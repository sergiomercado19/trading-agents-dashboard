import { ThemeProvider, useTheme, THEME_IDS, THEME_LABELS } from "./components/ThemeProvider";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { TerminalIcon, ModernIcon, BloombergIcon } from "./components/icons";

import AnalyzePage from "./pages/AnalyzePage";
import SchedulerPage from "./pages/SchedulerPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import MemoryPage from "./pages/MemoryPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";

const TABS = [
  { path: "/", label: "Analyze" },
  { path: "/scheduler", label: "Scheduler" },
  { path: "/reports", label: "Reports" },
  { path: "/memory", label: "Memory" },
  { path: "/chat", label: "Chat" },
  { path: "/history", label: "History" },
  { path: "/settings", label: "Settings" },
] as const;

function AppInner() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-bg-root)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 var(--space-4)",
          height: "var(--header-height)",
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-surface)",
          gap: "var(--space-6)",
          zIndex: "var(--z-sticky)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent)",
              boxShadow: "0 0 8px var(--color-accent)",
            }}
          />
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-bold)",
              color: "var(--color-text-primary)",
              letterSpacing: "0.04em",
            }}
          >
            TRADINGAGENTS
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "var(--space-1)", overflow: "auto", flex: 1 }}>
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
              className="btn btn-ghost"
              style={({ isActive }) => ({
                padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                background: isActive ? "var(--color-bg-elevated)" : "transparent",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Theme switcher — segmented icon control */}
        <div
          style={{
            display: "flex",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 2,
            gap: 2,
          }}
        >
          {THEME_IDS.map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                title={THEME_LABELS[t]}
                style={{
                  width: 30,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-faint)",
                  transition: "all var(--duration-fast) var(--ease-out)",
                  padding: 0,
                }}
              >
                {t === "terminal" && <TerminalIcon />}
                {t === "modern" && <ModernIcon />}
                {t === "bloomberg" && <BloombergIcon />}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<AnalyzePage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reports/*" element={<ReportsPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  );
}
