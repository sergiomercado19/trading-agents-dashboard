import { useEffect, useRef } from "react";
import { Badge } from "../ui/badge";
import type { StreamMessage } from "../../hooks/useRunStream";

interface Props {
  messages: StreamMessage[];
}

const AGENT_COLORS: Record<string, string> = {
  market_analyst: "var(--color-agent-market)",
  social_media_analyst: "var(--color-agent-social)",
  news_analyst: "var(--color-agent-news)",
  fundamentals_analyst: "var(--color-agent-fundamentals)",
  bull_researcher: "var(--color-agent-bull)",
  bear_researcher: "var(--color-agent-bear)",
  research_manager: "var(--color-agent-research-mgr)",
  portfolio_manager: "var(--color-agent-portfolio)",
  trader: "var(--color-agent-trader)",
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-c-border-subtle min-h-[40px]">
        <span className="text-sm font-semibold text-c-text-secondary tracking-[0.02em] uppercase">Messages</span>
        {messages.length > 0 && (
          <Badge variant="neutral">{messages.length}</Badge>
        )}
      </div>

      <div ref={feedRef} className="font-mono text-xs leading-relaxed p-3 overflow-auto flex-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-c-text-faint text-sm">Waiting for messages...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg, i) => (
              <div key={i} className="animate-slide-in-left" style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                <span className="font-semibold mr-2" style={{ color: getAgentColor(msg.agent) }}>
                  {formatAgentName(msg.agent)}
                </span>
                <span className="text-c-text-secondary">
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