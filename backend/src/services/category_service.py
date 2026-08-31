# ==================================================
# src/services/category_service.py
# ==================================================


from fastapi import (
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from src.core.logger import (
    get_logger,
)
from src.db.models import (
    Category,
    TransactionType,
    User,
)

logger = get_logger("categories")


class CategoryService:
    # ----------------------------------------------
    # CREATE
    # ----------------------------------------------
    @staticmethod
    def create_category(
        db: Session,
        current_user: User,
        payload,
    ):

        logger.info(
            f"Category create attempt: "
            f"user_id={current_user.id}, "
            f"name={payload.name.strip()}, "
            f"type={payload.type}"
        )

        existing = (
            db.query(Category)
            .filter(
                Category.user_id == current_user.id,
                Category.type == payload.type,
                Category.name.ilike(payload.name.strip()),
            )
            .first()
        )

        if existing:
            logger.warning(
                f"Duplicate category attempt: "
                f"user_id={current_user.id}, "
                f"name={payload.name.strip()}"
            )

            raise HTTPException(
                status_code=(status.HTTP_409_CONFLICT),
                detail="Category already exists",
            )

        try:
            category = Category(
                name=(payload.name.strip()),
                type=payload.type,
                user_id=current_user.id,
            )

            db.add(category)
            db.commit()
            db.refresh(category)

            logger.info(
                f"Category created: "
                f"category_id={category.id}, "
                f"user_id={current_user.id}"
            )

            return category

        except Exception:
            logger.exception(f"Category creation failed: user_id={current_user.id}")

            raise

    # ----------------------------------------------
    # LIST
    # ----------------------------------------------
    @staticmethod
    def list_categories(
        db: Session,
        current_user: User,
        category_type: TransactionType | None = None,
    ):

        logger.info(
            f"Category list requested: user_id={current_user.id}, type={category_type}"
        )

        query = db.query(Category).filter(Category.user_id == current_user.id)

        if category_type:
            query = query.filter(Category.type == category_type)

        results = query.order_by(Category.name.asc()).all()

        logger.info(
            f"Category list returned: user_id={current_user.id}, count={len(results)}"
        )

        return results

    # ----------------------------------------------
    # GET SINGLE
    # ----------------------------------------------
    @staticmethod
    def get_category(
        db: Session,
        current_user: User,
        category_id: int,
    ):

        category = (
            db.query(Category)
            .filter(
                Category.id == category_id,
                Category.user_id == current_user.id,
            )
            .first()
        )

        if not category:
            logger.warning(
                f"Category not found: "
                f"category_id={category_id}, "
                f"user_id={current_user.id}"
            )

            raise HTTPException(
                status_code=(status.HTTP_404_NOT_FOUND),
                detail="Category not found",
            )

        logger.info(
            f"Category fetched: category_id={category.id}, user_id={current_user.id}"
        )

        return category

    # ----------------------------------------------
    # UPDATE
    # ----------------------------------------------
    @staticmethod
    def update_category(
        db: Session,
        current_user: User,
        category_id: int,
        payload,
    ):

        logger.info(
            f"Category update attempt: "
            f"category_id={category_id}, "
            f"user_id={current_user.id}"
        )

        category = CategoryService.get_category(
            db=db,
            current_user=current_user,
            category_id=category_id,
        )

        duplicate = (
            db.query(Category)
            .filter(
                Category.user_id == current_user.id,
                Category.id != category_id,
                Category.type == payload.type,
                Category.name.ilike(payload.name.strip()),
            )
            .first()
        )

        if duplicate:
            logger.warning(
                f"Duplicate category update: "
                f"category_id={category_id}, "
                f"user_id={current_user.id}"
            )

            raise HTTPException(
                status_code=(status.HTTP_409_CONFLICT),
                detail=("Another category with same name exists"),
            )

        category.name = payload.name.strip()

        category.type = payload.type

        db.commit()
        db.refresh(category)

        logger.info(
            f"Category updated: category_id={category.id}, user_id={current_user.id}"
        )

        return category

    # ----------------------------------------------
    # DELETE
    # ----------------------------------------------
    @staticmethod
    def delete_category(
        db: Session,
        current_user: User,
        category_id: int,
    ):

        logger.warning(
            f"Category delete attempt: "
            f"category_id={category_id}, "
            f"user_id={current_user.id}"
        )

        category = CategoryService.get_category(
            db=db,
            current_user=current_user,
            category_id=category_id,
        )

        db.delete(category)
        db.commit()

        logger.warning(
            f"Category deleted: category_id={category.id}, user_id={current_user.id}"
        )

        return {"message": ("Category deleted successfully")}
