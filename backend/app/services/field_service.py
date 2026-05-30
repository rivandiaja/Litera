from __future__ import annotations

import re
import unicodedata

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models import ResearchField, ResearchProject, User, UserRole
from app.schemas.common import build_pagination
from app.schemas.field import FieldCreate, FieldListResponse, FieldRead, FieldUpdate


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug or "field"


def field_to_read(db: Session, field: ResearchField) -> FieldRead:
    project_count = db.scalar(
        select(func.count(ResearchProject.id)).where(ResearchProject.research_field_id == field.id)
    )
    return FieldRead(
        id=field.id,
        name=field.name,
        slug=field.slug,
        description=field.description,
        icon=field.icon,
        is_active=field.is_active,
        project_count=project_count or 0,
        created_at=field.created_at,
        updated_at=field.updated_at,
    )


def list_fields(
    db: Session,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    include_inactive: bool = False,
) -> FieldListResponse:
    conditions = []
    if not include_inactive or current_user.role != UserRole.ADMIN:
        conditions.append(ResearchField.is_active.is_(True))

    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                ResearchField.name.ilike(pattern),
                ResearchField.slug.ilike(pattern),
                ResearchField.description.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count(ResearchField.id)).where(*conditions)) or 0
    fields = db.scalars(
        select(ResearchField)
        .where(*conditions)
        .order_by(ResearchField.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return FieldListResponse(
        items=[field_to_read(db, field) for field in fields],
        pagination=build_pagination(page, page_size, total),
    )


def get_field_for_read(db: Session, field_id: int, current_user: User) -> ResearchField:
    field = db.get(ResearchField, field_id)
    if field is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research field not found")
    if not field.is_active and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research field not found")
    return field


def ensure_active_field(db: Session, field_id: int) -> ResearchField:
    field = db.get(ResearchField, field_id)
    if field is None or not field.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Research field is not active or does not exist",
        )
    return field


def _ensure_unique_slug(db: Session, slug: str, existing_id: int | None = None) -> None:
    field = db.scalar(select(ResearchField).where(ResearchField.slug == slug))
    if field is not None and field.id != existing_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Research field name already exists")


def create_field(db: Session, payload: FieldCreate) -> ResearchField:
    slug = slugify(payload.name)
    _ensure_unique_slug(db, slug)
    field = ResearchField(
        name=payload.name,
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        is_active=payload.is_active,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


def update_field(db: Session, field_id: int, payload: FieldUpdate) -> ResearchField:
    field = db.get(ResearchField, field_id)
    if field is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research field not found")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        slug = slugify(data["name"])
        _ensure_unique_slug(db, slug, existing_id=field.id)
        field.name = data["name"]
        field.slug = slug
    if "description" in data and data["description"] is not None:
        field.description = data["description"]
    if "icon" in data and data["icon"] is not None:
        field.icon = data["icon"]
    if "is_active" in data and data["is_active"] is not None:
        field.is_active = data["is_active"]

    db.commit()
    db.refresh(field)
    return field


def delete_field(db: Session, field_id: int) -> None:
    field = db.get(ResearchField, field_id)
    if field is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research field not found")

    project_count = db.scalar(
        select(func.count(ResearchProject.id)).where(ResearchProject.research_field_id == field.id)
    )
    if project_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Research field cannot be deleted while projects still use it",
        )

    db.delete(field)
    db.commit()
