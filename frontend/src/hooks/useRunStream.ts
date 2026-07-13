import { useEffect, useRef, useState } from "react";
import { createEventSource } from "../api/client";

export interface AgentUpdate {
  agent: string;
  status: "pending" | "in_progress" | "completed" | "error";
}

export interface StreamMessage {
  agent: string;
  content: string;
}

export interface RunSnapshot {
  run_id: string;
  ticker: string;
  date: string;
  status: "queued" | "running" | "completed" | "stopped" | "error";
  started: number;
  ended: number | null;
  error: string | null;
  decision: string | null;
  agents: Record<string, string>;
  reports: Record<string, string>;
  stats: {
    llm_calls: number;
    tool_calls: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    elapsed_s: number;
  };
}

export function useRunStream(runId: string | null) {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [agents, setAgents] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [stats, setStats] = useState<RunSnapshot["stats"] | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const closedRef = useRef(false);
  const serverErrorRef = useRef(false);

  useEffect(() => {
    if (!runId) return;

    closedRef.current = false;
    serverErrorRef.current = false;
    const es = createEventSource(`/stream?run_id=${runId}`);
    esRef.current = es;

    es.addEventListener("snapshot", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setSnapshot(data);
      if (data.agents) setAgents(data.agents);
      if (data.stats) setStats(data.stats);
    });

    es.addEventListener("agent_update", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setAgents((prev) => ({ ...prev, [data.agent]: data.status }));
    });

    es.addEventListener("message", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const content = data.content?.trim() || "";
      if (!content) return;
      setMessages((prev) => {
        const last = prev.length > 0 ? prev[prev.length - 1] : undefined;
        if (last && last.content === content) return prev;
        return [...prev, { agent: data.agent, content }];
      });
    });

    es.addEventListener("stats", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.stats) setStats(data.stats);
      else setStats((prev) => prev ? { ...prev, elapsed_s: data.elapsed || prev.elapsed_s } : prev);
    });

    es.addEventListener("final_report", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setSnapshot((prev) => prev ? { ...prev, decision: data.decision } : prev);
    });

    es.addEventListener("error", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        serverErrorRef.current = true;
        setError(data.error || "Unknown error");
      } catch {
        if (!closedRef.current) setError("SSE connection lost");
      }
    });

    es.addEventListener("done", () => {
      closedRef.current = true;
      setDone(true);
      es.close();
    });

    es.onerror = () => {
      if (!closedRef.current && !serverErrorRef.current) setError("SSE connection lost");
    };

    return () => {
      closedRef.current = true;
      es.close();
      esRef.current = null;
    };
  }, [runId]);

  return { snapshot, agents, messages, stats, done, error };
}
