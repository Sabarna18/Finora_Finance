# ==========================================================
# Finora
# SQLite → PostgreSQL Data Migration
# ==========================================================

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import (
    MetaData,
    Table,
    create_engine,
    select,
    text,
    func,
)
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

from src.core.config import settings
from src.db.database import DATABASE_URL

# ==========================================================
# CONFIGURATION
# ==========================================================

TABLE_ORDER = (
    "users",
    "categories",
    "transactions",
    "budgets",
)

MIGRATION_TABLES = set(TABLE_ORDER)


# ==========================================================
# LOGGING
# ==========================================================


def log(message: str) -> None:
    print(f"[MIGRATION] {message}")


def fail(message: str) -> None:
    print(f"[ERROR] {message}", file=sys.stderr)


# ==========================================================
# SQLITE ENGINE
# ==========================================================


def create_sqlite_engine(
    database_path: Path,
) -> Engine:

    if not database_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {database_path}")

    return create_engine(
        f"sqlite:///{database_path}",
        future=True,
    )


# ==========================================================
# POSTGRES ENGINE
# ==========================================================


def create_postgres_engine() -> Engine:

    return create_engine(
        DATABASE_URL,
        future=True,
        pool_pre_ping=True,
    )


# ==========================================================
# REFLECT DATABASES
# ==========================================================


def reflect_tables(
    engine: Engine,
) -> dict[str, Table]:

    metadata = MetaData()

    metadata.reflect(
        bind=engine,
        only=list(MIGRATION_TABLES),
    )

    missing = [table for table in TABLE_ORDER if table not in metadata.tables]

    if missing:
        raise RuntimeError("Missing expected tables: " + ", ".join(missing))

    return {name: metadata.tables[name] for name in TABLE_ORDER}


# ==========================================================
# VALIDATE SOURCE
# ==========================================================


def validate_source(
    sqlite_tables: dict[str, Table],
) -> None:

    log("Validating SQLite source database...")

    for table_name in TABLE_ORDER:

        table = sqlite_tables[table_name]

        log(f"  {table_name}: " f"{len(table.columns)} columns")

    log("✓ SQLite source validated")


# ==========================================================
# CHECK TARGET
# ==========================================================


def print_target_counts(
    connection: Connection,
) -> None:

    log("Current PostgreSQL record counts:")

    for table_name in TABLE_ORDER:

        count = connection.execute(
            text(f"SELECT COUNT(*) " f"FROM {table_name}")
        ).scalar_one()

        log(f"  {table_name}: {count}")


# ==========================================================
# COPY USERS
# ==========================================================


def migrate_users(
    sqlite_connection: Connection,
    postgres_connection: Connection,
    sqlite_tables: dict[str, Table],
    postgres_tables: dict[str, Table],
) -> dict[int, int]:

    log("Migrating users...")

    source = sqlite_tables["users"]
    target = postgres_tables["users"]

    user_id_map: dict[int, int] = {}

    rows = sqlite_connection.execute(select(source)).mappings().all()

    for row in rows:

        old_id = row["id"]
        email = row["email"]

        # --------------------------------------------------
        # Existing email check
        # --------------------------------------------------

        existing = postgres_connection.execute(
            select(target.c.id).where(target.c.email == email)
        ).scalar_one_or_none()

        if existing is not None:

            user_id_map[old_id] = existing

            log(
                f"  User already exists: {email} "
                f"(SQLite {old_id} → PostgreSQL {existing})"
            )

            continue

        # --------------------------------------------------
        # Build insert dynamically
        # --------------------------------------------------

        values = {}

        for column in target.columns:

            name = column.name

            if name == "id":
                continue

            if name in row:
                values[name] = row[name]

        result = postgres_connection.execute(
            target.insert().values(**values).returning(target.c.id)
        )

        new_id = result.scalar_one()

        user_id_map[old_id] = new_id

        log(f"  Migrated user: {email} " f"(SQLite {old_id} → PostgreSQL {new_id})")

    log(f"✓ Users migrated: {len(user_id_map)}")

    return user_id_map


# ==========================================================
# COPY CATEGORIES
# ==========================================================


