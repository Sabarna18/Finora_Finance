#!/usr/bin/env python3

"""
Finora Database Summary Generator
=================================

Purpose
-------

Generate a read-only operational and structural summary of the
currently configured Finora PostgreSQL database.

Finora uses Neon PostgreSQL as its canonical database.

This script reports:

    1. Database summary
    2. Database configuration
    3. Connection summary
    4. PostgreSQL server / instance summary
    5. Tables
    6. Columns
    7. Primary keys
    8. Indexes
    9. Foreign keys
   10. Row counts
   11. Overall schema statistics


Architecture
------------

                    Finora
                       │
                       ▼
              SQLAlchemy Engine
                       │
                       ▼
                Neon PostgreSQL
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      Database      Runtime      Metadata
      Queries       Stats        Inspector
          │            │            │
          ▼            ▼            ▼
       Summary     Connections    Schema


Important
---------

This script is READ-ONLY.

It does NOT:

    - run migrations
    - modify database schema
    - create tables
    - delete data
    - insert data
    - execute Alembic commands
    - modify PostgreSQL configuration
    - terminate connections
    - perform application health checks

Only read-only PostgreSQL queries and SQLAlchemy Inspector
metadata queries are performed.


Database Configuration
----------------------

The script intentionally reuses the application's existing
SQLAlchemy engine.

It does NOT duplicate credentials.

The source of truth remains:

    src.db.database

Therefore the script inspects the exact PostgreSQL database
used by the Finora application.


Neon
----

The database configuration section identifies the configured
Neon endpoint without exposing the PostgreSQL password.

The instance section reports PostgreSQL server information
visible from the connected database.

Neon control-plane properties such as compute size or autoscaling
configuration are not inferred because they are not reliably
available through ordinary PostgreSQL metadata queries.


Execution
---------

From project root:

    python backend/scripts/generate_db_summary.py

From backend:

    python scripts/generate_db_summary.py

Inside Docker:

    python scripts/generate_db_summary.py


Exit Codes
----------

    0 = summary generated successfully
    1 = database / inspection failure
"""

from __future__ import annotations

import sys
from pathlib import Path


# ============================================================
# PROJECT ROOT
# ============================================================

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


from collections.abc import Sequence
from datetime import datetime, timezone
from urllib.parse import urlsplit

from sqlalchemy import Engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError

from src.db.database import DATABASE_URL, engine
from src.core.config import settings


# ============================================================
# DISPLAY CONFIGURATION
# ============================================================

TITLE_WIDTH = 68


# ============================================================
# DISPLAY HELPERS
# ============================================================


def print_header(title: str) -> None:
    """Print a major section header."""

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


def print_key_value(
    label: str,
    value: object,
    width: int = 24,
) -> None:
    """Print an aligned key/value pair."""

    print(f"{label:<{width}}: {value}")


# ============================================================
# SAFE DATABASE URL INFORMATION
# ============================================================


def get_database_url_information() -> dict[str, object]:
    """
    Extract safe connection information from the application's
    SQLAlchemy DATABASE_URL.

    The password is intentionally never displayed.
    """

    return {
        "driver": DATABASE_URL.drivername,
        "host": DATABASE_URL.host or "<unknown>",
        "port": DATABASE_URL.port or 5432,
        "database": DATABASE_URL.database or "<unknown>",
        "username": DATABASE_URL.username or "<unknown>",
        "sslmode": settings.POSTGRES_SSLMODE,
    }


# ============================================================
# DATABASE SUMMARY
# ============================================================


def get_database_information(
    database_engine: Engine,
) -> dict[str, object]:
    """
    Retrieve basic PostgreSQL database information.

    Only read-only SELECT statements are executed.
    """

    query = text(
        """
        SELECT
            current_database() AS database_name,
            current_user AS current_user,
            current_schema() AS current_schema,
            version() AS version,
            current_setting('server_version') AS server_version,
            current_setting('server_version_num') AS server_version_num,
            pg_postmaster_start_time() AS server_start_time,
            CURRENT_TIMESTAMP AS server_time,
            pg_size_pretty(
                pg_database_size(current_database())
            ) AS database_size,
            pg_database_size(current_database()) AS database_size_bytes,
            inet_server_addr() AS server_address,
            inet_server_port() AS server_port,
            pg_backend_pid() AS backend_pid
        """
    )

    with database_engine.connect() as connection:

        row = connection.execute(query).mappings().one()

    return dict(row)


