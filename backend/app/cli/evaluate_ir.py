from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from json import JSONDecodeError
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User, UserRole
from app.db.session import SessionLocal
from app.services.indexer import preview_terms
from app.services.search_service import search_documents


class EvaluationError(Exception):
    """Raised for safe, user-facing evaluator errors."""


@dataclass
class QueryEvaluation:
    query: str
    processed_terms: list[str]
    relevant_documents: list[str]
    retrieved_documents: list[str]
    relevant_positions: list[int]
    precision_at_k: float
    recall_at_k: float | None
    elapsed_seconds: float


@dataclass
class EvaluationSummary:
    k: int
    queries: list[QueryEvaluation] = field(default_factory=list)

    @property
    def mean_precision(self) -> float:
        if not self.queries:
            return 0.0
        return sum(query.precision_at_k for query in self.queries) / len(self.queries)

    @property
    def mean_recall(self) -> float | None:
        recall_values = [query.recall_at_k for query in self.queries if query.recall_at_k is not None]
        if not recall_values:
            return None
        return sum(recall_values) / len(recall_values)

    @property
    def average_elapsed_seconds(self) -> float:
        if not self.queries:
            return 0.0
        return sum(query.elapsed_seconds for query in self.queries) / len(self.queries)


def _resolve_path(path: str | Path) -> Path:
    resolved = Path(path).expanduser()
    if not resolved.is_absolute():
        resolved = Path.cwd() / resolved
    return resolved.resolve()


