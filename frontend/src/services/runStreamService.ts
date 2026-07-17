/**
 * Run Stream Service
 * Proper SSE service with reconnection logic, error handling, and type safety
 */

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

interface RunStreamState {
  snapshot: RunSnapshot | null;
  agents: Record<string, string>;
  messages: StreamMessage[];
  stats: RunSnapshot["stats"] | null;
  done: boolean;
  error: string | null;
}

/**
 * Run Stream Service
 * Manages SSE connection with automatic reconnection and proper cleanup
 */
class RunStreamService {
  private esRef: EventSource | null = null;
  private runId: string | null = null;
  private closed = false;
  private reconnectAttempts = 0;

  private state: RunStreamState = {
    snapshot: null,
    agents: {},
    messages: [],
    stats: null,
    done: false,
    error: null,
  };

  private listeners: Set<(state: RunStreamState) => void> = new Set();

  subscribe(listener: (state: RunStreamState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private updateState(partial: Partial<RunStreamState> | ((prev: RunStreamState) => RunStreamState)) {
    this.state = typeof partial === "function" ? partial(this.state) : { ...this.state, ...partial };
    this.notify();
  }

  connect(runId: string) {
    if (this.runId === runId && this.esRef?.readyState === EventSource.OPEN) {
      return;
    }

    this.disconnect();
    this.runId = runId;
    this.closed = false;
    this.reconnectAttempts = 0;

    this.connectInternal();
  }

  private connectInternal() {
    if (this.closed || !this.runId) return;

    const es = new EventSource(`/stream?run_id=${this.runId}`);
    this.esRef = es;

    es.onopen = () => {
      console.debug("[RunStream] Connected");
    };

    es.addEventListener("snapshot", (e: MessageEvent) => {
      const raw = JSON.parse(e.data);
      const data = raw.data ?? raw;
      this.updateState({
        snapshot: data,
        agents: data.agents ?? this.state.agents,
        stats: data.stats ?? this.state.stats,
      });
    });

    es.addEventListener("agent_update", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      this.updateState({
        agents: { ...this.state.agents, [data.agent]: data.status },
      });
    });

    es.addEventListener("message", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const content = data.content?.trim() || "";
      if (!content) return;

      this.updateState((prev) => {
        const last = prev.messages.length > 0 ? prev.messages[prev.messages.length - 1] : undefined;
        if (last && last.content === content) return prev;
        return { ...prev, messages: [...prev.messages, { agent: data.agent, content }] };
      });
    });

    es.addEventListener("stats", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      this.updateState({ stats: data.stats ?? this.state.stats });
    });

    es.addEventListener("final_report", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      this.updateState({
        snapshot: this.state.snapshot ? { ...this.state.snapshot, decision: data.decision } : null,
      });
    });

    es.addEventListener("error", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        this.updateState({ error: data.error || "Unknown error" });
      } catch {
        this.updateState({ error: "SSE connection lost" });
      }
    });

    es.addEventListener("done", () => {
      this.updateState({ done: true });
      es.close();
    });

    es.onerror = () => {
      if (!this.closed) {
        this.handleError();
      }
    };
  }

  private handleError() {
    this.esRef?.close();
    this.reconnect();
  }

  private reconnect() {
    if (this.closed || this.reconnectAttempts >= 5) {
      this.updateState({ error: "Connection lost after multiple retries" });
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    setTimeout(() => {
      if (!this.closed) {
        this.connectInternal();
      }
    }, delay);
  }

  disconnect() {
    this.closed = true;
    this.esRef?.close();
    this.esRef = null;
    this.runId = null;
    this.reconnectAttempts = 0;
  }

  getState(): RunStreamState {
    return this.state;
  }
}

// Singleton instance
export const runStreamService = new RunStreamService();