interface Props {
  agents: Record<string, string>;
}

const STAGE_ORDER = [
  "market_analyst",
  "social_media_analyst",
  "news_analyst",
  "fundamentals_analyst",
  "bull_researcher",
  "bear_researcher",
  "research_manager",
  "portfolio_manager",
  "trader",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--text-muted)",
  in_progress: "var(--accent)",
  completed: "var(--success)",
  error: "var(--error)",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "\u25cb",
  in_progress: "\u25cf",
  completed: "\u2713",
  error: "\u2717",
};

export default function PipelineVisualization({ agents }: Props) {
  const activeStages = STAGE_ORDER.filter((s) => s in agents);

  if (activeStages.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>
        Waiting for analysis to start...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {activeStages.map((stage) => {
        const status = agents[stage] || "pending";
        const color = STATUS_COLORS[status] || "var(--text-muted)";
        const icon = STATUS_ICONS[status] || "\u25cb";
        const label = stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div
            key={stage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 12px",
              background: status === "in_progress" ? "rgba(59,130,246,0.1)" : "transparent",
              borderRadius: 4,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <span style={{ color, fontSize: 14, width: 16, textAlign: "center" }}>{icon}</span>
            <span style={{ fontSize: 13, color: status === "in_progress" ? "var(--text)" : "var(--text-muted)" }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
