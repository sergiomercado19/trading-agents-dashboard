import type { CostEstimate } from "../hooks/useCostEstimate";

interface Props {
  estimate: CostEstimate | null;
  loading: boolean;
}

export default function CostDisplay({ estimate, loading }: Props) {
  if (loading) {
    return (
      <div style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        Estimating cost...
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)" }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>Estimated Cost</div>
      <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)" }}>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>In: </span>
          <span>{estimate.estimated_tokens_in.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Out: </span>
          <span>{estimate.estimated_tokens_out.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Cost: </span>
          <span style={{ color: "var(--color-accent)", fontWeight: "var(--weight-semibold)" }}>
            ${estimate.estimated_cost_usd.toFixed(4)}
          </span>
        </div>
      </div>
      <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
        {estimate.stages.length} stages | {estimate.provider}
      </div>
    </div>
  );
}
