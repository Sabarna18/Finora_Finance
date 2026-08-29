# ==================================================
# src/services/reports_service.py
# ==================================================

from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from src.db.models import (
    Transaction,
    Budget,
    Category,
    TransactionType,
    User,
)


class ReportsService:

    # ----------------------------------------------
    # CASH FLOW
    # ----------------------------------------------
    @staticmethod
    def get_cash_flow(
        db: Session,
        current_user: User,
        start_date: datetime,
        end_date: datetime,
    ):
        base_query = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )

        income = (
            base_query.filter(Transaction.type == TransactionType.INCOME)
            .with_entities(func.coalesce(func.sum(Transaction.amount), 0))
            .scalar()
        )

        expense = (
            base_query.filter(Transaction.type == TransactionType.EXPENSE)
            .with_entities(func.coalesce(func.sum(Transaction.amount), 0))
            .scalar()
        )

        savings = float(income - expense)

        savings_rate = 0.0

        if income > 0:
            savings_rate = (savings / float(income)) * 100

        return {
            "start_date": start_date,
            "end_date": end_date,
            "income": float(income),
            "expense": float(expense),
            "savings": savings,
            "savings_rate": round(savings_rate, 2),
        }

    # ----------------------------------------------
    # CATEGORY ANALYSIS
    # ----------------------------------------------
    @staticmethod
    def get_category_analysis(
        db: Session,
        current_user: User,
        month: int,
        year: int,
    ):
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

        grand_total = sum(float(row.total) for row in rows)

        data = []

        for row in rows:

            percentage = 0.0

            if grand_total > 0:
                percentage = (float(row.total) / grand_total) * 100

            data.append(
                {
                    "category": row.name,
                    "amount": float(row.total),
                    "percentage": round(
                        percentage,
                        2,
                    ),
                }
            )

        return {
            "month": month,
            "year": year,
            "data": data,
        }

    # ----------------------------------------------
    # INCOME VS EXPENSE TREND
    # ----------------------------------------------
    @staticmethod
    def get_income_expense_trend(
        db: Session,
        current_user: User,
        year: int,
    ):
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
    # BUDGET PERFORMANCE
    # ----------------------------------------------
    @staticmethod
    def get_budget_performance(
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

        output = []

        for budget in budgets:

            spent_query = db.query(
                func.coalesce(func.sum(Transaction.amount), 0)
            ).filter(
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

            if budget.category_id:

                spent_query = spent_query.filter(
                    Transaction.category_id == budget.category_id
                )

            spent = float(spent_query.scalar())

            variance = float(budget.amount - spent)

            category_name = "Overall"

            if budget.category_id:

                category = (
                    db.query(Category).filter(Category.id == budget.category_id).first()
                )

                if category:
                    category_name = category.name

            output.append(
                {
                    "budget_id": budget.id,
                    "category": category_name,
                    "budget": float(budget.amount),
                    "spent": spent,
                    "variance": variance,
                    "status": ("Over Budget" if variance < 0 else "Within Budget"),
                }
            )

        return {
            "month": month,
            "year": year,
            "data": output,
        }
