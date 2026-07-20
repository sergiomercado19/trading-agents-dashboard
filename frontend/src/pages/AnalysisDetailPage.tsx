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
      <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
          Loading analysis...
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ padding: "var(--space-12)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>&#x274C;</div>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
            Analysis not found
          </h3>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
            This analysis may have been deleted or you don't have access to it.
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
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
              {analysis.ticker}
            </h1>
            <Badge variant={STATUS_COLORS[analysis.status] || "secondary"}>{analysis.status}</Badge>
            {analysis.final_recommendation && (
              <Badge variant={analysis.final_recommendation === "BUY" ? "success" : analysis.final_recommendation === "SELL" ? "destructive" : "warning"}>
                {analysis.final_recommendation}
              </Badge>
            )}
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Created {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : "—"}
            {analysis.completed_at ? ` \u2022 Completed ${new Date(analysis.completed_at).toLocaleString()}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button className="btn-ghost" onClick={() => navigate("/history")}>Back</Button>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <StatCard label="Confidence" value={analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : "\u2014"} color="var(--color-accent)" />
        <StatCard label="Risk Score" value={analysis.risk_score ? `${(analysis.risk_score * 100).toFixed(0)}%` : "\u2014"} color="var(--color-warning)" />
        <StatCard label="Agents" value={`${analysis.agents.length}`} color="var(--color-success)" />
        <StatCard label="Progress" value={`${analysis.progress}%`} color="var(--color-accent)" />
      </div>

      {/* Agent Pipeline */}
      <Card>
        <CardContent>
          <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Agent Pipeline
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {PHASES.map((phase, phaseIdx) => {
              const isPast = PHASES.findIndex((p) => p.key === analysis.current_phase) > phaseIdx;
              const isActive = analysis.current_phase === phase.key;

              return (
                <div key={phase.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-semibold)",
                      background: isPast ? "var(--color-success)" : isActive ? "var(--color-accent)" : "var(--color-bg-elevated)",
                      color: isPast || isActive ? "white" : "var(--color-text-muted)",
                    }}>
                      {isPast ? "\u2713" : phaseIdx + 1}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {phase.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", marginLeft: "10px", paddingLeft: "var(--space-3)", borderLeft: "1px solid var(--color-border)" }}>
                    {phase.agents.map((agentName) => {
                      const agent = agentMap.get(agentName);
                      const status: AgentStatus = agent?.status || "pending";

                      return (
                        <div
                          key={agentName}
                          onClick={() => agent && setSelectedAgent(agent)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                            padding: "var(--space-1) var(--space-2)",
                            borderRadius: "var(--radius-sm)",
                            cursor: agent ? "pointer" : "default",
                            background: "transparent",
                            transition: "background var(--duration-fast) var(--ease-out)",
                          }}
                          onMouseEnter={(e) => { if (agent) e.currentTarget.style.background = "var(--color-bg-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: STATUS_DOT_COLORS[status],
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: "var(--text-xs)",
                            color: status === "completed" || status === "failed" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                            fontWeight: status === "completed" || status === "failed" ? "var(--weight-medium)" : "var(--weight-regular)",
                          }}>
                            {formatAgentName(agentName)}
                          </span>
                          {agent && (
                            <>
                              <Badge variant={STATUS_COLORS[status] || "secondary"} style={{ fontSize: "9px" }}>{status}</Badge>
                              {agent.duration_ms > 0 && (
                                <span style={{ fontSize: "10px", color: "var(--color-text-faint)", marginLeft: "auto" }}>
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
    <div style={{ padding: "var(--space-4)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}
