#!/usr/bin/env python3

"""
Finora SQLite -> PostgreSQL Migration

Source:
    backend/finance.db

Target:
    PostgreSQL
    Host: postgres
    Port: 5432
    Database: finance_db

The source SQLite database is never modified.

Migration order:

    users
      |
      +---- categories
      |        |
      |        +---- transactions
      |        |
      |        +---- budgets
      |
      +---- transactions
      |
      +---- budgets

The script preserves primary keys and resets PostgreSQL sequences
after migration.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import (
    create_engine,
    inspect,
    select,
    text,
)
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session


# ==========================================================
# Project Path
# ==========================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ==========================================================
# Application Models
# ==========================================================

from src.models import (  # noqa: E402
    Base,
    User,
    Category,
    Transaction,
    Budget,
)


# ==========================================================
# Configuration
# ==========================================================

SQLITE_DATABASE = BACKEND_DIR / "finance.db"

POSTGRES_USER = os.getenv("POSTGRES_USER", "finora")
POSTGRES_PASSWORD = os.getenv(
    "POSTGRES_PASSWORD",
    "password",
)
POSTGRES_HOST = os.getenv(
    "POSTGRES_HOST",
    "localhost",
)
POSTGRES_PORT = os.getenv(
    "POSTGRES_PORT",
    "5432",
)
POSTGRES_DB = os.getenv(
    "POSTGRES_DB",
    "finance_db",
)


# ==========================================================
# Logging
# ==========================================================

def log(message: str) -> None:
    print()
    print("=" * 60)
    print(message)
    print("=" * 60)


def success(message: str) -> None:
    print(f"✓ {message}")


def fail(message: str) -> None:
    print()
    print("=" * 60)
    print(f"ERROR: {message}")
    print("=" * 60)
    sys.exit(1)


# ==========================================================
# Database URLs
# ==========================================================

SQLITE_URL = (
    f"sqlite:///{SQLITE_DATABASE}"
)

POSTGRES_URL = (
    "postgresql+psycopg2://"
    f"{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}"
    f"/{POSTGRES_DB}"
)


# ==========================================================
# Engines
# ==========================================================

def create_sqlite_engine() -> Engine:
    """
    Opens the source SQLite database.

    The database is opened in read-only mode so that the
    migration cannot accidentally modify the source.
    """

    if not SQLITE_DATABASE.exists():
        fail(
            f"SQLite database not found:\n"
            f"{SQLITE_DATABASE}"
        )

    readonly_url = (
        "sqlite:///file:"
        f"{SQLITE_DATABASE.resolve()}"
        "?mode=ro&uri=true"
    )

    return create_engine(
        readonly_url,
        future=True,
    )


def create_postgres_engine() -> Engine:
    """
    Creates the PostgreSQL target engine.
    """

    return create_engine(
        POSTGRES_URL,
        future=True,
        pool_pre_ping=True,
    )


# ==========================================================
# Source Validation
# ==========================================================

def validate_source(sqlite_engine: Engine) -> None:
    """
    Verify that the SQLite database contains the expected
    application tables.
    """

    log("STEP 1/7 - Validating SQLite source")

    inspector = inspect(sqlite_engine)

    tables = set(
        inspector.get_table_names()
    )

    expected_tables = {
        "users",
        "categories",
        "transactions",
        "budgets",
    }

    missing = expected_tables - tables

    if missing:
        fail(
            "SQLite database is missing expected tables: "
            + ", ".join(sorted(missing))
        )

    success(
        "SQLite database contains all expected tables."
    )


# ==========================================================
# Source Counts
# ==========================================================

def get_source_counts(
    sqlite_session: Session,
) -> dict[str, int]:

    return {
        "users": sqlite_session.query(User).count(),
        "categories": sqlite_session.query(Category).count(),
        "transactions": sqlite_session.query(Transaction).count(),
        "budgets": sqlite_session.query(Budget).count(),
    }


def print_counts(
    title: str,
    counts: dict[str, int],
) -> None:

    print()
    print(title)

    for table, count in counts.items():
        print(f"  {table:<15} {count}")


# ==========================================================
# Target Validation
# ==========================================================

def validate_target(
    postgres_engine: Engine,
) -> None:

    log("STEP 2/7 - Validating PostgreSQL target")

    with postgres_engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )

    success(
        f"Connected to PostgreSQL "
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )


# ==========================================================
# Create Schema
# ==========================================================

def create_target_schema(
    postgres_engine: Engine,
) -> None:

    log("STEP 3/7 - Creating PostgreSQL schema")

    Base.metadata.create_all(
        bind=postgres_engine
    )

    success(
        "PostgreSQL schema created."
    )


# ==========================================================
# Target Empty Check
# ==========================================================

def validate_target_empty(
    postgres_session: Session,
) -> None:

    counts = {
        "users": postgres_session.query(User).count(),
        "categories": postgres_session.query(Category).count(),
        "transactions": postgres_session.query(Transaction).count(),
        "budgets": postgres_session.query(Budget).count(),
    }

    total = sum(counts.values())

    if total > 0:
        fail(
            "Target PostgreSQL database is not empty.\n"
            "Migration aborted to prevent duplicate data.\n"
            f"Current rows: {counts}"
        )

    success(
        "Target PostgreSQL database is empty."
    )


# ==========================================================
# Generic Row Conversion
# ==========================================================

def model_to_dict(
    obj: Any,
) -> dict[str, Any]:
    """
    Extract mapped column values from a SQLAlchemy model.

    Relationships are deliberately excluded.
    """

    return {
        column.name: getattr(
            obj,
            column.name,
        )
        for column in obj.__table__.columns
    }


# ==========================================================
# Migration
# ==========================================================

def migrate_data(
    sqlite_session: Session,
    postgres_session: Session,
) -> None:

    log("STEP 4/7 - Migrating application data")

    # ------------------------------------------------------
    # USERS
    # ------------------------------------------------------

    users = sqlite_session.scalars(
        select(User).order_by(User.id)
    ).all()

    for user in users:
        postgres_session.add(
            User(
                **model_to_dict(user)
            )
        )

    postgres_session.flush()

    success(
        f"Migrated {len(users)} users."
    )


    # ------------------------------------------------------
    # CATEGORIES
    # ------------------------------------------------------

    categories = sqlite_session.scalars(
        select(Category).order_by(Category.id)
    ).all()

    for category in categories:
        postgres_session.add(
            Category(
                **model_to_dict(category)
            )
        )

    postgres_session.flush()

    success(
        f"Migrated {len(categories)} categories."
    )


    # ------------------------------------------------------
    # TRANSACTIONS
    # ------------------------------------------------------

    transactions = sqlite_session.scalars(
        select(Transaction).order_by(Transaction.id)
    ).all()

    for transaction in transactions:
        postgres_session.add(
            Transaction(
                **model_to_dict(transaction)
            )
        )

    postgres_session.flush()

    success(
        f"Migrated {len(transactions)} transactions."
    )


    # ------------------------------------------------------
    # BUDGETS
    # ------------------------------------------------------

    budgets = sqlite_session.scalars(
        select(Budget).order_by(Budget.id)
    ).all()

    for budget in budgets:
        postgres_session.add(
            Budget(
                **model_to_dict(budget)
            )
        )

    postgres_session.flush()

    success(
        f"Migrated {len(budgets)} budgets."
    )


# ==========================================================
# Reset PostgreSQL Sequences
# ==========================================================

def reset_sequences(
    postgres_session: Session,
) -> None:

    log("STEP 5/7 - Resetting PostgreSQL sequences")

    tables = {
        "users": "users_id_seq",
        "categories": "categories_id_seq",
        "transactions": "transactions_id_seq",
        "budgets": "budgets_id_seq",
    }

    for table, sequence in tables.items():

        postgres_session.execute(
            text(
                f"""
                SELECT setval(
                    '{sequence}',
                    COALESCE(
                        (SELECT MAX(id) FROM {table}),
                        1
                    ),
                    true
                )
                """
            )
        )

    success(
        "PostgreSQL identity sequences synchronized."
    )


# ==========================================================
# Target Counts
# ==========================================================

def get_target_counts(
    postgres_session: Session,
) -> dict[str, int]:

    return {
        "users": postgres_session.query(User).count(),
        "categories": postgres_session.query(Category).count(),
        "transactions": postgres_session.query(Transaction).count(),
        "budgets": postgres_session.query(Budget).count(),
    }


# ==========================================================
# Verify Migration
# ==========================================================

def verify_migration(
    source_counts: dict[str, int],
    target_counts: dict[str, int],
) -> None:

    log("STEP 6/7 - Verifying migration")

    print_counts(
        "Source SQLite:",
        source_counts,
    )

    print_counts(
        "Target PostgreSQL:",
        target_counts,
    )

    mismatches = []

    for table in source_counts:

        if source_counts[table] != target_counts[table]:
            mismatches.append(
                f"{table}: "
                f"{source_counts[table]} -> "
                f"{target_counts[table]}"
            )

    if mismatches:
        fail(
            "Migration verification failed:\n"
            + "\n".join(mismatches)
        )

    success(
        "All table row counts match."
    )


# ==========================================================
# Main
# ==========================================================

def main() -> None:

    print()
    print("=" * 60)
    print("FINORA - SQLITE TO POSTGRESQL MIGRATION")
    print("=" * 60)

    print()
    print(f"Source : {SQLITE_DATABASE}")
    print(
        f"Target : "
        f"{POSTGRES_USER}@"
        f"{POSTGRES_HOST}:"
        f"{POSTGRES_PORT}/"
        f"{POSTGRES_DB}"
    )


    # ------------------------------------------------------
    # Create Engines
    # ------------------------------------------------------

    sqlite_engine = create_sqlite_engine()

    postgres_engine = create_postgres_engine()


    # ------------------------------------------------------
    # Validate Source
    # ------------------------------------------------------

    validate_source(
        sqlite_engine
    )


    # ------------------------------------------------------
    # Validate Target
    # ------------------------------------------------------

    validate_target(
        postgres_engine
    )


    # ------------------------------------------------------
    # Read Source
    # ------------------------------------------------------

    with Session(
        sqlite_engine
    ) as sqlite_session:

        source_counts = get_source_counts(
            sqlite_session
        )

        print_counts(
            "Source database:",
            source_counts,
        )


        # --------------------------------------------------
        # Create Target Schema
        # --------------------------------------------------

        create_target_schema(
            postgres_engine
        )


        # --------------------------------------------------
        # Target Session
        # --------------------------------------------------

        with Session(
            postgres_engine
        ) as postgres_session:

            try:

                validate_target_empty(
                    postgres_session
                )

                # ------------------------------------------
                # Migrate
                # ------------------------------------------

                migrate_data(
                    sqlite_session,
                    postgres_session,
                )

                # ------------------------------------------
                # Sequences
                # ------------------------------------------

                reset_sequences(
                    postgres_session
                )

                # ------------------------------------------
                # Commit
                # ------------------------------------------

                postgres_session.commit()

                success(
                    "PostgreSQL transaction committed."
                )

            except Exception:

                postgres_session.rollback()

                print()
                print(
                    "Migration failed."
                )
                print(
                    "PostgreSQL transaction rolled back."
                )

                raise


            # ------------------------------------------------
            # Verify
            # ------------------------------------------------

            target_counts = get_target_counts(
                postgres_session
            )

            verify_migration(
                source_counts,
                target_counts,
            )


    # ------------------------------------------------------
    # Final
    # ------------------------------------------------------

    log("STEP 7/7 - Migration complete")

    print(
        "✓ SQLite database was preserved."
    )

    print(
        "✓ PostgreSQL database populated."
    )

    print(
        "✓ Primary keys preserved."
    )

    print(
        "✓ PostgreSQL sequences synchronized."
    )

    print(
        "✓ Row counts verified."
    )

    print()
    print(
        "The Finora backend can now use PostgreSQL."
    )
    print()


# ==========================================================
# Entry Point
# ==========================================================

if __name__ == "__main__":
    main()

