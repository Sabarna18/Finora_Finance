import {
  Bell,
  Search,
  Menu,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

// ======================================================
// APP VERSION
// ======================================================

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";

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
// COMPONENT
// ======================================================

export default function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const title =
    titles[location.pathname] || "Finance Tracker";

  const subtitle =
    subtitles[location.pathname] ||
    "Manage your personal finances";

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
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="h-full px-4 lg:px-5 flex items-center justify-between gap-4">

        {/* ── LEFT ─────────────────────────────────────── */}

        <div className="flex items-center gap-3">

          {/* MOBILE MENU */}

          <button
            className="
              lg:hidden
              inline-flex items-center justify-center
              h-9 w-9 rounded-lg
              border border-zinc-700
              text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800
              transition-colors
            "
          >
            <Menu size={16} />
          </button>

          {/* TITLE */}

          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold text-white tracking-tight">
              {title}
            </h1>

            <p className="hidden sm:block text-[11px] text-zinc-500 leading-none mt-0.5">
              {subtitle}
            </p>
          </div>

          {/* APP VERSION */}

          <span
            className="
              hidden sm:inline-flex
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
            "
            title={`Finora v${APP_VERSION}`}
          >
            v{APP_VERSION}
          </span>
        </div>

        {/* ── RIGHT ────────────────────────────────────── */}

        <div className="flex items-center gap-2">

          {/* SEARCH */}

          <div
            className="
              hidden md:flex items-center gap-2
              h-9 w-64
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
                flex-1 bg-transparent
                text-[13px] text-zinc-200
                placeholder:text-zinc-600
                outline-none
              "
            />
          </div>

          {/* NOTIFICATIONS */}

          <button
            className="
              relative
              inline-flex items-center justify-center
              h-9 w-9 rounded-lg
              border border-zinc-700/80
              text-zinc-400
              hover:text-zinc-100 hover:bg-zinc-800
              transition-colors
            "
          >
            <Bell size={16} />

            <span
              className="
                absolute top-1.5 right-1.5
                h-1.5 w-1.5 rounded-full
                bg-emerald-400
                ring-1 ring-zinc-950
              "
            />
          </button>

          {/* USER */}

          <div
            className="
              flex items-center gap-2.5
              rounded-lg
              border border-zinc-700/80
              bg-zinc-800/60
              pl-3 pr-2 py-1.5
            "
          >
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-[12px] font-medium text-zinc-200">
                {user?.name || "User"}
              </p>

              <p className="text-[11px] text-zinc-500 truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>

            <div
              className="
                h-7 w-7 rounded-full shrink-0
                bg-gradient-to-br from-violet-500 to-purple-700
                flex items-center justify-center
                text-[11px] font-bold text-white uppercase
              "
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

