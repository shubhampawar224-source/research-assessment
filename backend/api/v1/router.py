from fastapi import APIRouter
from .pdf_routes import router as pdf_router

# Create main API v1 router
api_router = APIRouter()

# Include all route modules
api_router.include_router(pdf_router, tags=["PDF Processing"])