def print_database_summary(
    database_information: dict[str, object],
) -> None:
    """Print database-level information."""

    print_section("DATABASE SUMMARY")

    print_key_value(
        "Database",
        database_information["database_name"],
    )

    print_key_value(
        "Current user",
        database_information["current_user"],
    )

    print_key_value(
        "Current schema",
        database_information["current_schema"],
    )

    print_key_value(
        "PostgreSQL",
        database_information["server_version"],
    )

    print_key_value(
        "Version number",
        database_information["server_version_num"],
    )

    print_key_value(
        "Database size",
        database_information["database_size"],
    )

    print_key_value(
        "Database size bytes",
        f'{database_information["database_size_bytes"]:,}',
    )

    print_key_value(
        "Server address",
        database_information["server_address"],
    )

    print_key_value(
        "Server port",
        database_information["server_port"],
    )

    print_key_value(
        "Server start time",
        database_information["server_start_time"],
    )

    print_key_value(
        "Server time",
        database_information["server_time"],
    )

    print_key_value(
        "Backend PID",
        database_information["backend_pid"],
    )


# ============================================================
# DATABASE CONFIGURATION
# ============================================================


def print_database_configuration() -> None:
    """
    Print safe application/database configuration.

    Credentials are deliberately excluded.
    """

    configuration = get_database_url_information()

    print_section("DATABASE CONFIGURATION")

    print_key_value(
        "Database provider",
        "Neon PostgreSQL",
    )

    print_key_value(
        "SQLAlchemy driver",
        configuration["driver"],
    )

    print_key_value(
        "Host",
        configuration["host"],
    )

    print_key_value(
        "Port",
        configuration["port"],
    )

    print_key_value(
        "Database",
        configuration["database"],
    )

    print_key_value(
        "Username",
        configuration["username"],
    )

    print_key_value(
        "SSL mode",
        configuration["sslmode"],
    )

    print_key_value(
        "Application",
        settings.APP_NAME,
    )

    print_key_value(
        "Environment",
        settings.APP_ENV,
    )

    print_key_value(
        "Debug",
        settings.DEBUG,
    )

    # --------------------------------------------------------
    # SQLAlchemy pool configuration
    # --------------------------------------------------------

    print_key_value(
        "Pool class",
        type(engine.pool).__name__,
    )

    pool_size = getattr(engine.pool, "size", None)

    if callable(pool_size):
        pool_size = pool_size()

    print_key_value(
        "Pool size",
        pool_size,
    )

    max_overflow = getattr(
        engine.pool,
        "_max_overflow",
        None,
    )

    print_key_value(
        "Max overflow",
        max_overflow,
    )

    pool_timeout = getattr(
        engine.pool,
        "_timeout",
        None,
    )

    print_key_value(
        "Pool timeout",
        pool_timeout,
    )

    pool_recycle = getattr(
        engine.pool,
        "_recycle",
        None,
    )

    print_key_value(
        "Pool recycle",
        pool_recycle,
    )


# ============================================================
# CONNECTION SUMMARY
# ============================================================


