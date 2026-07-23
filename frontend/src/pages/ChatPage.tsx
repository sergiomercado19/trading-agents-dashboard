import { useState, useEffect, useRef } from "react";
import { useChatSessions, useChatSession } from "../hooks/useChatSessions";
import { useChatStream } from "../hooks/useChatStream";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, streamText]);

  const handleNew = async () => {
    const s = await create() as { id: string };
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
    <div className="flex h-full relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[260px] min-w-[260px] border-r border-c-border-subtle flex flex-col bg-c-bg-surface transition-transform duration-200 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-3">
          <Button onClick={handleNew} className="w-full">+ New Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => { setActiveId(s.id); reset(); setSidebarOpen(false); }}
              className={cn(
                "px-3 py-2 rounded-md cursor-pointer mb-1 transition-all duration-[120ms] ease-out",
                activeId === s.id
                  ? "bg-c-bg-elevated border border-c-border-accent"
                  : "bg-transparent border border-transparent"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-c-text-primary">
                  {s.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  className="p-0 w-4 h-4 text-sm leading-none text-c-text-faint"
                >
                  ×
                </Button>
              </div>
              <div className="text-xs text-c-text-faint mt-1">
                {s.message_count} msgs · {s.model}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-c-text-faint text-sm p-3">No chats yet.</div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-c-text-faint text-sm">
            Select or create a chat
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-c-border-subtle bg-c-bg-surface">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </Button>
              {editingTitle ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  onBlur={handleRename}
                  autoFocus
                  className="input w-[200px] px-2 py-1 text-sm font-semibold"
                />
              ) : (
                <span
                  onClick={() => { setEditingTitle(true); setTitleInput(selectedSession?.title || ""); }}
                  className="cursor-pointer font-semibold text-base text-c-text-primary"
                  title="Click to rename"
                >
                  {selectedSession?.title || "Chat"}
                </span>
              )}
              <div className="flex-1" />
              {selectedSession?.pinned_reports && selectedSession.pinned_reports.length > 0 && (
                <div className="flex gap-1 mr-3">
                  {selectedSession.pinned_reports.map((r) => (
                    <span key={r} className="badge badge-accent">
                      {r.split("/").pop()?.split("_")[0] || r}
                      <span
                        onClick={() => togglePin(activeId, r, selectedSession.pinned_reports)}
                        className="cursor-pointer ml-1 opacity-60"
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
                className="input w-auto px-2 py-1 text-xs"
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(session?.messages || []).map((msg, i) => (
                <div key={i} className="mb-4">
                  <div className={cn(
                    "font-semibold text-xs uppercase tracking-wide mb-1",
                    msg.role === "user" ? "text-c-accent" : "text-c-text-muted"
                  )}>
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="text-sm leading-relaxed text-c-text-primary whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="mb-4">
                  <div className="font-semibold text-xs text-c-text-muted mb-1 uppercase tracking-wide">Assistant</div>
                  <div className="text-sm leading-relaxed text-c-text-primary whitespace-pre-wrap">
                    {streamText || <span className="animate-pulse opacity-50">Thinking...</span>}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 px-4 py-3 border-t border-c-border-subtle bg-c-bg-surface">
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
                className="input resize-none min-h-[42px] max-h-[120px] font-[inherit] text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className={cn("w-[42px] h-[42px] p-0 text-lg", !input.trim() || streaming ? "opacity-40" : "opacity-100")}
              >
                →
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
