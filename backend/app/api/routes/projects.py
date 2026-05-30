from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.db.models import ProjectVisibility, User
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(tags=["research projects"])


@router.get("", response_model=ProjectListResponse)
def list_research_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, max_length=255),
    field_id: int | None = Query(None, gt=0),
    visibility: ProjectVisibility | None = None,
    owner_id: int | None = Query(None, gt=0),
    sort_by: Literal["newest", "oldest", "title_asc", "title_desc"] = "newest",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProjectListResponse:
    return project_service.list_projects(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        field_id=field_id,
        visibility=visibility,
        owner_id=owner_id,
        sort_by=sort_by,
    )


@router.get("/me", response_model=ProjectListResponse)
def list_my_research_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, max_length=255),
    field_id: int | None = Query(None, gt=0),
    visibility: ProjectVisibility | None = None,
    sort_by: Literal["newest", "oldest", "title_asc", "title_desc"] = "newest",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProjectListResponse:
    return project_service.list_projects(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        field_id=field_id,
        visibility=visibility,
        only_current_user=True,
        sort_by=sort_by,
    )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_research_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = project_service.create_project(db, payload, current_user)
    return project_service.project_to_read(db, project)


@router.get("/{project_id}", response_model=ProjectRead)
def get_research_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = project_service.get_project_for_read(db, project_id, current_user)
    return project_service.project_to_read(db, project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_research_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = project_service.update_project(db, project_id, payload, current_user)
    return project_service.project_to_read(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_research_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Response:
    project_service.delete_project(db, project_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
