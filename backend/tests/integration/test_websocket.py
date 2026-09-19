# ============================================================
# backend/tests/integration/test_websocket.py
# ============================================================
#
# Integration tests for Finora WebSocket API.
#
# Coverage:
#
#   1. Authenticated connection
#   2. Connection acknowledgement
#   3. Invalid token rejection
#   4. Missing token rejection
#   5. Ping / pong
#   6. User authentication isolation
#   7. ConnectionManager registration
#   8. ConnectionManager cleanup
#
# ============================================================

from unittest.mock import patch

import pytest
from starlette.websockets import WebSocketDisconnect

from src.core.websocket_manager import websocket_manager

# ============================================================
# AUTHENTICATED CONNECTION
# ============================================================


def test_websocket_authenticated_connection(
    client,
    test_user,
    auth_token,
):
    """
    A valid JWT should establish an authenticated WebSocket
    connection.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=test_user,
    ):
        with client.websocket_connect(f"/api/v1/ws?token={auth_token}") as websocket:
            message = websocket.receive_json()

            assert message["event"] == "connection.ready"

            assert message["data"]["user_id"] == test_user.id

            assert message["data"]["message"] == "WebSocket connection established"


# ============================================================
# CONNECTION MANAGER REGISTRATION
# ============================================================


def test_websocket_registers_user_connection(
    client,
    test_user,
    auth_token,
):
    """
    The authenticated WebSocket should be registered in the
    ConnectionManager.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=test_user,
    ):
        with client.websocket_connect(f"/api/v1/ws?token={auth_token}") as websocket:
            # Consume acknowledgement.
            websocket.receive_json()

            assert websocket_manager.is_connected(test_user.id)

            assert websocket_manager.connection_count(test_user.id) == 1

    # TestClient context closes the WebSocket.

    assert not websocket_manager.is_connected(test_user.id)


# ============================================================
# PING / PONG
# ============================================================


def test_websocket_ping_pong(
    client,
    test_user,
    auth_token,
):
    """
    The WebSocket should respond to the application-level
    ping message with pong.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=test_user,
    ):
        with client.websocket_connect(f"/api/v1/ws?token={auth_token}") as websocket:
            websocket.receive_json()

            websocket.send_text("ping")

            response = websocket.receive_text()

            assert response == "pong"


# ============================================================
# JSON PING / PONG
# ============================================================


def test_websocket_json_ping_pong(
    client,
    test_user,
    auth_token,
):
    """
    The WebSocket should also support JSON heartbeat messages.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=test_user,
    ):
        with client.websocket_connect(f"/api/v1/ws?token={auth_token}") as websocket:
            websocket.receive_json()

            websocket.send_text('{"type":"ping"}')

            response = websocket.receive_json()

            assert response == {"event": "pong"}


# ============================================================
# MISSING TOKEN
# ============================================================


def test_websocket_rejects_missing_token(
    client,
):
    """
    A WebSocket connection without a JWT should be rejected.
    """

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/api/v1/ws"):
            pass

    assert exc_info.value.code == 1008


# ============================================================
# INVALID TOKEN
# ============================================================


def test_websocket_rejects_invalid_token(
    client,
):
    """
    An invalid JWT should be rejected.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=None,
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect("/api/v1/ws?token=invalid-token"):
                pass

    assert exc_info.value.code == 1008


# ============================================================
# INACTIVE / UNKNOWN USER
# ============================================================


def test_websocket_rejects_unknown_user(
    client,
    auth_token,
):
    """
    If JWT authentication cannot resolve an active user,
    the connection must be rejected.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=None,
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(f"/api/v1/ws?token={auth_token}"):
                pass

    assert exc_info.value.code == 1008


# ============================================================
# MULTIPLE CONNECTIONS
# ============================================================


def test_websocket_supports_multiple_user_connections(
    client,
    test_user,
    auth_token,
):
    """
    A user may have multiple active WebSocket sessions.

    This validates the manager's:

        user_id -> set[WebSocket]

    design.
    """

    with patch(
        "src.api.websocket._get_user_from_token",
        return_value=test_user,
    ):
        with client.websocket_connect(
            f"/api/v1/ws?token={auth_token}"
        ) as websocket_one:
            websocket_one.receive_json()

            with client.websocket_connect(
                f"/api/v1/ws?token={auth_token}"
            ) as websocket_two:
                websocket_two.receive_json()

                assert websocket_manager.connection_count(test_user.id) == 2

            assert websocket_manager.connection_count(test_user.id) == 1

        assert websocket_manager.connection_count(test_user.id) == 0
