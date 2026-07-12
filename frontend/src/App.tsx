import { useState } from "react";
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("analyze");
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
          gap: 24,
        }}
      >
        <h1 style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>
          TradingAgents
        </h1>
        <nav style={{ display: "flex", gap: 2, overflow: "auto" }}>
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
      </header>
      <main style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <ActivePage />
      </main>
    </div>
  );
}
