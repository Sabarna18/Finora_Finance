# ==========================================================
# src/services/notification_service.py
# ==========================================================
#
# Finora Notification Service
#
# Responsibilities:
#
#   - Create and persist notifications
#   - Deliver newly-created notifications over WebSocket
#   - Retrieve notification history
#   - Calculate unread notification count
#   - Mark notifications as read
#   - Mark all user notifications as read
#   - Delete notifications
#   - Enforce notification ownership
#
# Architecture:
#
#   API / Business Event
#          │
#          ▼
#   NotificationService
#          │
#          ├──────────────► PostgreSQL
#          │                  notifications
#          │
#          └──────────────► WebSocketManager
#                             │
#                             ▼
#                         Connected user
#
# This service does NOT:
#
#   - manage WebSocket connections
#   - authenticate WebSocket connections
#   - define FastAPI routes
#
# ==========================================================

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.logger import get_logger
from src.core.websocket_manager import websocket_manager
from src.db.models import Notification, User
from src.db.schemas import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
)

logger = get_logger("notifications")


class NotificationService:
    # ======================================================
    # CREATE
    # ======================================================

    @staticmethod
    async def create_notification(
        db: Session,
        payload: NotificationCreate,
    ) -> Notification:
        """
        Create and persist a notification.

        The notification is committed first so that the
        WebSocket payload always references a persistent
        database record.

        If the user is currently connected, the notification
        is then delivered to all active WebSocket sessions.

        Args:
            db:
                SQLAlchemy database session.

            payload:
                Notification creation payload.

        Returns:
            Persisted Notification instance.
        """

        notification = Notification(
            user_id=payload.user_id,
            title=payload.title.strip(),
            message=payload.message.strip(),
            type=payload.type,
            is_read=False,
        )

        db.add(notification)

        try:
            db.commit()

            db.refresh(notification)

        except Exception:
            db.rollback()

            logger.exception(
                "Failed to create notification | user_id=%s | type=%s",
                payload.user_id,
                payload.type,
            )

            raise

        logger.info(
            "Notification created | notification_id=%s | user_id=%s | type=%s",
            notification.id,
            notification.user_id,
            notification.type,
        )

        # --------------------------------------------------
        # Live WebSocket delivery
        # --------------------------------------------------

        websocket_payload = NotificationService._build_websocket_payload(notification)

        delivered = await websocket_manager.send_to_user(
            user_id=notification.user_id,
            message=websocket_payload,
        )

        if delivered:
            logger.info(
                "Notification delivered over WebSocket | "
                "notification_id=%s | user_id=%s",
                notification.id,
                notification.user_id,
            )

        else:
            logger.debug(
                "Notification persisted without active WebSocket "
                "connection | notification_id=%s | user_id=%s",
                notification.id,
                notification.user_id,
            )

        return notification

    # ======================================================
    # GET USER NOTIFICATIONS
    # ======================================================

    @staticmethod
    def get_notifications(
        db: Session,
        current_user: User,
        limit: int = 20,
        offset: int = 0,
    ) -> NotificationListResponse:
        """
        Retrieve notification history for the authenticated user.

        Notifications are returned newest first.
        """

        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(
                Notification.created_at.desc(),
                Notification.id.desc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        unread_count = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.is_read.is_(False),
            )
            .count()
        )

        return NotificationListResponse(
            notifications=[
                NotificationResponse.model_validate(notification)
                for notification in notifications
            ],
            unread_count=unread_count,
        )

    # ======================================================
    # UNREAD COUNT
    # ======================================================

    @staticmethod
    def get_unread_count(
        db: Session,
        current_user: User,
    ) -> int:
        """
        Return the number of unread notifications belonging
        to the authenticated user.
        """

        return (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.is_read.is_(False),
            )
            .count()
        )

    # ======================================================
    # GET SINGLE
    # ======================================================

    @staticmethod
    def get_notification(
        db: Session,
        current_user: User,
        notification_id: int,
    ) -> Notification:
        """
        Retrieve a notification belonging to the current user.
        """

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
            .first()
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        return notification

    # ======================================================
    # MARK ONE AS READ
    # ======================================================

    @staticmethod
    def mark_as_read(
        db: Session,
        current_user: User,
        notification_id: int,
    ) -> Notification:
        """
        Mark one notification as read.

        Ownership is enforced through get_notification().
        """

        notification = NotificationService.get_notification(
            db=db,
            current_user=current_user,
            notification_id=notification_id,
        )

        if not notification.is_read:
            notification.is_read = True

            notification.read_at = datetime.now(UTC)

            db.commit()

            db.refresh(notification)

            logger.info(
                "Notification marked as read | notification_id=%s | user_id=%s",
                notification.id,
                current_user.id,
            )

        return notification

    # ======================================================
    # MARK ALL AS READ
    # ======================================================

    @staticmethod
    def mark_all_as_read(
        db: Session,
        current_user: User,
    ) -> int:
        """
        Mark every unread notification belonging to the
        authenticated user as read.

        Returns:
            Number of notifications updated.
        """

        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.is_read.is_(False),
            )
            .all()
        )

        if not notifications:
            return 0

        read_timestamp = datetime.now(UTC)

        for notification in notifications:
            notification.is_read = True
            notification.read_at = read_timestamp

        db.commit()

        logger.info(
            "All notifications marked as read | user_id=%s | count=%s",
            current_user.id,
            len(notifications),
        )

        return len(notifications)

    # ======================================================
    # DELETE
    # ======================================================

    @staticmethod
    def delete_notification(
        db: Session,
        current_user: User,
        notification_id: int,
    ) -> dict[str, str]:
        """
        Delete a notification belonging to the authenticated
        user.
        """

        notification = NotificationService.get_notification(
            db=db,
            current_user=current_user,
            notification_id=notification_id,
        )

        deleted_id = notification.id

        db.delete(notification)

        db.commit()

        logger.info(
            "Notification deleted | notification_id=%s | user_id=%s",
            deleted_id,
            current_user.id,
        )

        return {"message": "Notification deleted successfully"}

    # ======================================================
    # WEBSOCKET PAYLOAD
    # ======================================================

    @staticmethod
    def _build_websocket_payload(
        notification: Notification,
    ) -> dict:
        """
        Build the standard WebSocket event envelope.

        The same notification representation is used by
        REST and WebSocket consumers.
        """

        response = NotificationResponse.model_validate(notification)

        return {
            "event": "notification.created",
            "data": response.model_dump(mode="json"),
        }
