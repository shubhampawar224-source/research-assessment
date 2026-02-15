from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from google import genai
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
from dotenv import load_dotenv

load_dotenv(override=True)

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
import database as db_module
from database import PDF, Section, PageSummary, get_db, init_db

router = APIRouter()

# Initialize database tables
init_db()

# Configure Gemini API
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_text_and_pages_from_pdf(pdf_bytes: bytes) -> tuple[str, int, Dict[str, int]]:
    """Extract text content from PDF and track page numbers for sections"""
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)
        full_text = ""
        page_texts = []
        
        # Extract text from each page separately
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            page_texts.append((page_num + 1, page_text))
            full_text += page_text + "\n"
        
        return full_text, total_pages, page_texts
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


def find_section_pages(section_text: str, page_texts: List[tuple]) -> tuple[int, int]:
    """Find the start and end page numbers for a section"""
    # Get first 200 characters of section to search for
    search_text = section_text[:200].strip()
    
    start_page = None
    end_page = None
    
    for page_num, page_text in page_texts:
        if search_text in page_text:
            if start_page is None:
                start_page = page_num
            end_page = page_num
    
    return start_page or 1, end_page or 1


def extract_text_and_pages_from_pdf(pdf_bytes: bytes) -> tuple[str, int, Dict[str, int]]:
    """Extract text content from PDF and track page numbers for sections"""
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)
        full_text = ""
        page_texts = []
        
        # Extract text from each page separately
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            page_texts.append((page_num + 1, page_text))
            full_text += page_text + "\n"
        
        return full_text, total_pages, page_texts
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


def find_section_pages(section_text: str, page_texts: List[tuple]) -> tuple[int, int]:
    """Find the start and end page numbers for a section"""
    # Get first 200 characters of section to search for
    search_text = section_text[:200].strip()
    
    start_page = None
    end_page = None
    
    for page_num, page_text in page_texts:
        if search_text in page_text:
            if start_page is None:
                start_page = page_num
            end_page = page_num
    
    return start_page or 1, end_page or 1


def extract_sections(text: str, page_texts: List[tuple]) -> List[Dict]:
    """Split the paper into logical sections based on common headers"""
    # Common section headers in research papers
    section_markers = [
        "abstract", "introduction", "related work", "methodology",
        "methods", "approach", "dataset", "experiments", "experimental setup",
        "results", "discussion", "conclusion", "future work", "references"
    ]

    # Simple section extraction (can be enhanced)
    sections = []
    lines = text.split('\n')
    current_section = ""
    current_title = ""

    for line in lines:
        line_lower = line.lower().strip()
        if any(marker in line_lower for marker in section_markers) and len(line) < 100:
            if current_section:
                start_page, end_page = find_section_pages(current_section, page_texts)
                sections.append({
                    "title": current_title,
                    "content": current_section,
                    "start_page": start_page,
                    "end_page": end_page
                })
            current_title = line.strip()
            current_section = line + "\n"
        else:
            current_section += line + "\n"

    if current_section:
        start_page, end_page = find_section_pages(current_section, page_texts)
        sections.append({
            "title": current_title or "Introduction",
            "content": current_section,
            "start_page": start_page,
            "end_page": end_page
        })

    return sections


def extract_page_title(page_content: str) -> str:
    """Extract ALL section/subsection titles from page content (main heading, subheadings, etc.)"""
    import re
    
    try:
        if not page_content or len(page_content.strip()) < 20:
            return ""
        
        found_headings = []
        
        # Regex patterns for different heading styles
        patterns = [
            # Numbered sections: "1. Introduction", "3.1. Research question", "3.1.1 Dataset"
            r'^(\d+(?:\.\d+)*\.?\s+[A-Z][^\n]{3,80})$',
            # All caps headings: "INTRODUCTION", "METHODOLOGY"
            r'^([A-Z][A-Z\s]{3,50})$',
            # Title case at start of line: "Introduction", "Related Work"
            r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,5})$'
        ]
        
        # Split content into lines and check all lines (not just first 15)
        lines = page_content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
                
            # Check each pattern
            for pattern in patterns:
                match = re.match(pattern, line, re.MULTILINE)
                if match:
                    title = match.group(1).strip()
                    # Validate it's not too long and looks like a heading
                    if 3 <= len(title) <= 100 and not title.endswith('.'):
                        # Avoid duplicates
                        if title not in found_headings:
                            found_headings.append(title)
                        break  # Move to next line once we found a match
        
        # If we found headings via regex, return them
        if found_headings:
            # Join multiple headings with " > " separator
            result = " > ".join(found_headings)
            print(f"DEBUG: Extracted {len(found_headings)} heading(s) via regex: '{result}'")
            return result
        
        # If regex didn't find anything, use AI as fallback
        prompt = f"""Analyze this page from a research paper and extract ALL section and subsection titles/headings.

Page Content (first 1500 chars):
{page_content[:1500]}

Instructions:
- Extract ALL headings from this page (e.g., "3. Method", "3.1. Research question", "3.2. Participants")
- Return them separated by " > " (e.g., "3. Method > 3.1. Research question > 3.2. Participants")
- Preserve numbering and capitalization exactly as they appear
- If no clear headings are found, return "NONE"
- Do NOT include any explanation, just the headings or "NONE"

Headings:"""

        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=150
            )
        )
        
        title = response.text.strip()
        # Clean up the response
        title = title.replace('"', '').replace("'", '').strip()
        
        # If AI says NONE or response is too long, return empty
        if title.upper() == "NONE" or len(title) > 300:
            return ""
        
        print(f"DEBUG: Extracted heading(s) via AI: '{title}'")
        return title
        
    except Exception as e:
        print(f"ERROR extracting title: {str(e)}")
        traceback.print_exc()
        return ""


