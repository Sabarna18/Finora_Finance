# ==================================================
# src/services/budgets_service.py
# ==================================================

from datetime import datetime
from typing import Optional

from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from src.db.models import (
    Budget,
    Category,
    User,
)

from sqlalchemy import func

from src.db.models import (
    Transaction,
    TransactionType,
)

from src.core.logger import (
    get_logger,
)

logger = get_logger("budgets")


class BudgetService:

    # ----------------------------------------------
    # CREATE
    # ----------------------------------------------
    @staticmethod
    def create_budget(
        db: Session,
        current_user: User,
        payload,
    ):

        logger.info(
            f"Budget create attempt: "
            f"user_id={current_user.id}, "
            f"month={payload.month}, "
            f"year={payload.year}"
        )

        # Validate category ownership
        if payload.category_id:

            category = (
                db.query(Category)
                .filter(
                    Category.id == payload.category_id,
                    Category.user_id == current_user.id,
                )
                .first()
            )

            if not category:

                logger.warning(
                    f"Invalid category in budget: "
                    f"user_id={current_user.id}, "
                    f"category_id={payload.category_id}"
                )

                raise HTTPException(
                    status_code=(status.HTTP_404_NOT_FOUND),
                    detail="Category not found",
                )

        # Duplicate check
        existing = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.month == payload.month,
                Budget.year == payload.year,
                Budget.category_id == payload.category_id,
            )
            .first()
        )

        if existing:

            logger.warning(
                f"Duplicate budget attempt: "
                f"user_id={current_user.id}, "
                f"month={payload.month}, "
                f"year={payload.year}"
            )

            raise HTTPException(
                status_code=(status.HTTP_409_CONFLICT),
                detail=("Budget already exists " "for this period"),
            )

        try:

            budget = Budget(
                amount=payload.amount,
                month=payload.month,
                year=payload.year,
                category_id=(payload.category_id),
                user_id=current_user.id,
            )

            db.add(budget)
            db.commit()
            db.refresh(budget)

            logger.info(
                f"Budget created: "
                f"budget_id={budget.id}, "
                f"user_id={current_user.id}"
            )

            return budget

        except Exception:

            logger.exception(f"Budget creation failed: " f"user_id={current_user.id}")

            raise

    # ----------------------------------------------
    # LIST
    # ----------------------------------------------
    @staticmethod
    def list_budgets(
        db: Session,
        current_user: User,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ):

        logger.info(
            f"Budget list requested: "
            f"user_id={current_user.id}, "
            f"month={month}, "
            f"year={year}"
        )

        query = db.query(Budget).filter(Budget.user_id == current_user.id)

        if month:
            query = query.filter(Budget.month == month)

        if year:
            query = query.filter(Budget.year == year)

        results = query.order_by(
            Budget.year.desc(),
            Budget.month.desc(),
        ).all()

        logger.info(
            f"Budget list returned: "
            f"user_id={current_user.id}, "
            f"count={len(results)}"
        )

        return results

    # ----------------------------------------------
    # CURRENT MONTH
    # ----------------------------------------------
    @staticmethod
    def get_current_month_budgets(
        db: Session,
        current_user: User,
    ):

        now = datetime.utcnow()

        logger.info(f"Current month budgets requested: " f"user_id={current_user.id}")

        results = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.month == now.month,
                Budget.year == now.year,
            )
            .all()
        )

        logger.info(
            f"Current month budgets returned: "
            f"user_id={current_user.id}, "
            f"count={len(results)}"
        )

        return results

    # ----------------------------------------------
    # GET SINGLE
    # ----------------------------------------------
    @staticmethod
    def get_budget(
        db: Session,
        current_user: User,
        budget_id: int,
    ):

        budget = (
            db.query(Budget)
            .filter(
                Budget.id == budget_id,
                Budget.user_id == current_user.id,
            )
            .first()
        )

        if not budget:

            logger.warning(
                f"Budget not found: "
                f"budget_id={budget_id}, "
                f"user_id={current_user.id}"
            )

            raise HTTPException(
                status_code=(status.HTTP_404_NOT_FOUND),
                detail="Budget not found",
            )

        logger.info(
            f"Budget fetched: " f"budget_id={budget.id}, " f"user_id={current_user.id}"
        )

        return budget

    # ----------------------------------------------
    # UPDATE
    # ----------------------------------------------
    @staticmethod
    def update_budget(
        db: Session,
        current_user: User,
        budget_id: int,
        payload,
    ):

        logger.info(
            f"Budget update attempt: "
            f"budget_id={budget_id}, "
            f"user_id={current_user.id}"
        )

        budget = BudgetService.get_budget(
            db=db,
            current_user=current_user,
            budget_id=budget_id,
        )

        updates = payload.model_dump(exclude_unset=True)

        # Validate category
        if "category_id" in updates and updates["category_id"]:

            category = (
                db.query(Category)
                .filter(
                    Category.id == updates["category_id"],
                    Category.user_id == current_user.id,
                )
                .first()
            )

            if not category:

                logger.warning(
                    f"Invalid category "
                    f"during budget update: "
                    f"budget_id={budget_id}"
                )

                raise HTTPException(
                    status_code=(status.HTTP_404_NOT_FOUND),
                    detail="Category not found",
                )

        # Apply updates
        for key, value in updates.items():
            setattr(budget, key, value)

        # Duplicate recheck
        duplicate = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.id != budget.id,
                Budget.month == budget.month,
                Budget.year == budget.year,
                Budget.category_id == budget.category_id,
            )
            .first()
        )

        if duplicate:

            logger.warning(f"Duplicate budget update: " f"budget_id={budget_id}")

            raise HTTPException(
                status_code=(status.HTTP_409_CONFLICT),
                detail=("Another budget exists " "for this period"),
            )

        db.commit()
        db.refresh(budget)

        logger.info(
            f"Budget updated: " f"budget_id={budget.id}, " f"user_id={current_user.id}"
        )

        return budget

    # ----------------------------------------------
    # DELETE
    # ----------------------------------------------
    @staticmethod
    def delete_budget(
        db: Session,
        current_user: User,
        budget_id: int,
    ):

        logger.warning(
            f"Budget delete attempt: "
            f"budget_id={budget_id}, "
            f"user_id={current_user.id}"
        )

        budget = BudgetService.get_budget(
            db=db,
            current_user=current_user,
            budget_id=budget_id,
        )

        db.delete(budget)
        db.commit()

        logger.warning(
            f"Budget deleted: " f"budget_id={budget.id}, " f"user_id={current_user.id}"
        )

        return {"message": ("Budget deleted successfully")}

    # ----------------------------------------------
    #   budget service
    # ----------------------------------------------

    @staticmethod
    def get_budget_status(
        db: Session,
        current_user: User,
        budget_id: int,
    ):

        budget = BudgetService.get_budget(
            db=db,
            current_user=current_user,
            budget_id=budget_id,
        )

        query = db.query(
            func.coalesce(
                func.sum(Transaction.amount),
                0,
            )
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == TransactionType.EXPENSE,
        )

        # Category budget
        if budget.category_id:

            query = query.filter(Transaction.category_id == budget.category_id)

        query = query.filter(
            func.extract("month", Transaction.date) == budget.month,
            func.extract("year", Transaction.date) == budget.year,
        )

        spent = query.scalar() or 0

        remaining = budget.amount - spent

        percentage = spent / budget.amount * 100 if budget.amount > 0 else 0

        # ----------------------------------------------
        # HEALTH STATUS
        # ----------------------------------------------
        if percentage >= 100:

            status = "Exceeded"

        elif percentage >= 80:

            status = "Warning"

        else:

            status = "Healthy"

        return {
            "budget_id": budget.id,
            "category_id": budget.category_id,
            "category_name": (budget.category.name if budget.category else None),
            "budget_amount": budget.amount,
            "spent_amount": spent,
            "remaining_amount": remaining,
            "percentage_used": round(percentage, 2),
            "status": status,
            "month": budget.month,
            "year": budget.year,
        }
