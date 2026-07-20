import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "📈" },
  { path: "/analyze", label: "Analyze", icon: "🔍" },
  { path: "/history", label: "History", icon: "📜" },
  { path: "/portfolio", label: "Portfolio", icon: "💼" },
  { path: "/trades", label: "Trades", icon: "💱" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] transform transition-transform duration-300 ease-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ height: "calc(100vh - var(--header-height))", marginTop: "var(--header-height)" }}
      >
        <nav style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                background: isActive ? "var(--color-bg-elevated)" : "transparent",
                textDecoration: "none",
                transition: "all var(--duration-fast) var(--ease-out)",
              })}
            >
              <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}