def generate_interview_questions(candidate, job) -> dict:
    """
    Generate targeted interview questions based on the candidate's
    profile and the job's requirements.

    Questions are grouped into categories to give the interviewer
    a structured guide covering both technical depth and fit.
    """

    def parse_skills(skills_str: str | None) -> list[str]:
        if not skills_str:
            return []
        return [s.strip() for s in skills_str.split(",") if s.strip()]

    candidate_skills = parse_skills(candidate.skills)
    required_skills = parse_skills(job.required_skills)

    matched_skills = [s for s in candidate_skills if s in required_skills]
    missing_skills = [s for s in required_skills if s not in candidate_skills]

    questions = {
        "technical": _technical_questions(matched_skills, missing_skills),
        "experience": _experience_questions(candidate, job),
        "behavioral": _behavioral_questions(),
        "skill_gap": _skill_gap_questions(missing_skills),
    }

    return {
        "candidate_name": candidate.name or "Candidate",
        "job_title": job.title,
        "questions": questions,
        "total_questions": sum(len(q) for q in questions.values()),
    }


def _technical_questions(matched_skills: list[str], missing_skills: list[str]) -> list[str]:
    """Generate technical questions targeting the candidate's known skills."""
    questions = []

    skill_templates = {
        "python": [
            "Walk me through how you've used Python in a real project. What libraries did you use and why?",
            "How do you manage dependencies and environments in Python projects?",
        ],
        "machine learning": [
            "Describe the end-to-end pipeline of an ML project you've worked on.",
            "How do you handle class imbalance in a classification problem?",
        ],
        "nlp": [
            "What NLP techniques have you applied in practice? What challenges did you face?",
            "How would you approach building a text classification system from scratch?",
        ],
        "sql": [
            "Write a SQL query to find the top 5 customers by total order value.",
            "How do you optimize a slow-running SQL query?",
        ],
        "react": [
            "How do you manage state in a large React application?",
            "Explain the difference between useEffect and useLayoutEffect.",
        ],
        "docker": [
            "How have you used Docker in your development workflow?",
            "What is the difference between a Docker image and a container?",
        ],
        "aws": [
            "Which AWS services have you used and in what context?",
            "How would you architect a scalable web application on AWS?",
        ],
        "deep learning": [
            "Explain the vanishing gradient problem and how it's addressed.",
            "What factors do you consider when choosing between CNN and RNN architectures?",
        ],
        "git": [
            "Describe your Git branching strategy in a team project.",
            "How do you resolve a complex merge conflict?",
        ],
        "flask": [
            "How have you used Flask to build a web application?",
            "How do you handle authentication in a Flask API?",
        ],
        "fastapi": [
            "What advantages does FastAPI have over Flask in your experience?",
            "How does FastAPI handle data validation?",
        ],
    }

    for skill in matched_skills[:4]:
        if skill.lower() in skill_templates:
            questions.extend(skill_templates[skill.lower()][:1])

    if not questions:
        questions.append(
            "Tell me about a technical challenge you solved recently. Walk me through your approach."
        )

    return questions


def _experience_questions(candidate, job) -> list[str]:
    """Generate questions about the candidate's experience relative to the role."""
    questions = [
        f"Why are you interested in the {job.title} position specifically?",
        "Tell me about a project you're most proud of. What was your individual contribution?",
    ]

    if candidate.work_experience:
        questions.append(
            "Your resume mentions some interesting experience. "
            "Can you describe a situation where you had to learn something new quickly to complete a project?"
        )

    if candidate.projects:
        questions.append(
            "Tell me about a personal or academic project that demonstrates your technical skills."
        )

    return questions


def _behavioral_questions() -> list[str]:
    """Standard behavioral questions applicable to any candidate."""
    return [
        "Describe a time you disagreed with a team member. How did you resolve it?",
        "Tell me about a time you missed a deadline. What happened and what did you learn?",
        "How do you prioritize tasks when working on multiple projects simultaneously?",
    ]


def _skill_gap_questions(missing_skills: list[str]) -> list[str]:
    """
    Generate questions that probe the candidate's awareness of and
    plans to address their identified skill gaps.
    """
    if not missing_skills:
        return ["You seem to meet all the technical requirements. How do you keep your skills current?"]

    gap_list = ", ".join(missing_skills[:3])
    return [
        f"This role requires experience with {gap_list}, which doesn't appear prominently in your resume. "
        f"What's your familiarity with these areas and how would you get up to speed?",
        "What new technical skill are you currently learning and why?",
    ]