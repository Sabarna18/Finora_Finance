# ==================================================
# src/services/dashboard_service.py
# ==================================================

from datetime import datetime

from sqlalchemy import (
    func,
    extract,
)

from sqlalchemy.orm import Session


from src.services.budgets_service import BudgetService
from src.db.models import (
    Transaction,
    Budget,
    Category,
    TransactionType,
    User,
)

from src.core.logger import (
    get_logger,
)

logger = get_logger("dashboard")


class DashboardService:

    # ----------------------------------------------
    # SUMMARY
    # ----------------------------------------------
    @staticmethod
    def get_summary(
        db: Session,
        current_user: User,
        month: int | None = None,
        year: int | None = None,
    ):

        logger.info(f"Dashboard summary requested: " f"user_id={current_user.id}")

        try:

            now = datetime.utcnow()

            month = month or now.month
            year = year or now.year

            base_query = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                extract(
                    "month",
                    Transaction.date,
                )
                == month,
                extract(
                    "year",
                    Transaction.date,
                )
                == year,
            )

            income = (
                base_query.filter(Transaction.type == TransactionType.INCOME)
                .with_entities(
                    func.coalesce(
                        func.sum(Transaction.amount),
                        0,
                    )
                )
                .scalar()
            )

            expense = (
                base_query.filter(Transaction.type == TransactionType.EXPENSE)
                .with_entities(
                    func.coalesce(
                        func.sum(Transaction.amount),
                        0,
                    )
                )
                .scalar()
            )

            count = base_query.count()

            logger.info(f"Dashboard summary generated: " f"user_id={current_user.id}")

            return {
                "month": month,
                "year": year,
                "total_income": float(income),
                "total_expense": float(expense),
                "savings": float(income - expense),
                "transaction_count": count,
            }

        except Exception:

            logger.exception(f"Dashboard summary failed: " f"user_id={current_user.id}")

            raise

    # ----------------------------------------------
    # MONTHLY TREND
    # ----------------------------------------------
    @staticmethod
    def get_monthly_trend(
        db: Session,
        current_user: User,
        year: int | None = None,
    ):

        logger.info(f"Monthly trend requested: " f"user_id={current_user.id}")

        now = datetime.utcnow()

        year = year or now.year

        rows = (
            db.query(
                extract(
                    "month",
                    Transaction.date,
                ).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
            )
            .filter(
                Transaction.user_id == current_user.id,
                extract(
                    "year",
                    Transaction.date,
                )
                == year,
            )
            .group_by(
                extract(
                    "month",
                    Transaction.date,
                ),
                Transaction.type,
            )
            .all()
        )

        logger.info(f"Monthly trend generated: " f"user_id={current_user.id}")

        result = {
            i: {
                "month": i,
                "income": 0.0,
                "expense": 0.0,
            }
            for i in range(1, 13)
        }

        for row in rows:

            month_no = int(row.month)

            if row.type == TransactionType.INCOME:

                result[month_no]["income"] = float(row.total)

            else:

                result[month_no]["expense"] = float(row.total)

        return {
            "year": year,
            "data": list(result.values()),
        }

    # ----------------------------------------------
    # CATEGORY BREAKDOWN
    # ----------------------------------------------
    @staticmethod
    def get_category_breakdown(
        db: Session,
        current_user: User,
        month: int | None = None,
        year: int | None = None,
    ):

        logger.info(f"Category breakdown requested: " f"user_id={current_user.id}")

        now = datetime.utcnow()

        month = month or now.month
        year = year or now.year

        rows = (
            db.query(
                Category.name,
                func.sum(Transaction.amount).label("total"),
            )
            .join(
                Category,
                Transaction.category_id == Category.id,
            )
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionType.EXPENSE,
                extract(
                    "month",
                    Transaction.date,
                )
                == month,
                extract(
                    "year",
                    Transaction.date,
                )
                == year,
            )
            .group_by(Category.name)
            .all()
        )

        logger.info(f"Category breakdown generated: " f"user_id={current_user.id}")

        return {
            "month": month,
            "year": year,
            "data": [
                {
                    "category": row.name,
                    "amount": float(row.total),
                }
                for row in rows
            ],
        }

    # ----------------------------------------------
    # BUDGET STATUS
    # ----------------------------------------------
    @staticmethod
    def get_all_budget_statuses(
        db: Session,
        current_user: User,
        month: int,
        year: int,
    ):

        budgets = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.month == month,
                Budget.year == year,
            )
            .all()
        )

        results = []

        for budget in budgets:

            results.append(
                BudgetService.get_budget_status(
                    db,
                    current_user,
                    budget.id,
                )
            )
        return results

    # ----------------------------------------------
    # RECENT TRANSACTIONS
    # ----------------------------------------------
    @staticmethod
    def get_recent_transactions(
        db: Session,
        current_user: User,
        limit: int,
    ):

        logger.info(
            f"Recent transactions requested: "
            f"user_id={current_user.id}, "
            f"limit={limit}"
        )

        rows = (
            db.query(Transaction)
            .filter(Transaction.user_id == current_user.id)
            .order_by(Transaction.date.desc())
            .limit(limit)
            .all()
        )

        logger.info(
            f"Recent transactions returned: "
            f"user_id={current_user.id}, "
            f"count={len(rows)}"
        )

        return {
            "count": len(rows),
            "data": [
                {
                    "id": row.id,
                    "amount": float(row.amount),
                    "type": row.type.value,
                    "description": row.description,
                    "date": row.date,
                    "category_id": row.category_id,
                }
                for row in rows
            ],
        }
