from __future__ import annotations

from collections import Counter
from math import log, sqrt


def tf_weight(term_frequency: int) -> float:
    """Return logarithmic term-frequency weight: 0 when tf=0, else 1 + ln(tf)."""
    if term_frequency <= 0:
        return 0.0
    return 1.0 + log(term_frequency)


def idf(total_documents: int, document_frequency: int) -> float:
    """Return smoothed inverse document frequency: ln((N + 1) / (df + 1)) + 1."""
    if total_documents <= 0:
        return 0.0
    return log((total_documents + 1) / (document_frequency + 1)) + 1.0


def cosine_similarity(query_vector: dict[str, float], document_vector: dict[str, float]) -> float:
    """Compute cosine similarity between explicit query and document TF-IDF vectors."""
    query_norm = sqrt(sum(weight * weight for weight in query_vector.values()))
    document_norm = sqrt(sum(weight * weight for weight in document_vector.values()))
    if query_norm == 0 or document_norm == 0:
        return 0.0
    dot_product = sum(query_vector.get(term, 0.0) * document_vector.get(term, 0.0) for term in query_vector)
    return dot_product / (query_norm * document_norm)


def build_query_vector(query_term_counts: Counter[str], idf_by_term: dict[str, float]) -> dict[str, float]:
    return {
        term: tf_weight(term_frequency) * idf_by_term.get(term, 0.0)
        for term, term_frequency in query_term_counts.items()
    }


def build_document_vector(document_term_counts: Counter[str], idf_by_term: dict[str, float]) -> dict[str, float]:
    return {
        term: tf_weight(term_frequency) * idf_by_term.get(term, 0.0)
        for term, term_frequency in document_term_counts.items()
        if term_frequency > 0
    }


def rank_documents(
    query_term_counts: Counter[str],
    document_term_counts: dict[int, Counter[str]],
    total_documents: int,
    document_frequency_by_term: dict[str, int],
) -> dict[int, float]:
    """Rank documents with a classic vector space model.

    Query and document terms use the same preprocessed token space. Each term
    gets log-normalized TF (`1 + ln(tf)`) and scoped IDF
    (`ln((N + 1) / (df + 1)) + 1`). Final relevance is cosine similarity:
    `dot(query_vector, document_vector) / (norm(query) * norm(document))`.
    """
    idf_by_term = {
        term: idf(total_documents, document_frequency_by_term.get(term, 0))
        for term in query_term_counts
    }
    query_vector = build_query_vector(query_term_counts, idf_by_term)
    return {
        document_id: cosine_similarity(query_vector, build_document_vector(term_counts, idf_by_term))
        for document_id, term_counts in document_term_counts.items()
    }


def page_scores(
    query_term_counts: Counter[str],
    page_term_counts: dict[int, Counter[str]],
    total_documents: int,
    document_frequency_by_term: dict[str, int],
) -> dict[int, float]:
    idf_by_term = {
        term: idf(total_documents, document_frequency_by_term.get(term, 0))
        for term in query_term_counts
    }
    query_vector = build_query_vector(query_term_counts, idf_by_term)
    return {
        page_number: sum(
            query_vector.get(term, 0.0) * tf_weight(term_frequency) * idf_by_term.get(term, 0.0)
            for term, term_frequency in term_counts.items()
        )
        for page_number, term_counts in page_term_counts.items()
    }
