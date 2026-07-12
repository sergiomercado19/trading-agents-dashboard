import type { SchedulerJob } from "../hooks/useSchedulerJobs";

interface Props {
  jobs: SchedulerJob[];
  onDelete: (jobId: string) => void;
}

export default function SchedulerJobList({ jobs, onDelete }: Props) {
  if (jobs.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
        No scheduled jobs yet. Create one to get started.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {jobs.map((job) => {
        const progressStatus = job.progress?.status;
        const statusColor = progressStatus === "running"
          ? "var(--accent)"
          : progressStatus === "completed"
          ? "var(--success)"
          : progressStatus === "error"
          ? "var(--error)"
          : "var(--text-muted)";

        return (
          <div
            key={job.job_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{job.ticker}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {job.frequency}
                </span>
                {progressStatus && (
                  <span style={{ fontSize: 11, color: statusColor, textTransform: "capitalize" }}>
                    {progressStatus}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Next: {job.next_run || "N/A"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {job.timezone} | {job.provider} | depth {job.research_depth}
              </div>
            </div>
            <button
              onClick={() => onDelete(job.job_id)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "transparent",
                color: "var(--error)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
