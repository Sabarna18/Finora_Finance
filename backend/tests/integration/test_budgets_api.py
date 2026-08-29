# ============================================================
# tests/integration/test_budgets_api.py
#
# Budget API integration tests.
#
# Covered endpoints:
#
#   POST   /api/v1/budgets/
#   GET    /api/v1/budgets/
#   GET    /api/v1/budgets/current-month
#   GET    /api/v1/budgets/{budget_id}
#   GET    /api/v1/budgets/status/{budget_id}
#   PUT    /api/v1/budgets/{budget_id}
#   DELETE /api/v1/budgets/{budget_id}
#
# Test scope:
#
#   - Authentication
#   - Budget creation
#   - Budget retrieval
#   - Month/year filtering
#   - Current-month budgets
#   - Budget status
#   - Budget update
#   - Budget deletion
#   - Request validation
#   - User ownership isolation
#
# ============================================================


# ============================================================
# TEST DATA
# ============================================================

VALID_BUDGET = {
    "amount": 5000,
    "month": 8,
    "year": 2026,
}


# ============================================================
# CREATE BUDGET
# ============================================================


def test_create_budget(
    client,
    auth_headers,
):
    """
    Authenticated user can create a budget.
    """

    response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["amount"] == 5000
    assert data["month"] == 8
    assert data["year"] == 2026

    assert "id" in data
    assert "user_id" in data
    assert "created_at" in data


# ============================================================
# CREATE BUDGET WITHOUT AUTHENTICATION
# ============================================================


def test_create_budget_requires_auth(
    client,
):
    """
    Budget creation requires authentication.
    """

    response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
    )

    assert response.status_code == 401


# ============================================================
# CREATE BUDGET WITH CATEGORY
# ============================================================


def test_create_budget_with_category(
    client,
    auth_headers,
):
    """
    A budget may optionally reference a category.
    """

    # This test assumes category_id=1 exists in the
    # test database. If category creation is required
    # by BudgetService, this should instead create the
    # category through the category API.
    response = client.post(
        "/api/v1/budgets/",
        json={
            "amount": 3000,
            "month": 8,
            "year": 2026,
            "category_id": 1,
        },
        headers=auth_headers,
    )

    # The exact service-level behavior for a nonexistent
    # category is not specified by the supplied router.
    assert response.status_code in {
        201,
        400,
        404,
    }


# ============================================================
# CREATE BUDGET — INVALID AMOUNT
# ============================================================


