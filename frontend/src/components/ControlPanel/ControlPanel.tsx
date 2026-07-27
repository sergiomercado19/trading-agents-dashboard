import { Button, Badge } from "../ui";
import TickerSearch from "../TickerSearch";
import ProviderSelector from "../ProviderSelector";
import ModelSelect from "../ModelSelect";
import type { CostEstimate } from "../../hooks/useCostEstimate";
import styles from "./ControlPanel.module.css";

interface Props {
  estimate: CostEstimate | null;
  estimateLoading: boolean;
  ticker: string;
  date: string;
  analysts: string[];
  depth: number;
  provider: string;
  quickModel: string;
  deepModel: string;
  onStart: () => void;
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
  estimate,
  estimateLoading,
  ticker,
  date,
  analysts,
  depth,
  provider,
  quickModel,
  deepModel,
  onStart,
  onTickerChange,
  onDateChange,
  onAnalystsChange,
  onDepthChange,
  onProviderChange,
  onQuickModelChange,
  onDeepModelChange,
}: Props) {
  const toggleAnalyst = (id: string) => {
    onAnalystsChange(analysts.includes(id) ? analysts.filter((a) => a !== id) : [...analysts, id]);
  };

  return (
    <div className={styles.controlPanel}>
      <div className={styles.header}>
        <span className={styles.title}>Configure</span>
        {estimate && !estimateLoading && (
          <Badge variant="accent">~${estimate.estimated_cost_usd.toFixed(4)}</Badge>
        )}
      </div>

      <div className={styles.body}>
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
  );
}