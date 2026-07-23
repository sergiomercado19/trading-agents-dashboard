import type { SchedulerJob } from "../hooks/useSchedulerJobs";

interface Props {
  jobs: SchedulerJob[];
  onDelete: (jobId: string) => void;
}

export default function SchedulerJobList({ jobs, onDelete }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="p-4 text-c-text-muted text-sm text-center">
        No scheduled jobs yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {jobs.map((job) => {
        const progressStatus = job.progress?.status;
        const statusColor = progressStatus === "running"
          ? "var(--color-accent)"
          : progressStatus === "completed"
          ? "var(--color-success)"
          : progressStatus === "error"
          ? "var(--color-error)"
          : "var(--color-text-muted)";

        return (
          <div
            key={job.job_id}
            className="flex items-center gap-3 p-2.5 px-3.5 bg-c-bg-surface rounded-lg border border-c-border"
          >
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{job.ticker}</span>
                <span className="text-xs text-c-text-muted capitalize">
                  {job.frequency}
                </span>
                {progressStatus && (
                  <span className="text-xs capitalize" style={{ color: statusColor }}>
                    {progressStatus}
                  </span>
                )}
              </div>
              <div className="text-xs text-c-text-muted">
                Next: {job.next_run || "N/A"}
              </div>
              <div className="text-xs text-c-text-muted mt-0.5">
                {job.timezone} | {job.provider} | depth {job.research_depth}
              </div>
            </div>
            <button
              onClick={() => onDelete(job.job_id)}
              className="px-3 py-1.5 text-xs bg-transparent text-c-error border border-c-border rounded cursor-pointer"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
