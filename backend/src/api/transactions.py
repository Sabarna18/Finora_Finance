# ==================================================
# src/api/v1/endpoints/transactions.py
# ==================================================


from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.core.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.db.schemas import TransactionCreate, TransactionResponse, TransactionUpdate
from src.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# --------------------------------------------------
# CREATE
# --------------------------------------------------
@router.post(
    "", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED
)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return TransactionService.create_transaction(
        db=db, current_user=current_user, payload=payload
    )


# --------------------------------------------------
# LIST
# --------------------------------------------------
@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str | None = None,
    search: str | None = None,
    category_id: int | None = None,
    month: int | None = None,
    year: int | None = None,
    week: int | None = None,
    sort: str = "-date",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return TransactionService.list_transactions(
        db=db,
        current_user=current_user,
        page=page,
        limit=limit,
        type=type,
        search=search,
        category_id=category_id,
        month=month,
        year=year,
        week=week,
        sort=sort,
    )


# --------------------------------------------------
# GET SINGLE
# --------------------------------------------------
@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return TransactionService.get_transaction(
        db=db, current_user=current_user, transaction_id=transaction_id
    )


# --------------------------------------------------
# UPDATE
# --------------------------------------------------
@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return TransactionService.update_transaction(
        db=db, current_user=current_user, transaction_id=transaction_id, payload=payload
    )


# --------------------------------------------------
# DELETE
# --------------------------------------------------
@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return TransactionService.delete_transaction(
        db=db, current_user=current_user, transaction_id=transaction_id
    )
