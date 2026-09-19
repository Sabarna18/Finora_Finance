# ============================================================
# backend/tests/unit/test_notification_service.py
# ============================================================
#
# Unit tests for Finora NotificationService.
#
# Coverage:
#
#   1. Notification creation
#   2. Database persistence
#   3. WebSocket delivery
#   4. Offline notification persistence
#   5. Notification retrieval
#   6. Unread count
#   7. Mark notification as read
#   8. Mark all notifications as read
#   9. Notification ownership
#  10. Notification deletion
#
# ============================================================

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.db.models import Notification
from src.db.schemas import (
    NotificationCreate,
    NotificationType,
)
from src.services.notification_service import NotificationService

# ============================================================
# CREATE NOTIFICATION
# ============================================================


def normalize_utc(value: datetime) -> datetime:
    """
    Normalize a datetime to UTC-aware form.

    SQLite may return timezone-aware SQLAlchemy DateTime(timezone=True)
    values as naive datetimes. PostgreSQL preserves timezone information.

    This helper makes tests portable across both backends.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


@pytest.mark.asyncio
async def test_create_notification_persists_notification(
    db,
    test_user,
):
    """
    A notification should be persisted in the test database.
    """

    payload = NotificationCreate(
        user_id=test_user.id,
        title="Budget Alert",
        message="Food budget reached 85%.",
        type=NotificationType.BUDGET_ALERT,
    )

    with patch(
        "src.services.notification_service.websocket_manager.send_to_user",
        new_callable=AsyncMock,
        return_value=False,
    ):
        notification = await NotificationService.create_notification(
            db=db,
            payload=payload,
        )

    assert notification.id is not None
    assert notification.user_id == test_user.id
    assert notification.title == "Budget Alert"
    assert notification.message == "Food budget reached 85%."
    assert notification.type == NotificationType.BUDGET_ALERT
    assert notification.is_read is False
    assert notification.created_at is not None


# ============================================================
# CREATE + WEBSOCKET DELIVERY
# ============================================================


@pytest.mark.asyncio
async def test_create_notification_delivers_over_websocket(
    db,
    test_user,
):
    """
    A newly-created notification should be delivered to the
    user's active WebSocket connections.
    """

    payload = NotificationCreate(
        user_id=test_user.id,
        title="Transaction Added",
        message="A new transaction was added.",
        type=NotificationType.TRANSACTION,
    )

    mock_send = AsyncMock(
        return_value=True,
    )

    with patch(
        "src.services.notification_service.websocket_manager.send_to_user",
        mock_send,
    ):
        notification = await NotificationService.create_notification(
            db=db,
            payload=payload,
        )

    mock_send.assert_awaited_once()

    call_kwargs = mock_send.await_args.kwargs

    assert call_kwargs["user_id"] == test_user.id

    message = call_kwargs["message"]

    assert message["event"] == "notification.created"

    assert message["data"]["id"] == notification.id
    assert message["data"]["user_id"] == test_user.id
    assert message["data"]["title"] == "Transaction Added"
    assert message["data"]["type"] == "transaction"
    assert message["data"]["is_read"] is False


# ============================================================
# OFFLINE USER
# ============================================================


@pytest.mark.asyncio
async def test_create_notification_succeeds_when_user_offline(
    db,
    test_user,
):
    """
    Notifications must remain persistent even when the user
    has no active WebSocket connection.
    """

    payload = NotificationCreate(
        user_id=test_user.id,
        title="System Notification",
        message="Your account was updated.",
        type=NotificationType.SYSTEM,
    )

    with patch(
        "src.services.notification_service.websocket_manager.send_to_user",
        new_callable=AsyncMock,
        return_value=False,
    ):
        notification = await NotificationService.create_notification(
            db=db,
            payload=payload,
        )

    stored = db.query(Notification).filter(Notification.id == notification.id).first()

    assert stored is not None
    assert stored.user_id == test_user.id
    assert stored.is_read is False


# ============================================================
# GET NOTIFICATIONS
# ============================================================


@pytest.mark.asyncio
async def test_get_notifications_returns_user_notifications(
    db,
    test_user,
):
    """
    A user should receive only their own notifications.
    """

    notifications = [
        Notification(
            user_id=test_user.id,
            title="Notification 1",
            message="First notification",
            type=NotificationType.INFO,
            is_read=False,
        ),
        Notification(
            user_id=test_user.id,
            title="Notification 2",
            message="Second notification",
            type=NotificationType.SUCCESS,
            is_read=True,
        ),
    ]

    db.add_all(notifications)
    db.commit()

    response = NotificationService.get_notifications(
        db=db,
        current_user=test_user,
    )

    assert len(response.notifications) == 2
    assert response.unread_count == 1


# ============================================================
# UNREAD COUNT
# ============================================================


def test_get_unread_count(
    db,
    test_user,
):
    """
    Unread count should only include unread notifications
    belonging to the authenticated user.
    """

    db.add_all(
        [
            Notification(
                user_id=test_user.id,
                title="Unread 1",
                message="Unread notification",
                type=NotificationType.INFO,
                is_read=False,
            ),
            Notification(
                user_id=test_user.id,
                title="Unread 2",
                message="Unread notification",
                type=NotificationType.WARNING,
                is_read=False,
            ),
            Notification(
                user_id=test_user.id,
                title="Read",
                message="Already read",
                type=NotificationType.INFO,
                is_read=True,
            ),
        ]
    )

    db.commit()

    count = NotificationService.get_unread_count(
        db=db,
        current_user=test_user,
    )

    assert count == 2


# ============================================================
# MARK ONE AS READ
# ============================================================


def test_mark_notification_as_read(
    db,
    test_user,
):
    """
    Marking a notification as read should set both is_read
    and read_at.

    SQLite may return timezone-aware SQLAlchemy datetime values
    as naive datetimes, so the returned timestamp is normalized
    before timezone assertions.
    """

    notification = Notification(
        user_id=test_user.id,
        title="Budget Alert",
        message="Budget reached 85%.",
        type=NotificationType.BUDGET_ALERT,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    result = NotificationService.mark_as_read(
        db=db,
        current_user=test_user,
        notification_id=notification.id,
    )

    assert result.is_read is True
    assert result.read_at is not None

    normalized_read_at = normalize_utc(result.read_at)

    assert normalized_read_at.tzinfo is not None
    assert normalized_read_at.utcoffset() == UTC.utcoffset(normalized_read_at)


# ============================================================
# MARK ALL AS READ
# ============================================================


def test_mark_all_notifications_as_read(
    db,
    test_user,
):
    """
    All unread notifications belonging to the user should
    become read.
    """

    db.add_all(
        [
            Notification(
                user_id=test_user.id,
                title="Alert 1",
                message="First alert",
                type=NotificationType.WARNING,
                is_read=False,
            ),
            Notification(
                user_id=test_user.id,
                title="Alert 2",
                message="Second alert",
                type=NotificationType.BUDGET_ALERT,
                is_read=False,
            ),
            Notification(
                user_id=test_user.id,
                title="Already Read",
                message="Read notification",
                type=NotificationType.INFO,
                is_read=True,
            ),
        ]
    )

    db.commit()

    updated = NotificationService.mark_all_as_read(
        db=db,
        current_user=test_user,
    )

    assert updated == 2

    unread_count = NotificationService.get_unread_count(
        db=db,
        current_user=test_user,
    )

    assert unread_count == 0


# ============================================================
# DELETE
# ============================================================


def test_delete_notification(
    db,
    test_user,
):
    """
    A notification belonging to the user should be deleted.
    """

    notification = Notification(
        user_id=test_user.id,
        title="Delete Me",
        message="Temporary notification",
        type=NotificationType.INFO,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    result = NotificationService.delete_notification(
        db=db,
        current_user=test_user,
        notification_id=notification.id,
    )

    assert result == {"message": "Notification deleted successfully"}

    stored = db.query(Notification).filter(Notification.id == notification.id).first()

    assert stored is None


# ============================================================
# OWNERSHIP
# ============================================================


def test_notification_cannot_be_accessed_by_another_user(
    db,
    test_user,
):
    """
    A user must not be able to access another user's
    notification.
    """

    other_user = test_user.__class__(
        name="Other User",
        email="other@finora.com",
        password_hash="hashed-password",
        is_active=True,
    )

    db.add(other_user)
    db.commit()
    db.refresh(other_user)

    notification = Notification(
        user_id=other_user.id,
        title="Private Notification",
        message="Private message",
        type=NotificationType.INFO,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    with pytest.raises(HTTPException) as exc_info:
        NotificationService.get_notification(
            db=db,
            current_user=test_user,
            notification_id=notification.id,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Notification not found"


# ============================================================
# ALREADY READ NOTIFICATION
# ============================================================


def test_mark_already_read_notification_does_not_change_read_at(
    db,
    test_user,
):
    """
    Marking an already-read notification should not overwrite
    its original read timestamp.
    """

    original_read_at = datetime.now(UTC)

    notification = Notification(
        user_id=test_user.id,
        title="Already Read",
        message="This is already read.",
        type=NotificationType.INFO,
        is_read=True,
        read_at=original_read_at,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    result = NotificationService.mark_as_read(
        db=db,
        current_user=test_user,
        notification_id=notification.id,
    )
    assert result.is_read is True
    assert result.read_at is not None

    assert normalize_utc(result.read_at) == normalize_utc(original_read_at)