def get_connection_summary(
    database_engine: Engine,
) -> dict[str, object]:
    """
    Retrieve PostgreSQL connection statistics.

    pg_stat_activity is read-only.
    """

    query = text(
        """
        SELECT
            COUNT(*) AS total_connections,

            COUNT(*) FILTER (
                WHERE state = 'active'
            ) AS active_connections,

            COUNT(*) FILTER (
                WHERE state = 'idle'
            ) AS idle_connections,

            COUNT(*) FILTER (
                WHERE state = 'idle in transaction'
            ) AS idle_in_transaction_connections,

            COUNT(*) FILTER (
                WHERE wait_event IS NOT NULL
            ) AS waiting_connections

        FROM pg_stat_activity
        WHERE datname = current_database()
        """
    )

    max_connections_query = text(
        """
        SELECT current_setting('max_connections')::integer
            AS max_connections
        """
    )

    reserved_connections_query = text(
        """
        SELECT current_setting(
            'superuser_reserved_connections'
        )::integer AS reserved_connections
        """
    )

    with database_engine.connect() as connection:

        summary = dict(
            connection.execute(query).mappings().one()
        )

        max_connections = connection.execute(
            max_connections_query
        ).scalar_one()

        reserved_connections = connection.execute(
            reserved_connections_query
        ).scalar_one()

    summary["max_connections"] = max_connections

    summary["reserved_connections"] = reserved_connections

    usable_connections = (
        int(max_connections)
        - int(reserved_connections)
    )

    summary["usable_connections"] = usable_connections

    current_connections = int(
        summary["total_connections"]
    )

    if usable_connections > 0:

        utilization = (
            current_connections
            / usable_connections
        ) * 100

    else:
        utilization = 0.0

    summary["connection_utilization_percent"] = utilization

    return summary


def print_connection_summary(
    connection_summary: dict[str, object],
) -> None:
    """Print PostgreSQL connection statistics."""

    print_section("CONNECTION SUMMARY")

    print_key_value(
        "Maximum connections",
        connection_summary["max_connections"],
    )

    print_key_value(
        "Reserved connections",
        connection_summary["reserved_connections"],
    )

    print_key_value(
        "Usable connections",
        connection_summary["usable_connections"],
    )

    print_key_value(
        "Current connections",
        connection_summary["total_connections"],
    )

    print_key_value(
        "Active connections",
        connection_summary["active_connections"],
    )

    print_key_value(
        "Idle connections",
        connection_summary["idle_connections"],
    )

    print_key_value(
        "Idle in transaction",
        connection_summary[
            "idle_in_transaction_connections"
        ],
    )

    print_key_value(
        "Waiting connections",
        connection_summary["waiting_connections"],
    )

    print_key_value(
        "Connection utilization",
        f'{connection_summary["connection_utilization_percent"]:.2f}%',
    )


# ============================================================
# CONNECTION DETAIL
# ============================================================


def get_connection_details(
    database_engine: Engine,
) -> list[dict[str, object]]:
    """
    Retrieve a safe summary of current database sessions.

    Passwords and sensitive query contents are intentionally
    excluded.

    Query text is not exposed because it may contain sensitive
    application data.
    """

    query = text(
        """
        SELECT
            pid,
            usename,
            application_name,
            client_addr,
            client_port,
            state,
            backend_type,
            backend_start,
            state_change
        FROM pg_stat_activity
        WHERE datname = current_database()
        ORDER BY backend_start
        """
    )

    with database_engine.connect() as connection:

        rows = connection.execute(query).mappings().all()

    return [dict(row) for row in rows]


def print_connection_details(
    connections: Sequence[dict[str, object]],
) -> None:
    """Print safe connection/session information."""

    print_section("CONNECTION DETAILS")

    if not connections:

        print("No active database sessions found.")

        return

    for connection in connections:

        print(
            f'  PID {connection["pid"]}'
            f' | user={connection["usename"]}'
            f' | state={connection["state"]}'
            f' | application={connection["application_name"] or "<none>"}'
        )

        print(
            f'      backend={connection["backend_type"]}'
            f' | client={connection["client_addr"] or "local"}'
            f' | port={connection["client_port"] or "-"}'
        )

        print(
            f'      started={connection["backend_start"]}'
        )

        print(
            f'      state_change={connection["state_change"]}'
        )


# ============================================================
# INSTANCE / SERVER SUMMARY
# ============================================================


