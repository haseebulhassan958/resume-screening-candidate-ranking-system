import re
from collections import Counter


STOPWORDS = {
    "the", "and", "for", "with", "this", "that", "are", "have", "will",
    "your", "you", "our", "from", "who", "what", "their", "they", "able",
    "was", "were", "been", "being", "has", "had", "did", "does", "but",
    "not", "all", "can", "into", "than", "then", "also", "more", "most"
}


def _split_sentences(text: str) -> list[str]:
    """
    Split resume text into sentence-like chunks.
    Resume text is often bullet points rather than full sentences,
    so we split on both sentence-ending punctuation and newlines.
    Very short or clearly incomplete fragments are filtered out.
    """
    raw_lines = re.split(r"[\n•]+", text)
    sentences = []
    for line in raw_lines:
        line = line.strip()
        if not line:
            continue
        parts = re.split(r"(?<=[.!?])\s+", line)
        for p in parts:
            p = p.strip()
            
            if len(p.split()) < 4:
                continue
            if p.count("(") != p.count(")"):
                continue
            sentences.append(p)
    return sentences


def _score_sentences(sentences: list[str]) -> dict[str, float]:
    """
    Score each sentence by the frequency of its significant words.
    Sentences containing more frequently-occurring, meaningful words
    score higher (this is the same word-frequency approach used in
    the earlier Document Summarization project).
    """
    word_freq = Counter()
    for sentence in sentences:
        words = re.findall(r"[a-zA-Z]+", sentence.lower())
        for word in words:
            if word not in STOPWORDS and len(word) > 2:
                word_freq[word] += 1

    if not word_freq:
        return {s: 0.0 for s in sentences}

    max_freq = max(word_freq.values())
    normalized_freq = {w: f / max_freq for w, f in word_freq.items()}

    scores = {}
    for sentence in sentences:
        words = re.findall(r"[a-zA-Z]+", sentence.lower())
        score = sum(normalized_freq.get(w, 0) for w in words)
        # Slightly favor sentences of reasonable length (avoid scoring tiny fragments highly)
        word_count = max(len(words), 1)
        scores[sentence] = score / (word_count ** 0.5)

    return scores


def generate_candidate_summary(candidate) -> str:
    """
    Generate a short, human-readable AI summary of a candidate,
    combining their parsed fields into 2-3 sentences.
    This gives recruiters a quick overview without reading the full resume.
    """
    parts = []

    if candidate.name:
        parts.append(f"{candidate.name} is a candidate")
    else:
        parts.append("This candidate")

    skill_list = (
        [s.strip() for s in candidate.skills.split(",") if s.strip()]
        if candidate.skills
        else []
    )
    if skill_list:
        top_skills = ", ".join(skill_list[:5])
        parts[-1] += f" with experience in {top_skills}."
    else:
        parts[-1] += "."

    if candidate.work_experience:
        sentences = _split_sentences(candidate.work_experience)
        scores = _score_sentences(sentences)
        top_sentences = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:2]
    
        top_sentences_sorted = sorted(
            top_sentences, key=lambda x: sentences.index(x[0])
        )

        cleaned_sentences = []
        for s, _ in top_sentences_sorted:
            s = s.strip()
            if s and not s.endswith((".", "!", "?")):
                s += "."
            if s:
                cleaned_sentences.append(s)

        experience_summary = " ".join(cleaned_sentences)
        if experience_summary:
            parts.append(experience_summary)

    if candidate.education:
        first_line = candidate.education.split("\n")[0].strip()
        if first_line:
            parts.append(f"Education: {first_line}.")

    return " ".join(parts)