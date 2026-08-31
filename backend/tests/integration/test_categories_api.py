# ============================================================
# tests/integration/test_categories_api.py
#
# Category API integration tests.
#
# Covered endpoints:
#
#   POST   /api/v1/categories/
#   GET    /api/v1/categories/
#   GET    /api/v1/categories/{category_id}
#   PUT    /api/v1/categories/{category_id}
#   DELETE /api/v1/categories/{category_id}
#
# Test scope:
#
#   - Authentication
#   - Category creation
#   - Category retrieval
#   - Category listing
#   - Category type filtering
#   - Category update
#   - Category deletion
#   - Request validation
#   - Nonexistent resources
#
# ============================================================


# ============================================================
# TEST DATA
# ============================================================

VALID_INCOME_CATEGORY = {
    "name": "Salary",
    "type": "income",
}

VALID_EXPENSE_CATEGORY = {
    "name": "Food",
    "type": "expense",
}


# ============================================================
# CREATE CATEGORY
# ============================================================


def test_create_category(
    client,
    auth_headers,
):
    """
    Authenticated user can create an income category.
    """

    response = client.post(
        "/api/v1/categories/",
        json=VALID_INCOME_CATEGORY,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Salary"
    assert data["type"] == "income"

    assert "id" in data
    assert "user_id" in data
    assert "created_at" in data


# ============================================================
# CREATE EXPENSE CATEGORY
# ============================================================


def test_create_expense_category(
    client,
    auth_headers,
):
    """
    Authenticated user can create an expense category.
    """

    response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Food"
    assert data["type"] == "expense"


# ============================================================
# CREATE CATEGORY WITHOUT AUTHENTICATION
# ============================================================


def test_create_category_requires_auth(
    client,
):
    """
    Category creation requires authentication.
    """

    response = client.post(
        "/api/v1/categories/",
        json=VALID_INCOME_CATEGORY,
    )

    assert response.status_code == 401


# ============================================================
# CREATE CATEGORY — INVALID TYPE
# ============================================================


def test_create_category_invalid_type(
    client,
    auth_headers,
):
    """
    Category type must be one of the TransactionType enum values.
    """

    response = client.post(
        "/api/v1/categories/",
        json={
            "name": "Invalid",
            "type": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE CATEGORY — MISSING NAME
# ============================================================


def test_create_category_missing_name(
    client,
    auth_headers,
):
    """
    Category name is required.
    """

    response = client.post(
        "/api/v1/categories/",
        json={
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE CATEGORY — MISSING TYPE
# ============================================================


def test_create_category_missing_type(
    client,
    auth_headers,
):
    """
    Category transaction type is required.
    """

    response = client.post(
        "/api/v1/categories/",
        json={
            "name": "Food",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE CATEGORY — NAME TOO LONG
# ============================================================


def test_create_category_name_too_long(
    client,
    auth_headers,
):
    """
    Category name cannot exceed the schema maximum length.
    """

    response = client.post(
        "/api/v1/categories/",
        json={
            "name": "A" * 101,
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# LIST CATEGORIES
# ============================================================


def test_get_categories(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve their categories.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/v1/categories/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert any(
        category["name"] == "Food" and category["type"] == "expense"
        for category in data
    )


# ============================================================
# LIST CATEGORIES WITHOUT AUTHENTICATION
# ============================================================


def test_get_categories_requires_auth(
    client,
):
    """
    Category listing requires authentication.
    """

    response = client.get(
        "/api/v1/categories/",
    )

    assert response.status_code == 401


# ============================================================
# FILTER CATEGORIES BY TYPE — INCOME
# ============================================================


def test_get_income_categories(
    client,
    auth_headers,
):
    """
    Categories can be filtered by type=income.
    """

    client.post(
        "/api/v1/categories/",
        json={
            "name": "Salary",
            "type": "income",
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/categories/",
        json={
            "name": "Food",
            "type": "expense",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/categories/",
        params={
            "type": "income",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert all(category["type"] == "income" for category in data)


# ============================================================
# FILTER CATEGORIES BY TYPE — EXPENSE
# ============================================================


def test_get_expense_categories(
    client,
    auth_headers,
):
    """
    Categories can be filtered by type=expense.
    """

    client.post(
        "/api/v1/categories/",
        json={
            "name": "Salary",
            "type": "income",
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/categories/",
        json={
            "name": "Food",
            "type": "expense",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/categories/",
        params={
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert all(category["type"] == "expense" for category in data)


# ============================================================
# GET SINGLE CATEGORY
# ============================================================


def test_get_category(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve a specific category.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/categories/{category_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == category_id
    assert data["name"] == "Food"
    assert data["type"] == "expense"


# ============================================================
# GET CATEGORY WITHOUT AUTHENTICATION
# ============================================================


def test_get_category_requires_auth(
    client,
    auth_headers,
):
    """
    Individual category retrieval requires authentication.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/categories/{category_id}",
    )

    assert response.status_code == 401


# ============================================================
# GET NONEXISTENT CATEGORY
# ============================================================


def test_get_nonexistent_category(
    client,
    auth_headers,
):
    """
    Requesting a nonexistent category must fail.
    """

    response = client.get(
        "/api/v1/categories/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# UPDATE CATEGORY
# ============================================================


def test_update_category(
    client,
    auth_headers,
):
    """
    Authenticated user can update an existing category.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json={
            "name": "Old Name",
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/categories/{category_id}",
        json={
            "name": "New Name",
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == category_id
    assert data["name"] == "New Name"
    assert data["type"] == "expense"


# ============================================================
# UPDATE CATEGORY TYPE
# ============================================================


def test_update_category_type(
    client,
    auth_headers,
):
    """
    Category type can be changed through the update endpoint.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json={
            "name": "Adjustable Category",
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/categories/{category_id}",
        json={
            "name": "Adjustable Category",
            "type": "income",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["type"] == "income"


# ============================================================
# UPDATE CATEGORY — INVALID TYPE
# ============================================================


def test_update_category_invalid_type(
    client,
    auth_headers,
):
    """
    Invalid transaction type must be rejected.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/categories/{category_id}",
        json={
            "name": "Food",
            "type": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# UPDATE NONEXISTENT CATEGORY
# ============================================================


def test_update_nonexistent_category(
    client,
    auth_headers,
):
    """
    Updating a nonexistent category must fail.
    """

    response = client.put(
        "/api/v1/categories/999999",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE CATEGORY
# ============================================================


def test_delete_category(
    client,
    auth_headers,
):
    """
    Authenticated user can delete an existing category.
    """

    create_response = client.post(
        "/api/v1/categories/",
        json=VALID_EXPENSE_CATEGORY,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    category_id = create_response.json()["id"]

    response = client.delete(
        f"/api/v1/categories/{category_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    get_response = client.get(
        f"/api/v1/categories/{category_id}",
        headers=auth_headers,
    )

    assert get_response.status_code == 404


# ============================================================
# DELETE NONEXISTENT CATEGORY
# ============================================================


def test_delete_nonexistent_category(
    client,
    auth_headers,
):
    """
    Deleting a nonexistent category must fail.
    """

    response = client.delete(
        "/api/v1/categories/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE CATEGORY WITHOUT AUTHENTICATION
# ============================================================


def test_delete_category_requires_auth(
    client,
):
    """
    Category deletion requires authentication.
    """

    response = client.delete(
        "/api/v1/categories/999999",
    )

    assert response.status_code == 401
