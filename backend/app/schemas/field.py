from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import PaginationMeta


def _strip_text(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip()


class FieldBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    icon: str = Field(default="BookOpen", min_length=1, max_length=80)
    is_active: bool = True

    @field_validator("name", "description", "icon", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        return _strip_text(value)


class FieldCreate(FieldBase):
    pass


class FieldUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    icon: str | None = Field(default=None, min_length=1, max_length=80)
    is_active: bool | None = None

    @field_validator("name", "description", "icon", mode="before")
    @classmethod
    def strip_strings(cls, value: str | None) -> str | None:
        return _strip_text(value)


class FieldRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    icon: str
    is_active: bool
    project_count: int
    created_at: datetime
    updated_at: datetime


class FieldListResponse(BaseModel):
    items: list[FieldRead]
    pagination: PaginationMeta
