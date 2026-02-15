# Research Paper Summarizer - Backend

## Setup

1. **Create virtual environment:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
- Copy `.env.example` to `.env`
- Add your Gemini API key to `.env`

4. **Run the server:**
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `POST /upload-pdf`
Upload a PDF file and receive streaming summaries

**Request:**
- Content-Type: multipart/form-data
- Body: PDF file

**Response:**
- Server-Sent Events (SSE) stream with section summaries

### `GET /pdfs`
Get list of all uploaded PDFs

**Response:**
```json
{
  "pdfs": [
    {
      "id": 1,
      "filename": "paper.pdf",
      "upload_date": "2026-02-14T17:00:00",
      "sections_count": 8
    }
  ]
}
```

## Tech Stack

- **FastAPI** - Modern Python web framework
- **PyPDF2** - PDF text extraction
- **Google Gemini API** - AI-powered summarization
- **Uvicorn** - ASGI server
