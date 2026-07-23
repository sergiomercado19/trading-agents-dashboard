import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import TickerSearch from "../TickerSearch";
import ProviderSelector from "../ProviderSelector";
import ModelSelect from "../ModelSelect";
import PipelineVisualization from "../PipelineVisualization";
import type { RunSnapshot } from "../../hooks/useRunStream";
import type { CostEstimate } from "../../hooks/useCostEstimate";
import { cn } from "@/utils/cn";

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
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Form layer */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col overflow-auto transition-all duration-200 ease-out",
          showForm
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-5 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] min-h-[40px]">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] tracking-[0.02em] uppercase">Configure</span>
          {estimate && !estimateLoading && (
            <Badge variant="accent">~${estimate.estimated_cost_usd.toFixed(4)}</Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 p-4 flex-1 overflow-auto">
          {/* Presets */}
          <div className="flex gap-1">
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="input flex-1 px-2 py-1 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button variant="default" size="sm" onClick={handleSave} disabled={!presetName.trim()}>
              Save
            </Button>
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => (
                <span
                  key={p.id}
                  onClick={() => onLoadPreset(p)}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-sm cursor-pointer text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                >
                  {p.name}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(p.id);
                    }}
                    className="opacity-40 cursor-pointer hover:opacity-100"
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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="input"
            />
          </div>

          {/* Analysts */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Analysts</label>
            <div className="flex gap-1">
              {ANALYSTS.map((a) => (
                <Button
                  key={a.id}
                  variant={analysts.includes(a.id) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleAnalyst(a.id)}
                  className="flex-1 text-xs"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Depth */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Depth</label>
            <div className="flex gap-1">
              {DEPTH_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={depth === opt.value ? "default" : "secondary"}
                  size="sm"
                  onClick={() => onDepthChange(opt.value)}
                  className="flex-1 text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <ProviderSelector value={provider} onChange={onProviderChange} />

          {/* Models */}
          <div className="grid grid-cols-2 gap-2">
            <ModelSelect provider={provider} value={quickModel} onChange={onQuickModelChange} type="quick" />
            <ModelSelect provider={provider} value={deepModel} onChange={onDeepModelChange} type="deep" />
          </div>

          {/* Cost estimate */}
          {estimate && (
            <div className="px-3 py-2 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border-subtle)] text-xs">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>{estimate.estimated_tokens_in.toLocaleString()} in</span>
                <span>{estimate.estimated_tokens_out.toLocaleString()} out</span>
                <span className="text-[var(--color-accent)] font-semibold">${estimate.estimated_cost_usd.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Start button */}
          <Button
            variant="default"
            className="w-full px-4 py-2 mt-2"
            onClick={onStart}
            disabled={!ticker}
          >
            Start Analysis
          </Button>
        </div>
      </div>

      {/* Pipeline layer (morphs in when running) */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col overflow-auto transition-all duration-200 ease-out",
          running
            ? "opacity-100 translate-x-0 pointer-events-auto delay-150"
            : "opacity-0 translate-x-5 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] min-h-[40px]">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] tracking-[0.02em] uppercase">Pipeline</span>
          {stats && (
            <div className="flex gap-2">
              <Badge variant="accent">${stats.cost_usd?.toFixed(4) || "0.00"}</Badge>
              <Badge variant="neutral">{elapsedSeconds}s</Badge>
            </div>
          )}
        </div>

        <div className="p-2 flex-1">
          <PipelineVisualization agents={agents} />
        </div>

        {/* Run info footer */}
        {snapshot && (
          <div className="flex justify-between px-4 py-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-faint)]">
            <span>{snapshot.ticker}</span>
            <span>{snapshot.run_id?.slice(0, 8)}</span>
          </div>
        )}

        {/* Stop button */}
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
          <Button variant="danger" className="w-full px-4 py-3" onClick={onStop}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}