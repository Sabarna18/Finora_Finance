# ============================================================
# tests/integration/test_users_api.py
#
# Users + Health API integration tests.
#
# Covered endpoints:
#
# HEALTH
#   GET /api/v1/health
#
# USERS
#   GET    /api/v1/users/me
#   PATCH  /api/v1/users/me
#   PATCH  /api/v1/users/change-password
#   DELETE /api/v1/users/me
#
# Test scope:
#
#   - Health endpoint
#   - Authentication requirements
#   - Profile retrieval
#   - Profile updates
#   - Email validation
#   - Password validation
#   - Password change
#   - Wrong current password
#   - Account deactivation
#   - Sensitive data protection
#
# ============================================================


# ============================================================
# HEALTH
# ============================================================


def test_health_check(client):
    """
    Health endpoint must be publicly accessible and report
    that the API is healthy.
    """

    response = client.get(
        "/api/v1/health",
    )

    assert response.status_code == 200

    data = response.json()

    assert data == {
        "status": "healthy",
        "service": "Finora API",
    }


# ============================================================
# HEALTH — NO AUTH REQUIRED
# ============================================================


def test_health_check_does_not_require_auth(client):
    """
    Health checks must remain accessible without authentication.

    This is important because Docker, Nginx, load balancers,
    and container monitoring systems may call this endpoint.
    """

    response = client.get(
        "/api/v1/health",
    )

    assert response.status_code == 200


# ============================================================
# PROFILE — GET
# ============================================================


def test_get_profile(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user can retrieve their own profile.
    """

    response = client.get(
        "/api/v1/users/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == test_user.id
    assert data["name"] == test_user.name
    assert data["email"] == test_user.email

    # Sensitive authentication data must never be exposed.
    assert "password" not in data
    assert "password_hash" not in data


# ============================================================
# PROFILE — AUTH REQUIRED
# ============================================================


def test_get_profile_requires_auth(client):
    """
    Profile endpoint must reject unauthenticated requests.
    """

    response = client.get(
        "/api/v1/users/me",
    )

    assert response.status_code == 401


# ============================================================
# PROFILE — INVALID TOKEN
# ============================================================


def test_get_profile_invalid_token(client):
    """
    Invalid JWT must be rejected.
    """

    response = client.get(
        "/api/v1/users/me",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == 401


# ============================================================
# PROFILE — UPDATE NAME
# ============================================================


def test_update_profile_name(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user can update their name.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "name": "Updated User",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == test_user.id
    assert data["name"] == "Updated User"
    assert data["email"] == test_user.email

    assert "password" not in data
    assert "password_hash" not in data


# ============================================================
# PROFILE — UPDATE EMAIL
# ============================================================


def test_update_profile_email(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user can update their email.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "email": "updated@finora.com",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == test_user.id
    assert data["email"] == "updated@finora.com"


# ============================================================
# PROFILE — UPDATE NAME AND EMAIL
# ============================================================


def test_update_profile_name_and_email(
    client,
    test_user,
    auth_headers,
):
    """
    User can update multiple profile fields in one request.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "name": "Completely Updated User",
            "email": "completely.updated@finora.com",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Completely Updated User"
    assert data["email"] == "completely.updated@finora.com"


# ============================================================
# PROFILE — EMPTY UPDATE
# ============================================================


def test_update_profile_empty_payload(
    client,
    auth_headers,
):
    """
    UserUpdate contains optional fields, therefore an empty
    payload should be handled by the API without schema failure.

    The exact service behavior determines whether this is a
    successful no-op or another response.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={},
        headers=auth_headers,
    )

    assert response.status_code == 200


# ============================================================
# PROFILE — INVALID EMAIL
# ============================================================


def test_update_profile_invalid_email(
    client,
    auth_headers,
):
    """
    Invalid email format must be rejected by the request schema.

    This assumes the UserUpdate schema uses the same email
    validation introduced for UserCreate.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "email": "not-an-email",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# PROFILE — NAME TOO LONG
# ============================================================


def test_update_profile_name_too_long(
    client,
    auth_headers,
):
    """
    User name must respect the schema's max_length constraint.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "name": "A" * 101,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# PROFILE — EMAIL TOO LONG
# ============================================================


def test_update_profile_email_too_long(
    client,
    auth_headers,
):
    """
    Email must respect the schema's max_length constraint.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "email": ("a" * 140) + "@finora.com",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# PROFILE — AUTH REQUIRED FOR UPDATE
# ============================================================


def test_update_profile_requires_auth(client):
    """
    Profile updates require authentication.
    """

    response = client.patch(
        "/api/v1/users/me",
        json={
            "name": "Unauthorized Update",
        },
    )

    assert response.status_code == 401


# ============================================================
# CHANGE PASSWORD — SUCCESS
# ============================================================


def test_change_password(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user can change their password using the
    correct current password.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "NewPassword123!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200


# ============================================================
# CHANGE PASSWORD — WRONG CURRENT PASSWORD
# ============================================================


def test_change_password_wrong_current_password(
    client,
    auth_headers,
):
    """
    Password change must fail when the current password
    is incorrect.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword123!",
        },
        headers=auth_headers,
    )

    assert response.status_code in (400, 401)


# ============================================================
# CHANGE PASSWORD — MISSING CURRENT PASSWORD
# ============================================================


def test_change_password_missing_current_password(
    client,
    auth_headers,
):
    """
    Current password is required.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "new_password": "NewPassword123!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CHANGE PASSWORD — MISSING NEW PASSWORD
# ============================================================


def test_change_password_missing_new_password(
    client,
    auth_headers,
):
    """
    New password is required.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "current_password": "TestPassword123!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CHANGE PASSWORD — NEW PASSWORD TOO SHORT
# ============================================================


def test_change_password_new_password_too_short(
    client,
    auth_headers,
):
    """
    New password must contain at least six characters according
    to the PasswordChange schema.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "12345",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CHANGE PASSWORD — AUTH REQUIRED
# ============================================================


def test_change_password_requires_auth(client):
    """
    Password changes require authentication.
    """

    response = client.patch(
        "/api/v1/users/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 401


# ============================================================
# DEACTIVATE ACCOUNT
# ============================================================


def test_deactivate_account(
    client,
    test_user,
    auth_headers,
):
    """
    Authenticated user can deactivate their account.
    """

    response = client.delete(
        "/api/v1/users/me",
        headers=auth_headers,
    )

    assert response.status_code == 200


# ============================================================
# DEACTIVATE ACCOUNT — AUTH REQUIRED
# ============================================================


def test_deactivate_account_requires_auth(client):
    """
    Account deactivation requires authentication.
    """

    response = client.delete(
        "/api/v1/users/me",
    )

    assert response.status_code == 401


# ============================================================
# DEACTIVATE ACCOUNT — INVALID TOKEN
# ============================================================


def test_deactivate_account_invalid_token(client):
    """
    Invalid JWT must not allow account deactivation.
    """

    response = client.delete(
        "/api/v1/users/me",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == 401
