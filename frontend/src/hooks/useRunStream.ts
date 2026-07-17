/**
 * Run Stream Hook
 * Uses the new service with proper reconnection and error handling
 */

import { useEffect, useState, useCallback } from "react";
import { runStreamService } from "../services/runStreamService";

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

export interface RunStreamState {
  snapshot: RunSnapshot | null;
  agents: Record<string, string>;
  messages: { agent: string; content: string }[];
  stats: RunSnapshot["stats"] | null;
  done: boolean;
  error: string | null;
}

export type UseRunStreamResult = RunStreamState & {
  disconnect: () => void;
};

export function useRunStream(runId: string | null) {
  const [state, setState] = useState<RunStreamState>({
    snapshot: null,
    agents: {},
    messages: [],
    stats: null,
    done: false,
    error: null,
  });

  useEffect(() => {
    if (!runId) {
      setState({
        snapshot: null,
        agents: {},
        messages: [],
        stats: null,
        done: false,
        error: null,
      });
      return;
    }

    const unsubscribe = runStreamService.subscribe(setState);
    runStreamService.connect(runId);

    return () => {
      unsubscribe();
      // Don't disconnect here - let service manage connection lifecycle
    };
  }, [runId]);

  const disconnect = useCallback(() => {
    runStreamService.disconnect();
  }, []);

  return { ...state, disconnect };
}

/**
 * Hook for manual connection control
 */
export function useRunStreamControl() {
  const [state, setState] = useState<RunStreamState>({
    snapshot: null,
    agents: {},
    messages: [],
    stats: null,
    done: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = runStreamService.subscribe(setState);
    return () => unsubscribe();
  }, []);

  const connect = useCallback((runId: string) => {
    runStreamService.connect(runId);
  }, []);

  const disconnect = useCallback(() => {
    runStreamService.disconnect();
  }, []);

  return { ...state, connect, disconnect };
}