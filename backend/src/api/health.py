# ==========================================================
# src/api/v1/endpoints/health.py
# ==========================================================

from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check():
    """
    Basic application health check.

    Used by:
    - Docker healthcheck
    - Nginx/container monitoring
    - Load balancers
    """

    return {
        "status": "healthy",
        "service": "Finora API",
    }
