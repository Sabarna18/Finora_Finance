# ============================================================
# tests/integration/test_dashboard_api.py
#
# Dashboard API integration tests.
#
# Covered endpoints:
#
#   GET /api/v1/dashboard/summary
#   GET /api/v1/dashboard/monthly-trend
#   GET /api/v1/dashboard/category-breakdown
#   GET /api/v1/dashboard/status
#   GET /api/v1/dashboard/recent-transactions
#
# Test scope:
#
#   - Authentication
#   - Successful endpoint execution
#   - Query parameter validation
#   - Response JSON contract
#
# ============================================================


# ============================================================
# DASHBOARD SUMMARY
# ============================================================


def test_dashboard_summary(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve dashboard summary.
    """

    response = client.get(
        "/api/v1/dashboard/summary",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# DASHBOARD SUMMARY — MONTH/YEAR FILTER
# ============================================================


def test_dashboard_summary_with_filters(
    client,
    auth_headers,
):
    """
    Dashboard summary accepts month and year filters.
    """

    response = client.get(
        "/api/v1/dashboard/summary",
        params={
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# DASHBOARD SUMMARY — INVALID MONTH
# ============================================================


def test_dashboard_summary_invalid_month(
    client,
    auth_headers,
):
    """
    Month must be between 1 and 12.
    """

    response = client.get(
        "/api/v1/dashboard/summary",
        params={
            "month": 13,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# DASHBOARD SUMMARY — INVALID YEAR
# ============================================================


def test_dashboard_summary_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/dashboard/summary",
        params={
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# DASHBOARD SUMMARY — NO AUTH
# ============================================================


def test_dashboard_summary_requires_auth(
    client,
):
    """
    Dashboard summary requires authentication.
    """

    response = client.get(
        "/api/v1/dashboard/summary",
    )

    assert response.status_code == 401


# ============================================================
# MONTHLY TREND
# ============================================================


def test_dashboard_monthly_trend(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve monthly trend data.
    """

    response = client.get(
        "/api/v1/dashboard/monthly-trend",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# MONTHLY TREND — YEAR FILTER
# ============================================================


def test_dashboard_monthly_trend_with_year(
    client,
    auth_headers,
):
    """
    Monthly trend accepts an optional year.
    """

    response = client.get(
        "/api/v1/dashboard/monthly-trend",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# MONTHLY TREND — INVALID YEAR
# ============================================================


def test_dashboard_monthly_trend_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/dashboard/monthly-trend",
        params={
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# MONTHLY TREND — NO AUTH
# ============================================================


def test_dashboard_monthly_trend_requires_auth(
    client,
):
    """
    Monthly trend requires authentication.
    """

    response = client.get(
        "/api/v1/dashboard/monthly-trend",
    )

    assert response.status_code == 401


# ============================================================
# CATEGORY BREAKDOWN
# ============================================================


def test_dashboard_category_breakdown(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve category breakdown.
    """

    response = client.get(
        "/api/v1/dashboard/category-breakdown",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# CATEGORY BREAKDOWN — FILTERS
# ============================================================


def test_dashboard_category_breakdown_with_filters(
    client,
    auth_headers,
):
    """
    Category breakdown accepts month and year.
    """

    response = client.get(
        "/api/v1/dashboard/category-breakdown",
        params={
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# CATEGORY BREAKDOWN — INVALID MONTH
# ============================================================


def test_dashboard_category_breakdown_invalid_month(
    client,
    auth_headers,
):
    """
    Month must be between 1 and 12.
    """

    response = client.get(
        "/api/v1/dashboard/category-breakdown",
        params={
            "month": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY BREAKDOWN — INVALID YEAR
# ============================================================


def test_dashboard_category_breakdown_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/dashboard/category-breakdown",
        params={
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY BREAKDOWN — NO AUTH
# ============================================================


def test_dashboard_category_breakdown_requires_auth(
    client,
):
    """
    Category breakdown requires authentication.
    """

    response = client.get(
        "/api/v1/dashboard/category-breakdown",
    )

    assert response.status_code == 401


# ============================================================
# BUDGET STATUS DASHBOARD
# ============================================================


def test_dashboard_budget_status(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve budget statuses.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# BUDGET STATUS — MISSING MONTH
# ============================================================


def test_dashboard_budget_status_missing_month(
    client,
    auth_headers,
):
    """
    Month is required by the dashboard status endpoint.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET STATUS — MISSING YEAR
# ============================================================


def test_dashboard_budget_status_missing_year(
    client,
    auth_headers,
):
    """
    Year is required by the dashboard status endpoint.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "month": 8,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET STATUS — INVALID MONTH
# ============================================================


def test_dashboard_budget_status_invalid_month(
    client,
    auth_headers,
):
    """
    Router declares month as int but does not constrain it
    with ge/le, so this test only verifies that a non-integer
    value is rejected.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "month": "invalid",
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET STATUS — INVALID YEAR TYPE
# ============================================================


def test_dashboard_budget_status_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be an integer.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "month": 8,
            "year": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET STATUS — NO AUTH
# ============================================================


def test_dashboard_budget_status_requires_auth(
    client,
):
    """
    Dashboard budget status requires authentication.
    """

    response = client.get(
        "/api/v1/dashboard/status",
        params={
            "month": 8,
            "year": 2026,
        },
    )

    assert response.status_code == 401


# ============================================================
# RECENT TRANSACTIONS
# ============================================================


def test_dashboard_recent_transactions(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve recent transactions.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# RECENT TRANSACTIONS — CUSTOM LIMIT
# ============================================================


def test_dashboard_recent_transactions_with_limit(
    client,
    auth_headers,
):
    """
    Recent transactions accepts a configurable limit.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
        params={
            "limit": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# RECENT TRANSACTIONS — MINIMUM LIMIT
# ============================================================


def test_dashboard_recent_transactions_min_limit(
    client,
    auth_headers,
):
    """
    Limit must be >= 1.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
        params={
            "limit": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# RECENT TRANSACTIONS — MAXIMUM LIMIT
# ============================================================


def test_dashboard_recent_transactions_max_limit(
    client,
    auth_headers,
):
    """
    Limit must be <= 20.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
        params={
            "limit": 21,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# RECENT TRANSACTIONS — INVALID LIMIT TYPE
# ============================================================


def test_dashboard_recent_transactions_invalid_limit(
    client,
    auth_headers,
):
    """
    Limit must be an integer.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
        params={
            "limit": "invalid",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# RECENT TRANSACTIONS — NO AUTH
# ============================================================


def test_dashboard_recent_transactions_requires_auth(
    client,
):
    """
    Recent transactions requires authentication.
    """

    response = client.get(
        "/api/v1/dashboard/recent-transactions",
    )

    assert response.status_code == 401