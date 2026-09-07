# ==========================================================
# migrations/env.py
# Finora Alembic Environment
#
# Uses the application's SQLAlchemy engine directly.
# This guarantees that Alembic and FastAPI use the
# exact same Neon database configuration.
# ==========================================================

from logging.config import fileConfig

from alembic import context


# ==========================================================
# ALEMBIC CONFIGURATION
# ==========================================================

config = context.config


# ==========================================================
# LOGGING
# ==========================================================

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ==========================================================
# APPLICATION DATABASE
# ==========================================================

from src.db.database import (  # noqa: E402
    Base,
    DATABASE_URL,
    engine,
)

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
    Run migrations without establishing a database connection.

    The application's DATABASE_URL is used so Alembic remains
    aligned with the application database configuration.
    """

    url = DATABASE_URL.render_as_string(
        hide_password=False
    )

    context.configure(
        url=url,
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
    Run migrations using the application's SQLAlchemy engine.

    IMPORTANT:

    We intentionally do NOT use engine_from_config() here.

    The engine from src.db.database already contains:

        - Neon host
        - Neon credentials
        - PostgreSQL driver
        - SSL mode
        - connection pooling
        - pool_pre_ping
    """

    with engine.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,

            compare_type=True,
            compare_server_default=True,

            # PostgreSQL is now the canonical database.
            render_as_batch=False,
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