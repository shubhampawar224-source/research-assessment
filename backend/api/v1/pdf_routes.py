from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from google import genai
from google.genai import types
from PyPDF2 import PdfReader
import os
import json
from typing import List, Dict
import io
from datetime import datetime
import uuid
import sys
import asyncio
import traceback
from helper.process_help import *
from dotenv import load_dotenv
import database as db_module
from database import PDF, PageSummary, SectionSummary, get_db, init_db

load_dotenv(override=True)

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

router = APIRouter()

# Initialize database tables
init_db()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-pdf", summary="Upload PDF and get streaming page summaries")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file content
    file_content = await file.read()
    
    # Initialize PDF Reader
    try:
        pdf_reader = PdfReader(io.BytesIO(file_content))
        total_pages = len(pdf_reader.pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

    # Generate unique filename and save PDF
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Store PDF metadata in database immediately
    new_pdf = PDF(
        filename=file.filename,
        original_filename=file.filename,
        file_path=file_path,
        total_pages=total_pages,
        sections_count=0 
    )
    db.add(new_pdf)
    db.commit()
    db.refresh(new_pdf)

    # PDF Metadata for frontend
    pdf_metadata = {
        "id": new_pdf.id,
        "filename": new_pdf.filename,
        "upload_date": new_pdf.upload_date.isoformat(),
        "sections_count": 0,
        "total_pages": new_pdf.total_pages
    }

    # Create streaming response with sequential page-by-page processing
    async def generate():
        print(f"DEBUG: Starting streaming response for PDF {new_pdf.id}")
        yield f"data: {json.dumps({'type': 'metadata', 'data': pdf_metadata})}\n\n"
        await asyncio.sleep(0.01)  # Force flush

        # Process each page sequentially: Extract → Extract Title → Summarize → Send to Frontend
        for page_num, page in enumerate(pdf_reader.pages):
            actual_page_num = page_num + 1
            page_text = page.extract_text() or ""
            print(f"DEBUG: Processing page {actual_page_num}, text length: {len(page_text)}")
            
            # Extract section title from page content
            page_title = extract_page_title(page_text)
            print(f"DEBUG: Page {actual_page_num} title: '{page_title}'")
            
            # Store Page Content and Title in DB
            with db_module.SessionLocal() as session:
                new_page = PageSummary(
                    pdf_id=new_pdf.id,
                    page_number=actual_page_num,
                    title=page_title,
                    content=page_text
                )
                session.add(new_page)
                session.commit()
                session.refresh(new_page)
                page_id = new_page.id
                print(f"DEBUG: Stored page {actual_page_num} in DB with ID {page_id}")

            # Send page content and title to frontend immediately
            yield f"data: {json.dumps({'page_id': page_id, 'page_num': actual_page_num, 'title': page_title, 'content': page_text[:500], 'summary': ''})}\n\n"
            await asyncio.sleep(0.01)  # Force flush
            
            # Generate individual section summaries if headings exist
            if page_title and page_title.strip():
                print(f"DEBUG: Generating individual section summaries for page {actual_page_num}")
                for section_chunk in generate_section_summaries_stream(page_id, new_pdf.id, actual_page_num, page_text, page_title):
                    yield section_chunk
                    await asyncio.sleep(0.01)  # Force flush
            
            # Summarize this page (overall summary) and stream results
            print(f"DEBUG: Starting overall page summarization for page {actual_page_num}")
            for chunk in summarize_page_stream(page_id, actual_page_num, page_text, page_title):
                yield chunk
                await asyncio.sleep(0.01)  # Force flush after each chunk

        print(f"DEBUG: Completed all pages for PDF {new_pdf.id}")
        yield "data: {\"type\": \"complete\"}\n\n"
        await asyncio.sleep(0.01)  # Force flush

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/pdfs", summary="Get list of uploaded PDFs")
async def get_pdfs(db: Session = Depends(get_db)):
    """
    Retrieve a list of all uploaded PDFs with metadata.
    
    Returns:
    - List of PDF metadata including filename, upload date, and section count
    """
    pdfs = db.query(PDF).order_by(PDF.upload_date.desc()).all()
    return {"pdfs": pdfs}


@router.get("/pdfs/{pdf_id}", summary="Get PDF details with pages and section summaries")
async def get_pdf_details(pdf_id: int, db: Session = Depends(get_db)):
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    pages = db.query(PageSummary).filter(PageSummary.pdf_id == pdf_id).order_by(PageSummary.page_number).all()
    section_summaries = db.query(SectionSummary).filter(SectionSummary.pdf_id == pdf_id).order_by(SectionSummary.page_number, SectionSummary.id).all()
    
    return {
        "pdf": pdf,
        "pages": pages,
        "section_summaries": section_summaries
    }


@router.get("/pdfs/{pdf_id}/file", summary="Download PDF file")
async def get_pdf_file(pdf_id: int, db: Session = Depends(get_db)):
    """
    Download the original PDF file.
    
    - **pdf_id**: ID of the PDF
    
    Returns:
    - PDF file for download/viewing
    """
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    file_path = pdf.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={pdf.filename}"
        }
    )


@router.delete("/pdfs/{pdf_id}", summary="Delete a PDF")
async def delete_pdf(pdf_id: int, db: Session = Depends(get_db)):
    """
    Delete a PDF and all its associated data.
    
    - **pdf_id**: ID of the PDF to delete
    
    Returns:
    - Success message
    """
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Check file path before deleting
    file_path = pdf.file_path
    if os.path.exists(file_path):
        os.remove(file_path)
    
    db.delete(pdf)
    db.commit()
    
    return {"message": "PDF deleted successfully"}

