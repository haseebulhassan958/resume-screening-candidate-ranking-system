import csv
import io
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.match_score import MatchScore
from app.services.scoring_engine import calculate_match_score
from app.services.skill_gap import analyze_skill_gap
from app.services.interview_generator import generate_interview_questions


router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/score/{candidate_id}/{job_id}")
def score_candidate_against_job(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """
    Calculate (or recalculate) the match score between one candidate and one job.
    If a score already exists for this pair, it is updated rather than duplicated.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    result = calculate_match_score(candidate, job)

    # Check if a score already exists for this candidate-job pair
    existing_score = db.query(MatchScore).filter(
        MatchScore.candidate_id == candidate_id,
        MatchScore.job_id == job_id
    ).first()

    if existing_score:
        match_score = existing_score
    else:
        match_score = MatchScore(candidate_id=candidate_id, job_id=job_id)
        db.add(match_score)

    match_score.skill_score = result["skill_score"]
    match_score.semantic_score = result["semantic_score"]
    match_score.experience_score = result["experience_score"]
    match_score.education_score = result["education_score"]
    match_score.keyword_score = result["keyword_score"]
    match_score.overall_score = result["overall_score"]
    match_score.strengths = " | ".join(result["strengths"])
    match_score.weaknesses = " | ".join(result["weaknesses"])
    match_score.verdict = result["verdict"]

    db.commit()
    db.refresh(match_score)

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.name,
        "job_id": job_id,
        "job_title": job.title,
        "scores": {
            "skill_score": match_score.skill_score,
            "semantic_score": match_score.semantic_score,
            "experience_score": match_score.experience_score,
            "education_score": match_score.education_score,
            "keyword_score": match_score.keyword_score,
            "overall_score": match_score.overall_score,
        },
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "strengths": result["strengths"],
        "weaknesses": result["weaknesses"],
        "verdict": match_score.verdict,
    }


@router.post("/score-all/{job_id}")
def score_all_candidates_against_job(job_id: int, db: Session = Depends(get_db)):
    """
    Score every candidate currently in the database against a single job.
    Useful for screening an entire pool of resumes at once.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    candidates = db.query(Candidate).all()
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found to score.")

    results = []
    for candidate in candidates:
        result = calculate_match_score(candidate, job)

        existing_score = db.query(MatchScore).filter(
            MatchScore.candidate_id == candidate.id,
            MatchScore.job_id == job_id
        ).first()

        if existing_score:
            match_score = existing_score
        else:
            match_score = MatchScore(candidate_id=candidate.id, job_id=job_id)
            db.add(match_score)

        match_score.skill_score = result["skill_score"]
        match_score.semantic_score = result["semantic_score"]
        match_score.experience_score = result["experience_score"]
        match_score.education_score = result["education_score"]
        match_score.keyword_score = result["keyword_score"]
        match_score.overall_score = result["overall_score"]
        match_score.strengths = " | ".join(result["strengths"])
        match_score.weaknesses = " | ".join(result["weaknesses"])
        match_score.verdict = result["verdict"]

        db.commit()
        db.refresh(match_score)

        results.append({
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "overall_score": match_score.overall_score,
            "verdict": match_score.verdict,
        })

    return {"job_id": job_id, "job_title": job.title, "scored_count": len(results), "results": results}


@router.get("/ranking/{job_id}")
def get_ranked_candidates(job_id: int, db: Session = Depends(get_db)):
    """
    Return all candidates already scored against a given job,
    sorted from highest to lowest overall match score.
    This is the main 'ranked shortlist' the task requires.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    scores = (
        db.query(MatchScore)
        .filter(MatchScore.job_id == job_id)
        .order_by(MatchScore.overall_score.desc())
        .all()
    )

    ranked_list = []
    for rank, score in enumerate(scores, start=1):
        candidate = score.candidate
        ranked_list.append({
            "rank": rank,
            "candidate_id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "skills": candidate.skills,
            "overall_score": score.overall_score,
            "skill_score": score.skill_score,
            "semantic_score": score.semantic_score,
            "experience_score": score.experience_score,
            "education_score": score.education_score,
            "verdict": score.verdict,
        })

    return {"job_id": job_id, "job_title": job.title, "total_candidates": len(ranked_list), "ranking": ranked_list}


@router.get("/details/{candidate_id}/{job_id}")
def get_match_details(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """Return the full detailed score breakdown for one candidate-job pair, including strengths/weaknesses."""
    score = db.query(MatchScore).filter(
        MatchScore.candidate_id == candidate_id,
        MatchScore.job_id == job_id
    ).first()

    if not score:
        raise HTTPException(status_code=404, detail="No score found for this candidate-job pair. Run scoring first.")

    candidate = score.candidate
    job = score.job

    return {
        "candidate": {"id": candidate.id, "name": candidate.name, "email": candidate.email},
        "job": {"id": job.id, "title": job.title},
        "scores": {
            "skill_score": score.skill_score,
            "semantic_score": score.semantic_score,
            "experience_score": score.experience_score,
            "education_score": score.education_score,
            "keyword_score": score.keyword_score,
            "overall_score": score.overall_score,
        },
        "strengths": score.strengths.split(" | ") if score.strengths else [],
        "weaknesses": score.weaknesses.split(" | ") if score.weaknesses else [],
        "verdict": score.verdict,
    }

@router.get("/skill-gap/{candidate_id}/{job_id}")
def get_skill_gap(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """
    Perform a skill gap analysis comparing a candidate's skills
    against the job's requirements, with learning recommendations.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return analyze_skill_gap(candidate, job)


@router.get("/interview-questions/{candidate_id}/{job_id}")
def get_interview_questions(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """
    Generate targeted interview questions based on the candidate's
    profile and the job's requirements.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return generate_interview_questions(candidate, job)

@router.get("/export/{job_id}")
def export_ranking_csv(job_id: int, db: Session = Depends(get_db)):
    """
    Export the ranked candidate list for a job as a downloadable CSV file.
    Includes the overall score and component breakdown for transparency.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    scores = (
        db.query(MatchScore)
        .filter(MatchScore.job_id == job_id)
        .order_by(MatchScore.overall_score.desc())
        .all()
    )

    if not scores:
        raise HTTPException(
            status_code=404,
            detail="No scored candidates found for this job. Run scoring first."
        )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Rank", "Name", "Email", "Phone", "Skills",
        "Overall Score", "Skill Score", "Semantic Score",
        "Experience Score", "Education Score", "Verdict"
    ])

    for rank, score in enumerate(scores, start=1):
        candidate = score.candidate
        writer.writerow([
            rank,
            candidate.name or "",
            candidate.email or "",
            candidate.phone or "",
            candidate.skills or "",
            score.overall_score,
            score.skill_score,
            score.semantic_score,
            score.experience_score,
            score.education_score,
            score.verdict,
        ])

    output.seek(0)
    filename = f"{job.title.replace(' ', '_')}_ranking.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/insights")
