# ==========================================================
# Finora Database
# Single PostgreSQL / Neon configuration
# ==========================================================

from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import declarative_base, sessionmaker

from src.core.config import settings

# ==========================================================
# DATABASE URL
# ==========================================================

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=settings.POSTGRES_USER,
    password=settings.POSTGRES_PASSWORD,
    host=settings.POSTGRES_HOST,
    port=settings.POSTGRES_PORT,
    database=settings.POSTGRES_DB,
)


# ==========================================================
# DATABASE ENGINE
# ==========================================================

engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={
        "sslmode": settings.POSTGRES_SSLMODE,
    },
    pool_pre_ping=True,
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
    FastAPI database dependency.

    Creates one SQLAlchemy session per request
    and guarantees that it is closed afterward.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
