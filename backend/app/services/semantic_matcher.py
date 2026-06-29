from sentence_transformers import SentenceTransformer, util

_model = SentenceTransformer("all-MiniLM-L6-v2")


def compute_semantic_similarity(text_a: str, text_b: str) -> float:
    """
    Compute semantic similarity between two pieces of text using
    sentence embeddings and cosine similarity.

    Returns a score from 0 to 100, where 100 means the texts are
    semantically identical in meaning, and 0 means completely unrelated.
    """
    if not text_a or not text_b:
        return 0.0

    embeddings = _model.encode([text_a, text_b], convert_to_tensor=True)
    cosine_score = util.cos_sim(embeddings[0], embeddings[1]).item()

    # cos_sim ranges from -1 to 1; clamp and scale to a 0-100 range
    score = max(0.0, cosine_score) * 100
    return round(score, 2)