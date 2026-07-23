import { useState } from "react";
import SchedulerForm from "../components/SchedulerForm";
import SchedulerJobList from "../components/SchedulerJobList";
import { useSchedulerJobs } from "../hooks/useSchedulerJobs";
import { Button } from "@/components/ui/button";

export default function SchedulerPage() {
  const { jobs, loading, addJob, removeJob } = useSchedulerJobs();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: Record<string, unknown>) => {
    await addJob(data);
    setShowForm(false);
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>Scheduler</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            + New Job
          </Button>
        )}
      </div>

      {showForm && (
        <div className="panel mb-5">
          <div className="panel-body">
            <SchedulerForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading jobs...</div>
      ) : (
        <SchedulerJobList jobs={jobs} onDelete={removeJob} />
      )}
    </div>
  );
}
