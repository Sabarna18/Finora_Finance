#!/usr/bin/env bash

# ==========================================================
# Finora Database Quality Gate
# ==========================================================
#
# Purpose:
#   Validate the complete database layer while the Docker
#   environment is running.
#
# Responsibilities:
#
#   1. Docker / Compose validation
#   2. PostgreSQL container validation
#   3. PostgreSQL health validation
#   4. Backend → PostgreSQL connectivity
#   5. SQL connectivity validation
#   6. Database identity validation
#   7. Alembic migration validation
#   8. PostgreSQL integrity validation
#   9. Database summary generation
#  10. Final summarized quality-gate report
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

POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
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
# CONTAINER STATUS
# ==========================================================

check_container_running() {

    local service="$1"

    local container_id

    container_id="$(
        docker compose \
            -f "${COMPOSE_FILE}" \
            ps -q "${service}" \
            2>/dev/null
    )"

    if [[ -z "${container_id}" ]]; then

        fail_gate \
            "${service} container exists"

        echo
        echo "The ${service} service is not running."
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
            "${service} container is running"

    else

        fail_gate \
            "${service} container is running"

        echo "Container status: ${status}"

        return 1

    fi
}


# ==========================================================
# POSTGRES HEALTH
# ==========================================================

check_postgres_health() {

    print_section "2. PostgreSQL Health"

    local container_id

    container_id="$(
        docker compose \
            -f "${COMPOSE_FILE}" \
            ps -q "${POSTGRES_SERVICE}"
    )"


    if [[ -z "${container_id}" ]]; then

        fail_gate \
            "PostgreSQL container available"

        return 1

    fi


    local health

    health="$(
        docker inspect \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
            "${container_id}"
    )"


    echo "PostgreSQL health status: ${health}"


    case "${health}" in

        healthy)

            pass_gate \
                "PostgreSQL container is healthy"

            ;;

        no-healthcheck)

            fail_gate \
                "PostgreSQL healthcheck is configured"

            echo
            echo "PostgreSQL must expose a Docker healthcheck."
            echo

            return 1

            ;;

        *)

            fail_gate \
                "PostgreSQL container is healthy"

            return 1

            ;;

    esac
}


# ==========================================================
# POSTGRES READINESS
# ==========================================================

check_postgres_readiness() {

    print_section "3. PostgreSQL Readiness"

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${POSTGRES_SERVICE}" \
        pg_isready >/dev/null 2>&1; then

        pass_gate \
            "PostgreSQL accepts connections"

    else

        fail_gate \
            "PostgreSQL accepts connections"

        return 1

    fi
}


# ==========================================================
# BACKEND → POSTGRES CONNECTION
# ==========================================================

check_backend_database_connection() {

    print_section "4. Backend → PostgreSQL Connectivity"


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
            "Database returned an unexpected result."
        )

print("Database connection successful.")
PY
    then

        pass_gate \
            "Backend can connect to PostgreSQL"

    else

        fail_gate \
            "Backend can connect to PostgreSQL"

        return 1

    fi
}


# ==========================================================
# DATABASE IDENTITY
# ==========================================================

check_database_identity() {

    print_section "5. Database Identity"


    docker compose \
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

    print(f"Database       : {database_name}")
    print(f"User           : {current_user}")
    print(f"PostgreSQL     : {server_version}")
PY


    pass_gate \
        "Database identity query succeeds"
}


# ==========================================================
# ALEMBIC VALIDATION
# ==========================================================

check_alembic() {

    print_section "6. Alembic Migration Validation"


    info "Checking current migration revision..."

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        alembic current; then

        pass_gate \
            "Alembic can read current database revision"

    else

        fail_gate \
            "Alembic can read current database revision"

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

    print_section "7. PostgreSQL Structural Integrity"


    docker compose \
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
        text(
            """
            SELECT COUNT(*)
            FROM pg_index
            WHERE NOT indisvalid
            """
        )
    ).scalar_one()


    if invalid_indexes != 0:

        raise RuntimeError(
            f"Found {invalid_indexes} invalid PostgreSQL index(es)."
        )


    # ------------------------------------------------------
    # Unvalidated constraints
    # ------------------------------------------------------

    unvalidated_constraints = connection.execute(
        text(
            """
            SELECT COUNT(*)
            FROM pg_constraint
            WHERE NOT convalidated
            """
        )
    ).scalar_one()


    if unvalidated_constraints != 0:

        raise RuntimeError(
            "Found "
            f"{unvalidated_constraints} "
            "unvalidated PostgreSQL constraint(s)."
        )


    # ------------------------------------------------------
    # Tables
    # ------------------------------------------------------

    table_count = connection.execute(
        text(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
            """
        )
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


print("PostgreSQL structural integrity checks passed.")
PY


    pass_gate \
        "PostgreSQL structural integrity checks pass"
}


# ==========================================================
# DATABASE SUMMARY
# ==========================================================
generate_database_summary() {

    print_section "8. Database Summary"

    info "Generating read-only database summary..."

    if docker compose \
        -f "${COMPOSE_FILE}" \
        exec -T "${BACKEND_SERVICE}" \
        python scripts/generate_db_summary.py; then

        pass_gate \
            "Database summary generated successfully"

    else

        fail_gate \
            "Database summary generated successfully"

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
    # Running containers
    # ------------------------------------------------------

    print_section "Container Runtime"


    check_container_running \
        "${POSTGRES_SERVICE}"


    check_container_running \
        "${BACKEND_SERVICE}"


    # ------------------------------------------------------
    # PostgreSQL
    # ------------------------------------------------------

    check_postgres_health

    check_postgres_readiness


    # ------------------------------------------------------
    # Backend connection
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

