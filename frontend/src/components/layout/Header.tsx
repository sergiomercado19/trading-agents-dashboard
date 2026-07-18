import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoWithText } from "./Logo";

const THEMES = [
  { id: "terminal" as const, label: "Terminal", icon: "🖥️" },
  { id: "modern" as const, label: "Modern", icon: "☀️" },
  { id: "bloomberg" as const, label: "Bloomberg", icon: "📊" },
];

export function Header() {
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
        <LogoWithText size={28} />
        <nav style={{ display: "flex", gap: "var(--space-1)" }}>
          <NavLink to="/" exact>Dashboard</NavLink>
          <NavLink to="/analyze">Analyze</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <ThemeSwitcher themes={THEMES} currentTheme={theme} onChange={setTheme} />
        <UserMenu />
      </div>
    </header>
  );
}

function NavLink({ to, exact, children }: { to: string; exact?: boolean; children: React.ReactNode }) {
  const location = window.location.pathname;
  const isActive = exact ? location === to : location.startsWith(to);
  
  return (
    <a
      href={to}
      style={{
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
        background: isActive ? "var(--color-bg-elevated)" : "transparent",
        textDecoration: "none",
        transition: "all var(--duration-fast) var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--color-bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </a>
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
            fontSize: "14px",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Avatar>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ minWidth: 200 }}>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>API Keys</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}