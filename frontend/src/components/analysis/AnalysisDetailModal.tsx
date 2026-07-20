import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, "default" | "destructive" | "outline" | "secondary" | "success" | "warning"> = {
  completed: "success",
  running: "default",
  failed: "destructive",
  pending: "secondary",
  skipped: "outline",
};

function formatAgentName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ModalAgent {
  name: string;
  phase: string;
  status: string;
  content?: string;
  message?: string;
  error_message?: string | null;
  duration_ms?: number;
  tokens_used?: number;
}

interface AnalysisDetailModalProps {
  agents: ModalAgent[];
  selectedAgent: ModalAgent | null;
  onSelectAgent: (agent: ModalAgent | null) => void;
}

export function AnalysisDetailModal({ selectedAgent, onSelectAgent }: AnalysisDetailModalProps) {
  useEffect(() => {
    if (!selectedAgent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelectAgent(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAgent, onSelectAgent]);

  if (!selectedAgent) return null;

  const agent = selectedAgent;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "var(--space-6)",
      }}
      onClick={() => onSelectAgent(null)}
    >
      <div
        style={{
          background: "var(--color-bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          maxWidth: 700,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
              {formatAgentName(agent.name)}
            </h3>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {agent.phase.replace(/_/g, " ")} &bull; <Badge variant={STATUS_COLORS[agent.status] || "secondary"} style={{ fontSize: "10px" }}>{agent.status}</Badge>
              {agent.duration_ms ? ` \u2022 ${(agent.duration_ms / 1000).toFixed(1)}s` : ""}
              {agent.tokens_used ? ` \u2022 ${agent.tokens_used} tokens` : ""}
            </span>
          </div>
          <button
            onClick={() => onSelectAgent(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-lg)",
              cursor: "pointer",
              padding: "var(--space-1)",
            }}
          >
            &#x2715;
          </button>
        </div>
        <div style={{ padding: "var(--space-6)" }}>
          {agent.content ? (
            <pre style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {agent.content}
            </pre>
          ) : agent.message ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{agent.message}</p>
          ) : agent.error_message ? (
            <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>{agent.error_message}</p>
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No output available</p>
          )}
        </div>
      </div>
    </div>
  );
}
