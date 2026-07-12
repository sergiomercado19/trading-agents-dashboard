import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export function useSummary(runId: string | null) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetchJson<{ summary: string }>(`/summary/${runId}`)
      .then((data) => setSummary(data.summary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [runId]);

  return { summary, loading };
}
