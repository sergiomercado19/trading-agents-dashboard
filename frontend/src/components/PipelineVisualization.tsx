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
  return (
    <div className="flex flex-col gap-1">
      {STAGE_ORDER.map((stage, index) => {
        const status = agents[stage] || "pending";
        const config = getStatusConfig(status);
        const isActive = status === "in_progress";

        return (
          <div
            key={stage}
            className="flex items-center gap-2 py-2 px-3 rounded-sm"
            style={{
              background: config.bg,
              borderLeft: `2px solid ${config.color}`,
              transition: "all var(--duration-normal) var(--ease-out)",
              animation: "slideInLeft var(--duration-normal) var(--ease-out) both",
              animationDelay: `${index * 30}ms`,
            }}
          >
            <span
              className="text-sm w-4 text-center font-mono"
              style={{
                color: config.color,
                animation: isActive ? "pulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              {config.icon}
            </span>
            <span
              className={`text-xs ${isActive ? "text-c-text-primary" : "text-c-text-muted"}`}
              style={{ fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)" }}
            >
              {formatStageName(stage)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
