import type { CostEstimate } from "../hooks/useCostEstimate";

interface Props {
  estimate: CostEstimate | null;
  loading: boolean;
}

export default function CostDisplay({ estimate, loading }: Props) {
  if (loading) {
    return (
      <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: 6, fontSize: 12, color: "var(--text-muted)" }}>
        Estimating cost...
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg-tertiary)",
        borderRadius: 6,
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Estimated Cost</div>
      <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Input: </span>
          <span>{estimate.estimated_tokens_in.toLocaleString()} tokens</span>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Output: </span>
          <span>{estimate.estimated_tokens_out.toLocaleString()} tokens</span>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Cost: </span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            ${estimate.estimated_cost_usd.toFixed(4)}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
        {estimate.stages.length} stages | {estimate.provider}
      </div>
    </div>
  );
}
