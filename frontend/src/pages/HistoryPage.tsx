import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

interface HistoryStats {
  total_runs: number;
  completed: number;
  failed: number;
  running: number;
  total_cost_usd: number;
  total_tokens: number;
  runs_by_date: Record<string, number>;
  cost_by_date: Record<string, number>;
  ticker_counts: Record<string, number>;
}

interface RunRecord {
  run_id: string;
  ticker: string;
  date: string;
  status: string;
  started: number;
  ended: number | null;
  error: string | null;
  stats: { cost_usd: number; tokens_in: number; tokens_out: number; elapsed_s: number };
}

interface SchedulerAudit {
  job_id: string;
  ticker: string;
  status: string;
  last_run: number | null;
  run_id: string | null;
  error: string | null;
}

export default function HistoryPage() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [schedulerAudit, setSchedulerAudit] = useState<SchedulerAudit[]>([]);
  const [tab, setTab] = useState<"overview" | "runs" | "scheduler">("overview");

  useEffect(() => {
    fetchJson<HistoryStats>("/history/stats").then(setStats).catch(() => {});
    fetchJson<RunRecord[]>("/history/runs?limit=50").then(setRuns).catch(() => {});
    fetchJson<SchedulerAudit[]>("/history/scheduler").then(setSchedulerAudit).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "20px 28px", maxWidth: 1000 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>History</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["overview", "runs", "scheduler"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px",
              background: tab === t ? "var(--accent)" : "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: tab === t ? "#000" : "var(--text-primary)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t === "overview" ? "Overview" : t === "runs" ? "Run History" : "Scheduler Audit"}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div>
          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard label="Total Runs" value={stats.total_runs} />
            <StatCard label="Completed" value={stats.completed} color="var(--success, #4caf50)" />
            <StatCard label="Failed" value={stats.failed} color="var(--error, #f44336)" />
            <StatCard label="Running" value={stats.running} color="var(--accent, #2196f3)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <StatCard label="Total Cost" value={`$${stats.total_cost_usd.toFixed(2)}`} />
            <StatCard label="Total Tokens" value={stats.total_tokens.toLocaleString()} />
          </div>

          {/* Runs by date chart (simple bar) */}
          {Object.keys(stats.runs_by_date).length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Runs by Date</div>
              <BarChart data={stats.runs_by_date} />
            </div>
          )}

          {/* Ticker breakdown */}
          {Object.keys(stats.ticker_counts).length > 0 && (
            <div style={{ ...cardStyle, marginTop: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Ticker Breakdown</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(stats.ticker_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ticker, count]) => (
                    <span key={ticker} style={badgeStyle}>
                      {ticker} ({count})
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "runs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {runs.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No runs yet.</div>}
          {runs.map((r) => (
            <div key={r.run_id} style={runRowStyle}>
              <span style={{ fontWeight: 600, minWidth: 60 }}>{r.ticker}</span>
              <span style={{ ...statusBadgeStyle, color: statusColor(r.status) }}>{r.status}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>
                {r.started ? new Date(r.started * 1000).toLocaleString() : "—"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                ${r.stats.cost_usd.toFixed(3)} · {(r.stats.tokens_in + r.stats.tokens_out).toLocaleString()} tok
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "scheduler" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {schedulerAudit.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No scheduler executions yet.</div>
          )}
          {schedulerAudit.map((j) => (
            <div key={j.job_id} style={runRowStyle}>
              <span style={{ fontWeight: 600, minWidth: 60 }}>{j.ticker || j.job_id}</span>
              <span style={{ ...statusBadgeStyle, color: statusColor(j.status) }}>{j.status}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>
                {j.last_run ? new Date(j.last_run * 1000).toLocaleString() : "Never"}
              </span>
              {j.error && (
                <span style={{ fontSize: 11, color: "var(--error, #f44336)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {j.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
      {entries.map(([date, count]) => (
        <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{count}</div>
          <div
            style={{
              width: "100%",
              maxWidth: 40,
              height: `${(count / max) * 80}px`,
              background: "var(--accent)",
              borderRadius: 3,
              minHeight: 2,
            }}
          />
          <div style={{ fontSize: 9, color: "var(--text-muted)", writingMode: "vertical-lr", transform: "rotate(180deg)", height: 40, overflow: "hidden" }}>
            {date.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}

function statusColor(status: string): string {
  if (status === "completed") return "var(--success, #4caf50)";
  if (status === "error" || status === "failed") return "var(--error, #f44336)";
  if (status === "running") return "var(--accent, #2196f3)";
  return "var(--text-muted)";
}

const cardStyle: React.CSSProperties = {
  padding: "14px 18px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--bg-secondary)",
};

const badgeStyle: React.CSSProperties = {
  padding: "3px 10px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  fontSize: 12,
  color: "var(--text-secondary)",
};

const runRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 13,
};

const statusBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  minWidth: 70,
};
