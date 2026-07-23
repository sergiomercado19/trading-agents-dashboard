import type { CostEstimate } from "../hooks/useCostEstimate";

interface Props {
  estimate: CostEstimate | null;
  loading: boolean;
}

export default function CostDisplay({ estimate, loading }: Props) {
  if (loading) {
    return (
      <div className="p-3 bg-c-bg-elevated rounded-md text-xs text-c-text-muted">
        Estimating cost...
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-3 bg-c-bg-elevated rounded-md border border-c-border-subtle">
      <div className="text-xs text-c-text-muted mb-2">Estimated Cost</div>
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-c-text-muted">In: </span>
          <span>{estimate.estimated_tokens_in.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-c-text-muted">Out: </span>
          <span>{estimate.estimated_tokens_out.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-c-text-muted">Cost: </span>
          <span className="text-c-accent font-semibold">
            ${estimate.estimated_cost_usd.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-c-text-faint">
        {estimate.stages.length} stages | {estimate.provider}
      </div>
    </div>
  );
}
