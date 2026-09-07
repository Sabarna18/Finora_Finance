#!/usr/bin/env bash

# ==========================================================
# Finora Database Quality Gate
# ==========================================================
#
# Purpose:
#   Validate the database layer against the deployed
#   Neon PostgreSQL database through the backend container.
#
# Responsibilities:
#
#   1. Docker / Compose validation
#   2. Backend container validation
#   3. Backend → Neon PostgreSQL connectivity
#   4. SQL connectivity validation
#   5. Database identity validation
#   6. Alembic migration validation
#   7. PostgreSQL integrity validation
#   8. Database summary generation
#   9. Final summarized quality-gate report
#
# This script does NOT:
#
#   - create databases
#   - modify schema
#   - run `alembic upgrade`
#   - insert/update/delete application data
#   - reset the database
#   - drop tables
#
# Database mutation belongs to:
#
#   make db-upgrade
#
# ==========================================================

set -Eeuo pipefail


# ==========================================================
# PROJECT ROOT
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"


# ==========================================================
# CONFIGURATION
# ==========================================================

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"
BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"

REPORT_DIR="${REPORT_DIR:-reports/database}"

TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"

REPORT_FILE="${REPORT_DIR}/db-check-${TIMESTAMP}.txt"
LATEST_REPORT="${REPORT_DIR}/db-check-latest.txt"


# ==========================================================
# COLORS
# ==========================================================

if [[ -t 1 ]]; then
    RESET='\033[0m'
    BOLD='\033[1m'
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
else
    RESET=''
    BOLD=''
    GREEN=''
    RED=''
    YELLOW=''
    BLUE=''
fi


# ==========================================================
# STATE
# ==========================================================

TOTAL_GATES=0
PASSED_GATES=0
FAILED_GATES=0

GATE_RESULTS=()


# ==========================================================
# REPORT SETUP
# ==========================================================

mkdir -p "${REPORT_DIR}"

touch "${REPORT_FILE}"

exec > >(tee -a "${REPORT_FILE}") 2>&1


# ==========================================================
# CLEANUP
# ==========================================================

cleanup() {
    cp "${REPORT_FILE}" "${LATEST_REPORT}" 2>/dev/null || true
}

trap cleanup EXIT


# ==========================================================
# DISPLAY HELPERS
# ==========================================================

print_header() {
    echo
    echo "=========================================================="
    echo "              Finora Database Quality Gate"
    echo "=========================================================="
    echo

    echo "Project root : ${PROJECT_ROOT}"
    echo "Compose file : ${COMPOSE_FILE}"
    echo "Backend      : ${BACKEND_SERVICE}"
    echo "Database     : Neon PostgreSQL"
    echo "Report       : ${REPORT_FILE}"
    echo
}


print_section() {
    echo
    echo "----------------------------------------------------------"
    echo " $1"
    echo "----------------------------------------------------------"
    echo
}


pass_gate() {
    local name="$1"

    TOTAL_GATES=$((TOTAL_GATES + 1))
    PASSED_GATES=$((PASSED_GATES + 1))

    GATE_RESULTS+=(
        "PASS|${name}"
    )

    echo -e "${GREEN}[PASS]${RESET} ${name}"
}


fail_gate() {
    local name="$1"

    TOTAL_GATES=$((TOTAL_GATES + 1))
    FAILED_GATES=$((FAILED_GATES + 1))

    GATE_RESULTS+=(
        "FAIL|${name}"
    )

    echo -e "${RED}[FAIL]${RESET} ${name}"
}


warn() {
    echo -e "${YELLOW}[WARN]${RESET} $1"
}


info() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}


# ==========================================================
# COMMAND REQUIREMENTS
# ==========================================================

require_command() {
    local command_name="$1"

    if command -v "${command_name}" >/dev/null 2>&1; then

        pass_gate \
            "Required command available: ${command_name}"

    else

        fail_gate \
            "Required command unavailable: ${command_name}"

        return 1

    fi
}


# ==========================================================
# COMPOSE VALIDATION
# ==========================================================

