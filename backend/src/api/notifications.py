# ==========================================================
# src/api/v1/endpoints/notification.py
# ==========================================================
#
# Finora Notification API
#
# Responsibilities:
#
#   - Expose notification REST endpoints
#   - Authenticate the current user
#   - Provide database session
#   - Delegate notification operations to NotificationService
#
# This layer does NOT:
#
#   - calculate budget alert conditions
#   - decide when a notification should be created
#   - directly manipulate Notification records
#   - manage WebSocket connections
#
# Business logic belongs to:
#
#   src/services/notification_service.py
#
# Authentication belongs to:
#
#   src/core/dependencies.py
#
# ==========================================================

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.core.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.db.schemas import (
    NotificationListResponse,
    NotificationResponse,
)
from src.services.notification_service import NotificationService

# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ==========================================================
# GET NOTIFICATIONS
# ==========================================================


@router.get(
    "",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
)
def get_notifications(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of notifications to return.",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of notifications to skip.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    """
    Get notifications belonging to the authenticated user.

    Notifications are returned newest first.
    """

    return NotificationService.get_notifications(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )


# ==========================================================
# GET UNREAD COUNT
# ==========================================================


@router.get(
    "/unread-count",
    response_model=dict[str, int],
    status_code=status.HTTP_200_OK,
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    """
    Get the unread notification count for the authenticated user.
    """

    unread_count = NotificationService.get_unread_count(
        db=db,
        current_user=current_user,
    )

    return {
        "unread_count": unread_count,
    }


# ==========================================================
# GET SINGLE NOTIFICATION
# ==========================================================


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    """
    Get a single notification belonging to the authenticated user.
    """

    notification = NotificationService.get_notification(
        db=db,
        current_user=current_user,
        notification_id=notification_id,
    )

    return NotificationResponse.model_validate(notification)


# ==========================================================
# MARK ONE NOTIFICATION AS READ
# ==========================================================


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    """
    Mark one notification as read.
    """

    notification = NotificationService.mark_as_read(
        db=db,
        current_user=current_user,
        notification_id=notification_id,
    )

    return NotificationResponse.model_validate(notification)


# ==========================================================
# MARK ALL NOTIFICATIONS AS READ
# ==========================================================


@router.patch(
    "/read-all",
    response_model=dict[str, int],
    status_code=status.HTTP_200_OK,
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    """
    Mark all unread notifications belonging to the
    authenticated user as read.
    """

    updated_count = NotificationService.mark_all_as_read(
        db=db,
        current_user=current_user,
    )

    return {
        "updated_count": updated_count,
    }


# ==========================================================
# DELETE NOTIFICATION
# ==========================================================


@router.delete(
    "/{notification_id}",
    response_model=dict[str, str],
    status_code=status.HTTP_200_OK,
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """
    Delete a notification belonging to the authenticated user.
    """

    return NotificationService.delete_notification(
        db=db,
        current_user=current_user,
        notification_id=notification_id,
    )
