# ============================================================
# tests/integration/test_transactions_api.py
#
# Transaction API integration tests.
#
# Covered endpoints:
#
#   POST   /api/v1/transactions
#   GET    /api/v1/transactions
#   GET    /api/v1/transactions/{transaction_id}
#   PATCH  /api/v1/transactions/{transaction_id}
#   DELETE /api/v1/transactions/{transaction_id}
#
# Test scope:
#
#   - Authentication
#   - Transaction creation
#   - Transaction retrieval
#   - Transaction listing
#   - Pagination
#   - Type filtering
#   - Search
#   - Category filtering
#   - Month/year filtering
#   - Week filtering
#   - Sorting
#   - Transaction update
#   - Transaction deletion
#   - Request validation
#   - Nonexistent resources
#
# ============================================================


# ============================================================
# TEST DATA
# ============================================================

VALID_EXPENSE_TRANSACTION = {
    "amount": 500.00,
    "type": "expense",
    "description": "Grocery shopping",
    "date": "2026-08-15",
}

VALID_INCOME_TRANSACTION = {
    "amount": 50000.00,
    "type": "income",
    "description": "Monthly salary",
    "date": "2026-08-01",
}


# ============================================================
# CREATE — EXPENSE
# ============================================================


def test_create_expense_transaction(
    client,
    auth_headers,
):
    """
    Authenticated user can create an expense transaction.
    """

    response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["amount"] == 500.00
    assert data["type"] == "expense"
    assert data["description"] == "Grocery shopping"
    assert data["date"] == "2026-08-15"

    assert "id" in data
    assert "user_id" in data
    assert "created_at" in data


# ============================================================
# CREATE — INCOME
# ============================================================


def test_create_income_transaction(
    client,
    auth_headers,
):
    """
    Authenticated user can create an income transaction.
    """

    response = client.post(
        "/api/v1/transactions",
        json=VALID_INCOME_TRANSACTION,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["amount"] == 50000.00
    assert data["type"] == "income"


# ============================================================
# CREATE — AUTHENTICATION REQUIRED
# ============================================================


def test_create_transaction_requires_auth(
    client,
):
    """
    Transaction creation requires authentication.
    """

    response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
    )

    assert response.status_code == 401


# ============================================================
# CREATE — INVALID AMOUNT
# ============================================================


def test_create_transaction_invalid_amount(
    client,
    auth_headers,
):
    """
    Transaction amount must be greater than zero.
    """

    response = client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "amount": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — NEGATIVE AMOUNT
# ============================================================


def test_create_transaction_negative_amount(
    client,
    auth_headers,
):
    """
    Negative transaction amounts must be rejected.
    """

    response = client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "amount": -100,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — INVALID TYPE
# ============================================================


def test_create_transaction_invalid_type(
    client,
    auth_headers,
):
    """
    Transaction type must be income or expense.
    """

    response = client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "type": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — MISSING REQUIRED FIELD
# ============================================================


