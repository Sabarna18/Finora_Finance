import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "../store/auth.store";
import { useNotificationStore } from "../store/notification.store";
import type { Notification } from "../types/api";

// ============================================================
// TYPES
// ============================================================

type WebSocketMessage = {
  event?: string;
  type?: string;
  data?: unknown;
};

type UseNotificationSocketReturn = {
  isConnected: boolean;
  reconnecting: boolean;
  lastError: string | null;
  connect: () => void;
  disconnect: () => void;
};

// ============================================================
// CONSTANTS
// ============================================================

const HEARTBEAT_INTERVAL = 30_000;

const INITIAL_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

const API_PREFIX = "/api/v1";
const WS_PATH = "/ws";

const WS_LOG_PREFIX = "[Finora WS]";

const WS_DEBUG =
  import.meta.env.VITE_NOTIFICATION_WS_DEBUG === "true";

// ============================================================
// DEVELOPMENT LOGGING
// ============================================================

function wsLog(...args: unknown[]) {
  if (!WS_DEBUG) {
    return;
  }

  console.debug(WS_LOG_PREFIX, ...args);
}

function wsInfo(...args: unknown[]) {
  if (!WS_DEBUG) {
    return;
  }

  console.info(WS_LOG_PREFIX, ...args);
}

function wsWarn(...args: unknown[]) {
  if (!WS_DEBUG) {
    return;
  }

  console.warn(WS_LOG_PREFIX, ...args);
}

function wsError(...args: unknown[]) {
  if (!WS_DEBUG) {
    return;
  }

  console.error(WS_LOG_PREFIX, ...args);
}

// ============================================================
// RUNTIME TYPE GUARDS
// ============================================================

function isWebSocketMessage(
  value: unknown
): value is WebSocketMessage {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isNotification(
  value: unknown
): value is Notification {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const notification =
    value as Record<string, unknown>;

  return (
    typeof notification.id === "number" &&
    typeof notification.user_id === "number" &&
    typeof notification.title === "string" &&
    typeof notification.message === "string" &&
    typeof notification.type === "string" &&
    typeof notification.is_read === "boolean" &&
    typeof notification.created_at === "string"
  );
}

// ============================================================
// API URL NORMALIZATION
// ============================================================

/**
 * Normalizes VITE_API_URL into:
 *
 *   scheme://host/api/v1
 *
 * Supported input examples:
 *
 *   http://localhost:8000
 *   http://localhost:8000/
 *   http://localhost:8000/api/v1
 *   http://localhost:8000/api/v1/
 *
 * The function deliberately prevents:
 *
 *   /api/v1/api/v1
 */
function buildApiBaseUrl(): string {
  const configuredUrl =
    import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      "VITE_API_URL is not configured."
    );
  }

  // Remove trailing slashes.
  let normalizedUrl =
    configuredUrl.replace(/\/+$/, "");

  // Remove an existing API prefix first.
  normalizedUrl =
    normalizedUrl.replace(
      /\/api\/v1$/i,
      ""
    );

  // Add exactly one API prefix.
  normalizedUrl =
    `${normalizedUrl}${API_PREFIX}`;

  return normalizedUrl;
}

// ============================================================
// WEBSOCKET URL
// ============================================================

/**
 * Builds the authenticated WebSocket URL.
 *
 * Example:
 *
 * VITE_API_URL:
 *   http://localhost:8000
 *
 * becomes:
 *
 *   ws://localhost:8000/api/v1/ws?token=...
 *
 * Production:
 *
 * VITE_API_URL:
 *   https://finora-backend-latest.onrender.com
 *
 * becomes:
 *
 *   wss://finora-backend-latest.onrender.com/api/v1/ws?token=...
 */
function buildWebSocketUrl(
  token: string
): string {
  const apiBaseUrl =
    buildApiBaseUrl();

  const websocketBaseUrl =
    apiBaseUrl
      .replace(
        /^https:\/\//i,
        "wss://"
      )
      .replace(
        /^http:\/\//i,
        "ws://"
      );

  const encodedToken =
    encodeURIComponent(token);

  return (
    `${websocketBaseUrl}${WS_PATH}` +
    `?token=${encodedToken}`
  );
}

/**
 * Safe version used exclusively for logging.
 *
 * Never exposes the JWT.
 */
function getSafeWebSocketUrl(): string {
  const apiBaseUrl =
    buildApiBaseUrl();

  const websocketBaseUrl =
    apiBaseUrl
      .replace(
        /^https:\/\//i,
        "wss://"
      )
      .replace(
        /^http:\/\//i,
        "ws://"
      );

  return (
    `${websocketBaseUrl}${WS_PATH}` +
    "?token=[REDACTED]"
  );
}

