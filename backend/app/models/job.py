from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    raw_description = Column(Text, nullable=False)   
    max_experience_years = Column(Integer, nullable=True)
    experience_label = Column(String(100), nullable=True)

    # Structured data extracted from the JD by our AI parser
    required_skills = Column(Text)                            # stored as comma-separated or JSON string
    preferred_skills = Column(Text)
    min_experience_years = Column(Integer, default=0)
    education_requirement = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)

    # One job can have many candidates scored against it
    scores = relationship("MatchScore", back_populates="job", cascade="all, delete-orphan")