# ==========================================================
# src/db/models.py
#
# SQLAlchemy ORM models for Finora
# ==========================================================

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from src.db.database import Base

# ==========================================================
# ENUMS
# ==========================================================


class TransactionType(StrEnum):
    """Supported financial transaction types."""

    INCOME = "income"
    EXPENSE = "expense"


class NotificationType(StrEnum):
    """Supported notification categories."""

    INFO = "info"

    SUCCESS = "success"

    WARNING = "warning"

    BUDGET_ALERT = "budget_alert"

    BUDGET_EXCEEDED = "budget_exceeded"

    TRANSACTION = "transaction"

    SYSTEM = "system"


# ==========================================================
# USER
# ==========================================================


class User(Base):
    """Application user."""

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    phone = Column(
        String(20),
        nullable=True,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    # System-generated UTC audit timestamp.
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    # ------------------------------------------------------
    # Relationships
    # ------------------------------------------------------

    transactions = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete",
    )

    categories = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete",
    )

    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete",
    )


# ==========================================================
# CATEGORY
# ==========================================================


class Category(Base):
    """User-defined income or expense category."""

    __tablename__ = "categories"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    type = Column(
        Enum(TransactionType),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # System-generated UTC audit timestamp.
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    # ------------------------------------------------------
    # Relationships
    # ------------------------------------------------------

    user = relationship(
        "User",
        back_populates="categories",
    )

    transactions = relationship(
        "Transaction",
        back_populates="category",
    )


# ==========================================================
# TRANSACTION
# ==========================================================


class Transaction(Base):
    """Financial income or expense transaction."""

    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    type = Column(
        Enum(TransactionType),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    # ------------------------------------------------------
    # User-selected transaction date.
    #
    # This represents when the financial transaction occurred,
    # not when the database record was created.
    # ------------------------------------------------------

    date = Column(
        Date,
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True,
    )

    # ------------------------------------------------------
    # System-generated UTC audit timestamp.
    #
    # This represents when the transaction record was created
    # in the system.
    # ------------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    # ------------------------------------------------------
    # Relationships
    # ------------------------------------------------------

    user = relationship(
        "User",
        back_populates="transactions",
    )

    category = relationship(
        "Category",
        back_populates="transactions",
    )


# ==========================================================
# BUDGET
# ==========================================================


class Budget(Base):
    """Monthly user budget, optionally scoped to a category."""

    __tablename__ = "budgets"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    # Calendar month: 1-12.
    month = Column(
        Integer,
        nullable=False,
    )

    # Calendar year.
    year = Column(
        Integer,
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True,
    )

    # System-generated UTC audit timestamp.
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    # ------------------------------------------------------
    # Relationships
    # ------------------------------------------------------

    user = relationship(
        "User",
        back_populates="budgets",
    )

    category = relationship(
        "Category",
    )


# ==========================================================
# NOTIFICATION
# ==========================================================


class Notification(Base):
    """Persistent user notification."""

    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    message = Column(
        String(500),
        nullable=False,
    )

    type = Column(
        Enum(
            NotificationType,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="notificationtype",
        ),
        nullable=False,
        default=NotificationType.INFO,
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    read_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------
    # Relationships
    # ------------------------------------------------------

    user = relationship(
        "User",
        back_populates="notifications",
    )
