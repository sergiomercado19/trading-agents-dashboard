import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";

export interface ChatSessionSummary {
  id: string;
  title: string;
  model: string;
  pinned_reports: string[];
  created_at: number;
  updated_at: number;
  message_count: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  pinned_reports: string[];
  messages: ChatMessage[];
  created_at: number;
  updated_at: number;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchJson<ChatSessionSummary[]>("/chat/sessions")
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const create = async (title?: string, model?: string) => {
    const data = await postJson("/chat/sessions", { title: title || "New Chat", model: model || "gpt-4o-mini" });
    refresh();
    return data;
  };

  const remove = async (id: string) => {
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    refresh();
  };

  const rename = async (id: string, title: string) => {
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    refresh();
  };

  const togglePin = async (id: string, reportPath: string, current: string[]) => {
    const pinned = current.includes(reportPath)
      ? current.filter((r) => r !== reportPath)
      : [...current, reportPath];
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned_reports: pinned }),
    });
    refresh();
  };

  return { sessions, loading, refresh, create, remove, rename, togglePin };
}

export function useChatSession(sessionId: string | null) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) { setSession(null); return; }
    setLoading(true);
    fetchJson<ChatSession>(`/chat/sessions/${sessionId}`)
      .then((s: ChatSession | null) => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const refresh = () => {
    if (!sessionId) return;
    fetchJson<ChatSession>(`/chat/sessions/${sessionId}`)
      .then((s: ChatSession | null) => setSession(s))
      .catch(() => setSession(null));
  };

  return { session, loading, refresh };
}
