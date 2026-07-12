import { useCallback, useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";

export interface SchedulerJob {
  job_id: string;
  ticker: string;
  frequency: string;
  hour: number;
  minute: number;
  timezone: string;
  days_of_week?: string[];
  day_of_month?: number;
  analysts: string[];
  research_depth: number;
  provider: string;
  quick_model: string;
  deep_model: string;
  next_run: string;
  created_at: number;
  progress?: {
    status: string;
    last_run?: number;
    run_id?: string;
    error?: string;
  };
}

export function useSchedulerJobs() {
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<SchedulerJob[]>("/scheduler/jobs");
      setJobs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const addJob = useCallback(async (params: Record<string, unknown>) => {
    const job = await postJson<SchedulerJob>("/scheduler/jobs", params);
    setJobs((prev) => [...prev, job]);
    return job;
  }, []);

  const removeJob = useCallback(async (jobId: string) => {
    await fetch(`/api/scheduler/jobs/${jobId}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
  }, []);

  return { jobs, loading, addJob, removeJob, refresh };
}
