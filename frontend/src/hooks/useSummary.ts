import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export interface SummaryResult {
  summary: string;
  generated_at: string;
  run_id: string;
}

export function useSummary(runId: string | null) {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    fetchJson<SummaryResult>(`/summary/${runId}`)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [runId]);

  return { summary, loading };
}
