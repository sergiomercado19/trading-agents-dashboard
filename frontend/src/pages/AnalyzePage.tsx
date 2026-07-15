import { useState, useEffect } from "react";
import ControlPanel from "../components/ControlPanel";
import MessageFeed from "../components/MessageFeed";
import DecisionPanel from "../components/DecisionPanel";
import StatsDrawer from "../components/StatsDrawer";
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

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0] ?? new Date().toISOString().slice(0, 10));
  const [analysts, setAnalysts] = useState<string[]>(["market", "social", "news", "fundamentals"]);
  const [depth, setDepth] = useState(3);
  const [provider, setProvider] = useState("nvidia");
  const [quickModel, setQuickModel] = useState("nvidia/nemotron-3-nano-30b-a3b");
  const [deepModel, setDeepModel] = useState("nvidia/nemotron-3-ultra-550b-a55b");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [statsOpen, setStatsOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const running = snapshot?.status === "running";

  useEffect(() => {
    if (!running || !startTime) {
      return;
    }
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running, startTime]);

  useEffect(() => {
    if (done || error) {
      setStartTime(null);
    }
  }, [done, error]);

  const handleStart = async () => {
    if (!ticker) return;
    setStartTime(Date.now());
    setElapsedSeconds(0);
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
  };

  const handleStop = async () => {
    if (activeRunId) {
      await stop(activeRunId);
    }
  };

  const handleSavePreset = async (name: string) => {
    const config = { analysts, depth, provider, quickModel, deepModel };
    const data = await postJson<Preset>("/presets", { name, config });
    setPresets((prev) => [...prev, data]);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Stats toggle button */}
      <button
        onClick={() => setStatsOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{
          position: "absolute",
          top: "var(--space-3)",
          right: "var(--space-3)",
          zIndex: "var(--z-elevated)",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)" }}>◇</span>
        Stats
      </button>

      {/* Terminal grid: 3 panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr 1fr",
          gap: "var(--space-3)",
          padding: "var(--space-3)",
          height: "100%",
          minHeight: 0,
        }}
      >
        {/* Panel 1: Control / Pipeline */}
        <div style={{ minHeight: 0 }}>
          <ControlPanel
            running={running}
            snapshot={snapshot}
            agents={agents}
            estimate={estimate}
            estimateLoading={estimateLoading}
            presets={presets}
            ticker={ticker}
            date={date}
            analysts={analysts}
            depth={depth}
            provider={provider}
            quickModel={quickModel}
            deepModel={deepModel}
            stats={stats}
            elapsedSeconds={elapsedSeconds}
            onStart={handleStart}
            onStop={handleStop}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
            onTickerChange={setTicker}
            onDateChange={setDate}
            onAnalystsChange={setAnalysts}
            onDepthChange={setDepth}
            onProviderChange={setProvider}
            onQuickModelChange={setQuickModel}
            onDeepModelChange={setDeepModel}
          />
        </div>

        {/* Panel 2: Message Feed */}
        <div style={{ minHeight: 0 }}>
          <MessageFeed messages={messages} />
        </div>

        {/* Panel 3: Decision */}
        <div style={{ minHeight: 0 }}>
          <DecisionPanel
            transcript={transcript}
            decision={snapshot?.decision || null}
            done={done}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            right: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            background: "var(--color-error-subtle)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            fontSize: "var(--text-sm)",
            zIndex: "var(--z-elevated)",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats drawer */}
      <StatsDrawer
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        estimate={estimate}
        snapshot={snapshot}
        done={done}
      />
    </div>
  );
}
