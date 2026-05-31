from datetime import datetime

from pydantic import BaseModel

from app.db.models import IndexStatus, ProjectVisibility


class DashboardSummary(BaseModel):
    projects_count: int
    documents_count: int
    indexed_documents_count: int
    pending_documents_count: int
    processing_documents_count: int
    failed_documents_count: int
    indexed_pages_count: int
    search_history_count: int


class RepositoryStats(BaseModel):
    fields_count: int
    public_projects_count: int
    public_documents_count: int
    contributors_count: int
    indexed_pages_count: int


class DashboardFieldSummary(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    is_active: bool


class DashboardOwnerSummary(BaseModel):
    id: int
    name: str
    email: str
    student_number: str


class DashboardProjectSummary(BaseModel):
    id: int
    title: str
    description: str
    keywords: list[str]
    visibility: ProjectVisibility
    field: DashboardFieldSummary
    document_count: int
    created_at: datetime
    updated_at: datetime


class DashboardDocumentSummary(BaseModel):
    id: int
    title: str
    original_filename: str
    file_size: int
    total_pages: int
    index_status: IndexStatus
    index_message: str | None
    indexed_at: datetime | None
    project: DashboardProjectSummary
    field: DashboardFieldSummary
    owner: DashboardOwnerSummary
    created_at: datetime
    updated_at: datetime


class DashboardSearchSummary(BaseModel):
    id: int
    query: str
    research_field_id: int | None
    research_project_id: int | None
    result_count: int
    created_at: datetime


class MyDashboardResponse(BaseModel):
    summary: DashboardSummary
    recent_projects: list[DashboardProjectSummary]
    recent_documents: list[DashboardDocumentSummary]
    recent_searches: list[DashboardSearchSummary]
