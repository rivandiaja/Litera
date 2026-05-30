from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.db.models import ProjectVisibility
from app.schemas.common import PaginationMeta


def _strip_text(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip()


def _clean_keywords(values: list[str]) -> list[str]:
    keywords: list[str] = []
    seen: set[str] = set()
    for value in values:
        keyword = value.strip()
        if not keyword:
            continue
        key = keyword.casefold()
        if key in seen:
            continue
        keywords.append(keyword)
        seen.add(key)
    return keywords


class OwnerSummary(BaseModel):
    id: int
    name: str
    email: str
    student_number: str


class FieldSummary(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    is_active: bool


class ProjectCreate(BaseModel):
    research_field_id: int = Field(gt=0)
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(default="", max_length=4000)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        return _strip_text(value)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str]) -> list[str]:
        return _clean_keywords(value)


class ProjectUpdate(BaseModel):
    research_field_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    keywords: list[str] | None = Field(default=None, max_length=30)
    visibility: ProjectVisibility | None = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        return _strip_text(value)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return _clean_keywords(value)


class ProjectRead(BaseModel):
    id: int
    title: str
    description: str
    keywords: list[str]
    visibility: ProjectVisibility
    owner: OwnerSummary
    field: FieldSummary
    document_count: int
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectRead]
    pagination: PaginationMeta
