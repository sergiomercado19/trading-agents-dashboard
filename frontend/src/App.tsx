import { useState, useEffect } from "react";
import { ThemeProvider, useTheme, THEME_IDS, THEME_LABELS } from "./components/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";

import AnalyzePage from "./pages/AnalyzePage";
import SchedulerPage from "./pages/SchedulerPage";
import ConfigPage from "./pages/ConfigPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import ReportsPage from "./pages/ReportsPage";
import MemoryPage from "./pages/MemoryPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import SetupPage from "./pages/SetupPage";

const TABS = [
  { id: "analyze", label: "Analyze" },
  { id: "scheduler", label: "Scheduler" },
  { id: "config", label: "Config" },
  { id: "api-keys", label: "API Keys" },
  { id: "reports", label: "Reports" },
  { id: "memory", label: "Memory" },
  { id: "chat", label: "Chat" },
  { id: "history", label: "History" },
  { id: "setup", label: "Setup" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const pages: Record<TabId, React.FC> = {
  analyze: AnalyzePage,
  scheduler: SchedulerPage,
  config: ConfigPage,
  "api-keys": ApiKeysPage,
  reports: ReportsPage,
  memory: MemoryPage,
  chat: ChatPage,
  history: HistoryPage,
  setup: SetupPage,
};

function AppInner() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try { return (localStorage.getItem("ta-active-tab") as TabId) || "analyze"; } catch { return "analyze"; }
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("ta-active-tab", activeTab); } catch {}
  }, [activeTab]);

  const ActivePage = pages[activeTab];

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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn btn-ghost btn-sm"
              style={{
                background: activeTab === tab.id ? "var(--color-bg-elevated)" : "transparent",
                color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Theme switcher */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}
          >
            {THEME_LABELS[theme]}
          </button>
          {showThemeMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: "var(--z-overlay)" }}
                onClick={() => setShowThemeMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "var(--space-1)",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-1)",
                  zIndex: "var(--z-overlay)",
                  minWidth: 120,
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                {THEME_IDS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setShowThemeMenu(false); }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      background: theme === t ? "var(--color-accent-subtle)" : "transparent",
                      color: theme === t ? "var(--color-accent)" : "var(--color-text-secondary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        <ErrorBoundary key={activeTab}>
          <ActivePage />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
