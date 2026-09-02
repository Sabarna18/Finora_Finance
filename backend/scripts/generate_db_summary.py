#!/usr/bin/env python3

"""
Finora Database Summary Generator
=================================

Purpose
-------

Generate a read-only summary of the currently configured database.

This script is intentionally limited to DATABASE INSPECTION.

It does NOT:

    - run migrations
    - modify database schema
    - create tables
    - delete data
    - insert data
    - execute Alembic commands
    - perform application health checks

Those responsibilities belong to the future:

    db-check.sh

The script is therefore safe to run independently from the terminal
and can later be called by:

    db-check.sh
    make db-check
    make check


Architecture
------------

    generate_db_summary.py
              │
              ▼
        SQLAlchemy Engine
              │
              ▼
       PostgreSQL database
              │
              ▼
       SQLAlchemy Inspector
              │
       ┌──────┼──────────┐
       ▼      ▼          ▼
     Tables Columns   Constraints
       │
       ├── Row counts
       ├── Indexes
       └── Foreign keys


Execution
---------

From project root:

    python backend/scripts/generate_db_summary.py

From backend:

    python scripts/generate_db_summary.py

Inside Docker backend container:

    python scripts/generate_db_summary.py

Later:

    make db-check


Database configuration
----------------------

The script intentionally uses the application's existing
database configuration.

It does NOT duplicate database credentials or construct its
own database URL.

The source of truth remains:

    src.db.database

This ensures that the summary tool examines the exact same
database configuration used by the application.


Important
---------

This script is READ-ONLY.

The only database operations performed are:

    SELECT
    SQLAlchemy Inspector metadata queries

No schema or data mutation is performed.
"""

from __future__ import annotations

import sys
from collections.abc import Sequence

from sqlalchemy import Engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError

from src.db.database import engine


# ============================================================
# DISPLAY CONFIGURATION
# ============================================================

TITLE_WIDTH = 60


# ============================================================
# DISPLAY HELPERS
# ============================================================


def print_header(title: str) -> None:
    """Print a consistent section header."""

    print()
    print("=" * TITLE_WIDTH)
    print(f" {title}")
    print("=" * TITLE_WIDTH)
    print()


def print_section(title: str) -> None:
    """Print a section heading."""

    print()
    print(title)
    print("-" * len(title))


def print_key_value(label: str, value: object, width: int = 16) -> None:
    """Print a simple aligned key/value pair."""

    print(f"{label:<{width}}: {value}")


# ============================================================
# DATABASE INFORMATION
# ============================================================


def get_database_information(database_engine: Engine) -> dict[str, object]:
    """
    Retrieve basic database information.

    Only read-only SELECT statements are executed.
    """

    with database_engine.connect() as connection:

        database_name = connection.execute(
            text("SELECT current_database()")
        ).scalar_one()

        current_user = connection.execute(
            text("SELECT current_user")
        ).scalar_one()

        server_version = connection.execute(
            text("SELECT current_setting('server_version')")
        ).scalar_one()

        server_time = connection.execute(
            text("SELECT CURRENT_TIMESTAMP")
        ).scalar_one()

    return {
        "name": database_name,
        "user": current_user,
        "version": server_version,
        "server_time": server_time,
    }


# ============================================================
# TABLE INFORMATION
# ============================================================


def get_tables(database_engine: Engine) -> list[str]:
    """
    Return all tables visible to SQLAlchemy's inspector.
    """

    inspector = inspect(database_engine)

    return sorted(inspector.get_table_names())


# ============================================================
# COLUMN INFORMATION
# ============================================================


def print_table_columns(
    inspector,
    table_name: str,
) -> None:
    """Print column definitions for a table."""

    columns = inspector.get_columns(table_name)

    print(f"  Columns      : {len(columns)}")

    if not columns:
        print("    No columns found.")
        return

    print()
    print("  Column definitions:")

    for column in columns:

        name = column["name"]
        column_type = str(column["type"])
        nullable = column["nullable"]

        nullable_text = "NULL" if nullable else "NOT NULL"

        print(
            f"    - {name:<25}"
            f"{column_type:<22}"
            f"{nullable_text}"
        )


# ============================================================
# PRIMARY KEY INFORMATION
# ============================================================


