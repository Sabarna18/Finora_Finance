// ======================================================
// src/stores/notification.store.ts
// Finora Notification Store
// ======================================================
//
// Responsibilities:
//
//   - Maintain notification state
//   - Load notifications from REST API
//   - Maintain unread count
//   - Mark individual notifications as read
//   - Mark all notifications as read
//   - Delete notifications
//   - Accept real-time notifications from WebSocket layer
//
// Architecture:
//
//   REST API
//       │
//       ▼
//   Notification Store
//       ▲
//       │
//   WebSocket Service
//
// IMPORTANT:
//
// This store does NOT own the WebSocket connection.
//
// The WebSocket service should communicate with this store
// through the real-time actions provided below.
//
// PostgreSQL remains the source of truth.
// Zustand only maintains the current frontend state.
// ======================================================

import { create } from "zustand";

import type {
  Notification,
} from "../types/api";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notification";


// ======================================================
// STORE TYPES
// ======================================================

type NotificationStore = {

  // ====================================================
  // STATE
  // ====================================================

  notifications: Notification[];

  unreadCount: number;

  isLoading: boolean;

  isFetching: boolean;

  isInitializing: boolean;

  error: string | null;


  // ====================================================
  // ACTIONS
  // ====================================================

  fetchNotifications: () => Promise<void>;

  refreshUnreadCount: () => Promise<void>;

  markAsRead: (
    notificationId: number
  ) => Promise<void>;

  markAllAsRead: () => Promise<void>;

  removeNotification: (
    notificationId: number
  ) => Promise<void>;


  // ====================================================
  // REAL-TIME ACTIONS
  // ====================================================

  addNotification: (
    notification: Notification
  ) => void;

  updateNotification: (
    notification: Notification
  ) => void;


  // ====================================================
  // LOCAL STATE ACTIONS
  // ====================================================

  clearNotifications: () => void;

  clearError: () => void;
};


// ======================================================
// STORE
// ======================================================

