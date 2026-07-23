interface Props {
  url: string;
  status?: "valid" | "broken" | "protected" | "unknown" | "checking";
}

type StatusKey = NonNullable<Props["status"]>;
export type FactCheckStatus = StatusKey;

const STATUS_CONFIG: Record<StatusKey, { icon: string; color: string; label: string }> = {
  valid: { icon: "\u2713", color: "var(--color-success)", label: "Valid" },
  broken: { icon: "\u2717", color: "var(--color-error)", label: "Broken" },
  protected: { icon: "\ud83d\udd12", color: "var(--color-warning)", label: "Protected" },
  unknown: { icon: "?", color: "var(--color-text-muted)", label: "Unknown" },
  checking: { icon: "\u23f3", color: "var(--color-accent)", label: "Checking..." },
};

export default function FactCheckBadge({ url, status = "unknown" }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] py-0.5 px-1.5 bg-c-bg-elevated rounded border border-c-border max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap"
      style={{ color: config.color }}
      title={`${url} — ${config.label}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
