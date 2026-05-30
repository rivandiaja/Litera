from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_admin
from app.db.models import User
from app.schemas.field import FieldCreate, FieldListResponse, FieldRead, FieldUpdate
from app.services import field_service

router = APIRouter(tags=["research fields"])


@router.get("", response_model=FieldListResponse)
def list_research_fields(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> FieldListResponse:
    return field_service.list_fields(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        include_inactive=include_inactive,
    )


@router.post("", response_model=FieldRead, status_code=status.HTTP_201_CREATED)
def create_research_field(
    payload: FieldCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> FieldRead:
    field = field_service.create_field(db, payload)
    return field_service.field_to_read(db, field)


@router.get("/{field_id}", response_model=FieldRead)
def get_research_field(
    field_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> FieldRead:
    field = field_service.get_field_for_read(db, field_id, current_user)
    return field_service.field_to_read(db, field)


@router.patch("/{field_id}", response_model=FieldRead)
def update_research_field(
    field_id: int,
    payload: FieldUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> FieldRead:
    field = field_service.update_field(db, field_id, payload)
    return field_service.field_to_read(db, field)


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_research_field(
    field_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    field_service.delete_field(db, field_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
