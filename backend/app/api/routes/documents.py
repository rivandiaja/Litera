from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.db.models import IndexStatus, User
from app.schemas.document import DocumentDetail, DocumentListResponse, DocumentRead, DocumentUpdate, DocumentUploadResponse
from app.services import document_service

router = APIRouter(tags=["documents"])


@router.post(
    "/projects/{project_id}/documents",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_project_documents(
    project_id: int,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentUploadResponse:
    return await document_service.upload_documents(db, project_id, current_user, files, background_tasks)


@router.get("/projects/{project_id}/documents", response_model=DocumentListResponse)
def list_project_documents(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    index_status: IndexStatus | None = Query(None, alias="status"),
    search: str | None = Query(None, max_length=255),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    return document_service.list_project_documents(
        db=db,
        project_id=project_id,
        current_user=current_user,
        page=page,
        page_size=page_size,
        index_status=index_status,
        search=search,
    )


@router.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Response:
    document = document_service.get_document_for_read(db, document_id, current_user)
    content = document_service.get_document_file_content(document)
    filename = quote(document.original_filename)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{filename}"},
    )


@router.post("/documents/{document_id}/reindex", response_model=DocumentRead)
def reindex_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentRead:
    document = document_service.reindex_document(db, document_id, current_user, background_tasks)
    return document_service.document_to_read(document)


@router.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentDetail:
    document = document_service.get_document_for_read(db, document_id, current_user)
    return document_service.document_to_detail(document)


@router.patch("/documents/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DocumentRead:
    document = document_service.update_document(db, document_id, payload, current_user)
    return document_service.document_to_read(document)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Response:
    document_service.delete_document(db, document_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
