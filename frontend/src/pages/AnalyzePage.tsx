import { useState, useEffect } from "react";
import TickerSearch from "../components/TickerSearch";
import ProviderSelector from "../components/ProviderSelector";
import ModelSelect from "../components/ModelSelect";
import CostDisplay from "../components/CostDisplay";
import PipelineVisualization from "../components/PipelineVisualization";
import MessageFeed from "../components/MessageFeed";
import DebateTranscript from "../components/DebateTranscript";
import { useRunStream } from "../hooks/useRunStream";
import { useRuns } from "../hooks/useRuns";
import { useCostEstimate } from "../hooks/useCostEstimate";
import { useDebateTranscript } from "../hooks/useDebateTranscript";
import { fetchJson, postJson } from "../api/client";

interface Preset {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

const ANALYSTS = [
  { id: "market", label: "Market" },
  { id: "social", label: "Social" },
  { id: "news", label: "News" },
  { id: "fundamentals", label: "Fundamentals" },
];

const DEPTH_OPTIONS = [
  { value: 1, label: "Quick (1)" },
  { value: 3, label: "Standard (3)" },
  { value: 5, label: "Deep (5)" },
];

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0] ?? new Date().toISOString().slice(0, 10));
  const [analysts, setAnalysts] = useState<string[]>(["market", "social", "news", "fundamentals"]);
  const [depth, setDepth] = useState(3);
  const [provider, setProvider] = useState("openai");
  const [quickModel, setQuickModel] = useState("gpt-5.4-mini");
  const [deepModel, setDeepModel] = useState("gpt-5.5");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showDebate, setShowDebate] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    fetchJson<Preset[]>("/presets").then(setPresets).catch(() => {});
  }, []);

  const { start, stop } = useRuns();
  const { snapshot, agents, messages, stats, done, error } = useRunStream(activeRunId);
  const { estimate, loading: estimateLoading } = useCostEstimate({
    ticker,
    date,
    analysts,
    research_depth: depth,
    provider,
    quick_model: quickModel,
    deep_model: deepModel,
  });
  const { transcript } = useDebateTranscript(done && activeRunId ? activeRunId : null);

  const toggleAnalyst = (id: string) => {
    setAnalysts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleStart = async () => {
    if (!ticker) return;
    const run = await start({
      ticker,
      date,
      analysts,
      research_depth: depth,
      provider,
      quick_model: quickModel,
      deep_model: deepModel,
    });
    setActiveRunId(run.run_id);
    setShowDebate(false);
  };

  const handleStop = async () => {
    if (activeRunId) {
      await stop(activeRunId);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const config = { analysts, depth, provider, quickModel, deepModel };
    const data = await postJson<Preset>("/presets", { name: presetName.trim(), config });
    setPresets((prev) => [...prev, data]);
    setPresetName("");
  };

  const handleLoadPreset = (p: Preset) => {
    const c = p.config;
    if (c.analysts) setAnalysts(c.analysts as string[]);
    if (c.depth) setDepth(c.depth as number);
    if (c.provider) setProvider(c.provider as string);
    if (c.quickModel) setQuickModel(c.quickModel as string);
    if (c.deepModel) setDeepModel(c.deepModel as string);
  };

  const handleDeletePreset = async (id: string) => {
    await fetch(`/api/presets/${id}`, { method: "DELETE" });
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const running = snapshot?.status === "running";

  return (
    <div style={{ display: "flex", gap: 16, height: "100%" }}>
      {/* Left: Form */}
      <div style={{ width: 360, flexShrink: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 18 }}>Analyze</h2>

        {/* Presets */}
        <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Presets</div>
          <div style={{ display: "flex", gap: 6, marginBottom: presets.length > 0 ? 8 : 0 }}>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              style={{ flex: 1, padding: "4px 8px", fontSize: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-primary)", outline: "none" }}
            />
            <button onClick={handleSavePreset} disabled={!presetName.trim()} style={{ padding: "4px 10px", fontSize: 11, background: "var(--accent)", border: "none", borderRadius: 4, color: "#000", fontWeight: 600, cursor: presetName.trim() ? "pointer" : "default", opacity: presetName.trim() ? 1 : 0.4 }}>Save</button>
          </div>
          {presets.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {presets.map((p) => (
                <span key={p.id} onClick={() => handleLoadPreset(p)} style={{ padding: "3px 8px", fontSize: 11, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--text-secondary)" }}>
                  {p.name}
                  <span onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.id); }} style={{ marginLeft: 4, opacity: 0.5 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <TickerSearch value={ticker} onChange={setTicker} />

        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            Analysis Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 13,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
            Analysts
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {ANALYSTS.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleAnalyst(a.id)}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  background: analysts.includes(a.id) ? "var(--accent)" : "var(--bg-tertiary)",
                  color: analysts.includes(a.id) ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${analysts.includes(a.id) ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            Research Depth
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDepth(opt.value)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  background: depth === opt.value ? "var(--accent)" : "var(--bg-tertiary)",
                  color: depth === opt.value ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${depth === opt.value ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <ProviderSelector value={provider} onChange={setProvider} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <ModelSelect provider={provider} value={quickModel} onChange={setQuickModel} type="quick" />
          <ModelSelect provider={provider} value={deepModel} onChange={setDeepModel} type="deep" />
        </div>

        <CostDisplay estimate={estimate} loading={estimateLoading} />

        <div style={{ display: "flex", gap: 8 }}>
          {!running ? (
            <button
              onClick={handleStart}
              disabled={!ticker}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                background: ticker ? "var(--accent)" : "var(--bg-tertiary)",
                color: ticker ? "#fff" : "var(--text-muted)",
                border: "none",
                borderRadius: 6,
                cursor: ticker ? "pointer" : "not-allowed",
              }}
            >
              Start Analysis
            </button>
          ) : (
            <button
              onClick={handleStop}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                background: "var(--error)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Stop
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: 10, background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: 6, fontSize: 13, color: "var(--error)" }}>
            {error}
          </div>
        )}
      </div>

      {/* Right: Pipeline + Feed */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {activeRunId && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 style={{ fontSize: 14 }}>
                Run: {snapshot?.ticker || ticker} ({activeRunId})
              </h3>
              {stats && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  ${stats.cost_usd?.toFixed(4) || "0.00"} | {stats.elapsed_s?.toFixed(0) || 0}s
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
              <div style={{ width: 240, flexShrink: 0 }}>
                <h4 style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Pipeline</h4>
                <PipelineVisualization agents={agents} />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {showDebate && transcript ? (
                  <DebateTranscript transcript={transcript} />
                ) : (
                  <MessageFeed messages={messages} />
                )}
              </div>
            </div>

            {done && transcript && (
              <button
                onClick={() => setShowDebate(!showDebate)}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  fontSize: 12,
                  background: showDebate ? "var(--bg-tertiary)" : "var(--accent)",
                  color: showDebate ? "var(--text-muted)" : "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {showDebate ? "Show Messages" : "Show Debate"}
              </button>
            )}
          </>
        )}

        {!activeRunId && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'🎉'}</div>
              <div style={{ fontSize: 14 }}>Enter a ticker and start an analysis</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
