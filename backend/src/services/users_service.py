# ==================================================
# src/services/users_service.py
# ==================================================

from fastapi import (
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from src.core.security import (
    hash_password,
    verify_password,
)
from src.db.models import User


class UserService:
    # ----------------------------------------------
    # PROFILE
    # ----------------------------------------------
    @staticmethod
    def get_profile(
        current_user: User,
    ):
        return current_user

    # ----------------------------------------------
    # UPDATE PROFILE
    # ----------------------------------------------
    @staticmethod
    def update_profile(
        db: Session,
        current_user: User,
        payload,
    ):
        updates = payload.model_dump(exclude_unset=True)

        if "email" in updates:
            existing = (
                db.query(User)
                .filter(
                    User.email == updates["email"],
                    User.id != current_user.id,
                )
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists",
                )

            updates["email"] = updates["email"].strip().lower()

        if "name" in updates:
            updates["name"] = updates["name"].strip()

        for key, value in updates.items():
            setattr(
                current_user,
                key,
                value,
            )

        db.commit()
        db.refresh(current_user)

        return current_user

    # ----------------------------------------------
    # CHANGE PASSWORD
    # ----------------------------------------------
    @staticmethod
    def change_password(
        db: Session,
        current_user: User,
        payload,
    ):
        if not verify_password(
            payload.current_password,
            current_user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        current_user.password_hash = hash_password(payload.new_password)

        db.commit()

        return {"message": "Password updated successfully"}

    # ----------------------------------------------
    # DEACTIVATE
    # ----------------------------------------------
    @staticmethod
    def deactivate_account(
        db: Session,
        current_user: User,
    ):
        current_user.is_active = False

        db.commit()

        return {"message": "Account deactivated successfully"}
