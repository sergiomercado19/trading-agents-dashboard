import { useState, useEffect } from "react";
import TickerSearch from "./TickerSearch";
import ProviderSelector from "./ProviderSelector";
import ModelSelect from "./ModelSelect";
import PipelineVisualization from "./PipelineVisualization";
import type { RunSnapshot } from "../hooks/useRunStream";
import type { CostEstimate } from "../hooks/useCostEstimate";

interface Preset {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

interface Props {
  running: boolean;
  snapshot: RunSnapshot | null;
  agents: Record<string, string>;
  estimate: CostEstimate | null;
  estimateLoading: boolean;
  presets: Preset[];
  ticker: string;
  date: string;
  analysts: string[];
  depth: number;
  provider: string;
  quickModel: string;
  deepModel: string;
  stats: RunSnapshot["stats"] | null;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onTickerChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onAnalystsChange: (v: string[]) => void;
  onDepthChange: (v: number) => void;
  onProviderChange: (v: string) => void;
  onQuickModelChange: (v: string) => void;
  onDeepModelChange: (v: string) => void;
}

const ANALYSTS = [
  { id: "market", label: "Market" },
  { id: "social", label: "Social" },
  { id: "news", label: "News" },
  { id: "fundamentals", label: "Fund." },
];

const DEPTH_OPTIONS = [
  { value: 1, label: "Quick" },
  { value: 3, label: "Standard" },
  { value: 5, label: "Deep" },
];

export default function ControlPanel({
  running,
  snapshot,
  agents,
  estimate,
  estimateLoading,
  presets,
  ticker,
  date,
  analysts,
  depth,
  provider,
  quickModel,
  deepModel,
  stats,
  elapsedSeconds,
  onStart,
  onStop,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onTickerChange,
  onDateChange,
  onAnalystsChange,
  onDepthChange,
  onProviderChange,
  onQuickModelChange,
  onDeepModelChange,
}: Props) {
  const [presetName, setPresetName] = useState("");
  const [showForm, setShowForm] = useState(!running);

  useEffect(() => {
    if (!running) {
      const t = setTimeout(() => setShowForm(true), 50);
      return () => clearTimeout(t);
    } else {
      setShowForm(false);
    }
  }, [running]);

  const toggleAnalyst = (id: string) => {
    onAnalystsChange(
      analysts.includes(id) ? analysts.filter((a) => a !== id) : [...analysts, id],
    );
  };

  const handleSave = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName("");
    }
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* Form layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          opacity: showForm ? 1 : 0,
          transform: showForm ? "translateX(0)" : "translateX(-20px)",
          transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
          pointerEvents: showForm ? "auto" : "none",
          overflow: "auto",
        }}
      >
        <div className="panel-header">
          <span className="panel-title">Configure</span>
          {estimate && !estimateLoading && (
            <span className="badge badge-accent">
              ~${estimate.estimated_cost_usd.toFixed(4)}
            </span>
          )}
        </div>

        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Presets */}
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="input"
              style={{ flex: 1, padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-xs)" }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <button onClick={handleSave} disabled={!presetName.trim()} className="btn btn-primary btn-sm">
              Save
            </button>
          </div>

          {presets.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
              {presets.map((p) => (
                <span
                  key={p.id}
                  onClick={() => onLoadPreset(p)}
                  style={{
                    padding: "2px var(--space-2)",
                    fontSize: "var(--text-xs)",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {p.name}
                  <span
                    onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id); }}
                    style={{ opacity: 0.4, cursor: "pointer" }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Ticker */}
          <TickerSearch value={ticker} onChange={onTickerChange} />

          {/* Date */}
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="input"
              style={{ fontSize: "var(--text-xs)" }}
            />
          </div>

          {/* Analysts */}
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
              Analysts
            </label>
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              {ANALYSTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAnalyst(a.id)}
                  className={`btn btn-sm ${analysts.includes(a.id) ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1, fontSize: "var(--text-xs)" }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Depth */}
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
              Depth
            </label>
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              {DEPTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onDepthChange(opt.value)}
                  className={`btn btn-sm ${depth === opt.value ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1, fontSize: "var(--text-xs)" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <ProviderSelector value={provider} onChange={onProviderChange} />

          {/* Models */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
            <ModelSelect provider={provider} value={quickModel} onChange={onQuickModelChange} type="quick" />
            <ModelSelect provider={provider} value={deepModel} onChange={onDeepModelChange} type="deep" />
          </div>

          {/* Cost estimate */}
          {estimate && (
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                background: "var(--color-bg-elevated)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-subtle)",
                fontSize: "var(--text-xs)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                <span>{estimate.estimated_tokens_in.toLocaleString()} in</span>
                <span>{estimate.estimated_tokens_out.toLocaleString()} out</span>
                <span style={{ color: "var(--color-accent)", fontWeight: "var(--weight-semibold)" }}>
                  ${estimate.estimated_cost_usd.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={onStart}
            disabled={!ticker}
            className="btn btn-primary"
            style={{ width: "100%", padding: "var(--space-2) var(--space-4)", marginTop: "var(--space-2)" }}
          >
            Start Analysis
          </button>
        </div>
      </div>

      {/* Pipeline layer (morphs in when running) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          opacity: running ? 1 : 0,
          transform: running ? "translateX(0)" : "translateX(20px)",
          transition: "opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)",
          transitionDelay: running ? "150ms" : "0ms",
          pointerEvents: running ? "auto" : "none",
        }}
      >
        <div className="panel-header">
          <span className="panel-title">Pipeline</span>
          {stats && (
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <span className="badge badge-accent">
                ${stats.cost_usd?.toFixed(4) || "0.00"}
              </span>
              <span className="badge" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
                {elapsedSeconds}s
              </span>
            </div>
          )}
        </div>

        <div className="panel-body" style={{ padding: "var(--space-2)" }}>
          <PipelineVisualization agents={agents} />
        </div>

        {/* Run info footer */}
        {snapshot && (
          <div
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderTop: "1px solid var(--color-border-subtle)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-faint)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{snapshot.ticker}</span>
            <span>{snapshot.run_id?.slice(0, 8)}</span>
          </div>
        )}

        {/* Stop button */}
        <div style={{ padding: "var(--space-3) var(--space-4)", borderTop: "1px solid var(--color-border-subtle)" }}>
          <button onClick={onStop} className="btn btn-danger" style={{ width: "100%" }}>
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
