import { NavLink } from "react-router-dom";
import { TrendingUp, Search, History, Briefcase, ArrowLeftRight, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: TrendingUp },
  { path: "/analyze", label: "Analyze", icon: Search },
  { path: "/history", label: "History", icon: History },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase },
  { path: "/trades", label: "Trades", icon: ArrowLeftRight },
  { path: "/settings", label: "Settings", icon: Settings },
];

export { NAV_ITEMS };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
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
          "fixed lg:static inset-y-0 left-0 z-50 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] transform transition-all duration-200 ease-out lg:translate-x-0 h-[calc(100vh-var(--header-height))] mt-[var(--header-height)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-72"
        )}
      >
        <TooltipProvider delayDuration={0}>
          <nav style={{ padding: collapsed ? "var(--space-3) var(--space-2)" : "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {NAV_ITEMS.map((item) => {
              const linkContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                    collapsed ? "justify-center h-10 w-10" : "px-4 py-3",
                    isActive
                      ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                  )}
                  style={{ textDecoration: "none" }}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.path}>{linkContent}</div>;
            })}
          </nav>
        </TooltipProvider>

        <button
          onClick={onToggleCollapse}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center h-7 w-7 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
