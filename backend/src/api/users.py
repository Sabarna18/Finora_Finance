# ==================================================
# src/api/v1/endpoints/users.py
# ==================================================

from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from src.db.database import get_db

from src.db.models import User

from src.db.schemas import (
    UserResponse,
    UserUpdate,
    PasswordChange,
)

from src.core.dependencies import (
    get_current_user,
)

from src.services.users_service import (
    UserService,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ----------------------------------------------
# PROFILE
# ----------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return UserService.get_profile(current_user)


# ----------------------------------------------
# UPDATE PROFILE
# ----------------------------------------------
@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.update_profile(
        db=db,
        current_user=current_user,
        payload=payload,
    )


# ----------------------------------------------
# CHANGE PASSWORD
# ----------------------------------------------
@router.patch(
    "/change-password",
)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.change_password(
        db=db,
        current_user=current_user,
        payload=payload,
    )


# ----------------------------------------------
# DEACTIVATE ACCOUNT
# ----------------------------------------------
@router.delete(
    "/me",
)
def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserService.deactivate_account(
        db=db,
        current_user=current_user,
    )
