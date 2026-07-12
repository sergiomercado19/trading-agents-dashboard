import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export interface Transcript {
  bull: Array<{ speaker: string; text: string }>;
  bear: Array<{ speaker: string; text: string }>;
  risk: Array<{ speaker: string; text: string }>;
  neutral: Array<{ speaker: string; text: string }>;
}

export function useDebateTranscript(runId: string | null) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetchJson<Transcript>(`/debate/${runId}`)
      .then(setTranscript)
      .catch(() => setTranscript(null))
      .finally(() => setLoading(false));
  }, [runId]);

  return { transcript, loading };
}
