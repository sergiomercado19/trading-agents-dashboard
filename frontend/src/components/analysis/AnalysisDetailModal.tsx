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
      className="fixed inset-0 flex items-center justify-center z-50 p-6 bg-black/70"
      onClick={() => onSelectAgent(null)}
    >
      <div
        className="bg-c-bg-surface rounded-lg border border-c-border max-w-[700px] w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-4 px-6 border-b border-c-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-c-text-primary">
              {formatAgentName(agent.name)}
            </h3>
            <span className="text-xs text-c-text-muted">
              {agent.phase.replace(/_/g, " ")} &bull; <Badge variant={STATUS_COLORS[agent.status] || "secondary"} style={{ fontSize: "10px" }}>{agent.status}</Badge>
              {agent.duration_ms ? ` \u2022 ${(agent.duration_ms / 1000).toFixed(1)}s` : ""}
              {agent.tokens_used ? ` \u2022 ${agent.tokens_used} tokens` : ""}
            </span>
          </div>
          <button
            onClick={() => onSelectAgent(null)}
            className="bg-transparent border-none text-c-text-muted text-lg cursor-pointer p-1"
          >
            &#x2715;
          </button>
        </div>
        <div className="p-6">
          {agent.content ? (
            <pre className="font-mono text-sm text-c-text-secondary leading-relaxed whitespace-pre-wrap break-word">
              {agent.content}
            </pre>
          ) : agent.message ? (
            <p className="text-c-text-secondary text-sm">{agent.message}</p>
          ) : agent.error_message ? (
            <p className="text-c-error text-sm">{agent.error_message}</p>
          ) : (
            <p className="text-c-text-muted text-sm">No output available</p>
          )}
        </div>
      </div>
    </div>
  );
}
