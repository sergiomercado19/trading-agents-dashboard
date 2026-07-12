import { useCallback, useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";
import type { RunSnapshot } from "./useRunStream";

export function useRuns() {
  const [runs, setRuns] = useState<RunSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<RunSnapshot[]>("/runs");
      setRuns(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const start = useCallback(async (params: Record<string, unknown>) => {
    const run = await postJson<RunSnapshot>("/analyze", params);
    setRuns((prev) => [run, ...prev]);
    return run;
  }, []);

  const stop = useCallback(async (runId: string) => {
    const run = await postJson<RunSnapshot>(`/stop/${runId}`, {});
    setRuns((prev) => prev.map((r) => (r.run_id === runId ? run : r)));
    return run;
  }, []);

  return { runs, loading, start, stop, refresh };
}
