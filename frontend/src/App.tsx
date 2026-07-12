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
  { id: "config", label: "Configuration" },
  { id: "api-keys", label: "API Keys" },
  { id: "reports", label: "Reports" },
  { id: "memory", label: "Memory/RAG" },
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

  // Persist tab
  useEffect(() => {
    try { localStorage.setItem("ta-active-tab", activeTab); } catch {}
  }, [activeTab]);

  const ActivePage = pages[activeTab];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: 48,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>
          TradingAgents
        </h1>
        <nav style={{ display: "flex", gap: 2, overflow: "auto", flex: 1 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: activeTab === tab.id ? "var(--accent)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                whiteSpace: "nowrap",
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
            style={{
              padding: "4px 10px",
              fontSize: 11,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {THEME_LABELS[theme]}
          </button>
          {showThemeMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 4,
                zIndex: 100,
                minWidth: 120,
              }}
            >
              {THEME_IDS.map((t) => (
                <div
                  key={t}
                  onClick={() => { setTheme(t); setShowThemeMenu(false); }}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    borderRadius: 4,
                    background: theme === t ? "var(--accent)" : "transparent",
                    color: theme === t ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {THEME_LABELS[t]}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
      <main style={{ flex: 1, overflow: "auto", padding: 16 }}>
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
