# ==========================================================
# src/api/v1/endpoints/health.py
# ==========================================================

from fastapi import APIRouter

from src.core.config import settings


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check() -> dict:
    """
    Application health and metadata endpoint.

    Used by:
    - Docker healthcheck
    - Nginx/container monitoring
    - Load balancers
    - Deployment verification
    - Frontend runtime metadata resolution
    """

    return {
        "status": "healthy",
        "service": "Finora API",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }