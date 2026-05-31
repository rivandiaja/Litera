from __future__ import annotations

from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentStats, IndexStatus, ProjectVisibility, ResearchField, ResearchProject, User, UserRole
from app.schemas.admin import (
    AdminDashboardResponse,
    AdminDashboardSummary,
    AdminDocumentListResponse,
    AdminDocumentRead,
    AdminDocumentStats,
    AdminIndexingResponse,
    AdminProjectListResponse,
    AdminProjectRead,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserUpdate,
    IndexingBreakdown,
)
from app.schemas.common import build_pagination
from app.schemas.dashboard import DashboardFieldSummary, DashboardOwnerSummary
from app.services.dashboard_service import document_summary

AdminProjectSort = Literal["newest", "oldest", "title_asc", "title_desc"]
AdminDocumentSort = Literal["newest", "oldest", "title_asc", "title_desc"]


def _status_count(db: Session, index_status: IndexStatus) -> int:
    return db.scalar(select(func.count(Document.id)).where(Document.index_status == index_status)) or 0


def _indexing_breakdown(db: Session) -> IndexingBreakdown:
    return IndexingBreakdown(
        pending=_status_count(db, IndexStatus.PENDING),
        processing=_status_count(db, IndexStatus.PROCESSING),
        indexed=_status_count(db, IndexStatus.INDEXED),
        failed=_status_count(db, IndexStatus.FAILED),
    )


def _indexed_pages_count(db: Session) -> int:
    return db.scalar(select(func.coalesce(func.sum(DocumentStats.indexed_page_count), 0))) or 0


def _field_summary(field: ResearchField) -> DashboardFieldSummary:
    return DashboardFieldSummary(
        id=field.id,
        name=field.name,
        slug=field.slug,
        icon=field.icon,
        is_active=field.is_active,
    )


def _owner_summary(owner: User) -> DashboardOwnerSummary:
    return DashboardOwnerSummary(
        id=owner.id,
        name=owner.name,
        email=owner.email,
        student_number=owner.student_number,
    )


def _document_count_subquery():
    return (
        select(Document.research_project_id.label("project_id"), func.count(Document.id).label("document_count"))
        .group_by(Document.research_project_id)
        .subquery()
    )


def _user_project_count_subquery():
    return (
        select(ResearchProject.user_id.label("user_id"), func.count(ResearchProject.id).label("projects_count"))
        .group_by(ResearchProject.user_id)
        .subquery()
    )


def _user_document_count_subquery():
    return (
        select(ResearchProject.user_id.label("user_id"), func.count(Document.id).label("documents_count"))
        .join(Document, Document.research_project_id == ResearchProject.id)
        .group_by(ResearchProject.user_id)
        .subquery()
    )


