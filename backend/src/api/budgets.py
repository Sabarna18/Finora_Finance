from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from src.core.dependencies import (
    get_current_user,
)
from src.db.database import get_db
from src.db.models import User
from src.db.schemas import (
    BudgetCreate,
    BudgetResponse,
    BudgetStatusResponse,
    BudgetUpdate,
)
from src.services.budgets_service import (
    BudgetService,
)

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"],
)


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.create_budget(
        db=db,
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/",
    response_model=list[BudgetResponse],
)
def get_budgets(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.list_budgets(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
    )


@router.get(
    "/current-month",
    response_model=list[BudgetResponse],
)
def get_current_month_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.get_current_month_budgets(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.get_budget(
        db=db,
        current_user=current_user,
        budget_id=budget_id,
    )


@router.get(
    "/status/{budget_id}",
    response_model=BudgetStatusResponse,
)
def get_budget_status(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return BudgetService.get_budget_status(
        db=db,
        current_user=current_user,
        budget_id=budget_id,
    )


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse,
)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.update_budget(
        db=db,
        current_user=current_user,
        budget_id=budget_id,
        payload=payload,
    )


@router.delete(
    "/{budget_id}",
)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BudgetService.delete_budget(
        db=db,
        current_user=current_user,
        budget_id=budget_id,
    )
