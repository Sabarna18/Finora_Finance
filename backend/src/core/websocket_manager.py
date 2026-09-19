# ==========================================================
# src/core/websocket_manager.py
# ==========================================================
#
# Finora WebSocket Connection Manager
#
# Responsibilities:
#
#   - Track active WebSocket connections per user
#   - Register already-accepted connections
#   - Remove connections safely
#   - Send messages to a specific user
#   - Broadcast messages when required
#   - Handle disconnected / broken sockets safely
#
# This module intentionally does NOT:
#
#   - access the database
#   - create notifications
#   - authenticate users
#   - accept WebSocket handshakes
#   - contain API route logic
#
# Authentication and WebSocket handshake belong to the
# WebSocket endpoint.
#
# Notification creation belongs to NotificationService.
#
# ==========================================================

from collections import defaultdict
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

from src.core.logger import get_logger

logger = get_logger("websocket")


class ConnectionManager:
    """
    Manage active WebSocket connections for Finora users.

    A user may have multiple active connections, for example:

        User 7

        ├── Browser tab 1
        ├── Browser tab 2
        └── Mobile / another client

    Therefore connections are stored as:

        user_id -> set[WebSocket]

    Important:
        This manager does NOT call websocket.accept().

        The WebSocket API endpoint owns the handshake.
        This class only registers an already-accepted socket.
    """

    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    # ======================================================
    # CONNECTION MANAGEMENT
    # ======================================================

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:
        """
        Register an already-accepted WebSocket connection.

        The WebSocket handshake must already have been completed
        by the API layer with:

            await websocket.accept()

        Args:
            user_id:
                Authenticated Finora user ID.

            websocket:
                Already-accepted WebSocket connection.
        """

        self._connections[user_id].add(websocket)

        logger.info(
            "WebSocket connected | user_id=%s | active_connections=%s",
            user_id,
            self.connection_count(user_id),
        )

    async def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:
        """
        Remove a WebSocket connection.

        Safe to call even if the connection is already absent.
        """

        connections = self._connections.get(user_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            self._connections.pop(user_id, None)

        logger.info(
            "WebSocket disconnected | user_id=%s | active_connections=%s",
            user_id,
            self.connection_count(user_id),
        )

    # ======================================================
    # USER CONNECTION STATUS
    # ======================================================

    def is_connected(
        self,
        user_id: int,
    ) -> bool:
        """
        Return True if the user currently has at least one
        active WebSocket connection.
        """

        return bool(self._connections.get(user_id))

    def connection_count(
        self,
        user_id: int,
    ) -> int:
        """
        Return the number of active connections for a user.
        """

        return len(
            self._connections.get(
                user_id,
                set(),
            )
        )

    def active_user_count(self) -> int:
        """
        Return the number of users currently connected.
        """

        return len(self._connections)

    def total_connection_count(self) -> int:
        """
        Return the total number of active WebSocket connections.
        """

        return sum(len(connections) for connections in self._connections.values())

    # ======================================================
    # MESSAGE DELIVERY
    # ======================================================

    async def send_to_user(
        self,
        user_id: int,
        message: dict[str, Any],
    ) -> bool:
        """
        Send a JSON message to all active connections belonging
        to a specific user.

        Returns:

            True:
                At least one connection received the message.

            False:
                The user has no active connections or all
                connections failed.

        Broken connections are removed automatically.
        """

        connections = self._connections.get(user_id)

        if not connections:
            return False

        disconnected: list[WebSocket] = []

        for websocket in list(connections):
            try:
                await websocket.send_json(message)

            except (
                WebSocketDisconnect,
                RuntimeError,
                ConnectionError,
            ) as exc:
                logger.warning(
                    "WebSocket delivery failed | user_id=%s | error=%s",
                    user_id,
                    exc,
                )

                disconnected.append(websocket)

        for websocket in disconnected:
            await self.disconnect(
                user_id=user_id,
                websocket=websocket,
            )

        return len(disconnected) < len(connections)

    # ======================================================
    # BROADCAST
    # ======================================================

    async def broadcast(
        self,
        message: dict[str, Any],
    ) -> int:
        """
        Broadcast a JSON message to every active connection.

        Returns:
            Number of successful connection deliveries.
        """

        delivered = 0

        for user_id in list(self._connections.keys()):
            connections = self._connections.get(user_id)

            if not connections:
                continue

            disconnected: list[WebSocket] = []

            for websocket in list(connections):
                try:
                    await websocket.send_json(message)
                    delivered += 1

                except (
                    WebSocketDisconnect,
                    RuntimeError,
                    ConnectionError,
                ) as exc:
                    logger.warning(
                        "WebSocket broadcast delivery failed | user_id=%s | error=%s",
                        user_id,
                        exc,
                    )

                    disconnected.append(websocket)

            for websocket in disconnected:
                await self.disconnect(
                    user_id=user_id,
                    websocket=websocket,
                )

        return delivered

    # ======================================================
    # CONNECTION SNAPSHOT
    # ======================================================

    def get_connection_snapshot(self) -> dict[int, int]:
        """
        Return a lightweight snapshot of active connections.

        Example:

            {
                1: 2,
                7: 1,
                12: 3,
            }

        Useful for diagnostics and future monitoring.
        """

        return {
            user_id: len(connections)
            for user_id, connections in self._connections.items()
        }


# ==========================================================
# SINGLE APPLICATION-LEVEL INSTANCE
# ==========================================================
#
# FastAPI runs this manager in the application process.
#
# Other modules import this instance rather than creating
# their own manager.
#
# ==========================================================

websocket_manager = ConnectionManager()
