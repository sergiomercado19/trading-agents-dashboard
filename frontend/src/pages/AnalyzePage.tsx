import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [aiProvider, setAiProvider] = useState("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await api.post("/api/analyze", {
        ticker: ticker.toUpperCase(),
        analysis_depth: analysisDepth,
        ai_provider: aiProvider,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
          AI Stock Analysis
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Run multi-agent analysis on any stock using 13 specialized AI agents
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)" }}>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>New Analysis</CardTitle>
              <CardDescription>Configure and run a new stock analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="AAPL, TSLA, NVDA..."
                    style={{ textTransform: "uppercase" }}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Analysis Depth</Label>
                  <select
                    value={analysisDepth}
                    onChange={(e) => setAnalysisDepth(e.target.value)}
                    className="input"
                    disabled={loading}
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    <option value="quick">Quick (3 agents)</option>
                    <option value="standard">Standard (8 agents)</option>
                    <option value="deep">Deep (13 agents)</option>
                  </select>
                </div>

                <div>
                  <Label>AI Provider</Label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="input"
                    disabled={loading}
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="google">Google Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !ticker.trim()}>
                  {loading ? "Running Analysis..." : "Run Analysis"}
                </Button>

                {error && (
                  <div style={{ padding: "var(--space-3)", background: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)" }}>
                    {error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card style={{ marginTop: "var(--space-4)" }}>
            <CardHeader>
              <CardTitle>Agent Phases</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {AGENT_PHASES.map((phase) => (
                  <div key={phase.name} style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                      <span style={{ fontWeight: "var(--weight-medium)" }}>{phase.name}</span>
                      <Badge variant="secondary">{phase.count} agents</Badge>
                    </div>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{phase.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
                      {phase.agents.map((agent) => (
                        <Badge key={agent} variant="outline" style={{ fontSize: "var(--text-xs)" }}>
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {result ? (
            <AnalysisResult result={result} onNewAnalysis={() => setResult(null)} />
          ) : (
            <Card>
              <CardContent style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>📊</div>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
                    Ready to Analyze
                  </h3>
                  <p style={{ color: "var(--color-text-muted)" }}>
                    Enter a ticker symbol and configure your analysis to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisResult({ result, onNewAnalysis }: { result: any; onNewAnalysis: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {result.ticker} Analysis
              <Badge variant={getRecommendationBadge(result.final_recommendation)}>
                {result.final_recommendation}
              </Badge>
            </CardTitle>
            <CardDescription>Completed in {result.duration_seconds?.toFixed(1)}s • {result.agents_completed}/{result.agents_total} agents</CardDescription>
          </div>
          <Button variant="ghost" onClick={onNewAnalysis}>New Analysis</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <MetricCard label="Confidence" value={`${(result.confidence_score * 100).toFixed(0)}%`} icon="🎯" />
          <MetricCard label="Risk Score" value={`${(result.risk_score * 100).toFixed(0)}%`} icon="⚠️" />
          <MetricCard label="Agents Run" value={`${result.agents_completed}/${result.agents_total}`} icon="🤖" />
          <MetricCard label="Cost" value={`$${result.total_cost_usd?.toFixed(4) || "0.0000"}`} icon="💰" />
        </div>

        <div style={{ marginBottom: "var(--space-6)" }}>
          <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
            Summary
          </h4>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)" }}>
            {result.summary || "No summary available"}
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
            Agent Results
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "var(--space-3)" }}>
            {result.agent_results?.map((agent: any) => (
              <AgentResultCard key={agent.name} agent={agent} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ padding: "var(--space-4)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-1)" }}>{icon}</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function AgentResultCard({ agent }: { agent: any }) {
  const statusColors = {
    completed: "var(--color-success)",
    failed: "var(--color-error)",
    pending: "var(--color-warning)",
    running: "var(--color-accent)",
  };

  return (
    <div style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", borderLeft: `3px solid ${statusColors[agent.status as keyof typeof statusColors] || "var(--color-border)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
        <span style={{ fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)" }}>{agent.name}</span>
        <Badge variant={agent.status === "completed" ? "success" : agent.status === "failed" ? "destructive" : "secondary"}>
          {agent.status}
        </Badge>
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        {agent.phase} • {agent.duration_ms}ms
      </div>
    </div>
  );
}

function getRecommendationBadge(rec: string) {
  switch (rec?.toLowerCase()) {
    case "buy": return "success";
    case "sell": return "destructive";
    case "hold": return "warning";
    default: return "secondary";
  }
}

const AGENT_PHASES = [
  {
    name: "Data Analysis",
    count: 5,
    description: "Market data, news, fundamentals, and macro analysis",
    agents: ["Macro Analyst", "Market Analyst", "News Analyst", "Social Analyst", "Fundamentals Analyst"],
  },
  {
    name: "Research",
    count: 2,
    description: "Bull and bear case research",
    agents: ["Bull Researcher", "Bear Researcher"],
  },
  {
    name: "Trading",
    count: 1,
    description: "Trading strategy and execution plan",
    agents: ["Trader"],
  },
  {
    name: "Risk",
    count: 4,
    description: "Risk assessment from multiple perspectives",
    agents: ["Risky Analyst", "Safe Analyst", "Neutral Analyst", "Risk Manager"],
  },
  {
    name: "Portfolio",
    count: 1,
    description: "Portfolio management and position sizing",
    agents: ["Portfolio Manager"],
  },
];