check_compose_file() {

    print_section "1. Docker Compose Validation"

    if [[ ! -f "${COMPOSE_FILE}" ]]; then

        fail_gate \
            "Compose file exists"

        echo "Missing: ${COMPOSE_FILE}"

        return 1

    fi

    pass_gate \
        "Compose file exists"


    if docker compose \
        -f "${COMPOSE_FILE}" \
        config --quiet; then

        pass_gate \
            "Docker Compose configuration is valid"

    else

        fail_gate \
            "Docker Compose configuration is valid"

        return 1

    fi
}


# ==========================================================
# BACKEND CONTAINER
# ==========================================================

check_backend_running() {

    print_section "2. Backend Container"

    local container_id

    container_id="$(
        docker compose \
            -f "${COMPOSE_FILE}" \
            ps -q "${BACKEND_SERVICE}" \
            2>/dev/null
    )"


    if [[ -z "${container_id}" ]]; then

        fail_gate \
            "Backend container exists"

        echo
        echo "The ${BACKEND_SERVICE} service is not running."
        echo
        echo "Start the environment with:"
        echo
        echo "    docker compose up -d"
        echo

        return 1

    fi


    local status

    status="$(
        docker inspect \
            --format '{{.State.Status}}' \
            "${container_id}"
    )"


    if [[ "${status}" == "running" ]]; then

        pass_gate \
            "Backend container is running"

    else

        fail_gate \
            "Backend container is running"

        echo "Container status: ${status}"

        return 1

    fi
}


# ==========================================================
# NEON DATABASE CONNECTION
# ==========================================================

check_backend_database_connection() {

    print_section "3. Backend → Neon PostgreSQL"

    info "Testing database connectivity from the backend container..."


    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        python - <<'PY'
from sqlalchemy import text

from src.db.database import engine


with engine.connect() as connection:

    result = connection.execute(
        text("SELECT 1")
    ).scalar_one()

    if result != 1:
        raise RuntimeError(
            "Neon PostgreSQL returned an unexpected result."
        )

print("Neon PostgreSQL connection successful.")
PY
    then

        pass_gate \
            "Backend can connect to Neon PostgreSQL"

    else

        fail_gate \
            "Backend can connect to Neon PostgreSQL"

        return 1

    fi
}


# ==========================================================
# DATABASE IDENTITY
# ==========================================================

check_database_identity() {

    print_section "4. Neon Database Identity"

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        python - <<'PY'
from sqlalchemy import text

from src.db.database import engine


with engine.connect() as connection:

    database_name = connection.execute(
        text("SELECT current_database()")
    ).scalar_one()

    current_user = connection.execute(
        text("SELECT current_user")
    ).scalar_one()

    server_version = connection.execute(
        text("SELECT current_setting('server_version')")
    ).scalar_one()

    host = connection.execute(
        text("""
            SELECT COALESCE(
                inet_server_addr()::text,
                'remote-managed-server'
            )
        """)
    ).scalar_one()

    print(f"Database       : {database_name}")
    print(f"User           : {current_user}")
    print(f"PostgreSQL     : {server_version}")
    print(f"Server         : {host}")
PY
    then

        pass_gate \
            "Neon database identity query succeeds"

    else

        fail_gate \
            "Neon database identity query succeeds"

        return 1

    fi
}


# ==========================================================
# ALEMBIC VALIDATION
# ==========================================================

check_alembic() {

    print_section "5. Alembic Migration Validation"

    info "Checking current migration revision..."

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        alembic current; then

        pass_gate \
            "Alembic can read current Neon database revision"

    else

        fail_gate \
            "Alembic can read current Neon database revision"

        return 1

    fi


    echo
    info "Checking migration heads..."

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        alembic heads; then

        pass_gate \
            "Alembic migration heads are readable"

    else

        fail_gate \
            "Alembic migration heads are readable"

        return 1

    fi


    echo
    info "Checking for model/schema migration drift..."

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        alembic check; then

        pass_gate \
            "Alembic reports no pending model migrations"

    else

        fail_gate \
            "Alembic reports no pending model migrations"

        return 1

    fi
}


# ==========================================================
# POSTGRESQL STRUCTURAL INTEGRITY
# ==========================================================

