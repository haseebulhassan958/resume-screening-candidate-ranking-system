from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    # Extracted contact info
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))

    # Extracted resume content (stored as text; lists kept as comma-separated or JSON strings)
    skills = Column(Text)
    education = Column(Text)
    certifications = Column(Text)
    work_experience = Column(Text)
    projects = Column(Text)

    raw_resume_text = Column(Text)        # full extracted text, kept for re-analysis
    resume_filename = Column(String(255))

    ai_summary = Column(Text)             # AI-generated candidate summary

    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("MatchScore", back_populates="candidate", cascade="all, delete-orphan")