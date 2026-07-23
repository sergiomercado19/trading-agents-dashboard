import type { ReactNode, CSSProperties } from "react";

export function SectionHeading({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h3
      style={{
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--color-text-secondary)",
        marginBottom: "var(--space-3)",
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
      {children}
    </label>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`badge ${ok ? "badge-success" : "badge-error"} text-xs`}
    >
      {label}
    </span>
  );
}