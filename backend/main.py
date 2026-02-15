from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from api.v1.router import api_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Research Paper Summarizer API",
    description="AI-powered research paper section summarization using Google Gemini",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router with prefix
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    """
    Health check endpoint.
    
    Returns API status and available endpoints.
    """
    return {
        "status": "ok",
        "message": "Research Paper Summarizer API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "upload_pdf": "/api/v1/upload-pdf",
            "list_pdfs": "/api/v1/pdfs"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check endpoint.
    """
    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
