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
    <div className="p-6 max-w-narrow mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-c-text-primary">Scheduler</h2>
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
        <div className="text-c-text-muted text-sm">Loading jobs...</div>
      ) : (
        <SchedulerJobList jobs={jobs} onDelete={removeJob} />
      )}
    </div>
  );
}
