// ======================================================
// src/hooks/useNotification.ts
// Finora Notification Hook
// ======================================================
//
// Responsibilities:
//
//   - Provide a clean React interface to the
//     notification Zustand store.
//   - Coordinate notification initialization.
//   - Expose notification actions to components.
//   - Keep notification business logic out of UI components.
//
// Architecture:
//
//   Component
//      │
//      ▼
//   useNotification()
//      │
//      ▼
//   useNotificationStore
//      │
//      ├── REST API
//      │
//      └── WebSocket events
//
// IMPORTANT:
//
// This hook does NOT create or manage the WebSocket
// connection.
//
// The WebSocket service should push events into the
// notification store through:
//
//   addNotification()
//   updateNotification()
//
// ======================================================

import {
  useCallback,
  useEffect,
} from "react";

import {
  useNotificationStore,
} from "../store/notification.store";


// ======================================================
// HOOK
// ======================================================

export function useNotifications() {

  // ====================================================
  // STORE STATE
  // ====================================================

  const notifications =
    useNotificationStore(
      (state) => state.notifications
    );

  const unreadCount =
    useNotificationStore(
      (state) => state.unreadCount
    );

  const isLoading =
    useNotificationStore(
      (state) => state.isLoading
    );

  const isFetching =
    useNotificationStore(
      (state) => state.isFetching
    );

  const isInitializing =
    useNotificationStore(
      (state) => state.isInitializing
    );

  const error =
    useNotificationStore(
      (state) => state.error
    );


  // ====================================================
  // STORE ACTIONS
  // ====================================================

  const fetchNotifications =
    useNotificationStore(
      (state) => state.fetchNotifications
    );

  const refreshUnreadCount =
    useNotificationStore(
      (state) => state.refreshUnreadCount
    );

  const markAsRead =
    useNotificationStore(
      (state) => state.markAsRead
    );

  const markAllAsRead =
    useNotificationStore(
      (state) => state.markAllAsRead
    );

  const removeNotification =
    useNotificationStore(
      (state) => state.removeNotification
    );

  const addNotification =
    useNotificationStore(
      (state) => state.addNotification
    );

  const updateNotification =
    useNotificationStore(
      (state) => state.updateNotification
    );

  const clearNotifications =
    useNotificationStore(
      (state) => state.clearNotifications
    );

  const clearError =
    useNotificationStore(
      (state) => state.clearError
    );


  // ====================================================
  // INITIALIZE NOTIFICATIONS
  // ====================================================
  //
  // Load notifications once when the hook is mounted.
  //
  // This is intentionally controlled here rather than
  // automatically inside the Zustand store.
  //
  // That keeps the store framework-agnostic and allows
  // components/application shells to control when the
  // notification state is initialized.
  // ====================================================

  useEffect(() => {

    let mounted = true;


    const initialize =
      async () => {

        try {

          await fetchNotifications();

        }

        catch {

          // --------------------------------------------
          // The store already records the error.
          //
          // Do not throw from useEffect because that
          // would create an unhandled promise rejection.
          // --------------------------------------------

          if (!mounted) {
            return;
          }

        }

      };


    initialize();


    return () => {

      mounted = false;

    };

  }, [fetchNotifications]);


  // ====================================================
  // REFRESH
  // ====================================================
  //
  // Explicit refresh operation.
  //
  // Useful when:
  //
  //   - notification panel opens
  //   - user pulls to refresh
  //   - WebSocket reconnects
  //   - application regains focus
  // ====================================================

  const refresh =
    useCallback(async () => {

      await fetchNotifications();

    }, [fetchNotifications]);


  // ====================================================
  // REFRESH UNREAD COUNT
  // ====================================================
  //
  // Lightweight synchronization operation.
  //
  // Does not reload the notification collection.
  // ====================================================

  const refreshUnread =
    useCallback(async () => {

      await refreshUnreadCount();

    }, [refreshUnreadCount]);


  // ====================================================
  // MARK AS READ
  // ====================================================

  const handleMarkAsRead =
    useCallback(
      async (notificationId: number) => {

        await markAsRead(
          notificationId
        );

      },
      [markAsRead]
    );


  // ====================================================
  // MARK ALL AS READ
  // ====================================================

  const handleMarkAllAsRead =
    useCallback(async () => {

      await markAllAsRead();

    }, [markAllAsRead]);


  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete =
    useCallback(
      async (notificationId: number) => {

        await removeNotification(
          notificationId
        );

      },
      [removeNotification]
    );


  // ====================================================
  // REAL-TIME ADD
  // ====================================================
  //
  // Intended for the WebSocket service.
  //
  // Example:
  //
  //   notificationSocket.on("notification", (data) => {
  //
  //     addRealtimeNotification(data);
  //
  //   });
  // ====================================================

  const addRealtimeNotification =
    useCallback(
      (notification: Parameters<typeof addNotification>[0]) => {

        addNotification(
          notification
        );

      },
      [addNotification]
    );


  // ====================================================
  // REAL-TIME UPDATE
  // ====================================================

  const updateRealtimeNotification =
    useCallback(
      (notification: Parameters<typeof updateNotification>[0]) => {

        updateNotification(
          notification
        );

      },
      [updateNotification]
    );


  // ====================================================
  // CLEAR
  // ====================================================
  //
  // Used during logout or user-session termination.
  // ====================================================

  const clear =
    useCallback(() => {

      clearNotifications();

    }, [clearNotifications]);


  // ====================================================
  // ERROR RESET
  // ====================================================

  const resetError =
    useCallback(() => {

      clearError();

    }, [clearError]);


  // ====================================================
  // DERIVED STATE
  // ====================================================

  const hasNotifications =
    notifications.length > 0;

  const hasUnreadNotifications =
    unreadCount > 0;


  // ====================================================
  // PUBLIC HOOK API
  // ====================================================

  return {

    // ----------------------------------------------
    // STATE
    // ----------------------------------------------

    notifications,

    unreadCount,

    isLoading,

    isFetching,

    isInitializing,

    error,

    hasNotifications,

    hasUnreadNotifications,


    // ----------------------------------------------
    // REST ACTIONS
    // ----------------------------------------------

    refresh,

    refreshUnread,

    markAsRead:
      handleMarkAsRead,

    markAllAsRead:
      handleMarkAllAsRead,

    deleteNotification:
      handleDelete,


    // ----------------------------------------------
    // REAL-TIME ACTIONS
    // ----------------------------------------------

    addRealtimeNotification,

    updateRealtimeNotification,


    // ----------------------------------------------
    // LOCAL ACTIONS
    // ----------------------------------------------

    clear,

    resetError,

  };

}

