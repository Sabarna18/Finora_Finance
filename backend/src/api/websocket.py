# ==========================================================
# src/api/websocket.py
# ==========================================================

from __future__ import annotations

import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.logger import get_logger
from src.core.websocket_manager import websocket_manager
from src.db.database import get_db
from src.db.models import User

logger = get_logger("websocket")


# NOTE:
# /api/v1 is already owned by src/api/router.py.
#
# Therefore this child router intentionally has no
# /api/v1 prefix.
router = APIRouter(
    tags=["WebSocket"],
)


# ==========================================================
# AUTHENTICATION HELPERS
# ==========================================================


def _extract_token(
    websocket: WebSocket,
    query_token: str | None,
) -> str | None:
    """
    Extract JWT from the Authorization header or query parameter.

    Browser WebSocket clients cannot reliably set arbitrary
    Authorization headers, so the query parameter is retained
    for browser compatibility.
    """

    authorization = websocket.headers.get("authorization")

    if authorization:
        scheme, _, credentials = authorization.partition(" ")

        if scheme.lower() == "bearer" and credentials:
            return credentials

    return query_token


def _get_user_from_token(
    token: str,
) -> User | None:
    """
    Resolve an active user from a JWT.

    WebSocket routes do not use normal HTTP dependency injection
    for the connection lifecycle, so the database generator is
    resolved explicitly here.

    Tests may patch this function to avoid bypassing their
    dependency override.
    """

    db: Session = next(get_db())

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        subject = payload.get("sub")

        if subject is None:
            return None

        try:
            user_id = int(subject)
        except (TypeError, ValueError):
            return None

        return (
            db.query(User)
            .filter(
                User.id == user_id,
                User.is_active.is_(True),
            )
            .first()
        )

    except JWTError:
        return None

    finally:
        db.close()


# ==========================================================
# WEBSOCKET ENDPOINT
# ==========================================================


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    """
    Authenticated Finora WebSocket.

    Lifecycle:

        authenticate
            ↓
        accept connection
            ↓
        register connection
            ↓
        send connection.ready
            ↓
        heartbeat/message loop
            ↓
        disconnect
            ↓
        cleanup
    """

    # ------------------------------------------------------
    # 1. Extract authentication token
    # ------------------------------------------------------

    access_token = _extract_token(
        websocket,
        token,
    )

    if not access_token:
        logger.warning("WebSocket authentication failed | reason=missing_token")

        await websocket.close(
            code=1008,
            reason="Authentication required",
        )

        return

    # ------------------------------------------------------
    # 2. Resolve authenticated user
    # ------------------------------------------------------

    current_user = _get_user_from_token(access_token)

    if current_user is None:
        logger.warning("WebSocket authentication failed | reason=invalid_token")

        await websocket.close(
            code=1008,
            reason="Invalid authentication",
        )

        return

    # ------------------------------------------------------
    # 3. Accept WebSocket connection
    #
    # IMPORTANT:
    # The API layer owns the handshake.
    #
    # ConnectionManager.connect() MUST NOT call
    # websocket.accept() again.
    # ------------------------------------------------------

    await websocket.accept()

    # ------------------------------------------------------
    # 4. Register accepted connection
    # ------------------------------------------------------

    await websocket_manager.connect(
        user_id=current_user.id,
        websocket=websocket,
    )

    try:
        # --------------------------------------------------
        # 5. Send connection confirmation
        # --------------------------------------------------

        await websocket.send_json(
            {
                "event": "connection.ready",
                "data": {
                    "user_id": current_user.id,
                    "message": "WebSocket connection established",
                },
            }
        )

        # --------------------------------------------------
        # 6. Message / heartbeat loop
        # --------------------------------------------------

        while True:
            message = await websocket.receive_text()

            # ------------------------------------------------
            # Plain-text heartbeat
            # ------------------------------------------------

            if message == "ping":
                await websocket.send_text("pong")
                continue

            # ------------------------------------------------
            # JSON message handling
            # ------------------------------------------------

            try:
                payload = json.loads(message)

            except json.JSONDecodeError:
                payload = None

            if isinstance(payload, dict):
                message_type = payload.get("type")

                # --------------------------------------------
                # JSON heartbeat
                # --------------------------------------------

                if message_type == "ping":
                    await websocket.send_json(
                        {
                            "event": "pong",
                        }
                    )

                    continue

            # ------------------------------------------------
            # Unknown / unhandled message
            # ------------------------------------------------

            logger.debug(
                "Unhandled WebSocket message | user_id=%s | message=%s",
                current_user.id,
                message,
            )

    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected | user_id=%s",
            current_user.id,
        )

    except Exception:
        logger.exception(
            "Unexpected WebSocket error | user_id=%s",
            current_user.id,
        )

    finally:
        # --------------------------------------------------
        # 7. Always unregister the connection
        # --------------------------------------------------

        await websocket_manager.disconnect(
            user_id=current_user.id,
            websocket=websocket,
        )
