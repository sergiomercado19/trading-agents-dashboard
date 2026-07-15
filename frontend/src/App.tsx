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
              className="btn btn-ghost"
              style={{
                padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                background: activeTab === tab.id ? "var(--color-bg-elevated)" : "transparent",
                color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {tab.label}
            </button>
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
                {t === "terminal" && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.5 8.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z" />
                  </svg>
                )}
                {t === "modern" && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <circle cx="8" cy="8" r="3" />
                    <line x1="8" y1="1" x2="8" y2="3" />
                    <line x1="8" y1="13" x2="8" y2="15" />
                    <line x1="1" y1="8" x2="3" y2="8" />
                    <line x1="13" y1="8" x2="15" y2="8" />
                    <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
                    <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
                    <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
                    <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
                  </svg>
                )}
                {t === "bloomberg" && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="9" width="3" height="6" rx="0.5" />
                    <rect x="5.5" y="5" width="3" height="10" rx="0.5" />
                    <rect x="10" y="2" width="3" height="13" rx="0.5" />
                  </svg>
                )}
              </button>
            );
          })}
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
