import { useState, useEffect, useRef } from "react";
import {
  useChatSessions,
  useChatSession,
} from "../hooks/useChatSessions";
import { useChatStream } from "../hooks/useChatStream";

const CHAT_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", provider: "anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "google" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "deepseek" },
  { id: "grok-4.3", name: "Grok 4.3", provider: "xai" },
];

export default function ChatPage() {
  const { sessions, refresh: refreshSessions, create, remove, rename, togglePin } = useChatSessions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { session, refresh: refreshSession } = useChatSession(activeId);
  const { streaming, streamText, send, reset } = useChatStream();
  const [input, setInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, streamText]);

  const handleNew = async () => {
    const s = await create();
    setActiveId(s.id);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId || streaming) return;
    const msg = input.trim();
    setInput("");
    refreshSession();
    await send(activeId, msg, session?.model === "gpt-4o-mini" ? "openai" : "openai");
    refreshSession();
  };

  const handleRename = async () => {
    if (!activeId || !titleInput.trim()) return;
    await rename(activeId, titleInput.trim());
    setEditingTitle(false);
    refreshSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this chat?")) return;
    await remove(id);
    if (activeId === id) setActiveId(null);
    refreshSessions();
  };

  const selectedSession = sessions.find((s) => s.id === activeId);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleNew} style={newBtnStyle}>+ New Chat</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); reset(); }}
              style={{
                ...sessionItemStyle,
                background: activeId === s.id ? "var(--bg-tertiary)" : "transparent",
                border: activeId === s.id ? "1px solid var(--accent)" : "1px solid transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {s.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  style={deleteBtnStyle}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {s.message_count} messages · {s.model}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 12 }}>No chats yet.</div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            Select or create a chat
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={headerStyle}>
              {editingTitle ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  onBlur={handleRename}
                  autoFocus
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--accent)", borderRadius: 4, color: "var(--text-primary)", padding: "2px 8px", fontSize: 14, fontWeight: 600, width: 200 }}
                />
              ) : (
                <span
                  onClick={() => { setEditingTitle(true); setTitleInput(selectedSession?.title || ""); }}
                  style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                  title="Click to rename"
                >
                  {selectedSession?.title || "Chat"}
                </span>
              )}
              <div style={{ flex: 1 }} />
              {/* Pinned reports */}
              {selectedSession?.pinned_reports && selectedSession.pinned_reports.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginRight: 12 }}>
                  {selectedSession.pinned_reports.map((r) => (
                    <span key={r} style={pinBadgeStyle}>
                      {r.split("/").pop()?.split("_")[0] || r}
                      <span
                        onClick={() => togglePin(activeId, r, selectedSession.pinned_reports)}
                        style={{ cursor: "pointer", marginLeft: 4, opacity: 0.6 }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {/* Model switcher */}
              <select
                value={selectedSession?.model || "gpt-4o-mini"}
                onChange={async (e) => {
                  await fetch(`/api/chat/sessions/${activeId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model: e.target.value }),
                  });
                  refreshSessions();
                }}
                style={selectStyle}
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {(session?.messages || []).map((msg, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: msg.role === "user" ? "var(--accent)" : "var(--text-muted)", marginBottom: 4 }}>
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Assistant</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                    {streamText || <span style={{ animation: "pulse 1s infinite", opacity: 0.5 }}>Thinking...</span>}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={inputBarStyle}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your reports..."
                rows={1}
                style={textareaStyle}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                style={{
                  ...sendBtnStyle,
                  opacity: !input.trim() || streaming ? 0.4 : 1,
                }}
              >
                {streaming ? "..." : "→"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: 260,
  minWidth: 260,
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  background: "var(--bg-secondary)",
};

const sessionItemStyle: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 4,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-secondary)",
};

const inputBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  padding: "12px 16px",
  borderTop: "1px solid var(--border)",
  background: "var(--bg-secondary)",
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  resize: "none",
  minHeight: 42,
  maxHeight: 120,
  outline: "none",
  fontFamily: "inherit",
};

const sendBtnStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 8,
  background: "var(--accent)",
  border: "none",
  color: "#000",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const newBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  background: "var(--accent)",
  border: "none",
  borderRadius: 6,
  color: "#000",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 16,
  cursor: "pointer",
  padding: "0 4px",
  lineHeight: 1,
};

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  color: "var(--text-primary)",
  fontSize: 12,
  cursor: "pointer",
};

const pinBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  fontSize: 11,
  color: "var(--text-secondary)",
};
