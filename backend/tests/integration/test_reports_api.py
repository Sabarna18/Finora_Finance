# ============================================================
# tests/integration/test_reports_api.py
#
# Reports API integration tests.
#
# Covered endpoints:
#
#   GET /api/v1/reports/cash-flow
#   GET /api/v1/reports/category-analysis
#   GET /api/v1/reports/income-vs-expense
#   GET /api/v1/reports/budget-performance
#
# Test scope:
#
#   - Authentication
#   - Required parameters
#   - Parameter validation
#   - Report generation
#   - Known transaction data
#   - Known budget data
#
# ============================================================


# ============================================================
# TEST DATA
# ============================================================

REPORT_INCOME = {
    "amount": 50000,
    "type": "income",
    "description": "August salary",
    "date": "2026-08-01",
}

REPORT_EXPENSE = {
    "amount": 5000,
    "type": "expense",
    "description": "August groceries",
    "date": "2026-08-10",
}


# ============================================================
# CASH FLOW
# ============================================================


def test_cash_flow(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve cash-flow report.
    """

    client.post(
        "/api/v1/transactions",
        json=REPORT_INCOME,
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json=REPORT_EXPENSE,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/reports/cash-flow",
        params={
            "start_date": "2026-08-01T00:00:00",
            "end_date": "2026-08-31T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# CASH FLOW — AUTH REQUIRED
# ============================================================


def test_cash_flow_requires_auth(
    client,
):
    """
    Cash-flow report requires authentication.
    """

    response = client.get(
        "/api/v1/reports/cash-flow",
        params={
            "start_date": "2026-08-01T00:00:00",
            "end_date": "2026-08-31T23:59:59",
        },
    )

    assert response.status_code == 401


# ============================================================
# CASH FLOW — MISSING START DATE
# ============================================================


def test_cash_flow_missing_start_date(
    client,
    auth_headers,
):
    """
    Start date is required.
    """

    response = client.get(
        "/api/v1/reports/cash-flow",
        params={
            "end_date": "2026-08-31T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CASH FLOW — MISSING END DATE
# ============================================================


def test_cash_flow_missing_end_date(
    client,
    auth_headers,
):
    """
    End date is required.
    """

    response = client.get(
        "/api/v1/reports/cash-flow",
        params={
            "start_date": "2026-08-01T00:00:00",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CASH FLOW — INVALID DATE
# ============================================================


def test_cash_flow_invalid_date(
    client,
    auth_headers,
):
    """
    Invalid datetime values must be rejected.
    """

    response = client.get(
        "/api/v1/reports/cash-flow",
        params={
            "start_date": "invalid-date",
            "end_date": "2026-08-31T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY ANALYSIS
# ============================================================


def test_category_analysis(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve category analysis.
    """

    client.post(
        "/api/v1/transactions",
        json=REPORT_EXPENSE,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/reports/category-analysis",
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
# CATEGORY ANALYSIS — AUTH REQUIRED
# ============================================================


def test_category_analysis_requires_auth(
    client,
):
    """
    Category analysis requires authentication.
    """

    response = client.get(
        "/api/v1/reports/category-analysis",
        params={
            "month": 8,
            "year": 2026,
        },
    )

    assert response.status_code == 401


# ============================================================
# CATEGORY ANALYSIS — MISSING MONTH
# ============================================================


def test_category_analysis_missing_month(
    client,
    auth_headers,
):
    """
    Month is required.
    """

    response = client.get(
        "/api/v1/reports/category-analysis",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY ANALYSIS — MISSING YEAR
# ============================================================


def test_category_analysis_missing_year(
    client,
    auth_headers,
):
    """
    Year is required.
    """

    response = client.get(
        "/api/v1/reports/category-analysis",
        params={
            "month": 8,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY ANALYSIS — INVALID MONTH
# ============================================================


def test_category_analysis_invalid_month(
    client,
    auth_headers,
):
    """
    Month must be between 1 and 12.
    """

    response = client.get(
        "/api/v1/reports/category-analysis",
        params={
            "month": 13,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# CATEGORY ANALYSIS — INVALID YEAR
# ============================================================


def test_category_analysis_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/reports/category-analysis",
        params={
            "month": 8,
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# INCOME VS EXPENSE
# ============================================================


def test_income_vs_expense(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve income-vs-expense trend.
    """

    client.post(
        "/api/v1/transactions",
        json=REPORT_INCOME,
        headers=auth_headers,
    )

    client.post(
        "/api/v1/transactions",
        json=REPORT_EXPENSE,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/reports/income-vs-expense",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (dict, list))


# ============================================================
# INCOME VS EXPENSE — AUTH REQUIRED
# ============================================================


def test_income_vs_expense_requires_auth(
    client,
):
    """
    Income-vs-expense report requires authentication.
    """

    response = client.get(
        "/api/v1/reports/income-vs-expense",
        params={
            "year": 2026,
        },
    )

    assert response.status_code == 401


# ============================================================
# INCOME VS EXPENSE — MISSING YEAR
# ============================================================


def test_income_vs_expense_missing_year(
    client,
    auth_headers,
):
    """
    Year is required.
    """

    response = client.get(
        "/api/v1/reports/income-vs-expense",
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# INCOME VS EXPENSE — INVALID YEAR
# ============================================================


def test_income_vs_expense_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/reports/income-vs-expense",
        params={
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET PERFORMANCE
# ============================================================


def test_budget_performance(
    client,
    auth_headers,
):
    """
    Authenticated user can retrieve budget performance.
    """

    budget_response = client.post(
        "/api/v1/budgets/",
        json={
            "amount": 10000,
            "month": 8,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert budget_response.status_code == 201

    client.post(
        "/api/v1/transactions",
        json=REPORT_EXPENSE,
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/reports/budget-performance",
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
# BUDGET PERFORMANCE — AUTH REQUIRED
# ============================================================


def test_budget_performance_requires_auth(
    client,
):
    """
    Budget performance requires authentication.
    """

    response = client.get(
        "/api/v1/reports/budget-performance",
        params={
            "month": 8,
            "year": 2026,
        },
    )

    assert response.status_code == 401


# ============================================================
# BUDGET PERFORMANCE — MISSING MONTH
# ============================================================


def test_budget_performance_missing_month(
    client,
    auth_headers,
):
    """
    Month is required.
    """

    response = client.get(
        "/api/v1/reports/budget-performance",
        params={
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET PERFORMANCE — MISSING YEAR
# ============================================================


def test_budget_performance_missing_year(
    client,
    auth_headers,
):
    """
    Year is required.
    """

    response = client.get(
        "/api/v1/reports/budget-performance",
        params={
            "month": 8,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET PERFORMANCE — INVALID MONTH
# ============================================================


def test_budget_performance_invalid_month(
    client,
    auth_headers,
):
    """
    Month must be between 1 and 12.
    """

    response = client.get(
        "/api/v1/reports/budget-performance",
        params={
            "month": 0,
            "year": 2026,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# ============================================================
# BUDGET PERFORMANCE — INVALID YEAR
# ============================================================


def test_budget_performance_invalid_year(
    client,
    auth_headers,
):
    """
    Year must be >= 2000.
    """

    response = client.get(
        "/api/v1/reports/budget-performance",
        params={
            "month": 8,
            "year": 1999,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422