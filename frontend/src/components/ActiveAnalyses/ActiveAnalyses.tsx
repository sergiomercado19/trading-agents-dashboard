import { Badge, Button } from "../ui";
import { formatElapsedTime } from "../../utils/formatTime";
import type { RunSnapshot } from "../../hooks/useRunStream";
import styles from "./ActiveAnalyses.module.css";

interface RunListItem {
  run_id: string;
  ticker: string;
  date: string;
  status: RunSnapshot["status"];
  started: number;
}

interface Props {
  runs: RunListItem[];
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
  onStopRun: (runId: string) => void;
  onRemoveFromQueue: (runId: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getStatusVariant(status: RunSnapshot["status"]): "success" | "warning" | "error" | "neutral" | "accent" {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "accent";
    case "queued":
      return "warning";
    case "stopped":
      return "neutral";
    case "error":
      return "error";
    default:
      return "neutral";
  }
}

export default function ActiveAnalyses({ runs, activeRunId, onSelectRun, onStopRun, onRemoveFromQueue }: Props) {
  const runningRuns = runs
    .filter((r) => r.status === "running")
    .sort((a, b) => a.started - b.started);
  const queuedRuns = runs
    .filter((r) => r.status === "queued")
    .sort((a, b) => a.started - b.started);
  const activeCount = runningRuns.length + queuedRuns.length;

  return (
    <div className={styles.activeAnalyses}>
      <div className={styles.header}>
        <span className={styles.title}>Active Analyses</span>
        <Badge variant="accent" size="sm">
          {activeCount}
        </Badge>
      </div>

      <div className={styles.body}>
        {activeCount === 0 ? (
          <div className={styles.empty}>No active analyses</div>
        ) : (
          <div className={styles.list}>
            {runningRuns.map((run) => (
              <RunRow
                key={run.run_id}
                run={run}
                isActive={activeRunId === run.run_id}
                onSelect={onSelectRun}
                onStop={onStopRun}
              />
            ))}
            {queuedRuns.map((run) => (
              <RunRow
                key={run.run_id}
                run={run}
                isActive={activeRunId === run.run_id}
                onSelect={onSelectRun}
                onStop={onRemoveFromQueue}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RunRowProps {
  run: RunListItem;
  isActive: boolean;
  onSelect: (runId: string) => void;
  onStop: (runId: string) => void;
}

function RunRow({ run, isActive, onSelect, onStop }: RunRowProps) {
  const elapsed = Date.now() - run.started;
  const statusVariant = getStatusVariant(run.status);
  const isQueued = run.status === "queued";

  return (
    <div
      className={`${styles.row} ${isActive ? styles.active : ""}`}
      onClick={() => onSelect(run.run_id)}
    >
      <div className={styles.runInfo}>
        <div className={styles.tickerRow}>
          <span className={styles.ticker}>{run.ticker.toUpperCase()}</span>
          <Badge variant={statusVariant} size="sm" dot>
            {run.status}
          </Badge>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.date}>{formatDate(run.date)}</span>
          <span className={styles.elapsed}>{formatElapsedTime(Math.floor(elapsed / 1000))}</span>
        </div>
      </div>
      {run.status === "running" || isQueued ? (
        <Button
          variant={isQueued ? "ghost" : "danger"}
          size="sm"
          className={styles.stopButton}
          onClick={(e) => {
            e.stopPropagation();
            onStop(run.run_id);
          }}
        >
          {isQueued ? "Remove" : "Stop"}
        </Button>
      ) : (
        <span className={styles.runId}>{run.run_id.slice(0, 8)}</span>
      )}
    </div>
  );
}