import { Search, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState } from "react";

import { useAuthStore } from "../../store/auth.store";

import NotificationBell from "../cards/NotificationBell";
import NotificationPanel from "../cards/NotificationPanel";

// ======================================================
// APP VERSION
// ======================================================

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION || "dev";

// ======================================================
// PAGE TITLES
// ======================================================

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/categories": "Categories",
  "/budgets": "Budgets",
  "/reports": "Reports",
  "/settings": "Settings",
};

const subtitles: Record<string, string> = {
  "/dashboard": "Your financial overview",
  "/transactions": "Track your spending",
  "/categories": "Organise your expenses",
  "/budgets": "Stay on target",
  "/reports": "Insights & analytics",
  "/settings": "Account preferences",
};

// ======================================================
// TYPES
// ======================================================

interface HeaderProps {
  /**
   * Called when the mobile hamburger button is tapped.
   * Opens the Sidebar.
   */
  onMenuClick: () => void;
}

// ======================================================
// COMPONENT
// ======================================================

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const location = useLocation();

  const user = useAuthStore(
    (state) => state.user
  );

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const title =
    titles[location.pathname] || "Finance Tracker";

  const subtitle =
    subtitles[location.pathname] ||
    "Manage your personal finances";

  function handleToggleNotifications() {
    setNotificationsOpen(
      (previous) => !previous
    );
  }

  function handleCloseNotifications() {
    setNotificationsOpen(false);
  }

  return (
    <header
      className="
        fixed top-0 right-0 left-0
        lg:left-64
        z-30
        h-16
        bg-zinc-950/95
        border-b border-zinc-800/60
        backdrop-blur-sm
      "
      style={{
        fontFamily:
          "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        className="
          h-full
          px-3 sm:px-4 lg:px-5
          flex items-center
          justify-between
          gap-2 sm:gap-4
        "
      >
        {/* ── LEFT ─────────────────────────────────────── */}

        <div
          className="
            flex items-center
            gap-2 sm:gap-3
            min-w-0
          "
        >
          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="
              lg:hidden
              inline-flex items-center justify-center
              h-9 w-9 shrink-0
              rounded-lg
              border border-zinc-700
              text-zinc-400
              hover:text-zinc-100
              hover:bg-zinc-800
              active:scale-95
              transition-all
            "
          >
            <Menu size={18} />
          </button>

          {/* TITLE */}

          <div
            className="
              leading-tight
              min-w-0
            "
          >
            <h1
              className="
                text-[14px] sm:text-[15px]
                font-semibold
                text-white
                tracking-tight
                truncate
              "
            >
              {title}
            </h1>

            <p
              className="
                hidden sm:block
                text-[11px]
                text-zinc-500
                leading-none
                mt-0.5
                truncate
              "
            >
              {subtitle}
            </p>
          </div>

          {/* APP VERSION */}

          <span
            className="
              hidden md:inline-flex
              items-center
              rounded-md
              border border-zinc-700/80
              bg-zinc-800/60
              px-2 py-1
              text-[10px]
              font-medium
              tracking-wide
              text-zinc-400
              uppercase
              shrink-0
            "
            title={`Finora v${APP_VERSION}`}
          >
            v{APP_VERSION}
          </span>
        </div>

        {/* ── RIGHT ────────────────────────────────────── */}

        <div
          className="
            flex items-center
            gap-1.5 sm:gap-2
            shrink-0
          "
        >
          {/* SEARCH */}

          <div
            className="
              hidden md:flex
              items-center
              gap-2
              h-9
              w-48 lg:w-64
              rounded-lg
              border border-zinc-700/80
              bg-zinc-800/60
              px-3
              focus-within:border-zinc-600
              transition-colors
            "
          >
            <Search
              size={14}
              className="text-zinc-500 shrink-0"
            />

            <input
              type="text"
              placeholder="Search..."
              className="
                flex-1
                bg-transparent
                text-[13px]
                text-zinc-200
                placeholder:text-zinc-600
                outline-none
                min-w-0
              "
            />
          </div>

          {/* SEARCH ICON — MOBILE/TABLET */}

          <button
            type="button"
            aria-label="Search"
            className="
              md:hidden
              inline-flex items-center justify-center
              h-9 w-9
              rounded-lg
              border border-zinc-700/80
              text-zinc-400
              hover:text-zinc-100
              hover:bg-zinc-800
              transition-colors
            "
          >
            <Search size={16} />
          </button>

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <div className="relative">
            <NotificationBell
              isOpen={notificationsOpen}
              onClick={handleToggleNotifications}
            />

            <NotificationPanel
              isOpen={notificationsOpen}
              onClose={handleCloseNotifications}
            />
          </div>

          {/* USER */}

          <div
            className="
              flex items-center
              gap-2.5
              rounded-lg
              border border-zinc-700/80
              bg-zinc-800/60
              pl-2 pr-2 py-1.5
              sm:pl-3
            "
          >
            <div
              className="
                hidden sm:block
                text-right
                leading-tight
              "
            >
              <p
                className="
                  text-[12px]
                  font-medium
                  text-zinc-200
                  truncate
                  max-w-[140px]
                "
              >
                {user?.name || "User"}
              </p>

              <p
                className="
                  text-[11px]
                  text-zinc-500
                  truncate
                  max-w-[140px]
                "
              >
                {user?.email}
              </p>
            </div>

            <div
              className="
                h-7 w-7
                rounded-full
                shrink-0
                bg-gradient-to-br
                from-violet-500
                to-purple-700
                flex items-center justify-center
                text-[11px]
                font-bold
                text-white
                uppercase
              "
            >
              {user?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

