import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";
import { TickerAutocomplete } from "@/components/TickerAutocomplete";
import { AnalysisDetailModal } from "@/components/analysis/AnalysisDetailModal";
import { BarChart3 } from "lucide-react";

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
    <div className="p-6 max-w-content mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-c-text-primary mb-2">
          AI Stock Analysis
        </h1>
        <p className="text-c-text-secondary">
          Run multi-agent analysis on any stock using 13 specialized AI agents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ─── Left: Config Panel ─── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Configure your analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <div className="mt-1">
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
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ANALYST_OPTIONS.map((opt) => {
                      const isSelected = selectedAnalysts.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleAnalyst(opt.value)}
                          disabled={isRunning}
                          className={cn(
                            "px-3 py-1 rounded-md text-sm transition-all",
                            isRunning ? "cursor-not-allowed" : "cursor-pointer",
                            isSelected
                              ? "border border-c-accent text-c-accent bg-[var(--color-accent-subtle)] hover:bg-[var(--color-accent-subtle)/0.9]"
                              : "border border-c-border text-c-text-muted bg-transparent hover:bg-c-bg-hover"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <select
                    id="provider"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    disabled={isRunning}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-c-border bg-c-bg-elevated text-c-text-primary text-sm"
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
                    className="mt-1 w-full px-3 py-2 rounded-md border border-c-border bg-c-bg-elevated text-c-text-primary text-sm"
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
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block">⟳</span>
                      Analyzing...
                    </span>
                  ) : (
                    "Run Analysis"
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-[var(--color-error-subtle)] text-c-error rounded-md text-sm">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Agent Phases ─── */}
          {(isRunning || agentList.length > 0) && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-md">Agent Pipeline</CardTitle>
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
              <CardContent className="flex items-center justify-center min-h-[400px] text-center">
                <div>
                  <div className="text-[4rem] mb-4 text-c-text-muted"><BarChart3 size={48} /></div>
                  <h3 className="text-lg font-semibold mb-2 text-c-text-primary">
                    Ready to Analyze
                  </h3>
                  <p className="text-c-text-muted max-w-panel mx-auto">
                    Enter a ticker symbol, select analysts, and click "Run Analysis" to get started with multi-agent AI analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Agent Detail Modal ─── */}
      <AnalysisDetailModal
        agents={agentList}
        selectedAgent={selectedAgent}
        onSelectAgent={(agent) => setSelectedAgent(agent as AgentState | null)}
      />
    </div>
  );
}

/* ─── Workflow Pipeline Visualization ─── */
function WorkflowPipeline({ agents, currentPhase, progress }: { agents: Record<string, AgentState>; currentPhase: string; progress: number }) {
  return (
    <div className="flex flex-col gap-3">
      {PHASES.map((phase, phaseIdx) => {
        const isActive = currentPhase === phase.key;
        const isPast = PHASES.findIndex((p) => p.key === currentPhase) > phaseIdx;

        return (
          <div key={phase.key}>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                isPast ? "bg-c-success text-white" : isActive ? "bg-c-accent text-white" : "bg-c-bg-elevated text-c-text-muted"
              )}>
                {isPast ? "✓" : phaseIdx + 1}
              </span>
              <span className={cn(
                "text-xs font-medium uppercase tracking-widest",
                isActive ? "text-c-text-primary" : "text-c-text-muted"
              )}>
                {phase.label}
              </span>
            </div>

            <div className="flex flex-col gap-1 ml-[10px] pl-3 border-l border-c-border">
              {phase.agents.map((agentName) => {
                const state = agents[agentName];
                const status = state?.status || "pending";
                const config = getStatusConfig(status);

                return (
                  <div
                    key={agentName}
                    className="flex items-center gap-2 py-1 px-2 rounded-sm transition-all"
                    style={{ background: config.bg }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: config.color,
                        animation: status === "running" ? "pulse 1.5s ease-in-out infinite" : "none",
                      }}
                    />
                    <span className={cn(
                      "text-xs",
                      status === "running" ? "text-c-text-primary font-medium" : "text-c-text-muted font-normal"
                    )}>
                      {formatAgentName(agentName)}
                    </span>
                    {state?.duration_ms && (
                      <span className="text-[10px] text-c-text-faint ml-auto">
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
      <div className="mt-2">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-c-text-muted">Progress</span>
          <span className="text-xs text-c-text-muted">{progress}%</span>
        </div>
        <div className="h-1 bg-c-bg-elevated rounded-sm overflow-hidden">
          <div
            className="h-full bg-c-accent rounded-sm transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="animate-spin inline-block">⟳</span>
              Analysis in Progress
            </CardTitle>
            <CardDescription>{progress}% complete • {currentPhase?.replace(/_/g, " ")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Live feed */}
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {agentList.length === 0 ? (
            <div className="p-6 text-center text-c-text-muted">
              Waiting for agents to start...
            </div>
          ) : (
            agentList.map((agent, i) => (
              <div
                key={agent.name + i}
                className="p-3 bg-c-bg-elevated rounded-md animate-[slideInUp_0.3s_var(--ease-out)_both]"
                style={{
                  borderLeft: `3px solid ${getStatusConfig(agent.status).color}`,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-c-text-primary">
                    {formatAgentName(agent.name)}
                  </span>
                  <Badge variant={agent.status === "completed" ? "success" : agent.status === "failed" ? "destructive" : agent.status === "running" ? "default" : "secondary"}>
                    {agent.status}
                  </Badge>
                </div>
                {agent.message && (
                  <p className="text-xs text-c-text-muted mt-1">
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              {result.ticker} Analysis
              <span className="text-lg" style={{ color: recColor }}>{result.recommendation}</span>
            </CardTitle>
            <CardDescription>Analysis complete</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} color="var(--color-accent)" />
          <StatCard label="Risk Score" value={`${(result.risk_score * 100).toFixed(0)}%`} color="var(--color-warning)" />
          <StatCard label="Agents" value={`${result.agents.length}`} color="var(--color-success)" />
        </div>

        {/* Summary */}
        {result.summary && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-c-text-secondary mb-2 uppercase tracking-widest">
              Summary
            </h4>
            <p className="text-c-text-secondary leading-relaxed text-sm">
              {result.summary}
            </p>
          </div>
        )}

        {/* Agent results */}
        <div>
          <h4 className="text-sm font-semibold text-c-text-secondary mb-3 uppercase tracking-widest">
            Agent Results
          </h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2">
            {result.agents.map((agent) => (
              <div
                key={agent.name}
                onClick={() => onSelectAgent(agent)}
                className="p-3 bg-c-bg-elevated hover:bg-c-bg-hover rounded-md cursor-pointer transition-colors"
                style={{ borderLeft: `3px solid ${getStatusConfig(agent.status).color}` }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-c-text-primary">
                    {formatAgentName(agent.name)}
                  </span>
                  <Badge variant={agent.status === "completed" ? "success" : "destructive"} className="text-[10px]">
                    {agent.status}
                  </Badge>
                </div>
                <div className="text-xs text-c-text-muted">
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
    <div className="p-4 bg-c-bg-elevated rounded-md text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-c-text-muted uppercase tracking-widest">{label}</div>
    </div>
  );
}
