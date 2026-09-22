import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Info,
  Receipt,
  Settings,
  WalletCards,
  X,
} from "lucide-react";

import { useEffect, useRef } from "react";
import { useNotifications } from "../../hooks/useNotification";

type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "budget_alert"
  | "budget_exceeded"
  | "transaction"
  | "system";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "budget_alert":
      return <WalletCards className="h-4 w-4" />;

    case "budget_exceeded":
      return <AlertTriangle className="h-4 w-4" />;

    case "transaction":
      return <Receipt className="h-4 w-4" />;

    case "success":
      return <CheckCircle2 className="h-4 w-4" />;

    case "warning":
      return <CircleAlert className="h-4 w-4" />;

    case "system":
      return <Settings className="h-4 w-4" />;

    case "info":
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getNotificationIconClass(type: NotificationType) {
  switch (type) {
    case "budget_alert":
      return "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";

    case "budget_exceeded":
      return "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400";

    case "transaction":
      return "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";

    case "success":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "warning":
      return "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";

    case "system":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

    case "info":
    default:
      return "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
  }
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
}

export default function NotificationPanel({
  isOpen,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  /*
   * Close the panel when the user clicks outside it.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, [isOpen, onClose]);

  /*
   * Escape closes the notification panel.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
      className="
        absolute
        right-0
        top-12
        z-50
        w-[calc(100vw-2rem)]
        max-w-md
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-xl
        shadow-slate-900/10
        dark:border-slate-700
        dark:bg-slate-900
        dark:shadow-black/30
      "
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-200
          px-4
          py-3
          dark:border-slate-700
        "
      >
        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-slate-100
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            <Bell className="h-4 w-4" />
          </div>

          <div>
            <h2
              className="
                text-sm
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              Notifications
            </h2>

            <p
              className="
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-600
            focus:outline-none
            focus:ring-2
            focus:ring-slate-300
            dark:hover:bg-slate-800
            dark:hover:text-slate-200
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Toolbar */}
      {notifications.length > 0 && (
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-4
            py-2
            dark:border-slate-800
          "
        >
          <span
            className="
              text-xs
              text-slate-500
              dark:text-slate-400
            "
          >
            Recent activity
          </span>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                void markAllAsRead();
              }}
              className="
                text-xs
                font-medium
                text-slate-600
                transition
                hover:text-slate-900
                dark:text-slate-300
                dark:hover:text-white
              "
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && notifications.length === 0 && (
        <div className="px-4 py-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="
                h-6
                w-6
                animate-spin
                rounded-full
                border-2
                border-slate-200
                border-t-slate-600
                dark:border-slate-700
                dark:border-t-slate-300
              "
            />

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Loading notifications...
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div
            className="
              mx-auto
              mb-3
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-400
              dark:bg-slate-800
              dark:text-slate-500
            "
          >
            <Bell className="h-5 w-5" />
          </div>

          <h3
            className="
              text-sm
              font-medium
              text-slate-900
              dark:text-white
            "
          >
            No notifications
          </h3>

          <p
            className="
              mt-1
              text-xs
              text-slate-500
              dark:text-slate-400
            "
          >
            New alerts and account activity will appear here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div
          className="
            max-h-[min(28rem,calc(100vh-12rem))]
            overflow-y-auto
          "
        >
          {notifications.map((notification) => {
            const type =
              notification.type as NotificationType;

            return (
              <div
                key={notification.id}
                className={`
                  group
                  relative
                  border-b
                  border-slate-100
                  px-4
                  py-3
                  transition
                  last:border-b-0
                  dark:border-slate-800
                  ${
                    notification.is_read
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/80 dark:bg-slate-800/40"
                  }
                `}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`
                      mt-0.5
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${getNotificationIconClass(type)}
                    `}
                  >
                    {getNotificationIcon(type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pr-7">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`
                          text-sm
                          leading-5
                          ${
                            notification.is_read
                              ? "font-medium text-slate-700 dark:text-slate-300"
                              : "font-semibold text-slate-900 dark:text-white"
                          }
                        `}
                      >
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span
                          aria-label="Unread"
                          className="
                            mt-1.5
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                            bg-blue-500
                          "
                        />
                      )}
                    </div>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {notification.message}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="
                          text-[11px]
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        {formatNotificationTime(
                          notification.created_at,
                        )}
                      </span>

                      {!notification.is_read && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">
                            •
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              void markAsRead(
                                notification.id,
                              );
                            }}
                            className="
                              text-[11px]
                              font-medium
                              text-slate-600
                              hover:text-slate-900
                              dark:text-slate-300
                              dark:hover:text-white
                            "
                          >
                            Mark as read
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      void deleteNotification(
                        notification.id,
                      );
                    }}
                    aria-label={`Delete notification: ${notification.title}`}
                    className="
                      absolute
                      right-3
                      top-3
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-md
                      text-slate-300
                      opacity-0
                      transition
                      group-hover:opacity-100
                      hover:bg-slate-200
                      hover:text-slate-600
                      focus:opacity-100
                      focus:outline-none
                      focus:ring-2
                      focus:ring-slate-300
                      dark:text-slate-600
                      dark:hover:bg-slate-700
                      dark:hover:text-slate-300
                    "
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}