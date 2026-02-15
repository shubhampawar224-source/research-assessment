from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./research_papers.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class PDF(Base):
    __tablename__ = "pdfs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    sections_count = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)

    sections = relationship("Section", back_populates="pdf", cascade="all, delete-orphan")
    pages = relationship("PageSummary", back_populates="pdf", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    pdf_id = Column(Integer, ForeignKey("pdfs.id"))
    section_number = Column(Integer)
    title = Column(String)
    summary = Column(Text, default="")
    content = Column(Text)
    start_page = Column(Integer, nullable=True)
    end_page = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pdf = relationship("PDF", back_populates="sections")

class PageSummary(Base):
    __tablename__ = "page_summaries"

    id = Column(Integer, primary_key=True, index=True)
    pdf_id = Column(Integer, ForeignKey("pdfs.id"))
    page_number = Column(Integer)
    title = Column(String, default="")  # NEW: Store section/subsection title (e.g., "3. Method", "3.1. Research question")
    summary = Column(Text, default="")
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    pdf = relationship("PDF", back_populates="pages")
    section_summaries = relationship("SectionSummary", back_populates="page", cascade="all, delete-orphan")

class SectionSummary(Base):
    __tablename__ = "section_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("page_summaries.id"))
    pdf_id = Column(Integer, ForeignKey("pdfs.id"))
    page_number = Column(Integer)
    section_title = Column(String)  # Individual heading (e.g., "3.1. Research question")
    summary = Column(Text, default="")  # Summary for this specific section
    created_at = Column(DateTime, default=datetime.utcnow)
    
    page = relationship("PageSummary", back_populates="section_summaries")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