def migrate_categories(
    sqlite_connection: Connection,
    postgres_connection: Connection,
    sqlite_tables: dict[str, Table],
    postgres_tables: dict[str, Table],
    user_id_map: dict[int, int],
) -> dict[int, int]:

    log("Migrating categories...")

    source = sqlite_tables["categories"]
    target = postgres_tables["categories"]

    category_id_map: dict[int, int] = {}

    rows = sqlite_connection.execute(select(source)).mappings().all()

    for row in rows:

        old_id = row["id"]
        old_user_id = row["user_id"]

        if old_user_id not in user_id_map:
            raise RuntimeError(
                f"Category {old_id} references " f"unknown user {old_user_id}"
            )

        values = {}

        for column in target.columns:

            name = column.name

            if name == "id":
                continue

            if name == "user_id":
                values[name] = user_id_map[old_user_id]

            elif name in row:
                values[name] = row[name]

        result = postgres_connection.execute(
            target.insert().values(**values).returning(target.c.id)
        )

        new_id = result.scalar_one()

        category_id_map[old_id] = new_id

        log(f"  Category {row['name']}: " f"{old_id} → {new_id}")

    log(f"✓ Categories migrated: " f"{len(category_id_map)}")

    return category_id_map


# ==========================================================
# COPY TRANSACTIONS
# ==========================================================


def migrate_transactions(
    sqlite_connection: Connection,
    postgres_connection: Connection,
    sqlite_tables: dict[str, Table],
    postgres_tables: dict[str, Table],
    user_id_map: dict[int, int],
    category_id_map: dict[int, int],
) -> None:

    log("Migrating transactions...")

    source = sqlite_tables["transactions"]
    target = postgres_tables["transactions"]

    rows = sqlite_connection.execute(select(source)).mappings().all()

    migrated = 0

    for row in rows:

        values = {}

        for column in target.columns:

            name = column.name

            if name == "id":
                continue

            if name == "user_id":

                old_user_id = row["user_id"]

                if old_user_id not in user_id_map:
                    raise RuntimeError(
                        f"Transaction {row['id']} "
                        f"references unknown user "
                        f"{old_user_id}"
                    )

                values[name] = user_id_map[old_user_id]

            elif name == "category_id":

                old_category_id = row["category_id"]

                if old_category_id is None:
                    values[name] = None

                else:

                    if old_category_id not in category_id_map:
                        raise RuntimeError(
                            f"Transaction {row['id']} "
                            f"references unknown category "
                            f"{old_category_id}"
                        )

                    values[name] = category_id_map[old_category_id]

            elif name in row:

                values[name] = row[name]

        postgres_connection.execute(target.insert().values(**values))

        migrated += 1

    log(f"✓ Transactions migrated: {migrated}")


# ==========================================================
# COPY BUDGETS
# ==========================================================


def migrate_budgets(
    sqlite_connection: Connection,
    postgres_connection: Connection,
    sqlite_tables: dict[str, Table],
    postgres_tables: dict[str, Table],
    user_id_map: dict[int, int],
    category_id_map: dict[int, int],
) -> None:

    log("Migrating budgets...")

    source = sqlite_tables["budgets"]
    target = postgres_tables["budgets"]

    rows = sqlite_connection.execute(select(source)).mappings().all()

    migrated = 0

    for row in rows:

        values = {}

        for column in target.columns:

            name = column.name

            if name == "id":
                continue

            if name == "user_id":

                old_user_id = row["user_id"]

                if old_user_id not in user_id_map:
                    raise RuntimeError(
                        f"Budget {row['id']} "
                        f"references unknown user "
                        f"{old_user_id}"
                    )

                values[name] = user_id_map[old_user_id]

            elif name == "category_id":

                old_category_id = row["category_id"]

                if old_category_id is None:
                    values[name] = None

                else:

                    if old_category_id not in category_id_map:
                        raise RuntimeError(
                            f"Budget {row['id']} "
                            f"references unknown category "
                            f"{old_category_id}"
                        )

                    values[name] = category_id_map[old_category_id]

            elif name in row:

                values[name] = row[name]

        postgres_connection.execute(target.insert().values(**values))

        migrated += 1

    log(f"✓ Budgets migrated: {migrated}")


# ==========================================================
# RESET POSTGRES SEQUENCES
# ==========================================================


def reset_sequences(
    connection: Connection,
) -> None:

    log("Synchronizing PostgreSQL sequences...")

    for table_name in TABLE_ORDER:

        connection.execute(text(f"""
                SELECT setval(
                    pg_get_serial_sequence(
                        '{table_name}',
                        'id'
                    ),
                    COALESCE(
                        (
                            SELECT MAX(id)
                            FROM {table_name}
                        ),
                        1
                    ),
                    true
                )
                """))

    log("✓ PostgreSQL sequences synchronized")


