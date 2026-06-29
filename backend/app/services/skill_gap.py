from app.services.resume_parser import COMMON_SKILLS


def analyze_skill_gap(candidate, job) -> dict:
    """
    Perform a skill gap analysis comparing a candidate's skills
    against a job's required and preferred skills.

    Returns a structured breakdown of matched skills, missing required
    skills, missing preferred skills, and learning recommendations.
    """
    def parse_skills(skills_str: str | None) -> set[str]:
        if not skills_str:
            return set()
        return {s.strip().lower() for s in skills_str.split(",") if s.strip()}

    candidate_skills = parse_skills(candidate.skills)
    required_skills = parse_skills(job.required_skills)
    preferred_skills = parse_skills(job.preferred_skills)

    matched_required = sorted(candidate_skills & required_skills)
    missing_required = sorted(required_skills - candidate_skills)
    matched_preferred = sorted(candidate_skills & preferred_skills)
    missing_preferred = sorted(preferred_skills - candidate_skills)
    extra_skills = sorted(candidate_skills - required_skills - preferred_skills)

    recommendations = _generate_recommendations(missing_required)

    coverage_pct = (
        round(len(matched_required) / len(required_skills) * 100, 1)
        if required_skills
        else 100.0
    )

    return {
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "extra_skills": extra_skills,
        "recommendations": recommendations,
        "required_coverage_percent": coverage_pct,
    }


LEARNING_RESOURCES = {
    "python": "Python.org official tutorial or 'Automate the Boring Stuff with Python'",
    "machine learning": "fast.ai Practical Deep Learning course (free) or Scikit-learn docs",
    "deep learning": "fast.ai or Andrew Ng's Deep Learning Specialization on Coursera",
    "nlp": "Hugging Face NLP Course (free) or NLTK Book online",
    "sql": "SQLZoo or Mode SQL Tutorial (both free, interactive)",
    "docker": "Docker's official Getting Started guide",
    "aws": "AWS Free Tier + AWS Skill Builder free courses",
    "react": "React official docs (react.dev) — excellent interactive tutorial",
    "node.js": "Node.js official docs + The Odin Project",
    "tensorflow": "TensorFlow official tutorials at tensorflow.org",
    "pytorch": "PyTorch official 60-minute blitz tutorial",
    "kubernetes": "Kubernetes official interactive tutorial (katacoda)",
    "git": "Pro Git book (free at git-scm.com)",
    "java": "MOOC.fi Java Programming course (free, highly rated)",
    "javascript": "javascript.info — comprehensive free guide",
    "typescript": "TypeScript official handbook",
    "golang": "Tour of Go — official interactive tutorial",
    "go": "Tour of Go — official interactive tutorial",
    "rest api": "REST API Tutorial at restfulapi.net",
    "graphql": "GraphQL official tutorials at graphql.org",
}


def _generate_recommendations(missing_skills: list[str]) -> list[dict]:
    """
    For each missing skill, provide a brief learning recommendation
    with a suggested resource where available.
    """
    recommendations = []
    for skill in missing_skills[:5]:  # cap at 5 to keep output focused
        resource = LEARNING_RESOURCES.get(skill.lower())
        recommendations.append({
            "skill": skill,
            "resource": resource or f"Search for '{skill} tutorial' on YouTube or Coursera",
        })
    return recommendations