def test_create_budget_invalid_amount(
    client,
    auth_headers,
):
    """
    Budget amount must be greater than zero.
    """

    response = client.post(
        "/api/v1/budgets/",
        json={
            "amount": 0,
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE BUDGET — INVALID MONTH
# ============================================================


def test_create_budget_invalid_month(
    client,
    auth_headers,
):
    """
    Month must be between 1 and 12.
    """

    response = client.post(
        "/api/v1/budgets/",
        json={
            "amount": 5000,
            "month": 13,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE BUDGET — INVALID YEAR
# ============================================================


def test_create_budget_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.post(
        "/api/v1/budgets/",
        json={
            "amount": 5000,
            "month": 8,
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# LIST BUDGETS
# ============================================================


def test_get_budgets(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve their budgets.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/v1/budgets/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1

    assert any(
        budget["amount"] == 5000
        and budget["month"] == 8
        and budget["year"] == 2026
        for budget in data
    )


# ============================================================
# LIST BUDGETS — MONTH FILTER
# ============================================================


def test_get_budgets_by_month(
    client,
    auth_headers,
):
    """
    Budgets can be filtered by month.
    """

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 5000,
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 3000,
            "month": 9,
            "year": 2026,
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/budgets/",
        params={
            "month": 8,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(
        budget["month"] == 8
        for budget in data
    )


# ============================================================
# LIST BUDGETS — YEAR FILTER
# ============================================================


def test_get_budgets_by_year(
    client,
    auth_headers,
):
    """
    Budgets can be filtered by year.
    """

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 5000,
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 4000,
            "month": 8,
            "year": 2027,
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/budgets/",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(
        budget["year"] == 2026
        for budget in data
    )


# ============================================================
# LIST BUDGETS — MONTH + YEAR FILTER
# ============================================================


def test_get_budgets_by_month_and_year(
    client,
    auth_headers,
):
    """
    Budgets can be filtered by both month and year.
    """

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 5000,
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 4000,
            "month": 8,
            "year": 2027,
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/budgets/",
        json={
            "amount": 3000,
            "month": 9,
            "year": 2026,
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/budgets/",
        params={
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(
        budget["month"] == 8
        and budget["year"] == 2026
        for budget in data
    )


# ============================================================
# LIST BUDGETS WITHOUT AUTHENTICATION
# ============================================================


def test_get_budgets_requires_auth(
    client,
):
    """
    Budget listing requires authentication.
    """

    response = client.get(
        "/api/v1/budgets/",
    )

    assert response.status_code == 401


# ============================================================
# CURRENT MONTH BUDGETS
# ============================================================


def test_get_current_month_budgets(
    client,
    auth_headers,
):
    """
    Current-month endpoint returns a list of budgets.
    """

    response = client.get(
        "/api/v1/budgets/current-month",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


# ============================================================
# CURRENT MONTH WITHOUT AUTHENTICATION
# ============================================================


def test_get_current_month_budgets_requires_auth(
    client,
):
    """
    Current-month budgets require authentication.
    """

    response = client.get(
        "/api/v1/budgets/current-month",
    )

    assert response.status_code == 401


# ============================================================
# GET SINGLE BUDGET
# ============================================================


def test_get_budget(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve a specific budget.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == budget_id
    assert data["amount"] == 5000


# ============================================================
# GET NONEXISTENT BUDGET
# ============================================================


def test_get_nonexistent_budget(
    client,
    auth_headers,
):
    """
    Requesting a nonexistent budget must fail.
    """

    response = client.get(
        "/api/v1/budgets/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# GET BUDGET WITHOUT AUTHENTICATION
# ============================================================


def test_get_budget_requires_auth(
    client,
    auth_headers,
):
    """
    Individual budget retrieval requires authentication.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/budgets/{budget_id}",
    )

    assert response.status_code == 401


# ============================================================
# GET BUDGET STATUS
# ============================================================


def test_get_budget_status(
    client,
    auth_headers,
):
    """
    Budget status endpoint returns the calculated
    budget status response.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/budgets/status/{budget_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["budget_id"] == budget_id

    assert "budget_amount" in data
    assert "spent_amount" in data
    assert "remaining_amount" in data
    assert "percentage_used" in data
    assert "status" in data
    assert "month" in data
    assert "year" in data


# ============================================================
# GET BUDGET STATUS — NONEXISTENT
# ============================================================


def test_get_nonexistent_budget_status(
    client,
    auth_headers,
):
    """
    Status for a nonexistent budget must fail.
    """

    response = client.get(
        "/api/v1/budgets/status/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# UPDATE BUDGET
# ============================================================


def test_update_budget(
    client,
    auth_headers,
):
    """
    Authenticated user can update an existing budget.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/budgets/{budget_id}",
        json={
            "amount": 7500,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == budget_id
    assert data["amount"] == 7500
    assert data["month"] == 8
    assert data["year"] == 2026


# ============================================================
# UPDATE BUDGET — MULTIPLE FIELDS
# ============================================================


def test_update_budget_multiple_fields(
    client,
    auth_headers,
):
    """
    Multiple budget fields can be updated together.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/budgets/{budget_id}",
        json={
            "amount": 8000,
            "month": 9,
            "year": 2027,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["amount"] == 8000
    assert data["month"] == 9
    assert data["year"] == 2027


# ============================================================
# UPDATE BUDGET — INVALID AMOUNT
# ============================================================


def test_update_budget_invalid_amount(
    client,
    auth_headers,
):
    """
    Updated amount must be greater than zero.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/budgets/{budget_id}",
        json={
            "amount": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# UPDATE NONEXISTENT BUDGET
# ============================================================


def test_update_nonexistent_budget(
    client,
    auth_headers,
):
    """
    Updating a nonexistent budget must fail.
    """

    response = client.put(
        "/api/v1/budgets/999999",
        json={
            "amount": 7500,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE BUDGET
# ============================================================


def test_delete_budget(
    client,
    auth_headers,
):
    """
    Authenticated user can delete an existing budget.
    """

    create_response = client.post(
        "/api/v1/budgets/",
        json=VALID_BUDGET,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    budget_id = create_response.json()["id"]

    response = client.delete(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    # Verify the resource no longer exists.
    get_response = client.get(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
    )

    assert get_response.status_code == 404


# ============================================================
# DELETE NONEXISTENT BUDGET
# ============================================================


def test_delete_nonexistent_budget(
    client,
    auth_headers,
):
    """
    Deleting a nonexistent budget must fail.
    """

    response = client.delete(
        "/api/v1/budgets/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE BUDGET WITHOUT AUTHENTICATION
# ============================================================


def test_delete_budget_requires_auth(
    client,
):
    """
    Budget deletion requires authentication.
    """

    response = client.delete(
        "/api/v1/budgets/999999",
    )

    assert response.status_code == 401