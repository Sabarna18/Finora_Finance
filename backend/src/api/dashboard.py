# ==================================================
# src/api/v1/endpoints/dashboard.py
# ==================================================

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from src.core.dependencies import (
    get_current_user,
)
from src.db.database import get_db
from src.db.models import User
from src.services.dashboard_service import (
    DashboardService,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_summary(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )


@router.get("/monthly-trend")
def get_monthly_trend(
    year: int | None = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_monthly_trend(
        db=db,
        current_user=current_user,
        year=year,
    )


@router.get("/category-breakdown")
def get_category_breakdown(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_category_breakdown(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )


@router.get(
    "/status",
)
def get_budget_statuses(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return DashboardService.get_all_budget_statuses(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )


@router.get("/recent-transactions")
def get_recent_transactions(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService.get_recent_transactions(
        db=db,
        current_user=current_user,
        limit=limit,
    )
