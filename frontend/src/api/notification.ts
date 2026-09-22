// ======================================================
// src/api/notification.ts
// Finora Notification API
// ======================================================
//
// Responsibilities:
//
//   - Fetch authenticated user's notifications
//   - Fetch unread notification count
//   - Mark one notification as read
//   - Mark all notifications as read
//   - Delete a notification
//
// Authentication is handled centrally by the Axios client.
//
// IMPORTANT:
// The Axios client already contains:
//
//     /api/v1
//
// Therefore this module MUST NOT repeat /api/v1.
// ======================================================

import { api } from "./client";

import type {
  DeleteNotificationResponse,
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "../types/api";


// ======================================================
// ENDPOINT
// ======================================================

const NOTIFICATIONS_ENDPOINT = "/notifications";


// ======================================================
// GET NOTIFICATIONS
// ======================================================
//
// Returns:
//   - user's notifications
//   - current unread count
//
// Backend contract:
//   GET /api/v1/notifications
//
// Axios resolves this as:
//   GET /notifications
//
// because /api/v1 is already configured in the client.
// ======================================================

export async function getNotifications(): Promise<NotificationListResponse> {

  const response =
    await api.get<NotificationListResponse>(
      NOTIFICATIONS_ENDPOINT
    );

  return response.data;
}


// ======================================================
// GET UNREAD COUNT
// ======================================================
//
// Returns only the unread notification count.
//
// Backend:
//   GET /api/v1/notifications/unread-count
// ======================================================

export async function getUnreadNotificationCount(): Promise<number> {

  const response =
    await api.get<NotificationUnreadCountResponse>(
      `${NOTIFICATIONS_ENDPOINT}/unread-count`
    );

  return response.data.unread_count;
}


// ======================================================
// MARK ONE NOTIFICATION AS READ
// ======================================================
//
// Backend:
//   PATCH /api/v1/notifications/{notification_id}/read
//
// Returns the updated notification.
// ======================================================

export async function markNotificationAsRead(
  notificationId: number
): Promise<Notification> {

  const response =
    await api.patch<Notification>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`
    );

  return response.data;
}


// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================
//
// Backend:
//   PATCH /api/v1/notifications/read-all
//
// Returns the number of notifications updated.
//
// The backend service tracks the number of unread
// notifications changed by the operation.
// ======================================================

export async function markAllNotificationsAsRead(): Promise<number> {

  const response =
    await api.patch<{ updated: number }>(
      `${NOTIFICATIONS_ENDPOINT}/read-all`
    );

  return response.data.updated;
}


// ======================================================
// DELETE NOTIFICATION
// ======================================================
//
// Backend:
//   DELETE /api/v1/notifications/{notification_id}
//
// Only the authenticated user's own notification can
// be deleted by the backend.
// ======================================================

export async function deleteNotification(
  notificationId: number
): Promise<DeleteNotificationResponse> {

  const response =
    await api.delete<DeleteNotificationResponse>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}`
    );

  return response.data;
}

