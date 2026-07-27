import { Badge, Button } from "./ui";
import { formatElapsedTime } from "../utils/formatTime";
import type { RunSnapshot } from "../hooks/useRunStream";
import styles from "./PipelineLayer.module.css";

const STAGE_ORDER = [
  "market_analyst",
  "social_media_analyst",
  "news_analyst",
  "fundamentals_analyst",
  "bull_researcher",
  "bear_researcher",
  "research_manager",
  "trader",
  "portfolio_manager",
];

const STATUS_FALLBACK = { color: "var(--color-text-faint)", icon: "○", bg: "transparent" };

function getStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return { color: "var(--color-accent)", icon: "○", bg: "transparent" };
    case "in_progress":
      return { color: "var(--color-accent)", icon: "●", bg: "var(--color-accent-subtle)" };
    case "completed":
      return { color: "var(--color-success)", icon: "✓", bg: "var(--color-success-subtle)" };
    case "error":
      return { color: "var(--color-error)", icon: "✗", bg: "var(--color-error-subtle)" };
    default:
      return STATUS_FALLBACK;
  }
}

function formatStageName(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PipelineVisualizationProps {
  agents: Record<string, string>;
}

function PipelineVisualizationInner({ agents }: PipelineVisualizationProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {STAGE_ORDER.map((stage, index) => {
        const status = agents[stage] || "pending";
        const config = getStatusConfig(status);
        const isActive = status === "in_progress";

        return (
          <div
            key={stage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: config.bg,
              borderRadius: "var(--radius-sm)",
              borderLeft: `2px solid ${config.color}`,
              transition: "all var(--duration-normal) var(--ease-out)",
              animation: "slideInLeft var(--duration-normal) var(--ease-out) both",
              animationDelay: `${index * 30}ms`,
            }}
          >
            <span
              style={{
                color: config.color,
                fontSize: "var(--text-sm)",
                width: 16,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                animation: isActive ? "pulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              {config.icon}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
              }}
            >
              {formatStageName(stage)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface PipelineLayerProps {
  agents: Record<string, string>;
  stats: RunSnapshot["stats"] | null;
  elapsedSeconds: number;
  snapshot: RunSnapshot | null;
  onStop: () => void;
}

export default function PipelineLayer({
  agents,
  stats,
  elapsedSeconds,
  snapshot,
  onStop,
}: PipelineLayerProps) {
  return (
    <div className={styles.pipelineLayer}>
      <div className={styles.header}>
        <span className={styles.title}>Pipeline</span>
        {stats && (
          <div className={styles.stats}>
            <Badge variant="accent">${stats.cost_usd?.toFixed(2) || "0.00"}</Badge>
            <Badge variant="neutral">{formatElapsedTime(elapsedSeconds)}</Badge>
          </div>
        )}
      </div>

      <div className={styles.pipelineBody}>
        <PipelineVisualizationInner agents={agents} />
      </div>

      {snapshot && (
        <div className={styles.runInfo}>
          <span>{snapshot.ticker}</span>
          <span>{snapshot.run_id?.slice(0, 8)}</span>
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="danger" className={styles.stopButton} onClick={onStop}>
          Stop
        </Button>
      </div>
    </div>
  );
}