def _load_judgments(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise EvaluationError(f"Judgments tidak ditemukan: {path}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except JSONDecodeError as exc:
        raise EvaluationError(f"Judgments bukan JSON valid: {exc.msg}") from exc
    except OSError as exc:
        raise EvaluationError("Judgments tidak dapat dibaca.") from exc

    if not isinstance(payload, dict) or not isinstance(payload.get("queries"), list):
        raise EvaluationError("Judgments harus memiliki array 'queries'.")
    return payload


def _normalize_identifier(identifier: str) -> str:
    return identifier.strip().casefold()


def precision_at_k(retrieved_documents: list[str], relevant_documents: list[str], k: int) -> float:
    if k <= 0:
        raise ValueError("k must be greater than 0")
    relevant = {_normalize_identifier(document) for document in relevant_documents}
    if not relevant:
        return 0.0
    top_k = retrieved_documents[:k]
    relevant_count = sum(1 for document in top_k if _normalize_identifier(document) in relevant)
    return relevant_count / k


def recall_at_k(retrieved_documents: list[str], relevant_documents: list[str], k: int) -> float | None:
    if k <= 0:
        raise ValueError("k must be greater than 0")
    relevant = {_normalize_identifier(document) for document in relevant_documents}
    if not relevant:
        return None
    top_k = retrieved_documents[:k]
    relevant_count = sum(1 for document in top_k if _normalize_identifier(document) in relevant)
    return relevant_count / len(relevant)


def _relevant_positions(retrieved_documents: list[str], relevant_documents: list[str], k: int) -> list[int]:
    relevant = {_normalize_identifier(document) for document in relevant_documents}
    return [
        position
        for position, document in enumerate(retrieved_documents[:k], start=1)
        if _normalize_identifier(document) in relevant
    ]


def _evaluation_user(db: Session) -> User:
    admin = db.scalar(
        select(User)
        .where(User.role == UserRole.ADMIN, User.is_active.is_(True))
        .order_by(User.id.asc())
        .limit(1)
    )
    if admin is not None:
        return admin
    user = db.scalar(select(User).where(User.is_active.is_(True)).order_by(User.id.asc()).limit(1))
    if user is None:
        raise EvaluationError("Tidak ada user aktif. Jalankan seed atau import dataset terlebih dahulu.")
    return user


def _clean_query_item(raw_query: Any) -> tuple[str, list[str]]:
    if not isinstance(raw_query, dict):
        raise EvaluationError("Setiap item queries harus berupa object.")
    query = raw_query.get("query")
    if not isinstance(query, str) or len(query.strip()) < 2:
        raise EvaluationError("Field queries[].query wajib berupa teks minimal 2 karakter.")
    relevant_documents = raw_query.get("relevant_documents", [])
    if relevant_documents is None:
        relevant_documents = []
    if not isinstance(relevant_documents, list):
        raise EvaluationError("Field queries[].relevant_documents harus berupa array.")
    return query.strip(), [str(document).strip() for document in relevant_documents if str(document).strip()]


def evaluate_judgments(path: str | Path, db: Session | None = None, k: int = 5) -> EvaluationSummary:
    if k <= 0:
        raise EvaluationError("Nilai --k harus lebih dari 0.")
    judgments_path = _resolve_path(path)
    payload = _load_judgments(judgments_path)

    owns_session = db is None
    session = db or SessionLocal()
    try:
        current_user = _evaluation_user(session)
        summary = EvaluationSummary(k=k)

        for raw_query in payload["queries"]:
            query, relevant_documents = _clean_query_item(raw_query)
            start = time.perf_counter()
            response = search_documents(
                db=session,
                current_user=current_user,
                query=query,
                page=1,
                page_size=k,
                sort_by="relevance",
                save_history=False,
            )
            elapsed = time.perf_counter() - start
            retrieved_documents = [result.original_filename for result in response.results]
            summary.queries.append(
                QueryEvaluation(
                    query=query,
                    processed_terms=preview_terms(query),
                    relevant_documents=relevant_documents,
                    retrieved_documents=retrieved_documents,
                    relevant_positions=_relevant_positions(retrieved_documents, relevant_documents, k),
                    precision_at_k=precision_at_k(retrieved_documents, relevant_documents, k),
                    recall_at_k=recall_at_k(retrieved_documents, relevant_documents, k),
                    elapsed_seconds=elapsed,
                )
            )
        return summary
    finally:
        if owns_session:
            session.close()


def format_evaluation(summary: EvaluationSummary) -> str:
    lines: list[str] = [f"Litera IR Evaluation @K={summary.k}", ""]
    for query in summary.queries:
        recall = "-" if query.recall_at_k is None else f"{query.recall_at_k:.2f}"
        lines.extend(
            [
                f"Query: {query.query}",
                f"Processed: {', '.join(query.processed_terms) if query.processed_terms else '-'}",
                f"Relevant expected: {len(query.relevant_documents)}",
                f"Retrieved top {summary.k}: {len(query.retrieved_documents)}",
                f"Relevant positions: {query.relevant_positions or '-'}",
                f"Precision@{summary.k}: {query.precision_at_k:.2f}",
                f"Recall@{summary.k}: {recall}",
                f"Elapsed: {query.elapsed_seconds:.3f}s",
                "",
            ]
        )

    mean_recall = "-" if summary.mean_recall is None else f"{summary.mean_recall:.2f}"
    lines.extend(
        [
            "Averages:",
            f"Mean Precision@{summary.k}: {summary.mean_precision:.2f}",
            f"Mean Recall@{summary.k}: {mean_recall}",
            f"Average elapsed time: {summary.average_elapsed_seconds:.3f}s",
        ]
    )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Evaluasi search engine Litera dengan Precision@K dan Recall@K.")
    parser.add_argument("--judgments", required=True, help="Path relevance judgments JSON.")
    parser.add_argument("--k", type=int, default=5, help="Jumlah hasil teratas untuk evaluasi.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        summary = evaluate_judgments(path=args.judgments, k=args.k)
        print(format_evaluation(summary))
        return 0
    except EvaluationError as exc:
        print(f"Evaluasi IR gagal: {exc}")
        return 1
    except Exception:
        print("Evaluasi IR gagal karena kesalahan tak terduga. Periksa database dan judgments.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
