import { useState } from "react";
import { postJson } from "../api/client";

export interface MemoryResult {
  id: string;
  document: string;
  distance: number | null;
  metadata: Record<string, unknown>;
}

export function useMemories() {
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await postJson<MemoryResult[]>("/memory/search", { query, n_results: 10 });
      setResults(data);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return { results, loading, search };
}