def print_primary_key(
    inspector,
    table_name: str,
) -> None:
    """Print primary-key information for a table."""

    primary_key = inspector.get_pk_constraint(table_name)

    constrained_columns = primary_key.get("constrained_columns") or []

    if constrained_columns:

        columns = ", ".join(constrained_columns)

        print(f"  Primary key  : {columns}")

    else:

        print("  Primary key  : none")


# ============================================================
# INDEX INFORMATION
# ============================================================


def get_indexes(
    inspector,
    tables: Sequence[str],
) -> list[dict[str, object]]:
    """
    Collect index metadata across all tables.
    """

    indexes: list[dict[str, object]] = []

    for table_name in tables:

        for index in inspector.get_indexes(table_name):

            indexes.append(
                {
                    "table": table_name,
                    "name": index.get("name"),
                    "columns": index.get("column_names") or [],
                    "unique": bool(index.get("unique")),
                }
            )

    return indexes


def print_indexes(
    indexes: Sequence[dict[str, object]],
) -> None:
    """Print index information."""

    print_section("INDEX SUMMARY")

    if not indexes:

        print("No indexes found.")
        return

    for index in indexes:

        table_name = index["table"]
        name = index["name"] or "<unnamed>"
        columns = ", ".join(index["columns"])  # type: ignore[arg-type]
        uniqueness = (
            "UNIQUE"
            if index["unique"]
            else "NON-UNIQUE"
        )

        print(
            f"  {table_name}.{name}"
            f" [{uniqueness}]"
            f" ({columns})"
        )

    print()
    print(f"Total indexes : {len(indexes)}")


# ============================================================
# FOREIGN KEY INFORMATION
# ============================================================


def get_foreign_keys(
    inspector,
    tables: Sequence[str],
) -> list[dict[str, object]]:
    """
    Collect foreign-key metadata across all tables.
    """

    foreign_keys: list[dict[str, object]] = []

    for table_name in tables:

        for foreign_key in inspector.get_foreign_keys(table_name):

            foreign_keys.append(
                {
                    "table": table_name,
                    "columns": foreign_key.get(
                        "constrained_columns"
                    )
                    or [],
                    "referred_table": foreign_key.get(
                        "referred_table"
                    ),
                    "referred_columns": foreign_key.get(
                        "referred_columns"
                    )
                    or [],
                }
            )

    return foreign_keys


def print_foreign_keys(
    foreign_keys: Sequence[dict[str, object]],
) -> None:
    """Print foreign-key information."""

    print_section("FOREIGN KEY SUMMARY")

    if not foreign_keys:

        print("No foreign keys found.")
        return

    for foreign_key in foreign_keys:

        table_name = foreign_key["table"]

        columns = ", ".join(
            foreign_key["columns"]  # type: ignore[arg-type]
        )

        referred_table = (
            foreign_key["referred_table"]
            or "<unknown>"
        )

        referred_columns = ", ".join(
            foreign_key["referred_columns"]  # type: ignore[arg-type]
        )

        print(
            f"  {table_name}.{columns}"
            f" -> {referred_table}.{referred_columns}"
        )

    print()
    print(f"Total foreign keys : {len(foreign_keys)}")


# ============================================================
# ROW COUNTS
# ============================================================


def get_row_counts(
    database_engine: Engine,
    inspector,
    tables: Sequence[str],
) -> dict[str, int]:
    """
    Retrieve row counts for every table.

    Table names come from SQLAlchemy's Inspector, rather than
    user input.
    """

    counts: dict[str, int] = {}

    identifier_preparer = (
        inspector.engine.dialect.identifier_preparer
    )

    with database_engine.connect() as connection:

        for table_name in tables:

            quoted_table = identifier_preparer.quote(
                table_name
            )

            result = connection.execute(
                text(
                    f"SELECT COUNT(*) FROM {quoted_table}"
                )
            )

            counts[table_name] = int(
                result.scalar_one()
            )

    return counts


def print_row_counts(
    row_counts: dict[str, int],
) -> None:
    """Print table row counts."""

    print_section("ROW COUNTS")

    if not row_counts:

        print("No tables found.")
        return

    for table_name, count in row_counts.items():

        print(
            f"  {table_name:<32}"
            f"{count:>10}"
        )


