from datetime import datetime

from pydantic import BaseModel


class SearchFilters(BaseModel):
    research_field_id: int | None
    research_project_id: int | None
    owner_id: int | None


class SearchPagination(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class SearchProjectSummary(BaseModel):
    id: int
    title: str


class SearchFieldSummary(BaseModel):
    id: int
    name: str


class SearchOwnerSummary(BaseModel):
    id: int
    name: str


class SearchResultItem(BaseModel):
    document_id: int
    title: str
    original_filename: str
    score: float
    relevance_percent: float
    total_pages: int
    relevant_pages: list[int]
    best_page: int | None
    snippet: str
    matched_terms: list[str]
    project: SearchProjectSummary
    field: SearchFieldSummary
    owner: SearchOwnerSummary
    created_at: datetime


class SearchResponse(BaseModel):
    query: str
    processed_terms: list[str]
    filters: SearchFilters
    pagination: SearchPagination
    results: list[SearchResultItem]


class CatalogFieldItem(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    is_active: bool


class CatalogProjectItem(BaseModel):
    id: int
    title: str
    description: str
    keywords: list[str]
    visibility: str
    owner: SearchOwnerSummary
    field: SearchFieldSummary


class CatalogResponse(BaseModel):
    query: str
    fields: list[CatalogFieldItem]
    projects: list[CatalogProjectItem]


class SearchHistoryItem(BaseModel):
    id: int
    query: str
    filters: SearchFilters
    result_count: int
    created_at: datetime


class SearchHistoryResponse(BaseModel):
    items: list[SearchHistoryItem]
    pagination: SearchPagination
