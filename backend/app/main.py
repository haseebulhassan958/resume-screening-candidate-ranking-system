from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import job, candidate, match_score
from app.routers import resumes, jobs, matching

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Resume Screening & Candidate Ranking System",
    description="Backend API for Teyzix Core Internship Task AI-2",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(matching.router)

@app.get("/")
def read_root():
    return {"message": "Resume Screening API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}