import { useState } from "react";
import SchedulerForm from "../components/SchedulerForm";
import SchedulerJobList from "../components/SchedulerJobList";
import { useSchedulerJobs } from "../hooks/useSchedulerJobs";

export default function SchedulerPage() {
  const { jobs, loading, addJob, removeJob } = useSchedulerJobs();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: Record<string, unknown>) => {
    await addJob(data);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>Scheduler</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + New Job
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            padding: 16,
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            marginBottom: 16,
          }}
        >
          <SchedulerForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading jobs...</div>
      ) : (
        <SchedulerJobList jobs={jobs} onDelete={removeJob} />
      )}
    </div>
  );
}
