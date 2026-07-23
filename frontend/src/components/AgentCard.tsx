interface Props {
  agent: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-text-muted)",
  in_progress: "var(--color-accent)",
  completed: "var(--color-success)",
  error: "var(--color-error)",
};

export default function AgentCard({ agent, status }: Props) {
  const label = agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const color = STATUS_COLORS[status] || "var(--color-text-muted)";

  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 bg-c-bg-elevated rounded-md border border-c-border text-xs">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-c-text-primary">{label}</span>
      <span className="ml-auto capitalize" style={{ color }}>{status}</span>
    </div>
  );
}
