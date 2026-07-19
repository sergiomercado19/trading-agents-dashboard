import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import { TickerAutocomplete } from "@/components/TickerAutocomplete";

/* ─── Types ─── */
interface AgentState {
  name: string;
  phase: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  duration_ms?: number;
  tokens_used?: number;
  content?: string;
}

interface AnalysisResult {
  analysis_id: number;
  ticker: string;
  recommendation: string;
  confidence: number;
  risk_score: number;
  summary: string;
  agents: AgentState[];
}

interface ProviderModel {
  id: string;
  name: string;
}

interface ProviderInfo {
  name: string;
  models: ProviderModel[];
}

/* ─── Constants ─── */
const PHASES = [
  { key: "data_analysis", label: "Data Analysis", agents: ["market_analyst", "news_analyst", "social_analyst", "fundamentals_analyst", "macro_analyst"] },
  { key: "research", label: "Research", agents: ["bull_researcher", "bear_researcher"] },
  { key: "trading", label: "Trading", agents: ["trader"] },
  { key: "risk", label: "Risk", agents: ["risky_analyst", "safe_analyst", "neutral_analyst", "risk_manager"] },
  { key: "portfolio", label: "Portfolio", agents: ["portfolio_manager"] },
];

const ANALYST_OPTIONS = [
  { value: "market", label: "Market" },
  { value: "news", label: "News" },
  { value: "social", label: "Social" },
  { value: "fundamentals", label: "Fundamentals" },
];

function formatAgentName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Main Page ─── */
export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(["market", "news", "social", "fundamentals"]);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");

  useEffect(() => {
    api.get<Record<string, ProviderInfo>>("/api/providers").then(setProviders).catch(() => {});
  }, []);

  const providerModels = providers[provider]?.models || [];

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const models = providers[value]?.models || [];
    setModel(models[0]?.id || "");
  };

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const toggleAnalyst = (value: string) => {
    setSelectedAnalysts((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleStart = useCallback(async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAgents({});
    setProgress(0);
    setCurrentPhase("");

    try {
      const data = await api.post<{ analysis_id: number }>("/api/analysis/start", {
        ticker: ticker.toUpperCase(),
        analysts: selectedAnalysts,
        provider,
        model,
        date: new Date().toISOString().split("T")[0],
      });

      const analysisId = data.analysis_id;
      connectSSE(analysisId);
    } catch (err: any) {
      setError(err.message || "Failed to start analysis");
      setLoading(false);
    }
  }, [ticker, selectedAnalysts, provider, model]);

  const connectSSE = useCallback((analysisId: number) => {
    const accessToken = useAuthStore.getState().accessToken;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const es = new EventSource(
      `${API_BASE}/api/analysis/stream/${analysisId}?token=${accessToken}`
    );
    eventSourceRef.current = es;

    es.addEventListener("agent_update", (e) => {
      const data = JSON.parse(e.data);
      setAgents((prev) => ({
        ...prev,
        [data.agent]: {
          name: data.agent,
          phase: data.phase,
          status: data.status,
          message: data.message || "",
          duration_ms: data.duration_ms,
          tokens_used: data.tokens_used,
        },
      }));
    });

    es.addEventListener("phase_start", (e) => {
      const data = JSON.parse(e.data);
      setCurrentPhase(data.phase);
    });

    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.progress);
      setCurrentPhase(data.phase);
    });

    es.addEventListener("result", (e) => {
      const data = JSON.parse(e.data);
      setResult(data);
    });

    es.addEventListener("error", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setError(data.error || "Analysis failed");
      } catch {
        // SSE connection error (not a data error)
      }
    });

    es.addEventListener("done", () => {
      es.close();
      setLoading(false);
      eventSourceRef.current = null;
    });

    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const agentList = Object.values(agents);
  const isRunning = loading;

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
          AI Stock Analysis
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Run multi-agent analysis on any stock using 13 specialized AI agents
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isRunning || result ? "320px 1fr" : "380px 1fr", gap: "var(--space-6)", transition: "grid-template-columns 0.3s" }}>
        {/* ─── Left: Config Panel ─── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Configure your analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <div style={{ marginTop: "var(--space-1)" }}>
                    <TickerAutocomplete
                      value={ticker}
                      onChange={(v) => setTicker(v)}
                      onSelect={(t) => setTicker(t.symbol)}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div>
                  <Label>Analysts</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
                    {ANALYST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleAnalyst(opt.value)}
                        disabled={isRunning}
                        style={{
                          padding: "var(--space-1) var(--space-3)",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${selectedAnalysts.includes(opt.value) ? "var(--color-accent)" : "var(--color-border)"}`,
                          background: selectedAnalysts.includes(opt.value) ? "var(--color-accent-subtle)" : "transparent",
                          color: selectedAnalysts.includes(opt.value) ? "var(--color-accent)" : "var(--color-text-muted)",
                          fontSize: "var(--text-sm)",
                          cursor: isRunning ? "not-allowed" : "pointer",
                          transition: "all var(--duration-fast) var(--ease-out)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <select
                    id="provider"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    disabled={isRunning}
                    style={{
                      marginTop: "var(--space-1)",
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="nvidia">NVIDIA NIM</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isRunning || providerModels.length === 0}
                    style={{
                      marginTop: "var(--space-1)",
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {providerModels.length === 0 && <option value="">No models available</option>}
                    {providerModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleStart}
                  disabled={isRunning || !ticker.trim() || selectedAnalysts.length === 0}
                  className="w-full"
                >
                  {isRunning ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ animation: "spin 1s linear infinite" }}>⟳</span>
                      Analyzing...
                    </span>
                  ) : (
                    "Run Analysis"
                  )}
                </Button>

                {error && (
                  <div style={{
                    padding: "var(--space-3)",
                    background: "var(--color-error-subtle)",
                    color: "var(--color-error)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-sm)",
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Agent Phases ─── */}
          {(isRunning || agentList.length > 0) && (
            <Card style={{ marginTop: "var(--space-4)" }}>
              <CardHeader>
                <CardTitle style={{ fontSize: "var(--text-md)" }}>Agent Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowPipeline agents={agents} currentPhase={currentPhase} progress={progress} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right: Results ─── */}
        <div>
          {result ? (
            <AnalysisResultView result={result} onSelectAgent={setSelectedAgent} />
          ) : isRunning ? (
            <RunningView agents={agents} progress={progress} currentPhase={currentPhase} />
          ) : (
            <Card>
              <CardContent style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>📊</div>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)", color: "var(--color-text-primary)" }}>
                    Ready to Analyze
                  </h3>
                  <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto" }}>
                    Enter a ticker symbol, select analysts, and click "Run Analysis" to get started with multi-agent AI analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Agent Detail Modal ─── */}
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
}

