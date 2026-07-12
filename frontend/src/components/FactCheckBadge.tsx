interface Props {
  url: string;
  status?: "valid" | "broken" | "protected" | "unknown" | "checking";
}

type StatusKey = NonNullable<Props["status"]>;
export type FactCheckStatus = StatusKey;

const STATUS_CONFIG: Record<StatusKey, { icon: string; color: string; label: string }> = {
  valid: { icon: "\u2713", color: "var(--success)", label: "Valid" },
  broken: { icon: "\u2717", color: "var(--error)", label: "Broken" },
  protected: { icon: "\ud83d\udd12", color: "var(--warning)", label: "Protected" },
  unknown: { icon: "?", color: "var(--text-muted)", label: "Unknown" },
  checking: { icon: "\u23f3", color: "var(--accent)", label: "Checking..." },
};

export default function FactCheckBadge({ url, status = "unknown" }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: config.color,
        padding: "2px 6px",
        background: "var(--bg-tertiary)",
        borderRadius: 4,
        border: "1px solid var(--border)",
        maxWidth: 240,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={`${url} — ${config.label}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