def summarize_page_stream(page_id: int, page_num: int, page_content: str):
    """Generate streaming summary for a page using Gemini API"""
    print(f"DEBUG: summarize_page_stream called for page {page_num}, content length: {len(page_content)}")
    try:
        # if not page_content or len(page_content.strip()) < 50:
        #      # Handle empty or very short pages (likely scanned or blank)
        #      msg = "Insufficient text content on this page to summarize (possibly an image or scanned page)."
        #      yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'summary': msg})}\n\n"
             
        #      with db_module.SessionLocal() as db:
        #         page = db.query(PageSummary).filter(PageSummary.id == page_id).first()
        #         if page:
        #             page.summary = msg
        #             db.commit()
             
        #      yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'done': True})}\n\n"
        #      return

        prompt = f"""You are analyzing page {page_num} of a research paper. 
        Provide a VERY CONCISE summary in EXACTLY 2-3 short sentences (maximum 50 words total).
        Focus only on the most important information.
        
        Page Content:
        {page_content[:3000]}

        Rules:
        - Maximum 2-3 sentences
        - Maximum 50 words total
        - No bullet points, no formatting
        - Plain text only
        - Be extremely concise"""

        print(f"DEBUG: About to call Gemini API for page {page_num}")
        
        try:
            # Use the correct model format for Python SDK
            response = client.models.generate_content_stream(
                model='models/gemini-flash-lite-latest',
                contents=prompt,

            )
            print(f"DEBUG: Gemini API call successful for page {page_num}, starting to read chunks")
        except Exception as api_error:
            print(f"ERROR: Gemini API call failed for page {page_num}: {str(api_error)}")
            
            # Check if it's a quota error
            if "RESOURCE_EXHAUSTED" in str(api_error) or "Quota exceeded" in str(api_error):
                error_msg = "⚠️ API quota exceeded. Please wait or upgrade your plan."
            else:
                error_msg = f"❌ Summary generation failed: {str(api_error)[:100]}"
            
            with db_module.SessionLocal() as db:
                page = db.query(PageSummary).filter(PageSummary.id == page_id).first()
                if page:
                    page.summary = error_msg
                    db.commit()
            
            # Still yield the error to frontend
            yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'summary': error_msg, 'error': True})}\n\n"
            return

        summary_parts = []
        chunk_count = 0
        print("response>>>>",response)
        print(f"DEBUG: About to start iterating response generator for page {page_num}")
        try:
            for chunk in response:
                print(f"DEBUG: ENTERED LOOP - Processing chunk for page {page_num}")
                chunk_count += 1
                if chunk.text:
                    print(f"DEBUG: Chunk {chunk_count} received for page {page_num}: {chunk.text[:50]}...") # Debug print
                    summary_parts.append(chunk.text)
                    # Stream each chunk immediately to frontend for real-time display
                    yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'summary': chunk.text, 'content': page_content[:500], 'streaming': True})}\n\n"
                else:
                    print(f"DEBUG: Empty chunk {chunk_count} for page {page_num}")
            print(f"DEBUG: Finished iterating, exited loop for page {page_num}")
        except Exception as loop_error:
            print(f"ERROR: Exception in for loop for page {page_num}: {type(loop_error).__name__}: {str(loop_error)}")
            import traceback
            traceback.print_exc()
            
            error_msg = f"Error iterating response: {str(loop_error)}"
            with db_module.SessionLocal() as db:
                page = db.query(PageSummary).filter(PageSummary.id == page_id).first()
                if page:
                    page.summary = error_msg
                    db.commit()
            return
        
        # Update database with complete summary
        final_summary = ''.join(summary_parts)
        print(f"DEBUG: Complete summary for page {page_num}: {final_summary[:100]}...")
        
        # Save to database
        with db_module.SessionLocal() as db:
            page = db.query(PageSummary).filter(PageSummary.id == page_id).first()
            if page:
                page.summary = final_summary
                db.commit()
                db.refresh(page)
                print(f"DEBUG: ✓ Summary saved to DB for page {page_num}, ID={page_id}, summary='{page.summary[:100]}...'")
            else:
                print(f"ERROR: Page with ID {page_id} not found in database!")
        
        # Send final complete summary to frontend
        yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'summary': final_summary, 'content': page_content[:500], 'streaming': False, 'complete': True})}\n\n"
        yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'done': True})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


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
            
            # Summarize this page and stream results
            print(f"DEBUG: Starting summarization for page {actual_page_num}")
            for chunk in summarize_page_stream(page_id, actual_page_num, page_text):
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


@router.get("/pdfs/{pdf_id}", summary="Get PDF details with pages")
async def get_pdf_details(pdf_id: int, db: Session = Depends(get_db)):
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    sections = db.query(Section).filter(Section.pdf_id == pdf_id).order_by(Section.section_number).all()
    pages = db.query(PageSummary).filter(PageSummary.pdf_id == pdf_id).order_by(PageSummary.page_number).all()
    
    return {
        "pdf": pdf,
        "sections": sections,
        "pages": pages
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

