# ==================================================
# src/api/v1/endpoints/reports.py
# ==================================================

from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import User

from src.core.dependencies import (
    get_current_user,
)

from src.services.reports_service import (
    ReportsService,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ----------------------------------------------
# CASH FLOW
# ----------------------------------------------
@router.get(
    "/cash-flow",
)
def get_cash_flow(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportsService.get_cash_flow(
        db=db,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )


# ----------------------------------------------
# CATEGORY ANALYSIS
# ----------------------------------------------
@router.get(
    "/category-analysis",
)
def get_category_analysis(
    month: int = Query(
        ...,
        ge=1,
        le=12,
    ),
    year: int = Query(
        ...,
        ge=2000,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportsService.get_category_analysis(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )


# ----------------------------------------------
# INCOME VS EXPENSE TREND
# ----------------------------------------------
@router.get(
    "/income-vs-expense",
)
def get_income_expense_trend(
    year: int = Query(
        ...,
        ge=2000,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportsService.get_income_expense_trend(
        db=db,
        current_user=current_user,
        year=year,
    )


# ----------------------------------------------
# BUDGET PERFORMANCE
# ----------------------------------------------
@router.get(
    "/budget-performance",
)
def get_budget_performance(
    month: int = Query(
        ...,
        ge=1,
        le=12,
    ),
    year: int = Query(
        ...,
        ge=2000,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportsService.get_budget_performance(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )
