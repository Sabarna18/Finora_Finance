# ==========================================================
# Finora Backend
# FastAPI + Uvicorn + Alembic
# Environment-neutral Docker image
# ==========================================================

FROM python:3.13-slim


# ==========================================================
# Build Arguments
# ==========================================================

# Release pipeline passes the semantic application version.
# Example:
#   1.0.5
#
# Development builds can use:
#   vdev
#
ARG APP_VERSION=vdev


# ==========================================================
# Environment
# ==========================================================

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/backend \
    PATH="/backend/.venv/bin:$PATH" \
    APP_VERSION=${APP_VERSION}


# ==========================================================
# Working directory
# ==========================================================

WORKDIR /backend


# ==========================================================
# System dependencies
# ==========================================================

# curl is used by container health checks.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*


# ==========================================================
# Install uv
# ==========================================================

COPY --from=ghcr.io/astral-sh/uv:latest \
    /uv \
    /usr/local/bin/uv


# ==========================================================
# Dependency files
# ==========================================================

# Copy dependency metadata first so Docker can cache
# dependency installation independently of source changes.

COPY pyproject.toml uv.lock ./


# ==========================================================
# Install runtime dependencies
# ==========================================================

# --frozen guarantees that the committed uv.lock is used.
# --no-dev keeps test/development dependencies out of
# the production runtime image.

RUN uv sync \
    --frozen \
    --no-dev


# ==========================================================
# Application source
# ==========================================================

COPY . .


# ==========================================================
# Entrypoint
# ==========================================================

RUN chmod +x /backend/docker-entrypoint.sh


# ==========================================================
# Runtime port
# ==========================================================

EXPOSE 8000


# ==========================================================
# Container startup
# ==========================================================

ENTRYPOINT ["/backend/docker-entrypoint.sh"]