// ============================================================
// HOOK
// ============================================================

export function useNotificationSocket(): UseNotificationSocketReturn {
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  const token = useAuthStore(
    (state) => state.token
  );

  const isAuthenticated =
    useAuthStore(
      (state) => state.isAuthenticated
    );

  // ----------------------------------------------------------
  // NOTIFICATION STORE
  // ----------------------------------------------------------

  const addNotification =
    useNotificationStore(
      (state) => state.addNotification
    );

  // ----------------------------------------------------------
  // WEBSOCKET REFS
  // ----------------------------------------------------------

  const socketRef =
    useRef<WebSocket | null>(null);

  const heartbeatTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const reconnectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const reconnectAttemptRef =
    useRef(0);

  const manuallyClosedRef =
    useRef(false);

  const connectingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  // ----------------------------------------------------------
  // CONNECT FUNCTION REF
  // ----------------------------------------------------------
  // Keeps a reference to the latest connect callback.
  //
  // This prevents the reconnect timer from directly
  // referencing `connect` before its declaration while
  // preserving the existing reconnect workflow.
  // ----------------------------------------------------------

  const connectRef =
    useRef<() => void>(() => {});

  // ----------------------------------------------------------
  // REACT STATE
  // ----------------------------------------------------------

  const [isConnected, setIsConnected] =
    useState(false);

  const [reconnecting, setReconnecting] =
    useState(false);

  const [lastError, setLastError] =
    useState<string | null>(null);

  // ==========================================================
  // CLEAR HEARTBEAT
  // ==========================================================

  const clearHeartbeat =
    useCallback(() => {
      if (
        heartbeatTimerRef.current !== null
      ) {
        clearInterval(
          heartbeatTimerRef.current
        );

        heartbeatTimerRef.current = null;

        wsLog(
          "Heartbeat timer cleared."
        );
      }
    }, []);

  // ==========================================================
  // CLEAR RECONNECT TIMER
  // ==========================================================

  const clearReconnectTimer =
    useCallback(() => {
      if (
        reconnectTimerRef.current !== null
      ) {
        clearTimeout(
          reconnectTimerRef.current
        );

        reconnectTimerRef.current = null;

        wsLog(
          "Reconnect timer cleared."
        );
      }
    }, []);

  // ==========================================================
  // START HEARTBEAT
  // ==========================================================

  const startHeartbeat =
    useCallback(() => {
      clearHeartbeat();

      wsLog(
        `Starting heartbeat every ${
          HEARTBEAT_INTERVAL / 1000
        }s.`
      );

      heartbeatTimerRef.current =
        setInterval(() => {
          const socket =
            socketRef.current;

          if (
            socket &&
            socket.readyState ===
              WebSocket.OPEN
          ) {
            wsLog(
              "Sending heartbeat → ping"
            );

            socket.send("ping");

            return;
          }

          wsWarn(
            "Heartbeat skipped because WebSocket is not OPEN."
          );
        }, HEARTBEAT_INTERVAL);
    }, [clearHeartbeat]);

  // ==========================================================
  // HANDLE WEBSOCKET MESSAGE
  // ==========================================================

  const handleMessage =
    useCallback(
      (
        messageEvent: MessageEvent<string>
      ) => {
        wsLog(
          "Raw message received ←",
          messageEvent.data
        );

        let parsed: unknown;

        // ----------------------------------------------------
        // PARSE JSON
        // ----------------------------------------------------

        try {
          parsed = JSON.parse(
            messageEvent.data
          );
        } catch {
          // Backend can return plain-text "pong".
          if (
            messageEvent.data === "pong"
          ) {
            wsLog(
              "Heartbeat response received ← pong"
            );

            return;
          }

          wsWarn(
            "Ignoring invalid JSON message.",
            messageEvent.data
          );

          return;
        }

        // ----------------------------------------------------
        // VALIDATE MESSAGE
        // ----------------------------------------------------

        if (
          !isWebSocketMessage(parsed)
        ) {
          wsWarn(
            "Ignoring invalid WebSocket payload.",
            parsed
          );

          return;
        }

        // ----------------------------------------------------
        // CONNECTION READY
        // ----------------------------------------------------

        if (
          parsed.event ===
          "connection.ready"
        ) {
          wsInfo(
            "Server confirmed WebSocket connection.",
            parsed.data
          );

          return;
        }

        // ----------------------------------------------------
        // PONG
        // ----------------------------------------------------

        if (
          parsed.event === "pong" ||
          parsed.type === "pong"
        ) {
          wsLog(
            "Heartbeat response received ← pong"
          );

          return;
        }

        // ----------------------------------------------------
        // NOTIFICATION CREATED
        // ----------------------------------------------------

        if (
          parsed.event ===
          "notification.created"
        ) {
          wsInfo(
            "Notification event received.",
            parsed.data
          );

          if (
            !isNotification(
              parsed.data
            )
          ) {
            wsWarn(
              "Notification payload failed validation.",
              parsed.data
            );

            return;
          }

          wsInfo(
            "Adding notification to Zustand store.",
            {
              id: parsed.data.id,
              type: parsed.data.type,
              title: parsed.data.title,
              is_read:
                parsed.data.is_read,
            }
          );

          addNotification(
            parsed.data
          );

          wsInfo(
            "Notification added successfully.",
            {
              id: parsed.data.id,
            }
          );

          return;
        }

        // ----------------------------------------------------
        // UNKNOWN EVENT
        // ----------------------------------------------------

        wsLog(
          "Unhandled WebSocket event.",
          {
            event:
              parsed.event ??
              parsed.type,
            data: parsed.data,
          }
        );
      },
      [addNotification]
    );

  // ==========================================================
  // CONNECT
  // ==========================================================

  const connect =
    useCallback(() => {
      // ------------------------------------------------------
      // MOUNT GUARD
      // ------------------------------------------------------

      if (!mountedRef.current) {
        wsLog(
          "Connection skipped: hook is unmounted."
        );

        return;
      }

      // ------------------------------------------------------
      // AUTH GUARD
      // ------------------------------------------------------

      if (
        !isAuthenticated ||
        !token
      ) {
        wsLog(
          "Connection skipped: user is not authenticated."
        );

        return;
      }

      // ------------------------------------------------------
      // CONNECTION GUARD
      // ------------------------------------------------------

      if (
        connectingRef.current
      ) {
        wsLog(
          "Connection skipped: connection attempt already in progress."
        );

        return;
      }

      // ------------------------------------------------------
      // EXISTING SOCKET GUARD
      // ------------------------------------------------------

      if (
        socketRef.current &&
        (
          socketRef.current.readyState ===
            WebSocket.OPEN ||
          socketRef.current.readyState ===
            WebSocket.CONNECTING
        )
      ) {
        wsLog(
          "Connection skipped: WebSocket already OPEN or CONNECTING."
        );

        return;
      }

      connectingRef.current =
        true;

      manuallyClosedRef.current =
        false;

      setLastError(null);

      // ------------------------------------------------------
      // CREATE SOCKET
      // ------------------------------------------------------

      let websocketUrl: string;

      try {
        websocketUrl =
          buildWebSocketUrl(
            token
          );
      } catch (error) {
        connectingRef.current =
          false;

        const message =
          error instanceof Error
            ? error.message
            : "Failed to build WebSocket URL.";

        setLastError(message);

        wsError(
          "Failed to build WebSocket URL.",
          error
        );

        return;
      }

      wsInfo(
        "Opening WebSocket connection.",
        {
          url: getSafeWebSocketUrl(),
          attempt:
            reconnectAttemptRef.current,
        }
      );

      const socket =
        new WebSocket(
          websocketUrl
        );

      socketRef.current =
        socket;

      // ------------------------------------------------------
      // ON OPEN
      // ------------------------------------------------------

      socket.onopen = () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        connectingRef.current =
          false;

        reconnectAttemptRef.current =
          0;

        setIsConnected(true);

        setReconnecting(false);

        setLastError(null);

        wsInfo(
          "WebSocket connection established.",
          {
            readyState:
              socket.readyState,
          }
        );

        startHeartbeat();
      };

      // ------------------------------------------------------
      // ON MESSAGE
      // ------------------------------------------------------

      socket.onmessage =
        handleMessage;

      // ------------------------------------------------------
      // ON ERROR
      // ------------------------------------------------------

      socket.onerror = (
        event
      ) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setLastError(
          "Notification connection encountered an error."
        );

        wsError(
          "WebSocket connection error.",
          event
        );
      };

      // ------------------------------------------------------
      // ON CLOSE
      // ------------------------------------------------------

      socket.onclose = (
        event
      ) => {
        connectingRef.current =
          false;

        clearHeartbeat();

        socketRef.current =
          null;

        wsWarn(
          "WebSocket connection closed.",
          {
            code: event.code,
            reason:
              event.reason ||
              "(no reason)",
            wasClean:
              event.wasClean,
          }
        );

        if (
          !mountedRef.current
        ) {
          return;
        }

        setIsConnected(false);

        // ----------------------------------------------------
        // MANUAL DISCONNECT
        // ----------------------------------------------------

        if (
          manuallyClosedRef.current
        ) {
          wsInfo(
            "WebSocket closed intentionally by client."
          );

          setReconnecting(false);

          return;
        }

        // ----------------------------------------------------
        // AUTHENTICATION LOST
        // ----------------------------------------------------

        if (
          !isAuthenticated ||
          !token
        ) {
          wsWarn(
            "WebSocket closed because authentication is unavailable."
          );

          setReconnecting(false);

          return;
        }

        // ----------------------------------------------------

        const attempt =
          reconnectAttemptRef.current;

        const delay =
          Math.min(
            INITIAL_RECONNECT_DELAY *
              Math.pow(2, attempt),
            MAX_RECONNECT_DELAY
          );

        reconnectAttemptRef.current +=
          1;

        setReconnecting(true);

        clearReconnectTimer();

        wsInfo(
          "Scheduling WebSocket reconnect.",
          {
            attempt:
              attempt + 1,
            delayMs: delay,
          }
        );

        reconnectTimerRef.current =
          setTimeout(() => {
            reconnectTimerRef.current =
              null;

            if (
              !mountedRef.current
            ) {
              return;
            }

            wsInfo(
              "Executing WebSocket reconnect."
            );

            // Use the latest connect callback instead of
            // directly referencing `connect` here.
            connectRef.current();
          }, delay);
      };
    }, [
      token,
      isAuthenticated,
      handleMessage,
      startHeartbeat,
      clearHeartbeat,
      clearReconnectTimer,
    ]);

  // ==========================================================
  // KEEP LATEST CONNECT FUNCTION
  // ==========================================================
  //
  // The reconnect timer accesses connectRef.current()
  // instead of connect() directly. Updating the ref here
  // guarantees that reconnect always uses the latest
  // callback/closure.
  //
  // NOTE: this assignment must not happen during render
  // (refs are not meant to be written while rendering), so
  // it is performed inside an effect that re-runs whenever
  // `connect` is recreated. Because effects run in the order
  // they are declared, this effect always commits before the
  // lifecycle effect below, so the lifecycle effect (and any
  // scheduled reconnect timer) will always observe the latest
  // `connect` closure.
  // ==========================================================

  useEffect(() => {
    connectRef.current =
      connect;
  }, [connect]);

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  const disconnect =
    useCallback(() => {
      wsInfo(
        "Disconnect requested."
      );

      manuallyClosedRef.current =
        true;

      connectingRef.current =
        false;

      clearHeartbeat();

      clearReconnectTimer();

      reconnectAttemptRef.current =
        0;

      const socket =
        socketRef.current;

      socketRef.current =
        null;

      if (socket) {
        wsLog(
          "Closing WebSocket.",
          {
            readyState:
              socket.readyState,
          }
        );

        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState ===
            WebSocket.OPEN ||
          socket.readyState ===
            WebSocket.CONNECTING
        ) {
          socket.close(
            1000,
            "Client disconnected"
          );
        }
      }

      if (
        mountedRef.current
      ) {
        setIsConnected(false);
        setReconnecting(false);
      }
    }, [
      clearHeartbeat,
      clearReconnectTimer,
    ]);

  // ==========================================================
  // AUTHENTICATION / LIFECYCLE
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    wsLog(
      "Notification WebSocket lifecycle effect.",
      {
        isAuthenticated,
        hasToken: Boolean(token),
      }
    );

    // NOTE: `connect()` / `disconnect()` synchronously update
    // state (e.g. setLastError, setIsConnected). Invoking them
    // directly in the effect body causes a synchronous
    // setState-during-effect cascade. Deferring via
    // queueMicrotask preserves the exact same behavior and
    // timing from the app's perspective (it still runs
    // immediately after this render commits) while avoiding
    // the synchronous render → effect → setState chain.
    if (
      isAuthenticated &&
      token
    ) {
      manuallyClosedRef.current =
        false;

      queueMicrotask(() => {
        connect();
      });
    } else {
      queueMicrotask(() => {
        disconnect();
      });
    }

    return () => {
      mountedRef.current =
        false;

      wsLog(
        "Notification WebSocket hook cleanup."
      );

      disconnect();
    };
  }, [
    isAuthenticated,
    token,
    connect,
    disconnect,
  ]);

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {
    isConnected,
    reconnecting,
    lastError,
    connect,
    disconnect,
  };
}