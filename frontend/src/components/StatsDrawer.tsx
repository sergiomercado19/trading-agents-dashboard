import type { RunSnapshot } from "../hooks/useRunStream";
import type { CostEstimate } from "../hooks/useCostEstimate";

interface Props {
  open: boolean;
  onClose: () => void;
  stats: RunSnapshot["stats"] | null;
  estimate: CostEstimate | null;
  snapshot: RunSnapshot | null;
  done: boolean;
}

export default function StatsDrawer({ open, onClose, stats, estimate, snapshot, done }: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0 0 0 / 0.3)",
            zIndex: "var(--z-drawer)",
            animation: "fadeIn var(--duration-normal) var(--ease-out)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: "var(--header-height)",
          right: 0,
          bottom: 0,
          width: "var(--drawer-width)",
          background: "var(--color-bg-surface)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: "var(--z-drawer)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform var(--duration-slow) var(--ease-out)",
          display: "flex",
          flexDirection: "column",
          boxShadow: open ? "var(--shadow-lg)" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-3) var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <span className="panel-title">Stats</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: "var(--text-lg)", padding: 0, width: 24, height: 24 }}>
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-4)" }}>
          {stats ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {/* Cost */}
              <Section title="Cost">
                <StatRow label="Estimated" value={estimate ? `$${estimate.estimated_cost_usd.toFixed(4)}` : "—"} />
                <StatRow
                  label="Actual"
                  value={`$${stats.cost_usd?.toFixed(4) || "0.00"}`}
                  accent={done}
                />
              </Section>

              {/* Tokens */}
              <Section title="Tokens">
                <StatRow label="Input" value={stats.tokens_in?.toLocaleString() || "0"} />
                <StatRow label="Output" value={stats.tokens_out?.toLocaleString() || "0"} />
              </Section>

              {/* Calls */}
              <Section title="Calls">
                <StatRow label="LLM" value={String(stats.llm_calls || 0)} />
                <StatRow label="Tools" value={String(stats.tool_calls || 0)} />
              </Section>

              {/* Timing */}
              <Section title="Timing">
                <StatRow label="Elapsed" value={`${stats.elapsed_s?.toFixed(1) || "0"}s`} />
              </Section>

              {/* Run info */}
              {snapshot && (
                <Section title="Run">
                  <StatRow label="Ticker" value={snapshot.ticker} />
                  <StatRow label="Date" value={snapshot.date} />
                  <StatRow label="Status" value={snapshot.status} />
                  <StatRow label="ID" value={snapshot.run_id?.slice(0, 12) || "—"} mono />
                </Section>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--space-8) 0" }}>
              No stats yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "var(--space-2)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: "var(--color-bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-subtle)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatRow({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--space-2) var(--space-3)",
        borderBottom: "1px solid var(--color-border-subtle)",
        fontSize: "var(--text-xs)",
      }}
    >
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span
        style={{
          color: accent ? "var(--color-accent)" : "var(--color-text-primary)",
          fontWeight: accent ? "var(--weight-semibold)" : "var(--weight-regular)",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}
