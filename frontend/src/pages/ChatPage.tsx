import { useState, useEffect, useRef } from "react";
import { useChatSessions, useChatSession } from "../hooks/useChatSessions";
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
      <div
        style={{
          width: 260,
          minWidth: 260,
          borderRight: "1px solid var(--color-border-subtle)",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-bg-surface)",
        }}
      >
        <div style={{ padding: "var(--space-3)" }}>
          <button onClick={handleNew} className="btn btn-primary" style={{ width: "100%" }}>+ New Chat</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 var(--space-2) var(--space-2)" }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); reset(); }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                marginBottom: "var(--space-1)",
                background: activeId === s.id ? "var(--color-bg-elevated)" : "transparent",
                border: activeId === s.id ? "1px solid var(--color-border-accent)" : "1px solid transparent",
                transition: "all var(--duration-fast) var(--ease-out)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: "var(--color-text-primary)" }}>
                  {s.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 0, width: 16, height: 16, fontSize: "var(--text-sm)", lineHeight: 1, color: "var(--color-text-faint)" }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-1)" }}>
                {s.message_count} msgs · {s.model}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ color: "var(--color-text-faint)", fontSize: "var(--text-sm)", padding: "var(--space-3)" }}>No chats yet.</div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-faint)", fontSize: "var(--text-sm)" }}>
            Select or create a chat
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                borderBottom: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-surface)",
              }}
            >
              {editingTitle ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  onBlur={handleRename}
                  autoFocus
                  className="input"
                  style={{ width: 200, padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
                />
              ) : (
                <span
                  onClick={() => { setEditingTitle(true); setTitleInput(selectedSession?.title || ""); }}
                  style={{ cursor: "pointer", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-md)", color: "var(--color-text-primary)" }}
                  title="Click to rename"
                >
                  {selectedSession?.title || "Chat"}
                </span>
              )}
              <div style={{ flex: 1 }} />
              {selectedSession?.pinned_reports && selectedSession.pinned_reports.length > 0 && (
                <div style={{ display: "flex", gap: "var(--space-1)", marginRight: "var(--space-3)" }}>
                  {selectedSession.pinned_reports.map((r) => (
                    <span key={r} className="badge badge-accent">
                      {r.split("/").pop()?.split("_")[0] || r}
                      <span
                        onClick={() => togglePin(activeId, r, selectedSession.pinned_reports)}
                        style={{ cursor: "pointer", marginLeft: "var(--space-1)", opacity: 0.6 }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
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
                className="input"
                style={{ width: "auto", padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-xs)" }}
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-6)" }}>
              {(session?.messages || []).map((msg, i) => (
                <div key={i} style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-xs)", color: msg.role === "user" ? "var(--color-accent)" : "var(--color-text-muted)", marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Assistant</div>
                  <div style={{ fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                    {streamText || <span style={{ animation: "pulse 1s infinite", opacity: 0.5 }}>Thinking...</span>}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--space-2)",
                padding: "var(--space-3) var(--space-4)",
                borderTop: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-surface)",
              }}
            >
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
                className="input"
                style={{ resize: "none", minHeight: 42, maxHeight: 120, fontFamily: "inherit", fontSize: "var(--text-sm)" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className="btn btn-primary"
                style={{ width: 42, height: 42, padding: 0, fontSize: "var(--text-lg)", opacity: !input.trim() || streaming ? 0.4 : 1 }}
              >
                →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
