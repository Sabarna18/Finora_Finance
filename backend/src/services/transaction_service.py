# ==================================================
# src/services/transaction_service.py
# ==================================================


from fastapi import HTTPException
from sqlalchemy import (
    asc,
    desc,
    extract,
)
from sqlalchemy.orm import Session

from src.core.logger import get_logger
from src.db.models import (
    Category,
    Transaction,
    User,
)

logger = get_logger("transactions")


class TransactionService:
    # ----------------------------------------------
    # CREATE
    # ----------------------------------------------
    @staticmethod
    def create_transaction(db: Session, current_user: User, payload):

        logger.info(
            f"Transaction create attempt: "
            f"user_id={current_user.id}, "
            f"amount={payload.amount}, "
            f"type={payload.type}"
        )

        # Validate Category
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
                    f"Invalid category in transaction: "
                    f"user_id={current_user.id}, "
                    f"category_id={payload.category_id}"
                )

                raise HTTPException(status_code=404, detail="Category not found")

        try:
            transaction = Transaction(
                amount=payload.amount,
                type=payload.type,
                description=payload.description,
                date=payload.date,
                category_id=payload.category_id,
                user_id=current_user.id,
            )

            db.add(transaction)

            db.commit()

            db.refresh(transaction)

            logger.info(
                f"Transaction created: "
                f"txn_id={transaction.id}, "
                f"user_id={current_user.id}"
            )

            return transaction

        except Exception:
            logger.exception(f"Transaction creation failed: user_id={current_user.id}")

            raise

    # ----------------------------------------------
    # LIST
    # ----------------------------------------------
    @staticmethod
    def list_transactions(
        db: Session,
        current_user: User,
        page: int,
        limit: int,
        search: str | None,
        type: str | None,
        category_id: int | None,
        month: int | None,
        year: int | None,
        week: int | None,
        sort: str,
    ):

        logger.info(
            f"Transaction list requested: "
            f"user_id={current_user.id}, "
            f"page={page}, "
            f"limit={limit}"
        )

        query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

        # ------------------------------------------
        # SEARCH
        # ------------------------------------------
        if search:
            query = query.filter(Transaction.description.ilike(f"%{search}%"))

        # -------------------------
        # Filters
        # -------------------------
        if type:
            query = query.filter(Transaction.type == type)

        if category_id:
            query = query.filter(Transaction.category_id == category_id)

        # -------------------------
        # MONTH
        # -------------------------
        if month:
            query = query.filter(extract("month", Transaction.date) == month)

        # -------------------------
        # YEAR
        # -------------------------
        if year:
            query = query.filter(extract("year", Transaction.date) == year)

        # -------------------------
        # WEEK
        # -------------------------
        if week:
            if week == 1:
                query = query.filter(extract("day", Transaction.date).between(1, 7))

            elif week == 2:
                query = query.filter(extract("day", Transaction.date).between(8, 14))

            elif week == 3:
                query = query.filter(extract("day", Transaction.date).between(15, 21))

            elif week == 4:
                query = query.filter(extract("day", Transaction.date) >= 22)

        # -------------------------
        # Sorting
        # -------------------------
        if sort.startswith("-"):
            field = sort[1:]

            if field == "date":
                query = query.order_by(desc(Transaction.date))

            elif field == "amount":
                query = query.order_by(desc(Transaction.amount))

        else:
            if sort == "date":
                query = query.order_by(asc(Transaction.date))

            elif sort == "amount":
                query = query.order_by(asc(Transaction.amount))

        offset = (page - 1) * limit

        transactions = query.offset(offset).limit(limit).all()

        logger.info(
            f"Transaction list returned: "
            f"user_id={current_user.id}, "
            f"count={len(transactions)}"
        )

        return transactions

    # ----------------------------------------------
    # GET SINGLE
    # ----------------------------------------------
    @staticmethod
    def get_transaction(db: Session, current_user: User, transaction_id: int):

        transaction = (
            db.query(Transaction)
            .filter(
                Transaction.id == transaction_id, Transaction.user_id == current_user.id
            )
            .first()
        )

        if not transaction:
            logger.warning(
                f"Transaction not found: "
                f"txn_id={transaction_id}, "
                f"user_id={current_user.id}"
            )

            raise HTTPException(status_code=404, detail="Transaction not found")

        logger.info(
            f"Transaction fetched: txn_id={transaction.id}, user_id={current_user.id}"
        )

        return transaction

    # ----------------------------------------------
    # UPDATE
    # ----------------------------------------------
    @staticmethod
    def update_transaction(
        db: Session, current_user: User, transaction_id: int, payload
    ):

        logger.info(
            f"Transaction update attempt: "
            f"txn_id={transaction_id}, "
            f"user_id={current_user.id}"
        )

        transaction = TransactionService.get_transaction(
            db=db, current_user=current_user, transaction_id=transaction_id
        )

        updates = payload.model_dump(exclude_unset=True)

        # Validate Category
        if updates.get("category_id"):
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
                    f"Invalid category during update: txn_id={transaction_id}"
                )

                raise HTTPException(status_code=404, detail="Category not found")

        for key, value in updates.items():
            setattr(transaction, key, value)

        db.commit()

        db.refresh(transaction)

        logger.info(
            f"Transaction updated: txn_id={transaction.id}, user_id={current_user.id}"
        )

        return transaction

    # ----------------------------------------------
    # DELETE
    # ----------------------------------------------
    @staticmethod
    def delete_transaction(db: Session, current_user: User, transaction_id: int):

        logger.warning(
            f"Transaction delete attempt: "
            f"txn_id={transaction_id}, "
            f"user_id={current_user.id}"
        )

        transaction = TransactionService.get_transaction(
            db=db, current_user=current_user, transaction_id=transaction_id
        )

        db.delete(transaction)

        db.commit()

        logger.warning(
            f"Transaction deleted: txn_id={transaction.id}, user_id={current_user.id}"
        )

        return {"message": "Transaction deleted successfully"}
