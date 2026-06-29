import re
import spacy

# Load spaCy's English model once when this module is imported
nlp = spacy.load("en_core_web_sm")


# A reasonably broad skills vocabulary used to detect skills mentioned anywhere
# in the resume text, even if there isn't a clean "Skills" section heading.
COMMON_SKILLS = [
    "python", "java", "c++", "c", "javascript", "typescript", "html", "css",
    "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi",
    "sql", "mysql", "postgresql", "mongodb", "sqlite", "firebase",
    "machine learning", "deep learning", "nlp", "natural language processing",
    "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy",
    "data analysis", "data science", "computer vision", "opencv",
    "git", "github", "docker", "kubernetes", "aws", "azure", "gcp",
    "rest api", "graphql", "linux", "agile", "scrum",
    "tableau", "power bi", "excel", "r", "matlab", "tailwindcss", "tailwind", "next.js", "nextjs", "redux",
    "websockets", "redis", "stripe", "graphql", "rest",
    "ci/cd", "cicd", "jenkins", "github actions", "terraform",
    "microservices", "agile", "scrum", "jira", "figma",
    "firebase", "supabase", "prisma", "mongoose",
    "celery", "rabbitmq", "kafka", "elasticsearch",
    "opencv", "matplotlib", "seaborn", "nltk",
    "bootstrap", "sass", "webpack", "babel",
    "php", "laravel", "ruby", "rails", "swift", "kotlin",
    "flutter", "react native", "android", "ios",
    "hadoop", "spark", "airflow", "dbt",
    "power bi", "tableau", "excel",
    "linux", "bash", "shell", "vim",
    "postman", "swagger", "rest api"
]

# Resume section headings we look for to slice the text into chunks
SECTION_HEADINGS = {
    "education": ["education", "academic background", "qualifications", "academic qualification"],
    "certifications": ["certifications", "certificates", "licenses", "certification"],
    "work_experience": [
        "experience", "work experience", "employment history",
        "internship", "internship experience", "professional experience"
    ],
    "projects": [
        "projects", "personal projects", "academic projects",
        "key projects", "project experience", "notable projects"
    ],
    "skills": ["skills", "technical skills", "core competencies", "skills & tools"]
}


def extract_email(text: str) -> str | None:
    """Extract the first email address found in the resume text."""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    """
    Extract a phone number. Handles common formats including
    Pakistani numbers (e.g. 0320-6469958) and international formats.
    """
    match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4,7}", text)
    return match.group(0).strip() if match else None


def extract_name(text: str) -> str | None:
    """
    Use spaCy NER to find the most likely candidate name.
    We only check the first line of the resume, since resumes almost
    always put just the candidate's name on the very first line
    (taglines/job titles usually follow on the next line).
    """
    first_line = text.split("\n")[0].strip()
    doc = nlp(first_line)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()

    if first_line and len(first_line.split()) <= 5 and not re.search(r"[\d@]", first_line):
        return first_line

    return None


def extract_skills(text: str) -> list[str]:
    """
    Match known skills against the resume text (case-insensitive).
    This catches skills regardless of whether they appear in a
    dedicated 'Skills' section or are mentioned elsewhere (e.g. in projects).
    """
    text_lower = text.lower()
    found_skills = []
    for skill in COMMON_SKILLS:
        # Use word boundaries so "c" doesn't match inside "scope", etc.
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    return found_skills


def _extract_section(text: str, heading_variants: list[str]) -> str | None:
    """
    Generic helper: find a section heading in the text and return the
    block of text until the next recognized section heading (or end of text).
    """
    lines = text.split("\n")
    all_headings = [h for variants in SECTION_HEADINGS.values() for h in variants]

    for i, line in enumerate(lines):
        line_clean = line.strip().lower()
        if any(line_clean == h or line_clean.startswith(h) for h in heading_variants):
            # Collect lines until we hit another section heading
            section_lines = []
            for next_line in lines[i + 1:]:
                next_clean = next_line.strip().lower()
                if any(next_clean == h or next_clean.startswith(h) for h in all_headings):
                    break
                section_lines.append(next_line)
            return "\n".join(section_lines).strip()
    return None


def extract_education(text: str) -> str | None:
    return _extract_section(text, SECTION_HEADINGS["education"])


def extract_certifications(text: str) -> str | None:
    return _extract_section(text, SECTION_HEADINGS["certifications"])


def extract_work_experience(text: str) -> str | None:
    return _extract_section(text, SECTION_HEADINGS["work_experience"])


def extract_projects(text: str) -> str | None:
    return _extract_section(text, SECTION_HEADINGS["projects"])


def parse_resume(text: str) -> dict:
    """
    Run all extractors on the given resume text and return a
    structured dictionary matching the Candidate model fields.
    """
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": ", ".join(extract_skills(text)),
        "education": extract_education(text),
        "certifications": extract_certifications(text),
        "work_experience": extract_work_experience(text),
        "projects": extract_projects(text),
    }