/* ─── Workflow Pipeline Visualization ─── */
function WorkflowPipeline({ agents, currentPhase, progress }: { agents: Record<string, AgentState>; currentPhase: string; progress: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {PHASES.map((phase, phaseIdx) => {
        const isActive = currentPhase === phase.key;
        const isPast = PHASES.findIndex((p) => p.key === currentPhase) > phaseIdx;

        return (
          <div key={phase.key}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-1)",
            }}>
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
                transition: "all var(--duration-normal) var(--ease-out)",
              }}>
                {isPast ? "✓" : phaseIdx + 1}
              </span>
              <span style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {phase.label}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", marginLeft: "10px", paddingLeft: "var(--space-3)", borderLeft: "1px solid var(--color-border)" }}>
              {phase.agents.map((agentName) => {
                const state = agents[agentName];
                const status = state?.status || "pending";
                const config = getStatusConfig(status);

                return (
                  <div
                    key={agentName}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-1) var(--space-2)",
                      borderRadius: "var(--radius-sm)",
                      background: config.bg,
                      transition: "all var(--duration-fast) var(--ease-out)",
                    }}
                  >
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: config.color,
                      flexShrink: 0,
                      animation: status === "running" ? "pulse 1.5s ease-in-out infinite" : "none",
                    }} />
                    <span style={{
                      fontSize: "var(--text-xs)",
                      color: status === "running" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      fontWeight: status === "running" ? "var(--weight-medium)" : "var(--weight-regular)",
                    }}>
                      {formatAgentName(agentName)}
                    </span>
                    {state?.duration_ms && (
                      <span style={{ fontSize: "10px", color: "var(--color-text-faint)", marginLeft: "auto" }}>
                        {(state.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Progress bar */}
      <div style={{ marginTop: "var(--space-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Progress</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: "var(--color-bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--color-accent)",
            borderRadius: 2,
            transition: "width 0.3s var(--ease-out)",
          }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Running View (streaming) ─── */
function RunningView({ agents, progress, currentPhase }: { agents: Record<string, AgentState>; progress: number; currentPhase: string }) {
  const agentList = Object.values(agents);

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              Analysis in Progress
            </CardTitle>
            <CardDescription>{progress}% complete • {currentPhase?.replace(/_/g, " ")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Live feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: 400, overflowY: "auto" }}>
          {agentList.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Waiting for agents to start...
            </div>
          ) : (
            agentList.map((agent, i) => (
              <div
                key={agent.name + i}
                style={{
                  padding: "var(--space-3)",
                  background: "var(--color-bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `3px solid ${getStatusConfig(agent.status).color}`,
                  animation: "slideInUp 0.3s var(--ease-out) both",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
                  <span style={{ fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {formatAgentName(agent.name)}
                  </span>
                  <Badge variant={agent.status === "completed" ? "success" : agent.status === "failed" ? "destructive" : agent.status === "running" ? "default" : "secondary"}>
                    {agent.status}
                  </Badge>
                </div>
                {agent.message && (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                    {agent.message.slice(0, 150)}{agent.message.length > 150 ? "..." : ""}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Analysis Result View ─── */
function AnalysisResultView({ result, onSelectAgent }: { result: AnalysisResult; onSelectAgent: (agent: AgentState) => void }) {
  const recColor = result.recommendation === "BUY" ? "var(--color-success)" : result.recommendation === "SELL" ? "var(--color-error)" : "var(--color-warning)";

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {result.ticker} Analysis
              <span style={{ color: recColor, fontSize: "var(--text-lg)" }}>{result.recommendation}</span>
            </CardTitle>
            <CardDescription>Analysis complete</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
          <StatCard label="Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} color="var(--color-accent)" />
          <StatCard label="Risk Score" value={`${(result.risk_score * 100).toFixed(0)}%`} color="var(--color-warning)" />
          <StatCard label="Agents" value={`${result.agents.length}`} color="var(--color-success)" />
        </div>

        {/* Summary */}
        {result.summary && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Summary
            </h4>
            <p style={{ color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", fontSize: "var(--text-sm)" }}>
              {result.summary}
            </p>
          </div>
        )}

        {/* Agent results */}
        <div>
          <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Agent Results
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-2)" }}>
            {result.agents.map((agent) => (
              <div
                key={agent.name}
                onClick={() => onSelectAgent(agent)}
                style={{
                  padding: "var(--space-3)",
                  background: "var(--color-bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `3px solid ${getStatusConfig(agent.status).color}`,
                  cursor: "pointer",
                  transition: "background var(--duration-fast) var(--ease-out)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
                  <span style={{ fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {formatAgentName(agent.name)}
                  </span>
                  <Badge variant={agent.status === "completed" ? "success" : "destructive"} style={{ fontSize: "10px" }}>
                    {agent.status}
                  </Badge>
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {agent.phase.replace(/_/g, " ")} • {((agent.duration_ms ?? 0) / 1000).toFixed(1)}s
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Agent Detail Modal ─── */
function AgentDetailModal({ agent, onClose }: { agent: AgentState; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
      onClick={onClose}
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
              {agent.phase.replace(/_/g, " ")} • {agent.status}
              {agent.duration_ms ? ` • ${(agent.duration_ms / 1000).toFixed(1)}s` : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-lg)",
              cursor: "pointer",
              padding: "var(--space-1)",
            }}
          >
            ✕
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
          ) : (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No output available</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function getStatusConfig(status: string) {
  switch (status) {
    case "running": return { color: "var(--color-accent)", bg: "var(--color-accent-subtle)" };
    case "completed": return { color: "var(--color-success)", bg: "var(--color-success-subtle)" };
    case "failed": return { color: "var(--color-error)", bg: "var(--color-error-subtle)" };
    default: return { color: "var(--color-text-faint)", bg: "transparent" };
  }
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "var(--space-4)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}
