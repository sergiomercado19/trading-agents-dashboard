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
    <div style={{ padding: "var(--space-6)", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>Memory / RAG</h2>

      {/* Status + Config row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? "Syncing vault..." : "Sync Vault → ChromaDB"}
            </Button>
            {syncResult && (
              <span style={{ fontSize: "var(--text-sm)", color: syncResult.status === "ok" ? "var(--color-success)" : "var(--color-error)" }}>
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
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search past situations and recommendations..."
              className="input"
              style={{ flex: 1 }}
            />
            <Button variant="secondary" onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {results.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "var(--space-3)",
                    background: "var(--color-bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                      {String(r.metadata.source || r.id)}
                    </span>
                    {r.distance !== null && (
                      <span className="badge" style={{ background: "var(--color-bg-overlay)", color: "var(--color-text-muted)" }}>
                        {r.distance.toFixed(3)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-wrap" }}>
                    {r.document.length > 500 ? r.document.slice(0, 500) + "..." : r.document}
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.length === 0 && query && !searching && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>No results found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
