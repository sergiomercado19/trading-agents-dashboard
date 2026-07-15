import { useState } from "react";
import type { Transcript } from "../hooks/useDebateTranscript";

interface Props {
  transcript: Transcript | null;
  decision: string | null;
  done: boolean;
}

type TranscriptKey = keyof Transcript;

const SECTION_CONFIG: Record<TranscriptKey, { color: string; label: string; icon: string }> = {
  bull: { color: "var(--color-success)", label: "Bull Case", icon: "↑" },
  bear: { color: "var(--color-error)", label: "Bear Case", icon: "↓" },
  risk: { color: "var(--color-warning)", label: "Risk", icon: "!" },
  neutral: { color: "var(--color-accent)", label: "Decision", icon: "→" },
};

export default function DecisionPanel({ transcript, decision, done }: Props) {
  const [expandedSection, setExpandedSection] = useState<TranscriptKey | null>(null);

  const sections = transcript
    ? (Object.keys(SECTION_CONFIG) as TranscriptKey[]).filter((key) => transcript[key]?.length > 0)
    : [];

  const hasContent = done || sections.length > 0;

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="panel-header">
        <span className="panel-title">Decision</span>
        {done && decision && (
          <span className="badge badge-success">Complete</span>
        )}
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        {!hasContent ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--color-text-faint)",
              fontSize: "var(--text-sm)",
            }}
          >
            Awaiting results...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Final decision banner */}
            {done && decision && (
              <div
                style={{
                  padding: "var(--space-4)",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background: "var(--color-accent-subtle)",
                  animation: "fadeIn var(--duration-slow) var(--ease-out)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Final Decision
                </div>
                <div
                  style={{
                    fontSize: "var(--text-md)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--color-text-primary)",
                    lineHeight: "var(--leading-tight)",
                  }}
                >
                  {decision}
                </div>
              </div>
            )}

            {/* Debate sections */}
            {sections.map((key) => {
              const config = SECTION_CONFIG[key];
              const isExpanded = expandedSection === key;
              const entries = transcript?.[key] || [];

              return (
                <div key={key} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-3) var(--space-4)",
                      background: isExpanded ? "var(--color-bg-hover)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background var(--duration-fast) var(--ease-out)",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "var(--radius-sm)",
                        background: `${config.color}20`,
                        color: config.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--weight-bold)",
                        flexShrink: 0,
                      }}
                    >
                      {config.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--weight-medium)",
                        color: "var(--color-text-primary)",
                        flex: 1,
                      }}
                    >
                      {config.label}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {entries.length}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-faint)",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform var(--duration-fast) var(--ease-out)",
                      }}
                    >
                      ▸
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 var(--space-4) var(--space-3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-2)",
                        animation: "fadeIn var(--duration-normal) var(--ease-out)",
                      }}
                    >
                      {entries.map((entry, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "var(--space-3)",
                            background: "var(--color-bg-elevated)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border-subtle)",
                            fontSize: "var(--text-xs)",
                            lineHeight: "var(--leading-relaxed)",
                            color: "var(--color-text-secondary)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {entry.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
