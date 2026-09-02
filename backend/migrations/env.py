# ==========================================================
# migrations/env.py
#
# Finora - Production-ready, environment-driven Alembic
# environment.
#
# Database configuration is NOT hardcoded here.
#
# The database URL comes from:
#
#     Environment
#          ↓
#     src.core.config.Settings
#          ↓
#     src.db.database.DATABASE_URL
#          ↓
#     Alembic
#
# This allows:
#
#     Local PostgreSQL
#     Local SQLite
#     Docker PostgreSQL
#     GitHub Actions SQLite
#     GitHub Actions PostgreSQL
#     Production PostgreSQL
#
# ==========================================================


from logging.config import fileConfig

from alembic import context

from sqlalchemy import create_engine
from sqlalchemy import pool


# ==========================================================
# ALEMBIC CONFIGURATION
# ==========================================================

config = context.config


# ==========================================================
# LOGGING
# ==========================================================

if config.config_file_name is not None:

    fileConfig(
        config.config_file_name
    )


# ==========================================================
# PROJECT DATABASE + METADATA
# ==========================================================
#
# IMPORTANT:
#
# We intentionally import DATABASE_URL from the application's
# database layer instead of reading a hardcoded URL from
# alembic.ini.
#
# This means Alembic follows exactly the same environment
# configuration as the FastAPI application.
#
# ==========================================================

from src.db.database import (  # noqa: E402
    Base,
    DATABASE_URL,
)


# ==========================================================
# MODEL REGISTRATION
# ==========================================================
#
# Import models before Alembic evaluates Base.metadata.
#
# Without this import, Alembic may see an incomplete metadata
# object and incorrectly report missing tables/columns.
#
# ==========================================================

from src.db import models  # noqa: F401,E402


# ==========================================================
# TARGET METADATA
# ==========================================================

target_metadata = Base.metadata


# ==========================================================
# ALEMBIC DATABASE URL
# ==========================================================
#
# Keep alembic.ini independent from the actual environment.
#
# DATABASE_URL has already been resolved by the application's
# Settings system.
#
# We still set it on Alembic's Config object so that commands
# and Alembic internals consistently see the active database.
#
# ==========================================================

config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.render_as_string(hide_password=False),
)


# ==========================================================
# OFFLINE MIGRATIONS
# ==========================================================

def run_migrations_offline() -> None:
    """
    Run Alembic migrations without opening a live database
    connection.

    The URL is resolved from the application's environment
    configuration.
    """

    context.configure(

        url=DATABASE_URL,

        target_metadata=target_metadata,

        literal_binds=True,

        compare_type=True,

        compare_server_default=True,

        render_as_batch=True,
    )


    with context.begin_transaction():

        context.run_migrations()


# ==========================================================
# ONLINE MIGRATIONS
# ==========================================================

def run_migrations_online() -> None:
    """
    Run Alembic migrations using the application's resolved
    DATABASE_URL.

    No database hostname, username, password, port, or database
    name is hardcoded here.

    Examples:

        Local:
            POSTGRES_HOST=localhost

        Docker:
            POSTGRES_HOST=postgres

        GitHub Actions:
            POSTGRES_HOST=localhost
    """

    connectable = create_engine(

        DATABASE_URL,

        poolclass=pool.NullPool,

        future=True,
    )


    try:

        with connectable.connect() as connection:

            context.configure(

                connection=connection,

                target_metadata=target_metadata,

                compare_type=True,

                compare_server_default=True,

                render_as_batch=True,
            )


            with context.begin_transaction():

                context.run_migrations()

    finally:

        connectable.dispose()


# ==========================================================
# EXECUTION
# ==========================================================

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()