# ==========================================================
# VALIDATION
# ==========================================================
# ==========================================================
# VALIDATION
# ==========================================================


def validate_migration(
    sqlite_connection: Connection,
    postgres_connection: Connection,
    sqlite_tables: dict[str, Table],
    postgres_tables: dict[str, Table],
) -> None:

    log("Validating migration...")

    for table_name in TABLE_ORDER:

        # --------------------------------------------------
        # SQLite count
        # --------------------------------------------------

        source_count = sqlite_connection.execute(
            select(func.count()).select_from(sqlite_tables[table_name])
        ).scalar_one()

        # --------------------------------------------------
        # PostgreSQL count
        # --------------------------------------------------

        target_count = postgres_connection.execute(
            select(func.count()).select_from(postgres_tables[table_name])
        ).scalar_one()

        log(f"  {table_name}: " f"SQLite={source_count}, " f"PostgreSQL={target_count}")

    log("✓ Migration validation completed")


# ==========================================================
# MAIN MIGRATION
# ==========================================================


def migrate(
    sqlite_path: Path,
) -> None:

    sqlite_engine = create_sqlite_engine(sqlite_path)

    postgres_engine = create_postgres_engine()

    sqlite_tables = reflect_tables(sqlite_engine)

    postgres_tables = reflect_tables(postgres_engine)

    validate_source(sqlite_tables)

    with (
        sqlite_engine.connect() as sqlite_connection,
        postgres_engine.begin() as postgres_connection,
    ):

        # ----------------------------------------------
        # PostgreSQL connectivity
        # ----------------------------------------------

        postgres_connection.execute(text("""
                SELECT 1
                """))

        log("✓ PostgreSQL connection successful")

        # ----------------------------------------------
        # Existing target data
        # ----------------------------------------------

        print_target_counts(postgres_connection)

        # ----------------------------------------------
        # Users
        # ----------------------------------------------

        user_id_map = migrate_users(
            sqlite_connection,
            postgres_connection,
            sqlite_tables,
            postgres_tables,
        )

        # ----------------------------------------------
        # Categories
        # ----------------------------------------------

        category_id_map = migrate_categories(
            sqlite_connection,
            postgres_connection,
            sqlite_tables,
            postgres_tables,
            user_id_map,
        )

        # ----------------------------------------------
        # Transactions
        # ----------------------------------------------

        migrate_transactions(
            sqlite_connection,
            postgres_connection,
            sqlite_tables,
            postgres_tables,
            user_id_map,
            category_id_map,
        )

        # ----------------------------------------------
        # Budgets
        # ----------------------------------------------

        migrate_budgets(
            sqlite_connection,
            postgres_connection,
            sqlite_tables,
            postgres_tables,
            user_id_map,
            category_id_map,
        )

        # ----------------------------------------------
        # Sequences
        # ----------------------------------------------

        reset_sequences(postgres_connection)

        # ----------------------------------------------
        # Validation
        # ----------------------------------------------

        validate_migration(
            sqlite_connection,
            postgres_connection,
            sqlite_tables,
            postgres_tables,
        )

        # ----------------------------------------------
        # Commit happens automatically here
        # ----------------------------------------------

    log("")
    log("==================================================")
    log("✓ SQLite → PostgreSQL migration completed")
    log("==================================================")


# ==========================================================
# CLI
# ==========================================================


def main() -> None:

    parser = argparse.ArgumentParser(
        description=("Migrate Finora SQLite data " "into PostgreSQL.")
    )

    parser.add_argument(
        "--sqlite",
        type=Path,
        default=Path("/migration/finance.db"),
        help=("Path to the source SQLite database."),
    )

    args = parser.parse_args()

    log("Starting Finora data migration")

    log(f"SQLite source: " f"{args.sqlite}")

    log(
        f"PostgreSQL target: "
        f"{settings.POSTGRES_HOST}:"
        f"{settings.POSTGRES_PORT}/"
        f"{settings.POSTGRES_DB}"
    )

    try:

        migrate(args.sqlite)

    except Exception as exc:

        fail("Migration failed.")

        fail(f"Reason: {exc}")

        raise


if __name__ == "__main__":
    main()
