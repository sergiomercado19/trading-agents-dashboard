import { useState, useCallback } from "react";

export interface ChatMessageStream {
  content: string;
  provider: string;
  timestamp: string;
  role: "user" | "assistant";
}

export function useChatStream() {
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  const send = useCallback(async (
    sessionId: string,
    content: string,
    provider: string,
    onToken?: (token: string) => void,
  ) => {
    setStreaming(true);
    setStreamText("");

    const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, provider }),
    });

    const reader = res.body?.getReader();
    if (!reader) { setStreaming(false); return ""; }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "token") {
                fullText += data.content;
                setStreamText(fullText);
                onToken?.(data.content);
              } else if (data.type === "done") {
                setStreaming(false);
                return fullText;
              } else if (data.type === "error") {
                fullText += `\n\nError: ${data.error}`;
                setStreamText(fullText);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } catch {
      // stream interrupted
    }

    setStreaming(false);
    return fullText;
  }, []);

  const reset = useCallback(() => {
    setStreamText("");
    setStreaming(false);
  }, []);

  return { streaming, streamText, send, reset };
}
