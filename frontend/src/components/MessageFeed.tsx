import { useEffect, useRef } from "react";
import type { StreamMessage } from "../hooks/useRunStream";

interface Props {
  messages: StreamMessage[];
}

export default function MessageFeed({ messages }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>
        No messages yet. Waiting for analysis...
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      style={{
        flex: 1,
        overflow: "auto",
        padding: 12,
        background: "var(--bg)",
        borderRadius: 6,
        border: "1px solid var(--border)",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {messages.map((msg, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            [{msg.agent}]
          </span>{" "}
          <span style={{ color: "var(--text-muted)" }}>
            {msg.content.slice(0, 500)}
            {msg.content.length > 500 ? "..." : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