def get_screening_insights(db: Session = Depends(get_db)):
    """
    Return AI screening insights for the dashboard:
    - Top ranked candidates across all jobs
    - Most in-demand skills across all job descriptions
    - Screening coverage stats
    """
    from app.models.candidate import Candidate
    from app.models.job import Job
    import re

    
    top_scores = (
        db.query(MatchScore)
        .order_by(MatchScore.overall_score.desc())
        .limit(5)
        .all()
    )

    top_candidates = []
    for score in top_scores:
        candidate = score.candidate
        job = score.job
        top_candidates.append({
            "candidate_id": candidate.id,
            "name": candidate.name or "Unnamed",
            "job_title": job.title,
            "overall_score": score.overall_score,
            "verdict": score.verdict,
        })

    
    all_jobs = db.query(Job).all()
    skill_counter = {}
    for job in all_jobs:
        if job.required_skills:
            for skill in job.required_skills.split(","):
                skill = skill.strip().lower()
                if skill:
                    skill_counter[skill] = skill_counter.get(skill, 0) + 1
        if job.preferred_skills:
            for skill in job.preferred_skills.split(","):
                skill = skill.strip().lower()
                if skill:
                    skill_counter[skill] = skill_counter.get(skill, 0) + 0.5

    top_skills = sorted(skill_counter.items(), key=lambda x: x[1], reverse=True)[:10]

    
    total_candidates = db.query(Candidate).count()
    scored_candidates = db.query(MatchScore.candidate_id).distinct().count()
    total_jobs = db.query(Job).count()

    return {
        "top_candidates": top_candidates,
        "top_demanded_skills": [
            {"skill": skill, "count": round(count)}
            for skill, count in top_skills
        ],
        "coverage": {
            "total_candidates": total_candidates,
            "scored_candidates": scored_candidates,
            "total_jobs": total_jobs,
            "screening_rate": round(
                (scored_candidates / total_candidates * 100) if total_candidates > 0 else 0, 1
            ),
        },
    }