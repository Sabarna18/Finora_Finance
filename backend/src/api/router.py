from fastapi import APIRouter
from src.api.auth import router as auth_router
from src.api.transactions import router as transactions_router
from src.api.categories import router as categories_router
from src.api.budgets import router as budgets_router
from src.api.dashboard import router as dashboard_router
from src.api.reports import router as reports_router
from src.api.users import router as users_router
from src.api.health import router as health_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(transactions_router)
api_router.include_router(categories_router)
api_router.include_router(budgets_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(users_router)
api_router.include_router(health_router)
