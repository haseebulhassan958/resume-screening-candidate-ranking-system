import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.services.pdf_extractor import extract_resume_text
from app.services.resume_parser import parse_resume
from app.services.summarizer import generate_candidate_summary

router = APIRouter(prefix="/resumes", tags=["Resumes"])

UPLOAD_DIR = "uploads/resumes"


def _save_uploaded_file(file: UploadFile) -> str:
    """Save an uploaded file to disk and return its path."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path


def _process_resume(file_path: str, filename: str, db: Session) -> Candidate:
    """
    Extract text from a resume PDF, parse it into structured fields,
    generate an AI summary, and store the result as a Candidate record.
    """
    extracted_text = extract_resume_text(file_path)

    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract any text from '{filename}'. The file may be scanned/image-based."
        )

    parsed_data = parse_resume(extracted_text)

    candidate = Candidate(
        resume_filename=filename,
        raw_resume_text=extracted_text,
        name=parsed_data["name"],
        email=parsed_data["email"],
        phone=parsed_data["phone"],
        skills=parsed_data["skills"],
        education=parsed_data["education"],
        certifications=parsed_data["certifications"],
        work_experience=parsed_data["work_experience"],
        projects=parsed_data["projects"],
    )

    candidate.ai_summary = generate_candidate_summary(candidate)

    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a single resume PDF, extract its text, parse it, and store a candidate record."""

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = _save_uploaded_file(file)
    candidate = _process_resume(file_path, file.filename, db)

    return {
        "message": "Resume uploaded, parsed, and stored successfully.",
        "candidate_id": candidate.id,
        "filename": candidate.resume_filename,
        "parsed_data": {
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "skills": candidate.skills,
            "education": candidate.education,
            "certifications": candidate.certifications,
            "work_experience": candidate.work_experience,
            "projects": candidate.projects,
        }
    }


@router.post("/upload-batch")
async def upload_multiple_resumes(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    """Upload multiple resumes at once, as required by the task ('Process multiple resumes')."""
    results = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            results.append({"filename": file.filename, "status": "failed", "reason": "Not a PDF file."})
            continue

        try:
            file_path = _save_uploaded_file(file)
            candidate = _process_resume(file_path, file.filename, db)
            results.append({
                "filename": file.filename,
                "status": "success",
                "candidate_id": candidate.id,
                "name": candidate.name
            })
        except HTTPException as e:
            results.append({"filename": file.filename, "status": "failed", "reason": e.detail})

    return {"results": results}


@router.get("/")
def list_candidates(db: Session = Depends(get_db)):
    """Return all candidates currently stored in the database, with parsed fields."""
    candidates = db.query(Candidate).all()
    return [
        {
            "id": c.id,
            "filename": c.resume_filename,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "skills": c.skills,
            "created_at": c.created_at
        }
        for c in candidates
    ]


@router.get("/{candidate_id}")
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Return full details for a single candidate, including all parsed resume fields."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    return {
        "id": candidate.id,
        "filename": candidate.resume_filename,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": candidate.skills,
        "education": candidate.education,
        "certifications": candidate.certifications,
        "work_experience": candidate.work_experience,
        "projects": candidate.projects,
        "ai_summary": candidate.ai_summary,
        "created_at": candidate.created_at
    }

@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate record (useful for cleaning up test uploads)."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    db.delete(candidate)
    db.commit()
    return {"message": f"Candidate {candidate_id} deleted successfully."}