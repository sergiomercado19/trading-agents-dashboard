import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export interface MemoryStatus {
  collection: string;
  note_count: number;
  last_synced: string | null;
  vault_path: string | null;
  is_docker: boolean;
}

export function useMemoryStatus() {
  const [status, setStatus] = useState<MemoryStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchJson<MemoryStatus>("/memory/status")
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  return { status, loading, refresh };
}