check_postgres_integrity() {

    print_section "6. Neon PostgreSQL Structural Integrity"


    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        python - <<'PY'
from sqlalchemy import text

from src.db.database import engine


with engine.connect() as connection:

    # ------------------------------------------------------
    # Invalid indexes
    # ------------------------------------------------------

    invalid_indexes = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM pg_index
            WHERE NOT indisvalid
        """)
    ).scalar_one()


    if invalid_indexes != 0:

        raise RuntimeError(
            f"Found {invalid_indexes} invalid PostgreSQL index(es)."
        )


    # ------------------------------------------------------
    # Unvalidated constraints
    # ------------------------------------------------------

    unvalidated_constraints = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM pg_constraint
            WHERE NOT convalidated
        """)
    ).scalar_one()


    if unvalidated_constraints != 0:

        raise RuntimeError(
            "Found "
            f"{unvalidated_constraints} "
            "unvalidated PostgreSQL constraint(s)."
        )


    # ------------------------------------------------------
    # Application tables
    # ------------------------------------------------------

    table_count = connection.execute(
        text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
        """)
    ).scalar_one()


    if table_count == 0:

        raise RuntimeError(
            "No application tables were found in the public schema."
        )


    print(
        f"Tables                 : {table_count}"
    )

    print(
        f"Invalid indexes        : {invalid_indexes}"
    )

    print(
        f"Unvalidated constraints : "
        f"{unvalidated_constraints}"
    )


print("Neon PostgreSQL structural integrity checks passed.")
PY
    then

        pass_gate \
            "Neon PostgreSQL structural integrity checks pass"

    else

        fail_gate \
            "Neon PostgreSQL structural integrity checks pass"

        return 1

    fi
}


# ==========================================================
# DATABASE SUMMARY
# ==========================================================

generate_database_summary() {

    print_section "7. Database Summary"

    info "Generating read-only database summary..."


    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        python scripts/generate_db_summary.py; then

        pass_gate \
            "Neon database summary generated successfully"

    else

        fail_gate \
            "Neon database summary generated successfully"

        return 1

    fi
}


# ==========================================================
# FINAL REPORT
# ==========================================================

print_final_report() {

    print_section "DATABASE QUALITY-GATE REPORT"

    echo
    echo "Gate results:"
    echo


    local result
    local status
    local name


    for result in "${GATE_RESULTS[@]}"; do

        status="${result%%|*}"
        name="${result#*|}"


        if [[ "${status}" == "PASS" ]]; then

            echo -e "  ${GREEN}[PASS]${RESET} ${name}"

        else

            echo -e "  ${RED}[FAIL]${RESET} ${name}"

        fi

    done


    echo
    echo "----------------------------------------------------------"
    echo

    echo "Total gates : ${TOTAL_GATES}"
    echo "Passed      : ${PASSED_GATES}"
    echo "Failed      : ${FAILED_GATES}"

    echo
    echo "Report:"
    echo "  ${REPORT_FILE}"

    echo
    echo "Latest:"
    echo "  ${LATEST_REPORT}"

    echo


    if [[ "${FAILED_GATES}" -eq 0 ]]; then

        echo "=========================================================="
        echo -e " ${GREEN}${BOLD}DATABASE QUALITY GATE PASSED${RESET}"
        echo "=========================================================="
        echo

        return 0

    fi


    echo "=========================================================="
    echo -e " ${RED}${BOLD}DATABASE QUALITY GATE FAILED${RESET}"
    echo "=========================================================="
    echo

    return 1
}


# ==========================================================
# MAIN
# ==========================================================

main() {

    print_header


    # ------------------------------------------------------
    # Required commands
    # ------------------------------------------------------

    print_section "Environment Requirements"

    require_command docker


    # ------------------------------------------------------
    # Compose
    # ------------------------------------------------------

    check_compose_file


    # ------------------------------------------------------
    # Backend
    # ------------------------------------------------------

    check_backend_running


    # ------------------------------------------------------
    # Neon PostgreSQL
    # ------------------------------------------------------

    check_backend_database_connection

    check_database_identity


    # ------------------------------------------------------
    # Migration layer
    # ------------------------------------------------------

    check_alembic


    # ------------------------------------------------------
    # PostgreSQL integrity
    # ------------------------------------------------------

    check_postgres_integrity


    # ------------------------------------------------------
    # Database summary
    # ------------------------------------------------------

    generate_database_summary


    # ------------------------------------------------------
    # Final result
    # ------------------------------------------------------

    print_final_report
}


main "$@"
