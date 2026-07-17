import { useState, useEffect } from "react";
import { Button, Badge } from "../ui";
import TickerSearch from "../TickerSearch";
import ProviderSelector from "../ProviderSelector";
import ModelSelect from "../ModelSelect";
import PipelineVisualization from "../PipelineVisualization";
import type { RunSnapshot } from "../../hooks/useRunStream";
import type { CostEstimate } from "../../hooks/useCostEstimate";
import styles from "./ControlPanel.module.css";

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
    }
    setShowForm(false);
    return undefined;
  }, [running]);

  const toggleAnalyst = (id: string) => {
    onAnalystsChange(analysts.includes(id) ? analysts.filter((a) => a !== id) : [...analysts, id]);
  };

  const handleSave = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName("");
    }
  };

  return (
    <div className={styles.controlPanel}>
      {/* Form layer */}
      <div
        className={`${styles.layer} ${styles.formLayer} ${showForm ? styles.visible : ""}`}
        style={{
          opacity: showForm ? 1 : 0,
          transform: showForm ? "translateX(0)" : "translateX(-20px)",
          transition: "opacity var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out)",
          pointerEvents: showForm ? "auto" : "none",
        }}
      >
        <div className={styles.header}>
          <span className={styles.title}>Configure</span>
          {estimate && !estimateLoading && (
            <Badge variant="accent">~${estimate.estimated_cost_usd.toFixed(4)}</Badge>
          )}
        </div>

        <div className={styles.body}>
          {/* Presets */}
          <div className={styles.row}>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className={`input ${styles.presetInput}`}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!presetName.trim()}>
              Save
            </Button>
          </div>

          {presets.length > 0 && (
            <div className={styles.presetList}>
              {presets.map((p) => (
                <span
                  key={p.id}
                  onClick={() => onLoadPreset(p)}
                  className={styles.presetItem}
                >
                  {p.name}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(p.id);
                    }}
                    className={styles.presetDelete}
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
          <div className={styles.section}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={`input ${styles.dateInput}`}
            />
          </div>

          {/* Analysts */}
          <div className={styles.section}>
            <label className={styles.label}>Analysts</label>
            <div className={styles.row}>
              {ANALYSTS.map((a) => (
                <Button
                  key={a.id}
                  variant={analysts.includes(a.id) ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => toggleAnalyst(a.id)}
                  className={styles.buttonFlex}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Depth */}
          <div className={styles.section}>
            <label className={styles.label}>Depth</label>
            <div className={styles.row}>
              {DEPTH_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={depth === opt.value ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => onDepthChange(opt.value)}
                  className={styles.buttonFlex}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <ProviderSelector value={provider} onChange={onProviderChange} />

          {/* Models */}
          <div className={styles.grid}>
            <ModelSelect provider={provider} value={quickModel} onChange={onQuickModelChange} type="quick" />
            <ModelSelect provider={provider} value={deepModel} onChange={onDeepModelChange} type="deep" />
          </div>

          {/* Cost estimate */}
          {estimate && (
            <div className={styles.costEstimate}>
              <div className={styles.costRow}>
                <span>{estimate.estimated_tokens_in.toLocaleString()} in</span>
                <span>{estimate.estimated_tokens_out.toLocaleString()} out</span>
                <span className={styles.costTotal}>${estimate.estimated_cost_usd.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Start button */}
          <Button
            variant="primary"
            className={styles.startButton}
            onClick={onStart}
            disabled={!ticker}
          >
            Start Analysis
          </Button>
        </div>
      </div>

      {/* Pipeline layer (morphs in when running) */}
      <div
        className={`${styles.layer} ${styles.pipelineLayer} ${running ? styles.visible : ""}`}
      >
        <div className={styles.header}>
          <span className={styles.title}>Pipeline</span>
          {stats && (
            <div className={styles.stats}>
              <Badge variant="accent">${stats.cost_usd?.toFixed(4) || "0.00"}</Badge>
              <Badge variant="neutral">{elapsedSeconds}s</Badge>
            </div>
          )}
        </div>

        <div className={styles.pipelineBody}>
          <PipelineVisualization agents={agents} />
        </div>

        {/* Run info footer */}
        {snapshot && (
          <div className={styles.runInfo}>
            <span>{snapshot.ticker}</span>
            <span>{snapshot.run_id?.slice(0, 8)}</span>
          </div>
        )}

        {/* Stop button */}
        <div className={styles.footer}>
          <Button variant="danger" className={styles.stopButton} onClick={onStop}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}