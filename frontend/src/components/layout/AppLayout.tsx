import { useState, useEffect, useCallback } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/utils/cn";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("ta-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("ta-sidebar-collapsed", String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={cn("min-h-screen bg-[var(--color-bg-root)]", "flex flex-col")}>
      <Header onToggleSidebar={toggleMobile} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-200 ease-out p-6",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
