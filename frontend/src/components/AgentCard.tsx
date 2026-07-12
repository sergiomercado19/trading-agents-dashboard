interface Props {
  agent: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--text-muted)",
  in_progress: "var(--accent)",
  completed: "var(--success)",
  error: "var(--error)",
};

export default function AgentCard({ agent, status }: Props) {
  const label = agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const color = STATUS_COLORS[status] || "var(--text-muted)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "var(--bg-tertiary)",
        borderRadius: 6,
        border: "1px solid var(--border)",
        fontSize: 12,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color: "var(--text)" }}>{label}</span>
      <span style={{ marginLeft: "auto", color, textTransform: "capitalize" }}>{status}</span>
    </div>
  );
}
