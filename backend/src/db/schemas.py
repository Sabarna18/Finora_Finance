from datetime import date as DateType
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ---------------- ENUM ---------------- #


class TransactionType(StrEnum):
    INCOME = "income"
    EXPENSE = "expense"


# ---------------- USER ---------------- #


class UserBase(BaseModel):
    name: str = Field(
        ...,
        max_length=100,
    )

    email: EmailStr = Field(
        ...,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
    )


class UserResponse(UserBase):
    id: int

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ---------------- USER UPDATE ---------------- #


class UserUpdate(BaseModel):
    name: str | None = Field(
        None,
        max_length=100,
    )

    email: EmailStr | None = Field(
        None,
        max_length=150,
    )


class PasswordChange(BaseModel):
    current_password: str

    new_password: str = Field(
        ...,
        min_length=6,
    )


# ---------------- CATEGORY ---------------- #


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: TransactionType


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- TRANSACTION ---------------- #


class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)

    type: TransactionType

    description: str | None = None

    date: DateType

    category_id: int | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: float | None = Field(None, gt=0)

    type: TransactionType | None = None

    description: str | None = None

    date: DateType | None = None

    category_id: int | None = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- BUDGET ---------------- #


class BudgetBase(BaseModel):
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    category_id: int | None = None


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: float | None = Field(None, gt=0)
    month: int | None = Field(None, ge=1, le=12)
    year: int | None = Field(None, ge=2000)
    category_id: int | None = None


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetStatusResponse(BaseModel):
    budget_id: int

    category_id: int | None

    category_name: str | None

    budget_amount: float

    spent_amount: float

    remaining_amount: float

    percentage_used: float

    status: str

    month: int

    year: int

    class Config:
        from_attributes = True
