from __future__ import annotations

from pathlib import Path

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentStats, IndexStatus, ProjectVisibility, ResearchProject, User, UserRole
from app.schemas.common import build_pagination
from app.schemas.document import (
    DocumentDetail,
    DocumentListResponse,
    DocumentRead,
    DocumentStatsRead,
    DocumentUpdate,
    DocumentUploadItem,
    DocumentUploadResponse,
    ProjectDocumentSummary,
)
from app.schemas.project import FieldSummary, OwnerSummary
from app.services import file_storage, indexer
from app.services.project_service import get_project_for_read, get_project_for_write


def _document_title_from_filename(filename: str) -> str:
    title = Path(filename).stem.strip()
    return (title or "Untitled PDF")[:255]


def document_to_read(document: Document) -> DocumentRead:
    return DocumentRead(
        id=document.id,
        research_project_id=document.research_project_id,
        title=document.title,
        original_filename=document.original_filename,
        stored_filename=document.stored_filename,
        file_size=document.file_size,
        total_pages=document.total_pages,
        index_status=document.index_status,
        index_message=document.index_message,
        indexed_at=document.indexed_at,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def document_to_detail(document: Document) -> DocumentDetail:
    stats = None
    if document.stats is not None:
        stats = DocumentStatsRead(
            total_terms=document.stats.total_terms,
            indexed_page_count=document.stats.indexed_page_count,
            updated_at=document.stats.updated_at,
        )
    project = document.research_project
    owner = project.owner
    field = project.research_field
    return DocumentDetail(
        **document_to_read(document).model_dump(),
        owner=OwnerSummary(
            id=owner.id,
            name=owner.name,
            email=owner.email,
            student_number=owner.student_number,
        ),
        project=ProjectDocumentSummary(id=project.id, title=project.title, visibility=project.visibility),
        field=FieldSummary(
            id=field.id,
            name=field.name,
            slug=field.slug,
            icon=field.icon,
            is_active=field.is_active,
        ),
        stats=stats,
    )


def _ensure_document_readable(document: Document, current_user: User) -> None:
    project = document.research_project
    if current_user.role == UserRole.ADMIN:
        return
    if project.visibility == ProjectVisibility.PUBLIC:
        return
    if project.user_id == current_user.id:
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")


def get_document_for_read(db: Session, document_id: int, current_user: User) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    _ensure_document_readable(document, current_user)
    return document


def get_document_for_write(db: Session, document_id: int, current_user: User) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if current_user.role != UserRole.ADMIN and document.research_project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Document owner or admin access required")
    return document


def list_project_documents(
    db: Session,
    project_id: int,
    current_user: User,
    page: int,
    page_size: int,
    index_status: IndexStatus | None = None,
    search: str | None = None,
) -> DocumentListResponse:
    project = get_project_for_read(db, project_id, current_user)
    conditions = [Document.research_project_id == project.id]
    if index_status is not None:
        conditions.append(Document.index_status == index_status)
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(or_(Document.title.ilike(pattern), Document.original_filename.ilike(pattern)))

    total = db.scalar(select(func.count(Document.id)).where(*conditions)) or 0
    documents = db.scalars(
        select(Document)
        .where(*conditions)
        .order_by(Document.created_at.desc(), Document.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return DocumentListResponse(
        items=[document_to_read(document) for document in documents],
        pagination=build_pagination(page, page_size, total),
    )


def _create_document_record(db: Session, project_id: int, stored_file: file_storage.StoredUpload) -> Document:
    document = Document(
        research_project_id=project_id,
        title=_document_title_from_filename(stored_file.original_filename),
        original_filename=stored_file.original_filename,
        stored_filename=stored_file.stored_filename,
        file_path=stored_file.file_path,
        total_pages=0,
        file_size=stored_file.file_size,
        index_status=IndexStatus.PENDING,
        index_message="Menunggu proses indexing.",
        indexed_at=None,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


async def upload_documents(
    db: Session,
    project_id: int,
    current_user: User,
    files: list[UploadFile],
    background_tasks: BackgroundTasks,
) -> DocumentUploadResponse:
    project = get_project_for_write(db, project_id, current_user)
    items: list[DocumentUploadItem] = []

    for upload in files:
        original_filename = (upload.filename or "document.pdf").replace("\\", "/").split("/")[-1]
        try:
            stored_file = await file_storage.save_pdf_upload(upload)
            try:
                document = _create_document_record(db, project.id, stored_file)
            except Exception:
                db.rollback()
                file_storage.delete_document_file(stored_file.file_path)
                raise

            background_tasks.add_task(indexer.index_document_by_id, document.id)
            items.append(
                DocumentUploadItem(
                    original_filename=stored_file.original_filename,
                    accepted=True,
                    document_id=document.id,
                    index_status=IndexStatus.PENDING,
                    file_size=document.file_size,
                )
            )
        except file_storage.UploadValidationError as exc:
            items.append(DocumentUploadItem(original_filename=original_filename, accepted=False, error=str(exc)))
        except file_storage.FileStorageError as exc:
            items.append(DocumentUploadItem(original_filename=original_filename, accepted=False, error=str(exc)))

    accepted_count = sum(1 for item in items if item.accepted)
    return DocumentUploadResponse(
        items=items,
        accepted_count=accepted_count,
        failed_count=len(items) - accepted_count,
    )


def update_document(db: Session, document_id: int, payload: DocumentUpdate, current_user: User) -> Document:
    document = get_document_for_write(db, document_id, current_user)
    document.title = payload.title
    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session, document_id: int, current_user: User) -> None:
    document = get_document_for_write(db, document_id, current_user)
    file_path = document.file_path
    indexer.clear_document_index(db, document.id)
    db.delete(document)
    db.commit()
    try:
        file_storage.delete_document_file(file_path)
    except file_storage.FileStorageError:
        return


def reindex_document(
    db: Session,
    document_id: int,
    current_user: User,
    background_tasks: BackgroundTasks,
) -> Document:
    document = get_document_for_write(db, document_id, current_user)
    try:
        file_exists = file_storage.document_file_exists(document.file_path)
    except file_storage.FileStorageError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Original PDF file is missing") from exc
    if not file_exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Original PDF file is missing")

    indexer.clear_document_index(db, document.id)
    document.index_status = IndexStatus.PENDING
    document.index_message = "Menunggu proses reindex."
    document.indexed_at = None
    document.total_pages = 0
    db.commit()
    db.refresh(document)
    background_tasks.add_task(indexer.index_document_by_id, document.id)
    return document


def get_document_file_content(document: Document) -> bytes:
    try:
        return file_storage.read_document_file(document.file_path)
    except file_storage.FileStorageError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found") from exc
