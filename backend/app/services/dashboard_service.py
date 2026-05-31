from __future__ import annotations

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.db.models import Document, DocumentStats, IndexStatus, ProjectVisibility, ResearchField, ResearchProject, SearchHistory, User
from app.schemas.dashboard import (
    DashboardDocumentSummary,
    DashboardFieldSummary,
    DashboardOwnerSummary,
    DashboardProjectSummary,
    DashboardSearchSummary,
    DashboardSummary,
    MyDashboardResponse,
    RepositoryStats,
)


def _count(db: Session, *conditions) -> int:
    return db.scalar(select(func.count()).where(*conditions)) or 0


def _document_count_subquery():
    return (
        select(Document.research_project_id.label("project_id"), func.count(Document.id).label("document_count"))
        .group_by(Document.research_project_id)
        .subquery()
    )


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


def _project_summary(project: ResearchProject, document_count: int | None = None) -> DashboardProjectSummary:
    return DashboardProjectSummary(
        id=project.id,
        title=project.title,
        description=project.description,
        keywords=project.keywords,
        visibility=project.visibility,
        field=_field_summary(project.research_field),
        document_count=document_count if document_count is not None else len(project.documents),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _safe_index_message(message: str | None) -> str | None:
    if not message:
        return None
    lowered = message.casefold()
    if "traceback" in lowered or "\n  file " in lowered or "stack trace" in lowered:
        return "Indexing gagal. Periksa file PDF dan jalankan re-index."
    return message[:500]


def document_summary(document: Document, document_count: int | None = None) -> DashboardDocumentSummary:
    project = document.research_project
    return DashboardDocumentSummary(
        id=document.id,
        title=document.title,
        original_filename=document.original_filename,
        file_size=document.file_size,
        total_pages=document.total_pages,
        index_status=document.index_status,
        index_message=_safe_index_message(document.index_message),
        indexed_at=document.indexed_at,
        project=_project_summary(project, document_count),
        field=_field_summary(project.research_field),
        owner=_owner_summary(project.owner),
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def _documents_for_owner_condition(user_id: int):
    return Document.research_project_id == ResearchProject.id, ResearchProject.user_id == user_id


def _document_status_count(db: Session, user_id: int, status: IndexStatus) -> int:
    return db.scalar(
        select(func.count(Document.id))
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(ResearchProject.user_id == user_id, Document.index_status == status)
    ) or 0


def _indexed_pages_for_owner(db: Session, user_id: int) -> int:
    return db.scalar(
        select(func.coalesce(func.sum(DocumentStats.indexed_page_count), 0))
        .join(Document, DocumentStats.document_id == Document.id)
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(ResearchProject.user_id == user_id)
    ) or 0


def _recent_project_rows(db: Session, user_id: int, limit: int = 5):
    doc_counts = _document_count_subquery()
    return db.execute(
        select(ResearchProject, func.coalesce(doc_counts.c.document_count, 0))
        .outerjoin(doc_counts, doc_counts.c.project_id == ResearchProject.id)
        .where(ResearchProject.user_id == user_id)
        .order_by(ResearchProject.created_at.desc(), ResearchProject.id.desc())
        .limit(limit)
    ).all()


def _recent_documents(db: Session, user_id: int, limit: int = 5) -> list[DashboardDocumentSummary]:
    rows = db.scalars(
        select(Document)
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(ResearchProject.user_id == user_id)
        .order_by(Document.created_at.desc(), Document.id.desc())
        .limit(limit)
    ).all()
    return [document_summary(document) for document in rows]


def _recent_searches(db: Session, user_id: int, limit: int = 5) -> list[DashboardSearchSummary]:
    histories = db.scalars(
        select(SearchHistory)
        .where(SearchHistory.user_id == user_id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .limit(limit)
    ).all()
    return [
        DashboardSearchSummary(
            id=history.id,
            query=history.query,
            research_field_id=history.research_field_id,
            research_project_id=history.research_project_id,
            result_count=history.result_count,
            created_at=history.created_at,
        )
        for history in histories
    ]


def get_my_dashboard(db: Session, current_user: User) -> MyDashboardResponse:
    user_id = current_user.id
    projects_count = db.scalar(select(func.count(ResearchProject.id)).where(ResearchProject.user_id == user_id)) or 0
    documents_count = db.scalar(
        select(func.count(Document.id))
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(ResearchProject.user_id == user_id)
    ) or 0
    recent_projects = [
        _project_summary(project, document_count)
        for project, document_count in _recent_project_rows(db, user_id)
    ]
    return MyDashboardResponse(
        summary=DashboardSummary(
            projects_count=projects_count,
            documents_count=documents_count,
            indexed_documents_count=_document_status_count(db, user_id, IndexStatus.INDEXED),
            pending_documents_count=_document_status_count(db, user_id, IndexStatus.PENDING),
            processing_documents_count=_document_status_count(db, user_id, IndexStatus.PROCESSING),
            failed_documents_count=_document_status_count(db, user_id, IndexStatus.FAILED),
            indexed_pages_count=_indexed_pages_for_owner(db, user_id),
            search_history_count=db.scalar(select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user_id)) or 0,
        ),
        recent_projects=recent_projects,
        recent_documents=_recent_documents(db, user_id),
        recent_searches=_recent_searches(db, user_id),
    )


def get_repository_stats(db: Session) -> RepositoryStats:
    public_project_condition = ResearchProject.visibility == ProjectVisibility.PUBLIC
    return RepositoryStats(
        fields_count=db.scalar(select(func.count(ResearchField.id)).where(ResearchField.is_active.is_(True))) or 0,
        public_projects_count=db.scalar(select(func.count(ResearchProject.id)).where(public_project_condition)) or 0,
        public_documents_count=db.scalar(
            select(func.count(Document.id))
            .join(ResearchProject, Document.research_project_id == ResearchProject.id)
            .where(public_project_condition)
        ) or 0,
        contributors_count=db.scalar(
            select(func.count(distinct(ResearchProject.user_id))).where(public_project_condition)
        ) or 0,
        indexed_pages_count=db.scalar(
            select(func.coalesce(func.sum(DocumentStats.indexed_page_count), 0))
            .join(Document, DocumentStats.document_id == Document.id)
            .join(ResearchProject, Document.research_project_id == ResearchProject.id)
            .where(public_project_condition)
        ) or 0,
    )
