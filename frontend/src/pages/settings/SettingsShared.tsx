import type { ReactNode, CSSProperties } from "react";

export function SectionHeading({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h3
      className="text-sm font-semibold text-c-text-secondary mb-3"
      style={style}
    >
      {children}
    </h3>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs text-c-text-muted mb-1">
      {children}
    </label>
  );
}

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`p-4 rounded-md bg-c-bg-surface border border-c-border ${className || ""}`}
      style={style}
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
