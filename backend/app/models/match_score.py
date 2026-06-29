from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    # Explainable scoring breakdown — each component out of 100
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)     # sentence-transformer similarity
    keyword_score = Column(Float, default=0.0)

    overall_score = Column(Float, default=0.0)       # weighted final score

    strengths = Column(Text)       # AI-generated, comma separated or JSON
    weaknesses = Column(Text)
    verdict = Column(String(50))   # "Strong Fit" / "Good Fit" / "Average" / "Low Fit"

    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="scores")
    job = relationship("Job", back_populates="scores")