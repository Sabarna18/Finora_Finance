# ==========================================================
# src/db/database.py
# ==========================================================

from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import (
    declarative_base,
    sessionmaker,
)

from src.core.config import settings

# ==========================================================
# DATABASE URL
# ==========================================================


def get_database_url() -> str:
    """
    Build the database URL from application settings.

    Supports:

        SQLite
        PostgreSQL

    The database host is controlled entirely through
    environment configuration.

    Examples:

        Local PostgreSQL:
            POSTGRES_HOST=localhost

        Docker PostgreSQL:
            POSTGRES_HOST=postgres
    """

    if settings.DB_TYPE == "sqlite":
        return f"sqlite:///{settings.SQLITE_DB_PATH}"

    if settings.DB_TYPE == "postgresql":
        return URL.create(
            drivername="postgresql+psycopg2",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
        )

    raise ValueError(f"Unsupported DB_TYPE: {settings.DB_TYPE}")


# ==========================================================
# DATABASE URL
# ==========================================================

DATABASE_URL = get_database_url()


# ==========================================================
# ENGINE
# ==========================================================

engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}


# ----------------------------------------------------------
# SQLite
# ----------------------------------------------------------

if settings.DB_TYPE == "sqlite":
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        **engine_kwargs,
    )


# ----------------------------------------------------------
# PostgreSQL
# ----------------------------------------------------------

else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        **engine_kwargs,
    )


# ==========================================================
# SESSION
# ==========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ==========================================================
# BASE
# ==========================================================

Base = declarative_base()


# ==========================================================
# DATABASE DEPENDENCY
# ==========================================================


def get_db():
    """
    Provide a SQLAlchemy database session.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
