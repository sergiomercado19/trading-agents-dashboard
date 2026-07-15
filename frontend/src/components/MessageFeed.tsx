import { useEffect, useRef } from "react";
import type { StreamMessage } from "../hooks/useRunStream";

interface Props {
  messages: StreamMessage[];
}

const AGENT_COLORS: Record<string, string> = {
  market_analyst: "oklch(0.70 0.15 200)",
  social_media_analyst: "oklch(0.70 0.15 280)",
  news_analyst: "oklch(0.70 0.15 320)",
  fundamentals_analyst: "oklch(0.70 0.15 160)",
  bull_researcher: "oklch(0.72 0.19 155)",
  bear_researcher: "oklch(0.65 0.2 25)",
  research_manager: "oklch(0.70 0.12 60)",
  portfolio_manager: "oklch(0.62 0.17 255)",
  trader: "oklch(0.75 0.15 80)",
};

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] || "var(--color-text-muted)";
}

function formatAgentName(agent: string): string {
  return agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MessageFeed({ messages }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="panel-header">
        <span className="panel-title">Messages</span>
        {messages.length > 0 && (
          <span className="badge" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
            {messages.length}
          </span>
        )}
      </div>

      <div
        ref={feedRef}
        className="panel-body"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          lineHeight: "var(--leading-relaxed)",
          padding: "var(--space-3)",
        }}
      >
        {messages.length === 0 ? (
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
            Waiting for messages...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  animation: "slideInLeft var(--duration-normal) var(--ease-out) both",
                  animationDelay: `${Math.min(i * 20, 200)}ms`,
                }}
              >
                <span
                  style={{
                    color: getAgentColor(msg.agent),
                    fontWeight: "var(--weight-semibold)",
                    marginRight: "var(--space-2)",
                  }}
                >
                  {formatAgentName(msg.agent)}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {msg.content.length > 400 ? msg.content.slice(0, 400) + "..." : msg.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
