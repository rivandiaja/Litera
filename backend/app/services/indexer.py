from __future__ import annotations

from collections import Counter
from pathlib import Path

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentPage, DocumentStats, IndexPosting, IndexStatus, IndexTerm, utc_now
from app.db.session import SessionLocal
from app.services.file_storage import FileStorageError, materialize_document_path
from app.services.pdf_extractor import PdfNoTextError, PdfReadError, extract_pdf_text
from app.services.preprocessing import preprocess_text, preprocess_tokens

INDEXING_RUNNING_MESSAGE = "Indexing sedang berjalan."


def _term_document_frequency(db: Session, term_id: int) -> int:
    return db.scalar(
        select(func.count(distinct(IndexPosting.document_id))).where(IndexPosting.term_id == term_id)
    ) or 0


def _refresh_document_frequencies(db: Session, term_ids: set[int]) -> None:
    for term_id in term_ids:
        term = db.get(IndexTerm, term_id)
        if term is None:
            continue
        document_frequency = _term_document_frequency(db, term.id)
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


def _get_or_create_term(db: Session, term_value: str) -> IndexTerm:
    term = db.scalar(select(IndexTerm).where(IndexTerm.term == term_value))
    if term is not None:
        return term
    term = IndexTerm(term=term_value, document_frequency=0)
    db.add(term)
    db.flush()
    return term


def build_inverted_index_for_document(db: Session, document: Document, pdf_path: Path) -> None:
    extracted = extract_pdf_text(pdf_path)
    touched_term_ids: set[int] = set()
    total_terms = 0

    clear_document_index(db, document.id)
    document.total_pages = extracted.total_pages

    for page in extracted.pages:
        clean_text = preprocess_text(page.raw_text)
        page_tokens = clean_text.split() if clean_text else []
        total_terms += len(page_tokens)
        document_page = DocumentPage(
            document_id=document.id,
            page_number=page.page_number,
            raw_text=page.raw_text,
            clean_text=clean_text,
        )
        db.add(document_page)

        for term_value, term_frequency in Counter(page_tokens).items():
            term = _get_or_create_term(db, term_value)
            touched_term_ids.add(term.id)
            db.add(
                IndexPosting(
                    term_id=term.id,
                    document_id=document.id,
                    page_number=page.page_number,
                    term_frequency=term_frequency,
                )
            )

    if total_terms == 0:
        raise PdfNoTextError("PDF tidak memiliki teks relevan setelah preprocessing.")

    db.add(DocumentStats(document_id=document.id, total_terms=total_terms, indexed_page_count=extracted.total_pages))
    _refresh_document_frequencies(db, touched_term_ids)
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

    try:
        with materialize_document_path(document.file_path) as pdf_path:
            document = db.get(Document, document_id)
            if document is None:
                return
            build_inverted_index_for_document(db, document, pdf_path)
        db.commit()
    except PdfNoTextError as exc:
        db.rollback()
        mark_document_failed(db, document_id, str(exc))
    except PdfReadError as exc:
        db.rollback()
        mark_document_failed(db, document_id, str(exc))
    except FileStorageError:
        db.rollback()
        mark_document_failed(db, document_id, "File PDF tidak ditemukan di storage.")
    except Exception:
        db.rollback()
        mark_document_failed(db, document_id, "Indexing gagal. Silakan coba reindex dokumen.")


def index_document_by_id(document_id: int) -> None:
    with SessionLocal() as db:
        index_document(db, document_id)


def preview_terms(text: str) -> list[str]:
    return preprocess_tokens(text)
