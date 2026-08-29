# ==================================================
# src/api/v1/endpoints/auth.py
# ==================================================

from fastapi import (
    APIRouter,
    Depends,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.schemas import (
    UserCreate,
    UserResponse,
)
from src.core.dependencies import (
    get_current_user,
)
from src.services.auth_service import (
    AuthService,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ----------------------------------------------
# REGISTER
# ----------------------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    return AuthService.register_user(
        db=db,
        user_data=user_data,
    )


# ----------------------------------------------
# LOGIN
# ----------------------------------------------
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return AuthService.login_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )


# ----------------------------------------------
# CURRENT USER
# ----------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(current_user=Depends(get_current_user)):
    return AuthService.get_me(current_user=current_user)
