from __future__ import annotations

from dataclasses import dataclass
import html
import re

from app.services.preprocessing import preprocess_tokens

_word_re = re.compile(r"\b[\w-]+\b", re.UNICODE)


@dataclass(frozen=True)
class SnippetResult:
    snippet: str
    matched_terms: list[str]


def _collapse_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def build_snippet(raw_text: str, query_terms: list[str], max_length: int = 240) -> SnippetResult:
    """Build a safe plain-text snippet from raw page text.

    Query terms are stemmed while PDF surface words are not, so each surface
    word is passed through the same preprocessing pipeline and matched against
    query terms. The returned snippet never contains injected HTML.
    """
    text = _collapse_whitespace(raw_text)
    if not text:
        return SnippetResult(snippet="", matched_terms=[])

    query_set = set(query_terms)
    matches: list[tuple[int, int, str]] = []
    for match in _word_re.finditer(text):
        surface_terms = preprocess_tokens(match.group(0))
        for term in surface_terms:
            if term in query_set:
                matches.append((match.start(), match.end(), term))

    if not matches:
        snippet = text[:max_length].strip()
        if len(text) > max_length:
            snippet = f"{snippet}..."
        return SnippetResult(snippet=html.escape(snippet), matched_terms=[])

    best_start = matches[0][0]
    best_score = -1
    for start, _, _ in matches:
        window_start = max(0, start - max_length // 2)
        window_end = min(len(text), window_start + max_length)
        terms_in_window = {term for term_start, term_end, term in matches if window_start <= term_start and term_end <= window_end}
        hit_count = sum(1 for term_start, term_end, _ in matches if window_start <= term_start and term_end <= window_end)
        score = len(terms_in_window) * 10 + hit_count
        if score > best_score:
            best_score = score
            best_start = start

    start = max(0, best_start - max_length // 2)
    end = min(len(text), start + max_length)
    if end - start < max_length:
        start = max(0, end - max_length)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"...{snippet}"
    if end < len(text):
        snippet = f"{snippet}..."

    matched_terms = sorted({term for _, _, term in matches if term in query_set}, key=query_terms.index)
    return SnippetResult(snippet=html.escape(snippet), matched_terms=matched_terms)
