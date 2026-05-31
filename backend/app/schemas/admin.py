from datetime import datetime

from pydantic import BaseModel

from app.db.models import IndexStatus, ProjectVisibility, UserRole
from app.schemas.common import PaginationMeta
from app.schemas.dashboard import DashboardDocumentSummary, DashboardFieldSummary, DashboardOwnerSummary


class AdminDashboardSummary(BaseModel):
    users_count: int
    active_users_count: int
    fields_count: int
    active_fields_count: int
    projects_count: int
    documents_count: int
    indexed_documents_count: int
    pending_documents_count: int
    processing_documents_count: int
    failed_documents_count: int
    indexed_pages_count: int


class IndexingBreakdown(BaseModel):
    pending: int
    processing: int
    indexed: int
    failed: int


class AdminDashboardResponse(BaseModel):
    summary: AdminDashboardSummary
    indexing_breakdown: IndexingBreakdown
    recent_uploads: list[DashboardDocumentSummary]
    failed_documents: list[DashboardDocumentSummary]


class AdminUserRead(BaseModel):
    id: int
    name: str
    student_number: str
    email: str
    study_program: str
    class_name: str
    role: UserRole
    is_active: bool
    projects_count: int
    documents_count: int
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserRead]
    pagination: PaginationMeta


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None


class AdminProjectRead(BaseModel):
    id: int
    title: str
    description: str
    keywords: list[str]
    visibility: ProjectVisibility
    owner: DashboardOwnerSummary
    field: DashboardFieldSummary
    document_count: int
    created_at: datetime
    updated_at: datetime


class AdminProjectListResponse(BaseModel):
    items: list[AdminProjectRead]
    pagination: PaginationMeta


class AdminDocumentStats(BaseModel):
    total_terms: int
    indexed_page_count: int
    updated_at: datetime


class AdminDocumentRead(DashboardDocumentSummary):
    stats: AdminDocumentStats | None


class AdminDocumentListResponse(BaseModel):
    items: list[AdminDocumentRead]
    pagination: PaginationMeta


class AdminIndexingResponse(BaseModel):
    summary: IndexingBreakdown
    items: list[AdminDocumentRead]
    pagination: PaginationMeta
