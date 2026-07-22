import { useEffect, useRef } from "react";
import { Badge } from "../ui/badge";
import type { StreamMessage } from "../../hooks/useRunStream";
import styles from "./MessageFeed.module.css";

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
    <div className={styles.messageFeed}>
      <div className={styles.header}>
        <span className={styles.title}>Messages</span>
        {messages.length > 0 && (
          <Badge variant="neutral">{messages.length}</Badge>
        )}
      </div>

      <div ref={feedRef} className={styles.body}>
        {messages.length === 0 ? (
          <div className={styles.empty}>Waiting for messages...</div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={styles.message} style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                <span className={styles.agentName} style={{ color: getAgentColor(msg.agent) }}>
                  {formatAgentName(msg.agent)}
                </span>
                <span className={styles.content}>
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