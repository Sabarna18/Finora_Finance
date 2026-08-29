# ==========================================================
# migrations/env.py
#
# Production-ready Alembic environment
# ==========================================================

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine
from sqlalchemy import pool

# ==========================================================
# ALEMBIC CONFIG
# ==========================================================

config = context.config


# ==========================================================
# LOGGING
# ==========================================================

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ==========================================================
# PROJECT DATABASE + METADATA
# ==========================================================

from src.db.database import (  # noqa: E402
    Base,
    DATABASE_URL,
)

# Import all models so that they are registered with
# Base.metadata before Alembic performs migrations.

from src.db import models  # noqa: F401,E402

# ==========================================================
# TARGET METADATA
# ==========================================================

target_metadata = Base.metadata


# ==========================================================
# OFFLINE MIGRATIONS
# ==========================================================


def run_migrations_offline() -> None:
    """
    Run migrations without creating a live database
    connection.

    Useful for generating SQL migration scripts.
    """

    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ==========================================================
# ONLINE MIGRATIONS
# ==========================================================


def run_migrations_online() -> None:
    """
    Run migrations using the application's actual
    database configuration.

    DATABASE_URL is passed directly to SQLAlchemy.

    This avoids routing the connection through
    alembic.ini and guarantees that the PostgreSQL
    credentials from Settings are used.
    """

    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
        future=True,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Detect model type changes.
            compare_type=True,
            # Detect server-default changes.
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ==========================================================
# EXECUTION
# ==========================================================

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()
