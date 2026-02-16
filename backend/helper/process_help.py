

import os
import json
import io
import uuid
import sys
import asyncio
import traceback
from google import genai
from PyPDF2 import PdfReader
import database as db_module
from typing import List, Dict
from datetime import datetime
from google.genai import types
from dotenv import load_dotenv
from fastapi import HTTPException
from database import PageSummary, SectionSummary

load_dotenv(override=True)

# Configure Gemini API
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "models/gemini-2.0-flash-lite")

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
            # Numbered sections with dot: "1. Introduction", "3.1. Research", "3.1.1. Dataset"
            r'^(\d+(?:\.\d+)+\.?\s+[A-Z][^\n]{3,100})$',  # Require at least one dot for subsections or strict format
            r'^(\d+\.\s+[A-Z][^\n]{3,100})$',             # Top level "1. Title"
            
            # All caps headings: "INTRODUCTION", "METHODOLOGY"
            r'^([A-Z][A-Z\s]{3,50})$',
            
            # Title case with limited keywords (avoid sentences): "Related Work", "Data Analysis"
            # Must look like a title (Capitalized Words)
            r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,7})$' 
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
            model=GEMINI_MODEL_NAME,
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
        return title
        
    except Exception as e:
        print(f"ERROR extracting title: {str(e)}")
        traceback.print_exc()
        return ""


def summarize_page_stream(page_id: int, page_num: int, page_content: str, page_headings: str = ""):
    """Generate streaming summary for a page, organized by headings if available"""
    print(f"DEBUG: summarize_page_stream called for page {page_num}, content length: {len(page_content)}, headings: '{page_headings}'")
    try:
        # Build prompt based on whether we have headings
        if page_headings and page_headings.strip():
            # We have headings - create structured summary
            headings_list = page_headings.split(" > ")
            headings_formatted = "\n".join([f"- {h}" for h in headings_list])
            
            prompt = f"""You are analyzing page {page_num} of a research paper.
            This page contains the following section(s)/subsection(s):
            {headings_formatted}

            Provide a CONCISE summary organized by these sections. For each section, write 1-2 sentences.

            Page Content:
            {page_content[:3000]}

            Format your response like this:
            [Section Name]: Brief summary (1-2 sentences)
            [Next Section Name]: Brief summary (1-2 sentences)

            Rules:
            - Summarize content under each section heading
            - 1-2 sentences per section
            - Maximum 50 words per section
            - Use the exact section names from the list above
            - Plain text only, no extra formatting"""
        else:
            # No headings - create general summary
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
                model=GEMINI_MODEL_NAME,
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
        try:
            for chunk in response:
                chunk_count += 1
                if chunk.text:
                    summary_parts.append(chunk.text)
                    # Stream each chunk immediately to frontend for real-time display
                    yield f"data: {json.dumps({'page_id': page_id, 'page_num': page_num, 'summary': chunk.text, 'content': page_content[:500], 'streaming': True})}\n\n"
                else:
                    print(f"DEBUG: Empty chunk {chunk_count} for page {page_num}")
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


def generate_section_summaries_stream(page_id: int, pdf_id: int, page_num: int, page_content: str, page_headings: str):
    """Generate individual summaries for each section/heading on a page"""
    
    if not page_headings or not page_headings.strip():
        print(f"DEBUG: No headings found for page {page_num}, skipping section summaries")
        return
    
    # Split headings
    headings_list = page_headings.split(" > ")
    
    for idx, heading in enumerate(headings_list):
        heading = heading.strip()
        if not heading:
            continue
        
        # Create prompt for this specific section
        prompt = f"""You are analyzing a research paper. Focus ONLY on the section titled "{heading}" from page {page_num}.

        Page Content:
        {page_content[:3000]}

        Provide a CONCISE summary (1-2 sentences, maximum 50 words) for ONLY the "{heading}" section.
        Focus on what this specific section discusses.
        Rules:
        - 1-2 sentences only
        - Maximum 50 words
        - Focus ONLY on the "{heading}" section
        - Plain text, no formatting"""

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=100
                )
            )
            
            section_summary = response.text.strip()
            print(f"DEBUG: Generated summary for '{heading}': {section_summary[:80]}...")
            
            # Store in database
            with db_module.SessionLocal() as db:
                new_section = SectionSummary(
                    page_id=page_id,
                    pdf_id=pdf_id,
                    page_number=page_num,
                    section_title=heading,
                    summary=section_summary
                )
                db.add(new_section)
                db.commit()
                db.refresh(new_section)
                print(f"DEBUG: ✓ Saved section summary to DB: ID={new_section.id}")
                
                # Yield to frontend
                yield f"data: {json.dumps({'type': 'section_summary', 'page_num': page_num, 'section_title': heading, 'summary': section_summary, 'section_id': new_section.id})}\n\n"
                
        except Exception as e:
            print(f"ERROR generating summary for section '{heading}': {str(e)}")
            traceback.print_exc()
