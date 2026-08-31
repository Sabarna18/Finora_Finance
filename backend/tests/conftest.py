# ============================================================
# backend/tests/conftest.py
#
# Shared pytest fixtures for Finora backend API tests.
#
# Responsibilities:
#   1. Create an isolated test database
#   2. Create/drop test tables for every test session
#   3. Override FastAPI's production DB dependency
#   4. Provide a reusable TestClient
#   5. Provide authenticated test users
#   6. Provide authentication headers
#
# Scope:
#   API integration testing for v1
# ============================================================


# ============================================================
# TEST PROJECT PATH
# ============================================================

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.app import app
from src.core.security import create_access_token, hash_password
from src.db.database import Base, get_db
from src.db.models import User

# backend/
PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(PROJECT_ROOT),
    )


# ============================================================
# TEST DATABASE
# ============================================================

TEST_DATABASE_URL = "sqlite://"


# ------------------------------------------------------------
# Engine
#
# StaticPool keeps the same in-memory SQLite database available
# across connections created during the test run.
#
# check_same_thread=False is required because FastAPI's
# TestClient may execute requests from different threads.
# ------------------------------------------------------------

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
    future=True,
)


# ------------------------------------------------------------
# Session factory
# ------------------------------------------------------------

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
)


# ============================================================
# DATABASE FIXTURE
# ============================================================


@pytest.fixture(autouse=True)
def create_test_database():
    """
    Create a completely isolated database for every test.

    Each test starts with an empty schema and leaves no
    persistent test data behind.
    """

    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)


# ============================================================
# DATABASE SESSION FIXTURE
# ============================================================


@pytest.fixture
def db() -> Generator[Session]:
    """
    Provide an isolated SQLAlchemy session to a test.

    Each test receives a fresh session and the session is always
    closed after the test completes.
    """

    session = TestingSessionLocal()

    try:
        yield session

    finally:
        session.close()


# ============================================================
# FASTAPI DATABASE OVERRIDE
# ============================================================


@pytest.fixture
def client(db: Session) -> Generator[TestClient]:
    """
    Provide a FastAPI TestClient using the test database.

    This overrides the production get_db dependency so API
    requests never touch finance.db.
    """

    def override_get_db():

        try:
            yield db

        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client

    finally:
        app.dependency_overrides.pop(
            get_db,
            None,
        )


# ============================================================
# TEST USER DATA
# ============================================================

TEST_USER_EMAIL = "testuser@finora.com"

TEST_USER_PASSWORD = "TestPassword123!"

TEST_USER_NAME = "Test User"


# ============================================================
# TEST USER FIXTURE
# ============================================================


@pytest.fixture
def test_user(
    db: Session,
) -> User:
    """
    Create a normal authenticated user for API tests.
    """

    user = User(
        name=TEST_USER_NAME,
        email=TEST_USER_EMAIL,
        password_hash=hash_password(TEST_USER_PASSWORD),
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


# ============================================================
# AUTHENTICATION TOKEN
# ============================================================


@pytest.fixture
def auth_token(
    test_user: User,
) -> str:
    """
    Generate a JWT for the test user.

    This uses the same token-generation function used by the
    production authentication flow.
    """

    return create_access_token({"sub": str(test_user.id)})


# ============================================================
# AUTHENTICATION HEADERS
# ============================================================


@pytest.fixture
def auth_headers(
    auth_token: str,
) -> dict[str, str]:
    """
    Return Authorization headers for authenticated requests.
    """

    return {"Authorization": f"Bearer {auth_token}"}
