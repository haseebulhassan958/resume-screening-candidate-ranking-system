import re
from app.services.semantic_matcher import compute_semantic_similarity

WEIGHTS = {
    "skill": 0.35,
    "semantic": 0.30,
    "experience": 0.15,
    "education": 0.10,
    "keyword": 0.10,
}

EDUCATION_RANK = {
    "bachelor's degree": 1,
    "master's degree": 2,
    "phd": 3,
}


def _parse_skill_list(skills_str: str | None) -> set[str]:
    """Convert a comma-separated skills string into a clean set of lowercase skills."""
    if not skills_str:
        return set()
    return {s.strip().lower() for s in skills_str.split(",") if s.strip()}


def compute_skill_score(candidate_skills: str, required_skills: str, preferred_skills: str) -> tuple[float, list[str], list[str]]:
    """
    Compare candidate skills against required and preferred job skills.
    Required skills carry more weight than preferred skills.

    Returns: (score out of 100, matched_skills, missing_required_skills)
    """
    cand_set = _parse_skill_list(candidate_skills)
    required_set = _parse_skill_list(required_skills)
    preferred_set = _parse_skill_list(preferred_skills)

    if not required_set and not preferred_set:
        return 0.0, [], []

    matched_required = cand_set & required_set
    matched_preferred = cand_set & preferred_set
    missing_required = required_set - cand_set

    required_ratio = len(matched_required) / len(required_set) if required_set else 1.0
    preferred_ratio = len(matched_preferred) / len(preferred_set) if preferred_set else 1.0

    score = (required_ratio * 80) + (preferred_ratio * 20)
    matched_skills = sorted(matched_required | matched_preferred)

    return round(score, 2), matched_skills, sorted(missing_required)


def compute_experience_score(candidate_experience_text: str, min_experience_years: int) -> float:
    """
    Estimate the candidate's years of experience by scanning their work
    experience text for year ranges (e.g. '2021 - Present', '2019 - 2021'),
    then compare against the job's minimum requirement.
    """
    if min_experience_years <= 0:
        return 100.0  

    if not candidate_experience_text:
        return 0.0

    # Find all 4-digit years mentioned (e.g. 2019, 2021, 2024)
    years_found = [int(y) for y in re.findall(r"\b(19|20)\d{2}\b", candidate_experience_text)]
    # The regex group above only captures the century; re-extract full years properly
    years_found = [int(y) for y in re.findall(r"\b(?:19|20)\d{2}\b", candidate_experience_text)]

    has_present = bool(re.search(r"present|current", candidate_experience_text.lower()))

    if not years_found:
        return 50.0  # can't determine experience; give a neutral/partial score

    earliest_year = min(years_found)
    latest_year = max(years_found) if not has_present else 2026  # current year context

    estimated_years = max(0, latest_year - earliest_year)

    if estimated_years >= min_experience_years:
        return 100.0
    elif estimated_years == 0:
        return 30.0
    else:
        
        return round(min(100.0, (estimated_years / min_experience_years) * 100), 2)


def compute_education_score(candidate_education_text: str, required_education: str | None) -> float:
    """
    Compare the candidate's education level against the job's requirement.
    Gives full credit if the candidate meets or exceeds the required level.
    """
    if not required_education:
        return 100.0  

    if not candidate_education_text:
        return 0.0

    text_lower = candidate_education_text.lower()
    required_lower = required_education.lower()

    candidate_rank = 0
    for level, rank in EDUCATION_RANK.items():
        if level.split("'")[0] in text_lower or level.replace("'s degree", "") in text_lower:
            candidate_rank = max(candidate_rank, rank)
    # Simpler fallback checks for common degree keywords
    if "phd" in text_lower or "doctorate" in text_lower:
        candidate_rank = max(candidate_rank, 3)
    elif "master" in text_lower or "m.sc" in text_lower:
        candidate_rank = max(candidate_rank, 2)
    elif "bachelor" in text_lower or "b.sc" in text_lower or "bs " in text_lower:
        candidate_rank = max(candidate_rank, 1)

    required_rank = EDUCATION_RANK.get(required_lower, 1)

    if candidate_rank >= required_rank:
        return 100.0
    elif candidate_rank == 0:
        return 40.0  # education mentioned but unclear level
    else:
        return round((candidate_rank / required_rank) * 100, 2)


