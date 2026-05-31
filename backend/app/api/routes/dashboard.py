from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.db.models import User
from app.schemas.dashboard import MyDashboardResponse, RepositoryStats
from app.services import dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/me", response_model=MyDashboardResponse)
def read_my_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> MyDashboardResponse:
    return dashboard_service.get_my_dashboard(db, current_user)


@router.get("/dashboard/repository-stats", response_model=RepositoryStats)
def read_repository_stats(
    _current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> RepositoryStats:
    return dashboard_service.get_repository_stats(db)