# ============================================================
# TABLE SUMMARY
# ============================================================


def print_table_summary(
    inspector,
    tables: Sequence[str],
) -> None:
    """Print structural information for every table."""

    print_section("TABLE DETAILS")

    if not tables:

        print("No tables found.")
        return

    for table_name in tables:

        print()
        print(f"[{table_name}]")

        print_table_columns(
            inspector,
            table_name,
        )

        print_primary_key(
            inspector,
            table_name,
        )

        indexes = inspector.get_indexes(
            table_name
        )

        foreign_keys = inspector.get_foreign_keys(
            table_name
        )

        print(
            f"  Indexes      : {len(indexes)}"
        )

        print(
            f"  Foreign keys : {len(foreign_keys)}"
        )


# ============================================================
# SUMMARY STATISTICS
# ============================================================


def print_summary_statistics(
    tables: Sequence[str],
    indexes: Sequence[dict[str, object]],
    foreign_keys: Sequence[dict[str, object]],
) -> None:
    """Print high-level database statistics."""

    print_section("SUMMARY")

    print_key_value(
        "Tables",
        len(tables),
    )

    print_key_value(
        "Indexes",
        len(indexes),
    )

    print_key_value(
        "Foreign keys",
        len(foreign_keys),
    )


# ============================================================
# MAIN
# ============================================================


def generate_database_summary(database_engine: Engine) -> None:
    """
    Generate and print the complete database summary.
    """

    print_header("Finora Database Summary")

    # --------------------------------------------------------
    # Database information
    # --------------------------------------------------------

    database_information = get_database_information(
        database_engine
    )

    print_section("DATABASE")

    print_key_value(
        "Name",
        database_information["name"],
    )

    print_key_value(
        "User",
        database_information["user"],
    )

    print_key_value(
        "PostgreSQL",
        database_information["version"],
    )

    print_key_value(
        "Server time",
        database_information["server_time"],
    )

    # --------------------------------------------------------
    # Inspector
    # --------------------------------------------------------

    inspector = inspect(database_engine)

    # --------------------------------------------------------
    # Tables
    # --------------------------------------------------------

    tables = get_tables(database_engine)

    print_section("TABLES")

    if tables:

        print_key_value(
            "Total tables",
            len(tables),
        )

        print()

        for table_name in tables:

            print(f"  • {table_name}")

    else:

        print("No tables found.")

    # --------------------------------------------------------
    # Table details
    # --------------------------------------------------------

    print_table_summary(
        inspector,
        tables,
    )

    # --------------------------------------------------------
    # Row counts
    # --------------------------------------------------------

    row_counts = get_row_counts(
        database_engine,
        inspector,
        tables,
    )

    print_row_counts(
        row_counts,
    )

    # --------------------------------------------------------
    # Indexes
    # --------------------------------------------------------

    indexes = get_indexes(
        inspector,
        tables,
    )

    print_indexes(
        indexes,
    )

    # --------------------------------------------------------
    # Foreign keys
    # --------------------------------------------------------

    foreign_keys = get_foreign_keys(
        inspector,
        tables,
    )

    print_foreign_keys(
        foreign_keys,
    )

    # --------------------------------------------------------
    # Summary statistics
    # --------------------------------------------------------

    print_summary_statistics(
        tables,
        indexes,
        foreign_keys,
    )

    print()
    print("=" * TITLE_WIDTH)
    print(" Database summary generated successfully")
    print("=" * TITLE_WIDTH)
    print()


def main() -> int:
    """
    CLI entry point.

    Returns:
        0 on success
        1 on database/SQLAlchemy failure
    """

    try:

        generate_database_summary(engine)

    except SQLAlchemyError as exc:

        print()
        print("=" * TITLE_WIDTH)
        print(" Database summary failed")
        print("=" * TITLE_WIDTH)
        print()
        print(f"Database error: {exc}")
        print()

        return 1

    except Exception as exc:

        print()
        print("=" * TITLE_WIDTH)
        print(" Database summary failed")
        print("=" * TITLE_WIDTH)
        print()
        print(f"Unexpected error: {exc}")
        print()

        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