def compute_keyword_score(resume_text: str, job_description_text: str) -> float:
    """
    Measure how many important keywords from the job description
    also appear in the resume. Uses simple word-frequency overlap
    on significant words (longer than 3 characters, ignoring common stopwords).
    """
    if not resume_text or not job_description_text:
        return 0.0

    stopwords = {
        "the", "and", "for", "with", "this", "that", "are", "have", "will",
        "your", "you", "our", "from", "who", "what", "their", "they", "able"
    }

    def significant_words(text: str) -> set[str]:
        words = re.findall(r"[a-zA-Z]+", text.lower())
        return {w for w in words if len(w) > 3 and w not in stopwords}

    jd_words = significant_words(job_description_text)
    resume_words = significant_words(resume_text)

    if not jd_words:
        return 0.0

    overlap = jd_words & resume_words
    score = (len(overlap) / len(jd_words)) * 100
    return round(min(100.0, score), 2)


def generate_strengths_and_weaknesses(matched_skills: list[str], missing_skills: list[str],
                                        experience_score: float, education_score: float) -> tuple[list[str], list[str]]:
    """Generate human-readable strengths and weaknesses based on the scoring breakdown."""
    strengths = []
    weaknesses = []

    if matched_skills:
        strengths.append(f"Strong match on key skills: {', '.join(matched_skills[:5])}")

    if experience_score >= 80:
        strengths.append("Meets or exceeds the required experience level")

    if education_score >= 80:
        strengths.append("Education background aligns well with job requirements")

    if missing_skills:
        weaknesses.append(f"Missing required skills: {', '.join(missing_skills[:5])}")

    if experience_score < 50:
        weaknesses.append("Experience level is below the job's requirement")

    if education_score < 50:
        weaknesses.append("Education background does not clearly meet the requirement")

    if not strengths:
        strengths.append("No standout strengths identified relative to this job.")

    if not weaknesses:
        weaknesses.append("No significant gaps identified.")

    return strengths, weaknesses

def determine_verdict(overall_score: float) -> str:
    """Translate a numeric score into a human-readable verdict label."""
    if overall_score >= 80:
        return "Strong Fit"
    elif overall_score >= 60:
        return "Good Fit"
    elif overall_score >= 40:
        return "Average Fit"
    else:
        return "Low Fit"


def calculate_match_score(candidate, job) -> dict:
    """
    Calculate a full, explainable match score between a Candidate and a Job.
    Returns all component scores plus the final weighted overall score.
    """
    skill_score, matched_skills, missing_skills = compute_skill_score(
        candidate.skills, job.required_skills, job.preferred_skills
    )

    semantic_score = compute_semantic_similarity(
        candidate.raw_resume_text or "", job.raw_description or ""
    )

    experience_score = compute_experience_score(
        candidate.work_experience or "", job.min_experience_years or 0
    )

    education_score = compute_education_score(
        candidate.education or "", job.education_requirement
    )

    keyword_score = compute_keyword_score(
        candidate.raw_resume_text or "", job.raw_description or ""
    )

    overall_score = (
        skill_score * WEIGHTS["skill"]
        + semantic_score * WEIGHTS["semantic"]
        + experience_score * WEIGHTS["experience"]
        + education_score * WEIGHTS["education"]
        + keyword_score * WEIGHTS["keyword"]
    )
    overall_score = round(overall_score, 2)

    strengths, weaknesses = generate_strengths_and_weaknesses(
        matched_skills, missing_skills, experience_score, education_score
    )

    return {
        "skill_score": skill_score,
        "semantic_score": semantic_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "keyword_score": keyword_score,
        "overall_score": overall_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "verdict": determine_verdict(overall_score),
    }