# ==================================================
# src/services/auth_service.py
# ==================================================

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.logger import get_logger
from src.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from src.db.models import User

logger = get_logger("Auth")


class AuthService:
    # ----------------------------------------------
    # REGISTER USER
    # ----------------------------------------------
    @staticmethod
    def register_user(
        db: Session,
        user_data,
    ):
        email = user_data.email.strip().lower()

        logger.info(f"Registration attempt: {email}")

        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            logger.warning(f"Registration failed: email already exists ({email})")

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        new_user = User(
            name=user_data.name.strip(),
            email=email,
            password_hash=hash_password(user_data.password),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(
            f"User registered successfully: user_id={new_user.id}, email={email}"
        )

        return new_user

    # ----------------------------------------------
    # LOGIN USER
    # ----------------------------------------------
    @staticmethod
    def login_user(
        db: Session,
        email: str,
        password: str,
    ):
        email = email.strip().lower()

        logger.info(f"Login attempt: {email}")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            logger.warning(f"Login failed: user not found ({email})")

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(password, user.password_hash):
            logger.warning(
                f"Login failed: wrong password (user_id={user.id}, email={email})"
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        token = create_access_token({"sub": str(user.id)})

        logger.info(f"Login successful: user_id={user.id}, email={email}")

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    # ----------------------------------------------
    # CURRENT USER
    # ----------------------------------------------
    @staticmethod
    def get_me(current_user):

        logger.info(f"Profile accessed: user_id={current_user.id}")

        return current_user
