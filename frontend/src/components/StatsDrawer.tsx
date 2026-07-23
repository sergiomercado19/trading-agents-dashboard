import type { RunSnapshot } from "../hooks/useRunStream";
import type { CostEstimate } from "../hooks/useCostEstimate";
import { Button } from "@/components/ui/button";

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
          className="fixed inset-0 z-[var(--z-drawer)] bg-black/30 animate-[fadeIn_var(--duration-normal)_var(--ease-out)]"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 bottom-0 top-[var(--header-height)] w-[var(--drawer-width)] z-[var(--z-drawer)] bg-c-bg-surface border-l border-c-border flex flex-col transition-[transform_var(--duration-slow)_var(--ease-out)] ${open ? "translate-x-0 shadow-lg" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-c-border-subtle px-4 py-3">
          <span className="panel-title">Stats</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-lg">
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {stats ? (
            <div className="flex flex-col gap-4">
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
            <div className="text-center text-sm text-c-text-muted py-8">
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
      <div className="text-xs font-semibold text-c-text-muted uppercase tracking-[0.05em] mb-2">
        {title}
      </div>
      <div className="bg-c-bg-elevated rounded-md border border-c-border-subtle overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function StatRow({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-c-border-subtle py-2 px-3 text-xs">
      <span className="text-c-text-muted">{label}</span>
      <span
        className={`${accent ? "text-c-accent font-semibold" : "text-c-text-primary"} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
