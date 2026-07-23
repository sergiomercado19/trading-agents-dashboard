import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { AnalysisDetailModal } from "@/components/analysis/AnalysisDetailModal";
import type { AnalysisDetail, AgentResult, AgentStatus } from "@/types/analysis";

const STATUS_COLORS: Record<string, "default" | "destructive" | "outline" | "secondary" | "success" | "warning"> = {
  completed: "success",
  running: "default",
  failed: "destructive",
  pending: "secondary",
  cancelled: "secondary",
  stale: "outline",
  skipped: "outline",
};

const STATUS_DOT_COLORS: Record<AgentStatus, string> = {
  completed: "var(--color-success)",
  running: "var(--color-accent)",
  failed: "var(--color-error)",
  pending: "var(--color-text-faint)",
  skipped: "var(--color-text-faint)",
};

const PHASES = [
  { key: "data_analysis", label: "Data Analysis", agents: ["market_analyst", "news_analyst", "social_analyst", "fundamentals_analyst", "macro_analyst"] },
  { key: "research", label: "Research", agents: ["bull_researcher", "bear_researcher"] },
  { key: "trading", label: "Trading", agents: ["trader"] },
  { key: "risk", label: "Risk", agents: ["risky_analyst", "safe_analyst", "neutral_analyst", "risk_manager"] },
  { key: "portfolio", label: "Portfolio", agents: ["portfolio_manager"] },
];

function formatAgentName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<AgentResult | null>(null);

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => api.get<AnalysisDetail>(`/api/analysis/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "running" || status === "pending") return 2000;
      return false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => api.post<{ analysis_id: number }>(`/api/analysis/${id}/retry`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["analysis", id] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      navigate(`/analysis/${data.analysis_id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/analysis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      navigate("/history");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/api/analysis/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", id] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });

  const handleRetry = useCallback(() => {
    if (confirm("Retry this analysis?")) retryMutation.mutate();
  }, [retryMutation]);

  const handleDelete = useCallback(() => {
    if (confirm("Permanently delete this analysis?")) deleteMutation.mutate();
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    if (confirm("Cancel this analysis?")) cancelMutation.mutate();
  }, [cancelMutation]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-content mx-auto">
        <div className="flex justify-center p-12 text-c-text-muted">
          Loading analysis...
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-6 max-w-content mx-auto">
        <div className="p-12 text-center">
          <div className="text-[3rem] mb-4">&#x274C;</div>
          <h3 className="text-lg font-semibold mb-2">
            Analysis not found
          </h3>
          <p className="text-c-text-muted mb-4">
            This analysis may have been deleted or you don&apos;t have access to it.
          </p>
          <Button onClick={() => navigate("/history")}>Back to History</Button>
        </div>
      </div>
    );
  }

  const agentMap = new Map<string, AgentResult>();
  for (const a of analysis.agents) agentMap.set(a.name, a);

  const canRetry = ["failed", "cancelled", "stale"].includes(analysis.status);
  const canCancel = ["running", "pending"].includes(analysis.status);

  return (
    <div className="p-6 max-w-content mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-c-text-primary">
              {analysis.ticker}
            </h1>
            <Badge variant={STATUS_COLORS[analysis.status] || "secondary"}>{analysis.status}</Badge>
            {analysis.final_recommendation && (
              <Badge variant={analysis.final_recommendation === "BUY" ? "success" : analysis.final_recommendation === "SELL" ? "destructive" : "warning"}>
                {analysis.final_recommendation}
              </Badge>
            )}
          </div>
          <p className="text-c-text-secondary text-sm">
            Created {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : "—"}
            {analysis.completed_at ? ` \u2022 Completed ${new Date(analysis.completed_at).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/history")}>Back</Button>
          {canCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}>Cancel</Button>
          )}
          {canRetry && (
            <Button onClick={handleRetry} disabled={retryMutation.isPending}>Retry</Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Delete</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Confidence" value={analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : "\u2014"} color="var(--color-accent)" />
        <StatCard label="Risk Score" value={analysis.risk_score ? `${(analysis.risk_score * 100).toFixed(0)}%` : "\u2014"} color="var(--color-warning)" />
        <StatCard label="Agents" value={`${analysis.agents.length}`} color="var(--color-success)" />
        <StatCard label="Progress" value={`${analysis.progress}%`} color="var(--color-accent)" />
      </div>

      {/* Agent Pipeline */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-semibold text-c-text-secondary mb-4 uppercase tracking-[0.05em]">
            Agent Pipeline
          </h3>
          <div className="flex flex-col gap-4">
            {PHASES.map((phase, phaseIdx) => {
              const isPast = PHASES.findIndex((p) => p.key === analysis.current_phase) > phaseIdx;
              const isActive = analysis.current_phase === phase.key;

              return (
                <div key={phase.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: isPast ? "var(--color-success)" : isActive ? "var(--color-accent)" : "var(--color-bg-elevated)",
                        color: isPast || isActive ? "white" : "var(--color-text-muted)",
                      }}
                    >
                      {isPast ? "\u2713" : phaseIdx + 1}
                    </span>
                    <span className="text-xs font-medium text-c-text-muted uppercase tracking-[0.05em]">
                      {phase.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 ml-[10px] pl-3 border-l border-c-border">
                    {phase.agents.map((agentName) => {
                      const agent = agentMap.get(agentName);
                      const status: AgentStatus = agent?.status || "pending";

                      return (
                        <div
                          key={agentName}
                          onClick={() => agent && setSelectedAgent(agent)}
                          className={`flex items-center gap-2 py-1 px-2 rounded-sm transition-colors ${agent ? "cursor-pointer hover:bg-c-bg-hover" : "cursor-default"}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: STATUS_DOT_COLORS[status] }}
                          />
                          <span
                            className={`text-xs ${status === "completed" || status === "failed" ? "text-c-text-primary font-medium" : "text-c-text-muted"}`}
                          >
                            {formatAgentName(agentName)}
                          </span>
                          {agent && (
                            <>
                              <Badge variant={STATUS_COLORS[status] || "secondary"} style={{ fontSize: "9px" }}>{status}</Badge>
                              {agent.duration_ms > 0 && (
                                <span className="text-[10px] text-c-text-faint ml-auto">
                                  {(agent.duration_ms / 1000).toFixed(1)}s
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Detail Modal */}
      <AnalysisDetailModal
        agents={analysis.agents.map((a) => ({
          name: a.name,
          phase: a.phase,
          status: a.status,
          content: (a.output_data?.content as string) || undefined,
          error_message: a.error_message,
          duration_ms: a.duration_ms,
          tokens_used: a.tokens_used,
        }))}
        selectedAgent={selectedAgent ? {
          name: selectedAgent.name,
          phase: selectedAgent.phase,
          status: selectedAgent.status,
          content: (selectedAgent.output_data?.content as string) || undefined,
          error_message: selectedAgent.error_message,
          duration_ms: selectedAgent.duration_ms,
          tokens_used: selectedAgent.tokens_used,
        } : null}
        onSelectAgent={(agent) => {
          if (!agent) { setSelectedAgent(null); return; }
          const found = analysis.agents.find((a) => a.name === agent.name) || null;
          setSelectedAgent(found);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 bg-c-bg-elevated rounded-md text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-c-text-muted uppercase tracking-[0.05em]">{label}</div>
    </div>
  );
}