def test_create_transaction_missing_amount(
    client,
    auth_headers,
):
    """
    Amount is required.
    """

    payload = {
        "type": "expense",
        "description": "Missing amount",
        "date": "2026-08-15",
    }

    response = client.post(
        "/api/v1/transactions",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — MISSING TYPE
# ============================================================


def test_create_transaction_missing_type(
    client,
    auth_headers,
):
    """
    Transaction type is required.
    """

    payload = {
        "amount": 100,
        "description": "Missing type",
        "date": "2026-08-15",
    }

    response = client.post(
        "/api/v1/transactions",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — MISSING DATE
# ============================================================


def test_create_transaction_missing_date(
    client,
    auth_headers,
):
    """
    Transaction date is required.
    """

    payload = {
        "amount": 100,
        "type": "expense",
        "description": "Missing date",
    }

    response = client.post(
        "/api/v1/transactions",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CREATE — INVALID DATE
# ============================================================


def test_create_transaction_invalid_date(
    client,
    auth_headers,
):
    """
    Invalid date format must be rejected.
    """

    response = client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "date": "not-a-date",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# LIST TRANSACTIONS
# ============================================================


def test_list_transactions(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve transactions.
    """

    client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


# ============================================================
# LIST — AUTH REQUIRED
# ============================================================


def test_list_transactions_requires_auth(
    client,
):
    """
    Transaction listing requires authentication.
    """

    response = client.get(
        "/api/v1/transactions",
    )

    assert response.status_code == 401


# ============================================================
# LIST — PAGINATION
# ============================================================


def test_list_transactions_pagination(
    client,
    auth_headers,
):
    """
    Page and limit parameters are accepted.
    """

    for index in range(3):
        client.post(
            "/api/v1/transactions",
            json={
                "amount": 100 + index,
                "type": "expense",
                "description": f"Transaction {index}",
                "date": "2026-08-15",
            },
            headers=auth_headers,
        )

    response = client.get(
        "/api/v1/transactions",
        params={
            "page": 1,
            "limit": 2,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) <= 2


# ============================================================
# LIST — INVALID PAGE
# ============================================================


def test_list_transactions_invalid_page(
    client,
    auth_headers,
):
    """
    Page must be >= 1.
    """

    response = client.get(
        "/api/v1/transactions",
        params={
            "page": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# LIST — INVALID LIMIT
# ============================================================


def test_list_transactions_invalid_limit(
    client,
    auth_headers,
):
    """
    Limit must be between 1 and 100.
    """

    response = client.get(
        "/api/v1/transactions",
        params={
            "limit": 101,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# LIST — TYPE FILTER
# ============================================================


def test_list_transactions_by_type(
    client,
    auth_headers,
):
    """
    Transactions can be filtered by type.
    """

    client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json=VALID_INCOME_TRANSACTION,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        params={
            "type": "expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(transaction["type"] == "expense" for transaction in data)


# ============================================================
# LIST — SEARCH
# ============================================================


def test_list_transactions_search(
    client,
    auth_headers,
):
    """
    Transaction description can be searched.
    """

    client.post(
        "/api/v1/transactions",
        json={
            "amount": 250,
            "type": "expense",
            "description": "Grocery shopping",
            "date": "2026-08-15",
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json={
            "amount": 100,
            "type": "expense",
            "description": "Electricity bill",
            "date": "2026-08-15",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        params={
            "search": "Grocery",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert any(transaction["description"] == "Grocery shopping" for transaction in data)


# ============================================================
# LIST — MONTH FILTER
# ============================================================


def test_list_transactions_by_month(
    client,
    auth_headers,
):
    """
    Transactions can be filtered by month.
    """

    client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "date": "2026-08-15",
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "date": "2026-09-15",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        params={
            "month": 8,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(transaction["date"].startswith("2026-08") for transaction in data)


# ============================================================
# LIST — YEAR FILTER
# ============================================================


def test_list_transactions_by_year(
    client,
    auth_headers,
):
    """
    Transactions can be filtered by year.
    """

    client.post(
        "/api/v1/transactions",
        json={
            **VALID_EXPENSE_TRANSACTION,
            "date": "2026-08-15",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert all(transaction["date"].startswith("2026-") for transaction in data)


# ============================================================
# LIST — WEEK FILTER
# ============================================================


def test_list_transactions_by_week(
    client,
    auth_headers,
):
    """
    Week filtering is accepted by the API.
    """

    response = client.get(
        "/api/v1/transactions",
        params={
            "week": 33,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ============================================================
# LIST — CATEGORY FILTER
# ============================================================


def test_list_transactions_by_category(
    client,
    auth_headers,
):
    """
    Category filtering is accepted by the API.

    This test uses category_id=1 only if the category exists.
    Otherwise the endpoint should simply return an empty list
    rather than fail.
    """

    response = client.get(
        "/api/v1/transactions",
        params={
            "category_id": 1,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ============================================================
# LIST — SORT
# ============================================================


def test_list_transactions_sort(
    client,
    auth_headers,
):
    """
    Sorting parameter is accepted.
    """

    client.post(
        "/api/v1/transactions",
        json={
            "amount": 100,
            "type": "expense",
            "description": "Older transaction",
            "date": "2026-08-01",
        },
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json={
            "amount": 200,
            "type": "expense",
            "description": "Newer transaction",
            "date": "2026-08-20",
        },
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/transactions",
        params={
            "sort": "date",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ============================================================
# GET SINGLE TRANSACTION
# ============================================================


def test_get_transaction(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve a transaction.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/transactions/{transaction_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == transaction_id
    assert data["amount"] == 500.00
    assert data["type"] == "expense"


# ============================================================
# GET SINGLE — NOT FOUND
# ============================================================


def test_get_nonexistent_transaction(
    client,
    auth_headers,
):
    """
    Nonexistent transaction must return 404.
    """

    response = client.get(
        "/api/v1/transactions/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# GET SINGLE — AUTH REQUIRED
# ============================================================


def test_get_transaction_requires_auth(
    client,
    auth_headers,
):
    """
    Individual transaction retrieval requires authentication.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/transactions/{transaction_id}",
    )

    assert response.status_code == 401


# ============================================================
# UPDATE TRANSACTION
# ============================================================


def test_update_transaction(
    client,
    auth_headers,
):
    """
    Authenticated user can update a transaction.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    assert create_response.status_code == 201

    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/transactions/{transaction_id}",
        json={
            "amount": 750,
            "description": "Updated grocery expense",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == transaction_id
    assert data["amount"] == 750
    assert data["description"] == "Updated grocery expense"


# ============================================================
# UPDATE — TYPE
# ============================================================


def test_update_transaction_type(
    client,
    auth_headers,
):
    """
    Transaction type can be updated.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/transactions/{transaction_id}",
        json={
            "type": "income",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    assert response.json()["type"] == "income"


# ============================================================
# UPDATE — DATE
# ============================================================


def test_update_transaction_date(
    client,
    auth_headers,
):
    """
    Transaction date can be updated.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/transactions/{transaction_id}",
        json={
            "date": "2026-08-20",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    assert response.json()["date"] == "2026-08-20"


# ============================================================
# UPDATE — INVALID AMOUNT
# ============================================================


def test_update_transaction_invalid_amount(
    client,
    auth_headers,
):
    """
    Updated amount must be greater than zero.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/transactions/{transaction_id}",
        json={
            "amount": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# UPDATE — INVALID TYPE
# ============================================================


def test_update_transaction_invalid_type(
    client,
    auth_headers,
):
    """
    Invalid transaction type must be rejected.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/transactions/{transaction_id}",
        json={
            "type": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# UPDATE — NONEXISTENT
# ============================================================


def test_update_nonexistent_transaction(
    client,
    auth_headers,
):
    """
    Updating a nonexistent transaction must fail.
    """

    response = client.patch(
        "/api/v1/transactions/999999",
        json={
            "amount": 500,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE TRANSACTION
# ============================================================


def test_delete_transaction(
    client,
    auth_headers,
):
    """
    Authenticated user can delete a transaction.
    """

    create_response = client.post(
        "/api/v1/transactions",
        json=VALID_EXPENSE_TRANSACTION,
        headers=auth_headers,
    )

    transaction_id = create_response.json()["id"]

    response = client.delete(
        f"/api/v1/transactions/{transaction_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    get_response = client.get(
        f"/api/v1/transactions/{transaction_id}",
        headers=auth_headers,
    )

    assert get_response.status_code == 404


# ============================================================
# DELETE — NOT FOUND
# ============================================================


def test_delete_nonexistent_transaction(
    client,
    auth_headers,
):
    """
    Deleting a nonexistent transaction must fail.
    """

    response = client.delete(
        "/api/v1/transactions/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404


# ============================================================
# DELETE — AUTH REQUIRED
# ============================================================


def test_delete_transaction_requires_auth(
    client,
):
    """
    Transaction deletion requires authentication.
    """

    response = client.delete(
        "/api/v1/transactions/999999",
    )

    assert response.status_code == 401
