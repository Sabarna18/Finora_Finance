import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotification";

interface NotificationBellProps {
    onClick: () => void;
    isOpen?: boolean;
    className?: string;
}

export default function NotificationBell({
    onClick,
    isOpen = false,
    className = "",
}: NotificationBellProps) {
    const { unreadCount } = useNotifications();

    const hasUnread = unreadCount > 0;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={
                hasUnread
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
            }
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            className={`
        relative
        inline-flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        text-slate-500
        transition
        duration-200
        hover:bg-slate-100
        hover:text-slate-700
        focus:outline-none
        focus:ring-2
        focus:ring-slate-300
        dark:text-slate-400
        dark:hover:bg-slate-800
        dark:hover:text-slate-200
        dark:focus:ring-slate-600
        ${isOpen ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : ""}
        ${className}
      `}
        >
            <Bell
                className="h-5 w-5"
                strokeWidth={isOpen || hasUnread ? 2.2 : 1.8}
            />

            {hasUnread && (
                <span
                    aria-hidden="true"
                    className="
            absolute
            right-1.5
            top-1.5
            flex
            min-h-4
            min-w-4
            items-center
            justify-center
            rounded-full
            bg-red-500
            px-1
            text-[10px]
            font-semibold
            leading-none
            text-white
            ring-2
            ring-white
            dark:ring-slate-900
          "
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </button>
    );
}