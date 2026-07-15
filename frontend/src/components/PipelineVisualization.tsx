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

const STATUS_FALLBACK = { color: "var(--color-text-faint)", icon: "○", bg: "transparent" };

function getStatusConfig(status: string) {
  switch (status) {
    case "in_progress":
      return { color: "var(--color-accent)", icon: "●", bg: "var(--color-accent-subtle)" };
    case "completed":
      return { color: "var(--color-success)", icon: "✓", bg: "var(--color-success-subtle)" };
    case "error":
      return { color: "var(--color-error)", icon: "✗", bg: "var(--color-error-subtle)" };
    default:
      return STATUS_FALLBACK;
  }
}

function formatStageName(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PipelineVisualization({ agents }: Props) {
  const activeStages = STAGE_ORDER.filter((s) => s in agents);

  if (activeStages.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-4)",
          color: "var(--color-text-faint)",
          fontSize: "var(--text-sm)",
          textAlign: "center",
        }}
      >
        Waiting for pipeline...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {activeStages.map((stage, index) => {
        const status = agents[stage] || "pending";
        const config = getStatusConfig(status);
        const isActive = status === "in_progress";

        return (
          <div
            key={stage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: config.bg,
              borderRadius: "var(--radius-sm)",
              borderLeft: `2px solid ${config.color}`,
              transition: "all var(--duration-normal) var(--ease-out)",
              animation: "slideInLeft var(--duration-normal) var(--ease-out) both",
              animationDelay: `${index * 30}ms`,
            }}
          >
            <span
              style={{
                color: config.color,
                fontSize: "var(--text-sm)",
                width: 16,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                animation: isActive ? "pulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              {config.icon}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
              }}
            >
              {formatStageName(stage)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
