from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.db.models import User
from app.schemas.search import CatalogResponse, SearchHistoryResponse, SearchResponse
from app.services import search_service

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search_documents(
    q: str = Query(..., max_length=255),
    research_field_id: int | None = Query(None, gt=0),
    research_project_id: int | None = Query(None, gt=0),
    owner_id: int | None = Query(None, gt=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    sort_by: Literal["relevance", "newest", "title_asc", "title_desc"] = "relevance",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    return search_service.search_documents(
        db=db,
        current_user=current_user,
        query=q,
        research_field_id=research_field_id,
        research_project_id=research_project_id,
        owner_id=owner_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
    )


@router.get("/search/catalog", response_model=CatalogResponse)
def search_catalog(
    q: str = Query(..., max_length=255),
    limit: int = Query(8, ge=1, le=20),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CatalogResponse:
    return search_service.search_catalog(db=db, current_user=current_user, query=q, limit=limit)


@router.get("/search/history", response_model=SearchHistoryResponse)
def list_search_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SearchHistoryResponse:
    return search_service.list_history(db=db, current_user=current_user, page=page, page_size=page_size)


@router.delete("/search/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_search_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Response:
    search_service.clear_history(db=db, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