def _project_to_admin_read(project: ResearchProject, document_count: int) -> AdminProjectRead:
    return AdminProjectRead(
        id=project.id,
        title=project.title,
        description=project.description,
        keywords=project.keywords,
        visibility=project.visibility,
        owner=_owner_summary(project.owner),
        field=_field_summary(project.research_field),
        document_count=document_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _document_to_admin_read(document: Document) -> AdminDocumentRead:
    stats = None
    if document.stats is not None:
        stats = AdminDocumentStats(
            total_terms=document.stats.total_terms,
            indexed_page_count=document.stats.indexed_page_count,
            updated_at=document.stats.updated_at,
        )
    return AdminDocumentRead(**document_summary(document).model_dump(), stats=stats)


def get_admin_dashboard(db: Session) -> AdminDashboardResponse:
    breakdown = _indexing_breakdown(db)
    recent_uploads = db.scalars(
        select(Document).order_by(Document.created_at.desc(), Document.id.desc()).limit(5)
    ).all()
    failed_documents = db.scalars(
        select(Document)
        .where(Document.index_status == IndexStatus.FAILED)
        .order_by(Document.updated_at.desc(), Document.id.desc())
        .limit(5)
    ).all()
    return AdminDashboardResponse(
        summary=AdminDashboardSummary(
            users_count=db.scalar(select(func.count(User.id))) or 0,
            active_users_count=db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0,
            fields_count=db.scalar(select(func.count(ResearchField.id))) or 0,
            active_fields_count=db.scalar(select(func.count(ResearchField.id)).where(ResearchField.is_active.is_(True))) or 0,
            projects_count=db.scalar(select(func.count(ResearchProject.id))) or 0,
            documents_count=db.scalar(select(func.count(Document.id))) or 0,
            indexed_documents_count=breakdown.indexed,
            pending_documents_count=breakdown.pending,
            processing_documents_count=breakdown.processing,
            failed_documents_count=breakdown.failed,
            indexed_pages_count=_indexed_pages_count(db),
        ),
        indexing_breakdown=breakdown,
        recent_uploads=[document_summary(document) for document in recent_uploads],
        failed_documents=[document_summary(document) for document in failed_documents],
    )


def list_admin_users(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
) -> AdminUserListResponse:
    project_counts = _user_project_count_subquery()
    document_counts = _user_document_count_subquery()
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
                User.student_number.ilike(pattern),
                User.study_program.ilike(pattern),
                User.class_name.ilike(pattern),
            )
        )
    if role is not None:
        conditions.append(User.role == role)
    if is_active is not None:
        conditions.append(User.is_active.is_(is_active))

    total = db.scalar(select(func.count(User.id)).where(*conditions)) or 0
    rows = db.execute(
        select(
            User,
            func.coalesce(project_counts.c.projects_count, 0),
            func.coalesce(document_counts.c.documents_count, 0),
        )
        .outerjoin(project_counts, project_counts.c.user_id == User.id)
        .outerjoin(document_counts, document_counts.c.user_id == User.id)
        .where(*conditions)
        .order_by(User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminUserListResponse(
        items=[
            AdminUserRead(
                id=user.id,
                name=user.name,
                student_number=user.student_number,
                email=user.email,
                study_program=user.study_program,
                class_name=user.class_name,
                role=user.role,
                is_active=user.is_active,
                projects_count=projects_count,
                documents_count=documents_count,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
            for user, projects_count, documents_count in rows
        ],
        pagination=build_pagination(page, page_size, total),
    )


def update_admin_user(db: Session, user_id: int, payload: AdminUserUpdate, current_user: User) -> AdminUserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id and payload.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot deactivate their own account")
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return list_admin_users(db, page=1, page_size=1, search=user.email).items[0]


def _project_sort_expression(sort_by: AdminProjectSort):
    if sort_by == "oldest":
        return ResearchProject.created_at.asc()
    if sort_by == "title_asc":
        return func.lower(ResearchProject.title).asc()
    if sort_by == "title_desc":
        return func.lower(ResearchProject.title).desc()
    return ResearchProject.created_at.desc()


def list_admin_projects(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    research_field_id: int | None = None,
    owner_id: int | None = None,
    visibility: ProjectVisibility | None = None,
    sort_by: AdminProjectSort = "newest",
) -> AdminProjectListResponse:
    doc_counts = _document_count_subquery()
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                ResearchProject.title.ilike(pattern),
                ResearchProject.description.ilike(pattern),
                cast(ResearchProject.keywords, String).ilike(pattern),
            )
        )
    if research_field_id is not None:
        conditions.append(ResearchProject.research_field_id == research_field_id)
    if owner_id is not None:
        conditions.append(ResearchProject.user_id == owner_id)
    if visibility is not None:
        conditions.append(ResearchProject.visibility == visibility)

    total = db.scalar(select(func.count(ResearchProject.id)).where(*conditions)) or 0
    rows = db.execute(
        select(ResearchProject, func.coalesce(doc_counts.c.document_count, 0))
        .outerjoin(doc_counts, doc_counts.c.project_id == ResearchProject.id)
        .where(*conditions)
        .order_by(_project_sort_expression(sort_by), ResearchProject.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminProjectListResponse(
        items=[_project_to_admin_read(project, document_count) for project, document_count in rows],
        pagination=build_pagination(page, page_size, total),
    )


def _document_sort_expression(sort_by: AdminDocumentSort):
    if sort_by == "oldest":
        return Document.created_at.asc()
    if sort_by == "title_asc":
        return func.lower(Document.title).asc()
    if sort_by == "title_desc":
        return func.lower(Document.title).desc()
    return Document.created_at.desc()


def _document_conditions(
    search: str | None = None,
    index_status: IndexStatus | None = None,
    research_field_id: int | None = None,
    research_project_id: int | None = None,
    owner_id: int | None = None,
):
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(or_(Document.title.ilike(pattern), Document.original_filename.ilike(pattern)))
    if index_status is not None:
        conditions.append(Document.index_status == index_status)
    if research_field_id is not None:
        conditions.append(ResearchProject.research_field_id == research_field_id)
    if research_project_id is not None:
        conditions.append(Document.research_project_id == research_project_id)
    if owner_id is not None:
        conditions.append(ResearchProject.user_id == owner_id)
    return conditions


def list_admin_documents(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    index_status: IndexStatus | None = None,
    research_field_id: int | None = None,
    research_project_id: int | None = None,
    owner_id: int | None = None,
    sort_by: AdminDocumentSort = "newest",
) -> AdminDocumentListResponse:
    conditions = _document_conditions(search, index_status, research_field_id, research_project_id, owner_id)
    total = db.scalar(
        select(func.count(Document.id))
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(*conditions)
    ) or 0
    documents = db.scalars(
        select(Document)
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(*conditions)
        .order_by(_document_sort_expression(sort_by), Document.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminDocumentListResponse(
        items=[_document_to_admin_read(document) for document in documents],
        pagination=build_pagination(page, page_size, total),
    )


def list_admin_indexing(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    index_status: IndexStatus | None = None,
) -> AdminIndexingResponse:
    documents = list_admin_documents(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        index_status=index_status,
        sort_by="newest",
    )
    return AdminIndexingResponse(
        summary=_indexing_breakdown(db),
        items=documents.items,
        pagination=documents.pagination,
    )
