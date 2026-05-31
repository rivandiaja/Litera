from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.db.models import IndexStatus, ProjectVisibility, User, UserRole
from app.schemas.admin import (
    AdminDashboardResponse,
    AdminDocumentListResponse,
    AdminIndexingResponse,
    AdminProjectListResponse,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserUpdate,
)
from app.services import admin_service

router = APIRouter(tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
def read_admin_dashboard(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDashboardResponse:
    return admin_service.get_admin_dashboard(db)


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    search: str | None = Query(None, max_length=255),
    role: UserRole | None = None,
    is_active: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserListResponse:
    return admin_service.list_admin_users(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        is_active=is_active,
    )


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserRead:
    return admin_service.update_admin_user(db, user_id, payload, admin)


@router.get("/projects", response_model=AdminProjectListResponse)
def list_projects(
    search: str | None = Query(None, max_length=255),
    research_field_id: int | None = Query(None, gt=0),
    owner_id: int | None = Query(None, gt=0),
    visibility: ProjectVisibility | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Literal["newest", "oldest", "title_asc", "title_desc"] = "newest",
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminProjectListResponse:
    return admin_service.list_admin_projects(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        research_field_id=research_field_id,
        owner_id=owner_id,
        visibility=visibility,
        sort_by=sort_by,
    )


@router.get("/documents", response_model=AdminDocumentListResponse)
def list_documents(
    search: str | None = Query(None, max_length=255),
    index_status: IndexStatus | None = None,
    research_field_id: int | None = Query(None, gt=0),
    research_project_id: int | None = Query(None, gt=0),
    owner_id: int | None = Query(None, gt=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Literal["newest", "oldest", "title_asc", "title_desc"] = "newest",
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDocumentListResponse:
    return admin_service.list_admin_documents(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        index_status=index_status,
        research_field_id=research_field_id,
        research_project_id=research_project_id,
        owner_id=owner_id,
        sort_by=sort_by,
    )


@router.get("/indexing", response_model=AdminIndexingResponse)
def list_indexing(
    search: str | None = Query(None, max_length=255),
    index_status: IndexStatus | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminIndexingResponse:
    return admin_service.list_admin_indexing(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        index_status=index_status,
    )
