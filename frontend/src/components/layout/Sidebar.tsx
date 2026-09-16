import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  FileCode2Icon,
  X,
} from "lucide-react";

import Logo from "../brands/Logo";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/auth.store";

// ======================================================
// NAVIGATION
// ======================================================

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    label: "Budgets",
    href: "/budgets",
    icon: Wallet,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "About Us",
    href: "/about",
    icon: FileCode2Icon,
  },
];

// ======================================================
// TYPES
// ======================================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ======================================================
// COMPONENT
// ======================================================

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // ====================================================
  // LOGOUT
  // ====================================================

  function handleLogout() {
    logout();
    onClose();
    navigate("/login", { replace: true });
  }

  // ====================================================
  // NAVIGATION
  // ====================================================

  function handleNavigation() {
    onClose();
  }

  return (
    <>
      {/* ==================================================
          MOBILE OVERLAY
          Sidebar owns its own overlay.
          This keeps the component self-contained.
      ================================================== */}

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="
            fixed
            inset-0
            z-40

            bg-black/60
            backdrop-blur-sm

            lg:hidden
          "
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={cn(
          `
          fixed
          left-0
          top-0
          z-50

          flex
          h-screen
          w-[82vw]
          max-w-64
          flex-col

          border-r
          border-zinc-800/60
          bg-zinc-950

          transition-transform
          duration-300
          ease-in-out

          sm:w-72
          lg:w-64
          lg:max-w-none
          lg:translate-x-0
          `,
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
        style={{
          fontFamily:
            "'DM Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        {/* ==================================================
            BRAND
        ================================================== */}

        <div
          className="
            relative
            flex
            h-16
            shrink-0
            items-center

            border-b
            border-zinc-800/60

            px-4
            sm:px-6
          "
        >
          <Logo
            variant="full"
            size="md"
          />

          {/* ==================================================
              MOBILE CLOSE
          ================================================== */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="
              absolute
              right-3

              flex
              h-9
              w-9
              items-center
              justify-center

              rounded-lg

              text-zinc-500

              transition-colors

              hover:bg-zinc-800
              hover:text-zinc-200

              lg:hidden
            "
          >
            <X
              size={19}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* ==================================================
            NAV LABEL
        ================================================== */}

        <p
          className="
            shrink-0
            px-5
            pb-2
            pt-6

            text-[10px]
            font-semibold
            uppercase
            tracking-widest

            text-zinc-600
          "
        >
          Menu
        </p>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav
          className="
            flex-1
            space-y-0.5
            overflow-y-auto
            px-3
          "
        >
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={handleNavigation}
                className={({ isActive }) =>
                  cn(
                    `
                    group
                    relative

                    flex
                    items-center
                    gap-3

                    rounded-lg
                    px-3
                    py-2.5

                    text-[13px]
                    font-medium

                    transition-all
                    duration-150
                    `,
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}

                    {isActive && (
                      <span
                        className="
                          absolute
                          left-0
                          top-1/2

                          h-5
                          w-[3px]

                          -translate-y-1/2

                          rounded-r-full

                          bg-gradient-to-b
                          from-emerald-400
                          to-teal-500
                        "
                      />
                    )}

                    {/* Icon */}

                    <Icon
                      size={16}
                      strokeWidth={
                        isActive ? 2.2 : 1.8
                      }
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />

                    {/* Label */}

                    <span className="truncate">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ==================================================
            USER / LOGOUT
        ================================================== */}

        <div
          className="
            shrink-0
            border-t
            border-zinc-800/60
            p-3
          "
        >
          {/* User */}

          {user && (
            <div
              className="
                mb-1
                flex
                items-center
                gap-3
                px-3
                py-2.5
              "
            >
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-gradient-to-br
                  from-violet-500
                  to-purple-700

                  text-[11px]
                  font-bold
                  uppercase
                  text-white
                "
              >
                {(user.name ??
                  user.email ??
                  "U")[0]}
              </div>

              <div className="min-w-0 leading-tight">
                <p
                  className="
                    truncate
                    text-[12px]
                    font-medium
                    text-zinc-200
                  "
                >
                  {user.name ?? "User"}
                </p>

                <p
                  className="
                    truncate
                    text-[11px]
                    text-zinc-500
                  "
                >
                  {user.email ?? ""}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              flex
              w-full
              items-center
              gap-3

              rounded-lg
              px-3
              py-2.5

              text-[13px]
              font-medium
              text-zinc-500

              transition-all
              duration-150

              hover:bg-red-500/10
              hover:text-red-400
            "
          >
            <LogOut
              size={16}
              strokeWidth={1.8}
              className="shrink-0"
            />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}