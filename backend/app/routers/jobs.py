import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.job import Job
from app.services.pdf_extractor import extract_resume_text
from app.services.jd_parser import parse_job_description

router = APIRouter(prefix="/jobs", tags=["Jobs"])

UPLOAD_DIR = "uploads/job_descriptions"


class JobTextInput(BaseModel):
    """Schema for submitting a job description as plain text instead of a file."""
    title: str
    description: str


def _create_job_from_text(title: str, description: str, db: Session) -> Job:
    """Parse a job description's text and store it as a Job record."""
    parsed_data = parse_job_description(description)

    job = Job(
        title=title,
        raw_description=description,
        required_skills=parsed_data["required_skills"],
        preferred_skills=parsed_data["preferred_skills"],
        min_experience_years=parsed_data["min_experience_years"],
        education_requirement=parsed_data["education_requirement"],
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.post("/upload-text")
def upload_job_text(payload: JobTextInput, db: Session = Depends(get_db)):
    """Submit a job description as plain text (e.g. pasted from a job posting)."""
    job = _create_job_from_text(payload.title, payload.description, db)
    return {
        "message": "Job description submitted and parsed successfully.",
        "job_id": job.id,
        "parsed_data": {
            "title": job.title,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "min_experience_years": job.min_experience_years,
            "education_requirement": job.education_requirement,
        }
    }


@router.post("/upload-pdf")
async def upload_job_pdf(title: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a job description as a PDF file."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_resume_text(file_path)  

    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract any text from this PDF.")

    job = _create_job_from_text(title, extracted_text, db)
    return {
        "message": "Job description PDF uploaded and parsed successfully.",
        "job_id": job.id,
        "parsed_data": {
            "title": job.title,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "min_experience_years": job.min_experience_years,
            "education_requirement": job.education_requirement,
        }
    }


@router.get("/")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "required_skills": j.required_skills,
            "preferred_skills": j.preferred_skills,        
            "min_experience_years": j.min_experience_years,
            "experience_label": j.experience_label,        
            "education_requirement": j.education_requirement,  
            "created_at": j.created_at,
        }
        for j in jobs
    ]


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Return full details for a single job description."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "id": job.id,
        "title": job.title,
        "raw_description": job.raw_description,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills,
        "min_experience_years": job.min_experience_years,
        "education_requirement": job.education_requirement,
        "created_at": job.created_at
    }


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job description record."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    db.delete(job)
    db.commit()
    return {"message": f"Job {job_id} deleted successfully."}