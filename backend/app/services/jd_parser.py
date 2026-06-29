import re
from app.services.resume_parser import COMMON_SKILLS


def extract_required_experience(text: str) -> dict:
    """
    Properly analyze experience requirements from JD.
    Returns a dict with min_years, max_years, and a human-readable label.

    Handles patterns like:
      - "3+ years"         -> min=3, max=None
      - "3-5 years"        -> min=3, max=5
      - "minimum 2 years"  -> min=2, max=None
      - "up to 7 years"    -> min=0, max=7
      - "5 years"          -> min=5, max=5
    """
    text_lower = text.lower()

    # Pattern: range like "3-5 years" or "3 to 5 years"
    range_match = re.search(
        r"(\d+)\s*(?:-|to)\s*(\d+)\s*\+?\s*years?", text_lower
    )
    if range_match:
        min_y = int(range_match.group(1))
        max_y = int(range_match.group(2))
        return {
            "min_years": min_y,
            "max_years": max_y,
            "label": f"{min_y}-{max_y} years",
        }

    # Pattern: "X+ years" or "at least X years" or "minimum X years"
    min_match = re.search(
        r"(?:minimum\s*(?:of\s*)?|at least\s*|at minimum\s*)?(\d+)\s*\+\s*years?",
        text_lower,
    )
    if not min_match:
        min_match = re.search(
            r"(?:minimum|at least|at minimum)\s*(?:of\s*)?(\d+)\s*years?",
            text_lower,
        )
    if min_match:
        min_y = int(min_match.group(1))
        return {
            "min_years": min_y,
            "max_years": None,
            "label": f"{min_y}+ years",
        }

    # Pattern: "up to X years"
    upto_match = re.search(r"up to\s*(\d+)\s*years?", text_lower)
    if upto_match:
        max_y = int(upto_match.group(1))
        return {
            "min_years": 0,
            "max_years": max_y,
            "label": f"Up to {max_y} years",
        }

    # Pattern: plain "X years"
    plain_match = re.search(r"(\d+)\s*years?\s*(?:of\s*)?(?:experience)?", text_lower)
    if plain_match:
        y = int(plain_match.group(1))
        return {
            "min_years": y,
            "max_years": y,
            "label": f"{y} years",
        }

    # No experience mentioned — entry level
    return {
        "min_years": 0,
        "max_years": None,
        "label": "Not specified",
    }


def extract_education_requirement(text: str) -> str | None:
    """Detect the minimum education level mentioned in the job description."""
    text_lower = text.lower()
    if "phd" in text_lower or "doctorate" in text_lower:
        return "PhD"
    if "master" in text_lower or "m.sc" in text_lower or "ms degree" in text_lower:
        return "Master's Degree"
    if "bachelor" in text_lower or "b.sc" in text_lower or "bs degree" in text_lower or "undergraduate" in text_lower:
        return "Bachelor's Degree"
    return None


def _split_required_and_preferred(text: str) -> tuple[str, str]:
    """
    Split JD into required and preferred sections.
    Handles headings like 'Nice to have', 'Bonus', 'Preferred', etc.
    Also detects inline preferred keywords like 'preferably', 'ideally', 'is a plus'.
    """
    text_lower = text.lower()

    preferred_markers = [
    "preferred qualifications", "preferred skills", "nice to have",
    "bonus points", "good to have", "preferred", "bonus", "desirable",
    "plus", "ideally", "additional skills"
 ]
    split_index = -1
    for marker in preferred_markers:
        idx = text_lower.find(marker)
        if idx != -1:
            if split_index == -1 or idx < split_index:
                split_index = idx  # take the earliest match

    if split_index == -1:
        return text, ""

    return text[:split_index], text[split_index:]


def extract_skills_from_text(text: str) -> list[str]:
    """Match known skills against a block of text (reuses the same skill vocabulary as resumes)."""
    text_lower = text.lower()
    found_skills = []
    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    return found_skills


def parse_job_description(text: str) -> dict:
    required_text, preferred_text = _split_required_and_preferred(text)

    required_skills = extract_skills_from_text(required_text)
    preferred_skills = extract_skills_from_text(preferred_text) if preferred_text else []
    preferred_skills = [s for s in preferred_skills if s not in required_skills]

    experience = extract_required_experience(text)  # now returns a dict

    return {
        "required_skills": ", ".join(required_skills),
        "preferred_skills": ", ".join(preferred_skills),
        "min_experience_years": experience["min_years"],   # backward compatible
        "max_experience_years": experience["max_years"],   # new field
        "experience_label": experience["label"],           # new field
        "education_requirement": extract_education_requirement(text),
    }