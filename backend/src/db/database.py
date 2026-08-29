# ==========================================================
# src/db/database.py
#
# Database configuration and SQLAlchemy session management
# Supports SQLite for development and PostgreSQL for Docker
# ==========================================================

from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import declarative_base, sessionmaker

from src.core.config import settings

# ==========================================================
# DATABASE URL
# ==========================================================


def get_database_url() -> str | URL:
    """
    Build the database URL dynamically.

    Supports:
        - SQLite for local development
        - PostgreSQL for Docker / production

    Important:
        PostgreSQL returns a SQLAlchemy URL object directly.
        Do NOT convert it to str(), because SQLAlchemy's string
        representation masks the password as '***'.
    """

    # ------------------------------------------------------
    # SQLite
    # ------------------------------------------------------

    if settings.DB_TYPE == "sqlite":
        return f"sqlite:///{settings.SQLITE_DB_PATH}"

    # ------------------------------------------------------
    # PostgreSQL
    # ------------------------------------------------------

    if settings.DB_TYPE == "postgresql":
        return URL.create(
            drivername="postgresql+psycopg2",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
        )

    # ------------------------------------------------------
    # Unsupported database
    # ------------------------------------------------------

    raise ValueError(f"Unsupported DB_TYPE: {settings.DB_TYPE}")


DATABASE_URL = get_database_url()


# ==========================================================
# DATABASE ENGINE
# ==========================================================

if settings.DB_TYPE == "sqlite":

    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        echo=settings.DEBUG,
        future=True,
    )

else:

    engine = create_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
    )


# ==========================================================
# SESSION FACTORY
# ==========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ==========================================================
# DECLARATIVE BASE
# ==========================================================

Base = declarative_base()


# ==========================================================
# DATABASE DEPENDENCY
# ==========================================================


def get_db():
    """
    FastAPI database dependency.

    Creates one SQLAlchemy session per request and
    guarantees that the session is closed afterwards.

    Usage:

        db: Session = Depends(get_db)
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
