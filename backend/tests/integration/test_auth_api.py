# ============================================================
# tests/integration/test_auth_api.py
#
# Authentication API integration tests.
#
# Covered endpoints:
#
#   POST /api/v1/auth/register
#   POST /api/v1/auth/login
#   GET  /api/v1/auth/me
#
# These tests verify the complete API layer:
#
#   Request
#      ↓
#   FastAPI Router
#      ↓
#   Dependencies
#      ↓
#   AuthService
#      ↓
#   Test Database
#      ↓
#   Response
# ============================================================


# ============================================================
# REGISTER
# ============================================================


def test_register_user(client):
    """
    Successfully register a new user.
    """

    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "register@finora.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Test User"

    assert data["email"] == ("register@finora.com")

    # Sensitive password data must never
    # appear in the response.
    assert "password" not in data
    assert "password_hash" not in data


# ============================================================
# REGISTER — DUPLICATE EMAIL
# ============================================================


def test_register_duplicate_email(client):
    """
    Registering the same email twice must fail.
    """

    payload = {
        "name": "Duplicate User",
        "email": "duplicate@finora.com",
        "password": "Password123!",
    }

    first_response = client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert second_response.status_code == 400


# ============================================================
# REGISTER — INVALID EMAIL
# ============================================================


def test_register_invalid_email(client):
    """
    Invalid email format must be rejected by the
    request schema before reaching the service.
    """

    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Invalid Email",
            "email": "not-an-email",
            "password": "Password123!",
        },
    )

    assert response.status_code == 422


# ============================================================
# REGISTER — MISSING REQUIRED FIELD
# ============================================================


def test_register_missing_email(client):
    """
    Email is required during registration.
    """

    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Missing Email",
            "password": "Password123!",
        },
    )

    assert response.status_code == 422


# ============================================================
# REGISTER — MISSING PASSWORD
# ============================================================


def test_register_missing_password(client):
    """
    Password is required during registration.
    """

    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Missing Password",
            "email": "missing-password@finora.com",
        },
    )

    assert response.status_code == 422


# ============================================================
# LOGIN — SUCCESS
# ============================================================


def test_login_user(client):
    """
    Successfully authenticate a registered user.

    OAuth2PasswordRequestForm requires form data using:
        username
        password
    """

    registration_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login User",
            "email": "login@finora.com",
            "password": "Password123!",
        },
    )

    assert registration_response.status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@finora.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data

    assert data["token_type"] == "bearer"

    assert isinstance(
        data["access_token"],
        str,
    )

    assert data["access_token"]


# ============================================================
# LOGIN — WRONG PASSWORD
# ============================================================


def test_login_wrong_password(client):
    """
    Incorrect password must be rejected.
    """

    registration_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Wrong Password",
            "email": "wrong-password@finora.com",
            "password": "Password123!",
        },
    )

    assert registration_response.status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "wrong-password@finora.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


# ============================================================
# LOGIN — NONEXISTENT USER
# ============================================================


def test_login_nonexistent_user(client):
    """
    Authentication must fail when the email does not exist.
    """

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "does-not-exist@finora.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 401


# ============================================================
# LOGIN — MISSING FORM DATA
# ============================================================


def test_login_missing_password(client):
    """
    OAuth2PasswordRequestForm requires a password field.
    """

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@finora.com",
        },
    )

    assert response.status_code == 422


# ============================================================
# CURRENT USER — SUCCESS
# ============================================================


def test_get_current_user(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user should be returned by /me.
    """

    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == test_user.id

    assert data["name"] == test_user.name

    assert data["email"] == test_user.email

    assert "password" not in data
    assert "password_hash" not in data


# ============================================================
# CURRENT USER — NO TOKEN
# ============================================================


def test_get_current_user_without_token(client):
    """
    /me must reject unauthenticated requests.
    """

    response = client.get(
        "/api/v1/auth/me",
    )

    assert response.status_code == 401


# ============================================================
# CURRENT USER — INVALID TOKEN
# ============================================================


def test_get_current_user_with_invalid_token(
    client,
):
    """
    /me must reject an invalid JWT.
    """

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == 401
