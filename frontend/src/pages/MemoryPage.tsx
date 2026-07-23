import { useState } from "react";
import { postJson } from "../api/client";
import { useMemoryStatus } from "../hooks/useMemoryStatus";
import { useMemories } from "../hooks/useMemories";
import MemoryStatusCard from "../components/MemoryStatusCard";
import ObsidianConfig from "../components/ObsidianConfig";
import { Button } from "@/components/ui/button";

export default function MemoryPage() {
  const { status, loading, refresh } = useMemoryStatus();
  const { results, loading: searching, search } = useMemories();
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ status: string; indexed?: number; message?: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await postJson<{ status: string; indexed?: number; message?: string }>("/memory/sync", {});
      setSyncResult(result);
      refresh();
    } catch {
      setSyncResult({ status: "error", message: "Sync failed" });
    }
    setSyncing(false);
  };

  const handleSearch = () => {
    search(query);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto flex flex-col gap-6">
      <h2 className="text-xl font-bold text-c-text-primary">Memory / RAG</h2>

      {/* Status + Config row */}
      <div className="grid grid-cols-2 gap-4">
        <MemoryStatusCard status={status} loading={loading} />
        <ObsidianConfig
          currentPath={status?.vault_path ?? null}
          isDocker={status?.is_docker ?? false}
          onSaved={refresh}
        />
      </div>

      {/* Sync */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Sync</span>
        </div>
        <div className="panel-body">
          <div className="flex items-center gap-3">
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? "Syncing vault..." : "Sync Vault → ChromaDB"}
            </Button>
            {syncResult && (
              <span className={`text-sm ${syncResult.status === "ok" ? "text-c-success" : "text-c-error"}`}>
                {syncResult.status === "ok"
                  ? `Indexed ${syncResult.indexed} notes`
                  : syncResult.message}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Similarity Search */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Similarity Search</span>
        </div>
        <div className="panel-body">
          <div className="flex gap-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search past situations and recommendations..."
              className="input flex-1"
            />
            <Button variant="secondary" onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="p-3 bg-c-bg-elevated rounded-md border border-c-border-subtle"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-c-text-primary">
                      {String(r.metadata.source || r.id)}
                    </span>
                    {r.distance !== null && (
                      <span className="badge bg-c-bg-overlay text-c-text-muted">
                        {r.distance.toFixed(3)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-c-text-secondary leading-relaxed whitespace-pre-wrap">
                    {r.document.length > 500 ? r.document.slice(0, 500) + "..." : r.document}
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.length === 0 && query && !searching && (
            <div className="text-sm text-c-text-muted">No results found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