export const useNotificationStore =

  create<NotificationStore>((set) => ({

    // ==================================================
    // INITIAL STATE
    // ==================================================

    notifications: [],

    unreadCount: 0,

    isLoading: false,

    isFetching: false,

    isInitializing: true,

    error: null,


    // ==================================================
    // FETCH NOTIFICATIONS
    // ==================================================
    //
    // Loads the authenticated user's notifications.
    //
    // This should normally be called:
    //
    //   - when the authenticated application starts
    //   - when the notification panel opens
    //   - after reconnecting the WebSocket
    //
    // The backend response contains both:
    //
    //   notifications
    //   unread_count
    //
    // Therefore both pieces of state are updated together.
    // ==================================================

    fetchNotifications: async () => {

      set({
        isLoading: true,
        error: null,
      });

      try {

        // --------------------------------------------
        // FETCH NOTIFICATIONS
        // --------------------------------------------

        const response =
          await getNotifications();


        // --------------------------------------------
        // UPDATE STATE
        // --------------------------------------------

        set({

          notifications:
            response.notifications,

          unreadCount:
            response.unread_count,

          isLoading: false,

          isInitializing: false,

          error: null,

        });

      }

      catch (error) {

        console.error(
          "Failed to fetch notifications:",
          error
        );

        set({

          isLoading: false,

          isInitializing: false,

          error:
            "Failed to load notifications.",

        });

        throw error;
      }
    },


    // ==================================================
    // REFRESH UNREAD COUNT
    // ==================================================
    //
    // Lightweight endpoint used when only the badge
    // count needs to be synchronized.
    //
    // Useful for:
    //
    //   - navbar notification badge
    //   - sidebar badge
    //   - background synchronization
    // ==================================================

    refreshUnreadCount: async () => {

      try {

        const unreadCount =
          await getUnreadNotificationCount();

        set({
          unreadCount,
        });

      }

      catch (error) {

        console.error(
          "Failed to fetch unread notification count:",
          error
        );

        throw error;
      }
    },


    // ==================================================
    // MARK ONE AS READ
    // ==================================================
    //
    // Backend updates the persistent notification.
    //
    // After successful response, replace the local
    // notification with the server representation.
    //
    // This prevents the frontend from assuming the
    // resulting state instead of using the backend's
    // authoritative response.
    // ==================================================

    markAsRead: async (
      notificationId
    ) => {

      try {

        const updatedNotification =
          await markNotificationAsRead(
            notificationId
          );


        set((state) => ({

          notifications:
            state.notifications.map(
              (notification) =>
                notification.id === notificationId
                  ? updatedNotification
                  : notification
            ),

          unreadCount:
            Math.max(
              0,
              state.unreadCount -
                (
                  state.notifications.find(
                    (notification) =>
                      notification.id ===
                      notificationId
                  )?.is_read
                    ? 0
                    : 1
                )
            ),

        }));

      }

      catch (error) {

        console.error(
          "Failed to mark notification as read:",
          error
        );

        throw error;
      }
    },


    // ==================================================
    // MARK ALL AS READ
    // ==================================================
    //
    // Backend returns the number of notifications
    // changed.
    //
    // Once successful, update the local collection
    // rather than refetching the entire list.
    // ==================================================

    markAllAsRead: async () => {

      try {

        await markAllNotificationsAsRead();


        set((state) => ({

          notifications:
            state.notifications.map(
              (notification) => ({

                ...notification,

                is_read: true,

                read_at:
                  notification.read_at ??
                  new Date().toISOString(),

              })
            ),

          unreadCount: 0,

        }));

      }

      catch (error) {

        console.error(
          "Failed to mark all notifications as read:",
          error
        );

        throw error;
      }
    },


    // ==================================================
    // DELETE NOTIFICATION
    // ==================================================
    //
    // Backend performs ownership validation.
    //
    // Only remove the notification locally after the
    // DELETE request succeeds.
    // ==================================================

    removeNotification: async (
      notificationId
    ) => {

      try {

        await deleteNotification(
          notificationId
        );


        set((state) => {

          const notification =
            state.notifications.find(
              (item) =>
                item.id === notificationId
            );


          return {

            notifications:
              state.notifications.filter(
                (item) =>
                  item.id !== notificationId
              ),

            unreadCount:
              notification && !notification.is_read
                ? Math.max(
                    0,
                    state.unreadCount - 1
                  )
                : state.unreadCount,

          };

        });

      }

      catch (error) {

        console.error(
          "Failed to delete notification:",
          error
        );

        throw error;
      }
    },


    // ==================================================
    // ADD REAL-TIME NOTIFICATION
    // ==================================================
    //
    // Called by the WebSocket layer when the backend
    // pushes a newly-created notification.
    //
    // The notification is inserted at the beginning
    // because the newest notification should appear first.
    //
    // Duplicate protection is included because a
    // notification can potentially arrive through:
    //
    //   - WebSocket
    //   - REST refresh
    //
    // ==================================================

    addNotification: (
      notification
    ) => {

      set((state) => {

        const alreadyExists =
          state.notifications.some(
            (item) =>
              item.id === notification.id
          );


        if (alreadyExists) {

          return state;
        }


        return {

          notifications: [
            notification,
            ...state.notifications,
          ],

          unreadCount:
            notification.is_read
              ? state.unreadCount
              : state.unreadCount + 1,

        };

      });

    },


    // ==================================================
    // UPDATE REAL-TIME NOTIFICATION
    // ==================================================
    //
    // Used when a WebSocket event represents an update
    // to an existing notification.
    //
    // If the notification does not currently exist,
    // it is added.
    // ==================================================

    updateNotification: (
      notification
    ) => {

      set((state) => {

        const exists =
          state.notifications.some(
            (item) =>
              item.id === notification.id
          );


        if (!exists) {

          return {

            notifications: [
              notification,
              ...state.notifications,
            ],

            unreadCount:
              notification.is_read
                ? state.unreadCount
                : state.unreadCount + 1,

          };

        }


        const previousNotification =
          state.notifications.find(
            (item) =>
              item.id === notification.id
          );


        let unreadCount =
          state.unreadCount;


        // --------------------------------------------
        // UNREAD → READ
        // --------------------------------------------

        if (
          previousNotification &&
          !previousNotification.is_read &&
          notification.is_read
        ) {

          unreadCount =
            Math.max(
              0,
              unreadCount - 1
            );

        }


        // --------------------------------------------
        // READ → UNREAD
        // --------------------------------------------

        else if (
          previousNotification &&
          previousNotification.is_read &&
          !notification.is_read
        ) {

          unreadCount += 1;

        }


        return {

          notifications:
            state.notifications.map(
              (item) =>
                item.id === notification.id
                  ? notification
                  : item
            ),

          unreadCount,

        };

      });

    },


    // ==================================================
    // CLEAR NOTIFICATIONS
    // ==================================================
    //
    // Used during logout.
    //
    // Important:
    // Notifications belong to the authenticated user,
    // therefore they must not survive a user session.
    // ==================================================

    clearNotifications: () => {

      set({

        notifications: [],

        unreadCount: 0,

        isLoading: false,

        isFetching: false,

        isInitializing: true,

        error: null,

      });

    },


    // ==================================================
    // CLEAR ERROR
    // ==================================================

    clearError: () => {

      set({
        error: null,
      });

    },

  }));

