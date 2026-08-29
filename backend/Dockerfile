# ==========================================================
# Finora Backend
# FastAPI + Uvicorn + Alembic
# ==========================================================

FROM python:3.13-slim


# ==========================================================
# Environment
# ==========================================================

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/backend


# ==========================================================
# Working directory
# ==========================================================

WORKDIR /backend


# ==========================================================
# System dependencies
# ==========================================================

# curl is useful for container-level health checks
# and basic runtime diagnostics.

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

# Copy these first so Docker can cache dependency
# installation when application source changes.

COPY pyproject.toml uv.lock ./


# ==========================================================
# Install Python dependencies
# ==========================================================

# --frozen ensures uv.lock is used exactly as committed.
# --no-dev excludes development/test dependencies.

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

RUN chmod +x \
    /backend/docker-entrypoint.sh


# ==========================================================
# Runtime port
# ==========================================================

EXPOSE 8000


# ==========================================================
# Container startup
# ==========================================================

ENTRYPOINT [ "/backend/docker-entrypoint.sh" ]
   

