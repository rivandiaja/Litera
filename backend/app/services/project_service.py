from __future__ import annotations

from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Document, ProjectVisibility, ResearchProject, User, UserRole
from app.schemas.common import build_pagination
from app.schemas.project import FieldSummary, OwnerSummary, ProjectCreate, ProjectListResponse, ProjectRead, ProjectUpdate
from app.services.field_service import ensure_active_field

ProjectSort = Literal["newest", "oldest", "title_asc", "title_desc"]


def _document_count(db: Session, project_id: int) -> int:
    return db.scalar(select(func.count(Document.id)).where(Document.research_project_id == project_id)) or 0


def project_to_read(db: Session, project: ResearchProject) -> ProjectRead:
    return ProjectRead(
        id=project.id,
        title=project.title,
        description=project.description,
        keywords=project.keywords,
        visibility=project.visibility,
        owner=OwnerSummary(
            id=project.owner.id,
            name=project.owner.name,
            email=project.owner.email,
            student_number=project.owner.student_number,
        ),
        field=FieldSummary(
            id=project.research_field.id,
            name=project.research_field.name,
            slug=project.research_field.slug,
            icon=project.research_field.icon,
            is_active=project.research_field.is_active,
        ),
        document_count=_document_count(db, project.id),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _readable_conditions(current_user: User) -> list:
    if current_user.role == UserRole.ADMIN:
        return []
    return [
        or_(
            ResearchProject.visibility == ProjectVisibility.PUBLIC,
            ResearchProject.user_id == current_user.id,
        )
    ]


def _sort_expression(sort_by: ProjectSort):
    if sort_by == "oldest":
        return ResearchProject.created_at.asc()
    if sort_by == "title_asc":
        return func.lower(ResearchProject.title).asc()
    if sort_by == "title_desc":
        return func.lower(ResearchProject.title).desc()
    return ResearchProject.created_at.desc()


def list_projects(
    db: Session,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    field_id: int | None = None,
    visibility: ProjectVisibility | None = None,
    owner_id: int | None = None,
    only_current_user: bool = False,
    sort_by: ProjectSort = "newest",
) -> ProjectListResponse:
    conditions = _readable_conditions(current_user)

    if only_current_user:
        conditions.append(ResearchProject.user_id == current_user.id)
    elif owner_id is not None:
        conditions.append(ResearchProject.user_id == owner_id)

    if field_id is not None:
        conditions.append(ResearchProject.research_field_id == field_id)
    if visibility is not None:
        conditions.append(ResearchProject.visibility == visibility)
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                ResearchProject.title.ilike(pattern),
                ResearchProject.description.ilike(pattern),
                cast(ResearchProject.keywords, String).ilike(pattern),
            )
        )

    total = db.scalar(select(func.count(ResearchProject.id)).where(*conditions)) or 0
    projects = db.scalars(
        select(ResearchProject)
        .where(*conditions)
        .order_by(_sort_expression(sort_by), ResearchProject.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return ProjectListResponse(
        items=[project_to_read(db, project) for project in projects],
        pagination=build_pagination(page, page_size, total),
    )


def get_project_for_read(db: Session, project_id: int, current_user: User) -> ResearchProject:
    project = db.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if (
        current_user.role != UserRole.ADMIN
        and project.visibility == ProjectVisibility.PRIVATE
        and project.user_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def get_project_for_write(db: Session, project_id: int, current_user: User) -> ResearchProject:
    project = db.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if current_user.role != UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project owner or admin access required")
    return project


def create_project(db: Session, payload: ProjectCreate, current_user: User) -> ResearchProject:
    ensure_active_field(db, payload.research_field_id)
    project = ResearchProject(
        user_id=current_user.id,
        research_field_id=payload.research_field_id,
        title=payload.title,
        description=payload.description,
        keywords=payload.keywords,
        visibility=payload.visibility,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: int, payload: ProjectUpdate, current_user: User) -> ResearchProject:
    project = get_project_for_write(db, project_id, current_user)
    data = payload.model_dump(exclude_unset=True)

    if "research_field_id" in data and data["research_field_id"] is not None:
        ensure_active_field(db, data["research_field_id"])
        project.research_field_id = data["research_field_id"]
    if "title" in data and data["title"] is not None:
        project.title = data["title"]
    if "description" in data and data["description"] is not None:
        project.description = data["description"]
    if "keywords" in data and data["keywords"] is not None:
        project.keywords = data["keywords"]
    if "visibility" in data and data["visibility"] is not None:
        project.visibility = data["visibility"]

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int, current_user: User) -> None:
    project = get_project_for_write(db, project_id, current_user)
    db.delete(project)
    db.commit()