def get_instance_information(
    database_engine: Engine,
) -> dict[str, object]:
    """
    Retrieve PostgreSQL server/instance information visible
    from the current database connection.

    This represents the PostgreSQL server behind the Neon
    connection.

    Neon control-plane compute properties are not inferred.
    """

    query = text(
        """
        SELECT
            version() AS full_version,

            current_setting(
                'server_version'
            ) AS server_version,

            current_setting(
                'server_version_num'
            ) AS server_version_num,

            inet_server_addr()
                AS server_address,

            inet_server_port()
                AS server_port,

            pg_postmaster_start_time()
                AS start_time,

            CURRENT_TIMESTAMP
                AS current_time,

            current_setting(
                'max_connections'
            )::integer AS max_connections,

            current_setting(
                'shared_buffers'
            ) AS shared_buffers,

            current_setting(
                'work_mem'
            ) AS work_mem,

            current_setting(
                'maintenance_work_mem'
            ) AS maintenance_work_mem,

            current_setting(
                'effective_cache_size'
            ) AS effective_cache_size
        """
    )

    with database_engine.connect() as connection:

        row = connection.execute(
            query
        ).mappings().one()

    information = dict(row)

    start_time = information["start_time"]

    current_time = information["current_time"]

    if isinstance(start_time, datetime) and isinstance(
        current_time,
        datetime,
    ):

        uptime_seconds = (
            current_time - start_time
        ).total_seconds()

        information["uptime_seconds"] = uptime_seconds

        days = int(uptime_seconds // 86400)

        hours = int(
            (uptime_seconds % 86400) // 3600
        )

        minutes = int(
            (uptime_seconds % 3600) // 60
        )

        information["uptime"] = (
            f"{days}d {hours}h {minutes}m"
        )

    else:

        information["uptime_seconds"] = None
        information["uptime"] = "unknown"

    return information


def print_instance_summary(
    instance_information: dict[str, object],
) -> None:
    """Print PostgreSQL server/instance information."""

    print_section("POSTGRESQL INSTANCE / SERVER SUMMARY")

    print_key_value(
        "Provider",
        "Neon PostgreSQL",
    )

    print_key_value(
        "PostgreSQL version",
        instance_information["server_version"],
    )

    print_key_value(
        "Version number",
        instance_information["server_version_num"],
    )

    print_key_value(
        "Server address",
        instance_information["server_address"],
    )

    print_key_value(
        "Server port",
        instance_information["server_port"],
    )

    print_key_value(
        "Start time",
        instance_information["start_time"],
    )

    print_key_value(
        "Current time",
        instance_information["current_time"],
    )

    print_key_value(
        "Uptime",
        instance_information["uptime"],
    )

    print_key_value(
        "Max connections",
        instance_information["max_connections"],
    )

    print_key_value(
        "Shared buffers",
        instance_information["shared_buffers"],
    )

    print_key_value(
        "Work memory",
        instance_information["work_mem"],
    )

    print_key_value(
        "Maintenance work memory",
        instance_information["maintenance_work_mem"],
    )

    print_key_value(
        "Effective cache size",
        instance_information["effective_cache_size"],
    )

    print_key_value(
        "Neon compute metadata",
        "Not exposed through PostgreSQL",
    )


# ============================================================
# TABLE INFORMATION
# ============================================================


def get_tables(
    database_engine: Engine,
) -> list[str]:
    """
    Return all tables visible to SQLAlchemy's inspector.
    """

    inspector = inspect(database_engine)

    return sorted(
        inspector.get_table_names()
    )


# ============================================================
# COLUMN INFORMATION
# ============================================================


def print_table_columns(
    inspector,
    table_name: str,
) -> None:
    """Print column definitions for a table."""

    columns = inspector.get_columns(
        table_name
    )

    print(
        f"  Columns      : {len(columns)}"
    )

    if not columns:

        print(
            "    No columns found."
        )

        return

    print()
    print(
        "  Column definitions:"
    )

    for column in columns:

        name = column["name"]

        column_type = str(
            column["type"]
        )

        nullable = column["nullable"]

        nullable_text = (
            "NULL"
            if nullable
            else "NOT NULL"
        )

        print(
            f"    - "
            f"{name:<25}"
            f"{column_type:<24}"
            f"{nullable_text}"
        )


# ============================================================
# PRIMARY KEY INFORMATION
# ============================================================


def print_primary_key(
    inspector,
    table_name: str,
) -> None:
    """Print primary-key information."""

    primary_key = inspector.get_pk_constraint(
        table_name
    )

    constrained_columns = (
        primary_key.get(
            "constrained_columns"
        )
        or []
    )

    if constrained_columns:

        columns = ", ".join(
            constrained_columns
        )

        print(
            f"  Primary key  : {columns}"
        )

    else:

        print(
            "  Primary key  : none"
        )


# ============================================================
# INDEX INFORMATION
# ============================================================


def get_indexes(
    inspector,
    tables: Sequence[str],
) -> list[dict[str, object]]:
    """Collect index metadata."""

    indexes: list[
        dict[str, object]
    ] = []

    for table_name in tables:

        for index in inspector.get_indexes(
            table_name
        ):

            indexes.append(
                {
                    "table": table_name,
                    "name": index.get("name"),
                    "columns": (
                        index.get(
                            "column_names"
                        )
                        or []
                    ),
                    "unique": bool(
                        index.get("unique")
                    ),
                }
            )

    return indexes


def print_indexes(
    indexes: Sequence[
        dict[str, object]
    ],
) -> None:
    """Print index information."""

    print_section(
        "INDEX SUMMARY"
    )

    if not indexes:

        print(
            "No indexes found."
        )

        return

    for index in indexes:

        table_name = index["table"]

        name = (
            index["name"]
            or "<unnamed>"
        )

        columns = ", ".join(
            index["columns"]  # type: ignore[arg-type]
        )

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

    print(
        f"Total indexes : {len(indexes)}"
    )


# ============================================================
# FOREIGN KEY INFORMATION
# ============================================================


def get_foreign_keys(
    inspector,
    tables: Sequence[str],
) -> list[dict[str, object]]:
    """Collect foreign-key metadata."""

    foreign_keys: list[
        dict[str, object]
    ] = []

    for table_name in tables:

        for foreign_key in inspector.get_foreign_keys(
            table_name
        ):

            foreign_keys.append(
                {
                    "table": table_name,

                    "columns": (
                        foreign_key.get(
                            "constrained_columns"
                        )
                        or []
                    ),

                    "referred_table":
                        foreign_key.get(
                            "referred_table"
                        ),

                    "referred_columns": (
                        foreign_key.get(
                            "referred_columns"
                        )
                        or []
                    ),
                }
            )

    return foreign_keys


def print_foreign_keys(
    foreign_keys: Sequence[
        dict[str, object]
    ],
) -> None:
    """Print foreign-key information."""

    print_section(
        "FOREIGN KEY SUMMARY"
    )

    if not foreign_keys:

        print(
            "No foreign keys found."
        )

        return

    for foreign_key in foreign_keys:

        table_name = (
            foreign_key["table"]
        )

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
            f" -> {referred_table}."
            f"{referred_columns}"
        )

    print()

    print(
        f"Total foreign keys : "
        f"{len(foreign_keys)}"
    )


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

    Table names come from SQLAlchemy Inspector.
    """

    counts: dict[str, int] = {}

    identifier_preparer = (
        inspector.engine
        .dialect
        .identifier_preparer
    )

    with database_engine.connect() as connection:

        for table_name in tables:

            quoted_table = (
                identifier_preparer.quote(
                    table_name
                )
            )

            result = connection.execute(
                text(
                    f"""
                    SELECT COUNT(*)
                    FROM {quoted_table}
                    """
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

    print_section(
        "ROW COUNTS"
    )

    if not row_counts:

        print(
            "No tables found."
        )

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
    """Print structural information."""

    print_section(
        "TABLE DETAILS"
    )

    if not tables:

        print(
            "No tables found."
        )

        return

    for table_name in tables:

        print()
        print(
            f"[{table_name}]"
        )

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

        foreign_keys = (
            inspector.get_foreign_keys(
                table_name
            )
        )

        print(
            f"  Indexes      : "
            f"{len(indexes)}"
        )

        print(
            f"  Foreign keys : "
            f"{len(foreign_keys)}"
        )


# ============================================================
# SUMMARY STATISTICS
# ============================================================


def print_summary_statistics(
    tables: Sequence[str],
    indexes: Sequence[
        dict[str, object]
    ],
    foreign_keys: Sequence[
        dict[str, object]
    ],
    row_counts: dict[str, int],
) -> None:
    """Print high-level database statistics."""

    print_section(
        "SCHEMA SUMMARY"
    )

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

    print_key_value(
        "Total rows",
        f"{sum(row_counts.values()):,}",
    )


# ============================================================
# MAIN SUMMARY GENERATOR
# ============================================================


def generate_database_summary(
    database_engine: Engine,
) -> None:
    """
    Generate the complete read-only database summary.
    """

    print_header(
        "Finora Database Summary"
    )

    print(
        "Database provider : Neon PostgreSQL"
    )

    print(
        "Inspection mode   : READ-ONLY"
    )

    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    database_information = (
        get_database_information(
            database_engine
        )
    )

    print_database_summary(
        database_information
    )

    # --------------------------------------------------------
    # Configuration
    # --------------------------------------------------------

    print_database_configuration()

    # --------------------------------------------------------
    # Connections
    # --------------------------------------------------------

    connection_summary = (
        get_connection_summary(
            database_engine
        )
    )

    print_connection_summary(
        connection_summary
    )

    # --------------------------------------------------------
    # Connection details
    # --------------------------------------------------------

    connection_details = (
        get_connection_details(
            database_engine
        )
    )

    print_connection_details(
        connection_details
    )

    # --------------------------------------------------------
    # Instance / server
    # --------------------------------------------------------

    instance_information = (
        get_instance_information(
            database_engine
        )
    )

    print_instance_summary(
        instance_information
    )

    # --------------------------------------------------------
    # Inspector
    # --------------------------------------------------------

    inspector = inspect(
        database_engine
    )

    # --------------------------------------------------------
    # Tables
    # --------------------------------------------------------

    tables = get_tables(
        database_engine
    )

    print_section(
        "TABLES"
    )

    if tables:

        print_key_value(
            "Total tables",
            len(tables),
        )

        print()

        for table_name in tables:

            print(
                f"  • {table_name}"
            )

    else:

        print(
            "No tables found."
        )

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
        row_counts
    )

    # --------------------------------------------------------
    # Indexes
    # --------------------------------------------------------

    indexes = get_indexes(
        inspector,
        tables,
    )

    print_indexes(
        indexes
    )

    # --------------------------------------------------------
    # Foreign keys
    # --------------------------------------------------------

    foreign_keys = get_foreign_keys(
        inspector,
        tables,
    )

    print_foreign_keys(
        foreign_keys
    )

    # --------------------------------------------------------
    # Schema statistics
    # --------------------------------------------------------

    print_summary_statistics(
        tables,
        indexes,
        foreign_keys,
        row_counts,
    )

    # --------------------------------------------------------
    # Final
    # --------------------------------------------------------

    print()

    print("=" * TITLE_WIDTH)

    print(
        " Neon PostgreSQL database summary generated successfully"
    )

    print("=" * TITLE_WIDTH)

    print()


# ============================================================
# MAIN
# ============================================================


def main() -> int:
    """
    CLI entry point.

    Returns:

        0 = success
        1 = inspection/database failure
    """

    try:

        generate_database_summary(
            engine
        )

    except SQLAlchemyError as exc:

        print()

        print("=" * TITLE_WIDTH)

        print(
            " Database summary failed"
        )

        print("=" * TITLE_WIDTH)

        print()

        print(
            f"Database error: {exc}"
        )

        print()

        return 1

    except Exception as exc:

        print()

        print("=" * TITLE_WIDTH)

        print(
            " Database summary failed"
        )

        print("=" * TITLE_WIDTH)

        print()

        print(
            f"Unexpected error: {exc}"
        )

        print()

        return 1

    return 0


# ============================================================
# EXECUTION
# ============================================================


if __name__ == "__main__":
    sys.exit(main())