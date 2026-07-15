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

type TabId = "overview" | "runs" | "scheduler";

export default function HistoryPage() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [schedulerAudit, setSchedulerAudit] = useState<SchedulerAudit[]>([]);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    fetchJson<HistoryStats>("/history/stats").then(setStats).catch(() => {});
    fetchJson<RunRecord[]>("/history/runs?limit=50").then(setRuns).catch(() => {});
    fetchJson<SchedulerAudit[]>("/history/scheduler").then(setSchedulerAudit).catch(() => {});
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "runs", label: "Run History" },
    { id: "scheduler", label: "Scheduler Audit" },
  ];

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 1000, display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>History</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div>
          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
            <StatCard label="Total Runs" value={stats.total_runs} />
            <StatCard label="Completed" value={stats.completed} color="var(--color-success)" />
            <StatCard label="Failed" value={stats.failed} color="var(--color-error)" />
            <StatCard label="Running" value={stats.running} color="var(--color-accent)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
            <StatCard label="Total Cost" value={`$${stats.total_cost_usd.toFixed(2)}`} />
            <StatCard label="Total Tokens" value={stats.total_tokens.toLocaleString()} />
          </div>

          {Object.keys(stats.runs_by_date).length > 0 && (
            <div className="panel" style={{ marginBottom: "var(--space-3)" }}>
              <div className="panel-header">
                <span className="panel-title">Runs by Date</span>
              </div>
              <div className="panel-body">
                <BarChart data={stats.runs_by_date} />
              </div>
            </div>
          )}

          {Object.keys(stats.ticker_counts).length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Ticker Breakdown</span>
              </div>
              <div className="panel-body">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                  {Object.entries(stats.ticker_counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ticker, count]) => (
                      <span key={ticker} className="badge" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                        {ticker} ({count})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "runs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {runs.length === 0 && <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No runs yet.</div>}
          {runs.map((r) => (
            <div key={r.run_id} className="panel" style={{ padding: "var(--space-2) var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontWeight: "var(--weight-semibold)", minWidth: 60, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{r.ticker}</span>
              <span className={`badge ${r.status === "completed" ? "badge-success" : r.status === "error" || r.status === "failed" ? "badge-error" : "badge-accent"}`}>
                {r.status}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flex: 1 }}>
                {r.started ? new Date(r.started * 1000).toLocaleString() : "—"}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>
                ${r.stats.cost_usd.toFixed(3)} · {(r.stats.tokens_in + r.stats.tokens_out).toLocaleString()} tok
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "scheduler" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {schedulerAudit.length === 0 && (
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No scheduler executions yet.</div>
          )}
          {schedulerAudit.map((j) => (
            <div key={j.job_id} className="panel" style={{ padding: "var(--space-2) var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontWeight: "var(--weight-semibold)", minWidth: 60, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{j.ticker || j.job_id}</span>
              <span className={`badge ${j.status === "completed" ? "badge-success" : j.status === "error" ? "badge-error" : "badge-accent"}`}>
                {j.status}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flex: 1 }}>
                {j.last_run ? new Date(j.last_run * 1000).toLocaleString() : "Never"}
              </span>
              {j.error && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    <div className="panel" style={{ padding: "var(--space-3) var(--space-4)" }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--space-1)" }}>{label}</div>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: color || "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-1)", height: 120 }}>
      {entries.map(([date, count]) => (
        <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{count}</div>
          <div
            style={{
              width: "100%",
              maxWidth: 40,
              height: `${(count / max) * 80}px`,
              background: "var(--color-accent)",
              borderRadius: "var(--radius-sm)",
              minHeight: 2,
            }}
          />
          <div style={{ fontSize: 9, color: "var(--color-text-faint)", writingMode: "vertical-lr", transform: "rotate(180deg)", height: 40, overflow: "hidden" }}>
            {date.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}
