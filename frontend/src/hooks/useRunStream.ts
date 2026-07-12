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

  useEffect(() => {
    if (!runId) return;

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
      setMessages((prev) => [...prev, { agent: data.agent, content: data.content }]);
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
        setError(data.error || "Unknown error");
      } catch {
        setError("SSE connection lost");
      }
    });

    es.addEventListener("done", () => {
      setDone(true);
      es.close();
    });

    es.onerror = () => {
      setError("SSE connection lost");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [runId]);

  return { snapshot, agents, messages, stats, done, error };
}
