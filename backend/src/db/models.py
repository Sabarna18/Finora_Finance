from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
    Enum,
    Text,
    Date,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from zoneinfo import ZoneInfo


from src.db.database import Base

# ---------------- ENUMS ---------------- #


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


# ---------------- USER ---------------- #


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)

    password_hash = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transactions = relationship(
        "Transaction", back_populates="user", cascade="all, delete"
    )
    categories = relationship("Category", back_populates="user", cascade="all, delete")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete")


# ---------------- CATEGORY ---------------- #


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    type = Column(Enum(TransactionType), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")


# ---------------- TRANSACTION ---------------- #


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Float, nullable=False)

    type = Column(Enum(TransactionType), nullable=False)

    description = Column(Text, nullable=True)

    # User-selected transaction date
    date = Column(Date, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # System-generated audit timestamp
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="transactions")

    category = relationship("Category", back_populates="transactions")


# ---------------- BUDGET ---------------- #


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Float, nullable=False)

    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category")
