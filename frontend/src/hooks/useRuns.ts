import { useCallback, useEffect, useState } from "react";
import { fetchJson, postJson, api } from "../api/client";
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
    setRuns((prev) => [run as RunSnapshot, ...prev]);
    return run as RunSnapshot;
  }, []);

  const stop = useCallback(async (runId: string) => {
    const run = await postJson<RunSnapshot>(`/stop/${runId}`, {});
    setRuns((prev) => prev.map((r) => (r.run_id === runId ? (run as RunSnapshot) : r)));
    return run as RunSnapshot;
  }, []);

  const deleteRun = useCallback(async (runId: string) => {
    await api.delete(`/runs/${runId}`);
    setRuns((prev) => prev.filter((r) => r.run_id !== runId));
  }, []);

  const removeFromQueue = useCallback(async (runId: string) => {
    await api.delete(`/queue/${runId}`);
    setRuns((prev) => prev.filter((r) => r.run_id !== runId));
  }, []);

  return { runs, loading, start, stop, deleteRun, removeFromQueue, refresh };
}
