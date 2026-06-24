from __future__ import annotations

from collections import Counter
import logging
from pathlib import Path
from time import perf_counter
from typing import Iterable, Sequence, TypeVar

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentPage, DocumentStats, IndexPosting, IndexStatus, IndexTerm, utc_now
from app.db.session import SessionLocal
from app.services.file_storage import FileStorageError, materialize_document_path
from app.services.pdf_extractor import PdfNoTextError, PdfReadError, extract_pdf_text
from app.services.preprocessing import preprocess_tokens

INDEXING_RUNNING_MESSAGE = "Indexing sedang berjalan."
logger = logging.getLogger(__name__)
T = TypeVar("T")


def _chunks(values: Sequence[T], size: int = 500) -> Iterable[Sequence[T]]:
    for index in range(0, len(values), size):
        yield values[index:index + size]


def _refresh_document_frequencies(db: Session, term_ids: set[int]) -> None:
    if not term_ids:
        return

    frequencies: dict[int, int] = {}
    term_id_list = sorted(term_ids)
    for term_id_chunk in _chunks(term_id_list):
        rows = db.execute(
            select(IndexPosting.term_id, func.count(distinct(IndexPosting.document_id)))
            .where(IndexPosting.term_id.in_(term_id_chunk))
            .group_by(IndexPosting.term_id)
        ).all()
        frequencies.update({term_id: document_frequency for term_id, document_frequency in rows})

    for term_id_chunk in _chunks(term_id_list):
        terms = db.scalars(select(IndexTerm).where(IndexTerm.id.in_(term_id_chunk))).all()
        for term in terms:
            document_frequency = frequencies.get(term.id, 0)
            if document_frequency == 0:
                db.delete(term)
            else:
                term.document_frequency = document_frequency
    db.flush()


def clear_document_index(db: Session, document_id: int) -> None:
    old_term_ids = set(db.scalars(select(IndexPosting.term_id).where(IndexPosting.document_id == document_id)).all())
    db.execute(delete(IndexPosting).where(IndexPosting.document_id == document_id))
    db.execute(delete(DocumentStats).where(DocumentStats.document_id == document_id))
    db.execute(delete(DocumentPage).where(DocumentPage.document_id == document_id))
    db.flush()
    _refresh_document_frequencies(db, old_term_ids)


def _get_or_create_terms(db: Session, term_values: set[str]) -> dict[str, IndexTerm]:
    if not term_values:
        return {}

    term_list = sorted(term_values)
    term_by_value: dict[str, IndexTerm] = {}
    for term_chunk in _chunks(term_list):
        terms = db.scalars(select(IndexTerm).where(IndexTerm.term.in_(term_chunk))).all()
        term_by_value.update({term.term: term for term in terms})

    missing_terms = [term_value for term_value in term_list if term_value not in term_by_value]
    if missing_terms:
        created_terms = [IndexTerm(term=term_value, document_frequency=0) for term_value in missing_terms]
        db.add_all(created_terms)
        db.flush()
        term_by_value.update({term.term: term for term in created_terms})

    return term_by_value


def build_inverted_index_for_document(db: Session, document: Document, pdf_path: Path) -> None:
    extracted = extract_pdf_text(pdf_path)
    total_terms = 0
    all_terms: set[str] = set()
    document_pages: list[DocumentPage] = []
    posting_rows: list[tuple[str, int, int]] = []

    clear_document_index(db, document.id)
    document.total_pages = extracted.total_pages

    for page in extracted.pages:
        page_tokens = preprocess_tokens(page.raw_text)
        clean_text = " ".join(page_tokens)
        total_terms += len(page_tokens)
        document_pages.append(
            DocumentPage(
                document_id=document.id,
                page_number=page.page_number,
                raw_text=page.raw_text,
                clean_text=clean_text,
            )
        )

        for term_value, term_frequency in Counter(page_tokens).items():
            all_terms.add(term_value)
            posting_rows.append((term_value, page.page_number, term_frequency))

    if total_terms == 0:
        raise PdfNoTextError("PDF tidak memiliki teks relevan setelah preprocessing.")

    term_by_value = _get_or_create_terms(db, all_terms)
    db.add_all(document_pages)
    db.add_all(
        [
            IndexPosting(
                term_id=term_by_value[term_value].id,
                document_id=document.id,
                page_number=page_number,
                term_frequency=term_frequency,
            )
            for term_value, page_number, term_frequency in posting_rows
        ]
    )
    db.add(DocumentStats(document_id=document.id, total_terms=total_terms, indexed_page_count=extracted.total_pages))
    db.flush()
    _refresh_document_frequencies(db, {term.id for term in term_by_value.values()})
    document.index_status = IndexStatus.INDEXED
    document.index_message = f"Indexing selesai: {extracted.total_pages} halaman diproses."
    document.indexed_at = utc_now()


def mark_document_failed(db: Session, document_id: int, message: str) -> None:
    document = db.get(Document, document_id)
    if document is None:
        return
    document.index_status = IndexStatus.FAILED
    document.index_message = message
    document.indexed_at = None
    db.commit()


def index_document(db: Session, document_id: int) -> None:
    document = db.get(Document, document_id)
    if document is None:
        return

    document.index_status = IndexStatus.PROCESSING
    document.index_message = INDEXING_RUNNING_MESSAGE
    document.indexed_at = None
    db.commit()
    started_at = perf_counter()
    logger.info("Starting PDF indexing for document_id=%s", document_id)

    try:
        with materialize_document_path(document.file_path) as pdf_path:
            document = db.get(Document, document_id)
            if document is None:
                return
            build_inverted_index_for_document(db, document, pdf_path)
        db.commit()
        elapsed = perf_counter() - started_at
        logger.info("Finished PDF indexing for document_id=%s in %.2fs", document_id, elapsed)
    except PdfNoTextError as exc:
        db.rollback()
        logger.info("PDF indexing failed without text for document_id=%s: %s", document_id, exc)
        mark_document_failed(db, document_id, str(exc))
    except PdfReadError as exc:
        db.rollback()
        logger.info("PDF indexing failed to read document_id=%s: %s", document_id, exc)
        mark_document_failed(db, document_id, str(exc))
    except FileStorageError:
        db.rollback()
        logger.exception("PDF indexing could not read storage file for document_id=%s", document_id)
        mark_document_failed(db, document_id, "File PDF tidak ditemukan di storage.")
    except Exception:
        db.rollback()
        logger.exception("Unexpected PDF indexing failure for document_id=%s", document_id)
        mark_document_failed(db, document_id, "Indexing gagal. Silakan coba reindex dokumen.")


def index_document_by_id(document_id: int) -> None:
    with SessionLocal() as db:
        index_document(db, document_id)


def preview_terms(text: str) -> list[str]:
    return preprocess_tokens(text)
