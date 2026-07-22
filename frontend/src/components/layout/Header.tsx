import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Terminal, Sun, BarChart3, Menu } from "lucide-react";
import { LogoWithText } from "./Logo";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/utils/api";

const THEMES = [
  { id: "terminal" as const, label: "Terminal", icon: Terminal },
  { id: "modern" as const, label: "Modern", icon: Sun },
  { id: "bloomberg" as const, label: "Bloomberg", icon: BarChart3 },
];

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      style={{
        height: "var(--header-height)",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-6)",
        position: "sticky",
        top: 0,
        zIndex: "var(--z-sticky)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onToggleSidebar}
          >
            <Menu size={18} />
          </Button>
        )}
        <LogoWithText size={28} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <ThemeSwitcher themes={THEMES} currentTheme={theme} onChange={setTheme} />
        <UserMenu />
      </div>
    </header>
  );
}

function ThemeSwitcher({ themes, currentTheme, onChange }: { themes: typeof THEMES; currentTheme: string; onChange: (t: "terminal" | "modern" | "bloomberg") => void }) {
  return (
    <div style={{ display: "flex", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 2, gap: 2 }}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            width: 30,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            background: currentTheme === t.id ? "var(--color-accent)" : "transparent",
            color: currentTheme === t.id ? "#fff" : "var(--color-text-faint)",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
          title={t.label}
        >
          <t.icon size={14} />
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const { user, logout, refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/api/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout API errors
    }
    logout();
    window.location.href = "/login";
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase()
    ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Avatar>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ minWidth: 200 }}>
        <DropdownMenuItem onClick={() => window.location.href = "/profile"}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = "/settings"}>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = "/settings"}>API Keys</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
