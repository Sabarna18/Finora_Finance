# ==================================================
# src/api/v1/endpoints/categories.py
# ==================================================

from typing import List

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from sqlalchemy.orm import Session

from src.db.database import get_db

from src.db.models import (
    TransactionType,
    User,
)

from src.db.schemas import (
    CategoryCreate,
    CategoryResponse,
)

from src.core.dependencies import (
    get_current_user,
)

from src.services.category_service import (
    CategoryService,
)

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CategoryService.create_category(
        db=db,
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/",
    response_model=List[CategoryResponse],
)
def get_categories(
    category_type: TransactionType | None = Query(
        default=None,
        alias="type",
        description=("Filter by income/expense"),
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CategoryService.list_categories(
        db=db,
        current_user=current_user,
        category_type=category_type,
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CategoryService.get_category(
        db=db,
        current_user=current_user,
        category_id=category_id,
    )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CategoryService.update_category(
        db=db,
        current_user=current_user,
        category_id=category_id,
        payload=payload,
    )


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_200_OK,
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CategoryService.delete_category(
        db=db,
        current_user=current_user,
        category_id=category_id,
    )
