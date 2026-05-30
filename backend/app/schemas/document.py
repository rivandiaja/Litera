from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.db.models import IndexStatus, ProjectVisibility
from app.schemas.common import PaginationMeta
from app.schemas.project import FieldSummary, OwnerSummary


class DocumentStatsRead(BaseModel):
    total_terms: int
    indexed_page_count: int
    updated_at: datetime


class ProjectDocumentSummary(BaseModel):
    id: int
    title: str
    visibility: ProjectVisibility


class DocumentRead(BaseModel):
    id: int
    research_project_id: int
    title: str
    original_filename: str
    stored_filename: str
    file_size: int
    total_pages: int
    index_status: IndexStatus
    index_message: str | None
    indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DocumentDetail(DocumentRead):
    owner: OwnerSummary
    project: ProjectDocumentSummary
    field: FieldSummary
    stats: DocumentStatsRead | None


class DocumentListResponse(BaseModel):
    items: list[DocumentRead]
    pagination: PaginationMeta


class DocumentUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()


class DocumentUploadItem(BaseModel):
    original_filename: str
    accepted: bool
    document_id: int | None = None
    index_status: IndexStatus | None = None
    file_size: int | None = None
    error: str | None = None


class DocumentUploadResponse(BaseModel):
    items: list[DocumentUploadItem]
    accepted_count: int
    failed_count: int
