import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  FileCode2Icon,
} from "lucide-react";
import  Logo  from "../brands/Logo";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/auth.store";

// ======================================================
// NAVIGATION
// ======================================================
const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Budgets", href: "/budgets", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  {label: "About Us", href: "/about", icon:FileCode2Icon},
];

// ======================================================
// COMPONENT
// ======================================================
export default function Sidebar() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className="
        hidden lg:flex
        fixed left-0 top-0 z-40
        h-screen w-64
        flex-col
        bg-zinc-950
        border-r border-zinc-800/60
      "
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >

      {/* ── Brand ──────────────────────────────────────── */}

      <div
        className="
    h-16
    px-6
    border-b
    flex
    items-center
  "
      >
        <Logo
          variant="full"
          size="md"
        />
      </div>


      {/* ── Nav label ──────────────────────────────────── */}
      <p className="px-5 pt-6 pb-2 text-[10px] font-semibold tracking-widest uppercase text-zinc-600 shrink-0">
        Menu
      </p>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  `
                  group relative
                  flex items-center gap-3
                  rounded-lg px-3 py-2.5
                  text-[13px] font-medium
                  transition-all duration-150
                  `,
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active accent bar */}
                  {isActive && (
                    <span
                      className="
                        absolute left-0 top-1/2 -translate-y-1/2
                        w-[3px] h-5 rounded-r-full
                        bg-gradient-to-b from-emerald-400 to-teal-500
                      "
                    />
                  )}

                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />

                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User / Logout ───────────────────────────────── */}
      <div className="shrink-0 border-t border-zinc-800/60 p-3">
        {/* User row */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div
              className="
                h-7 w-7 rounded-full shrink-0
                bg-gradient-to-br from-violet-500 to-purple-700
                flex items-center justify-center
                text-[11px] font-bold text-white uppercase
              "
            >
              {(user.name ?? user.email ?? "U")[0]}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[12px] font-medium text-zinc-200 truncate">
                {user.name ?? "User"}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {user.email ?? ""}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3
            rounded-lg px-3 py-2.5
            text-[13px] font-medium
            text-zinc-500
            hover:bg-red-500/10 hover:text-red-400
            transition-all duration-150
          "
        >
          <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}