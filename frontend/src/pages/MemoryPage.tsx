import { useState } from "react";
import { postJson } from "../api/client";
import { useMemoryStatus } from "../hooks/useMemoryStatus";
import { useMemories } from "../hooks/useMemories";
import MemoryStatusCard from "../components/MemoryStatusCard";
import ObsidianConfig from "../components/ObsidianConfig";

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
    <div style={{ padding: "20px 28px", maxWidth: 900 }}>
      <h2 style={{ fontSize: 18, marginBottom: 20 }}>Memory / RAG</h2>

      {/* Status + Config row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <MemoryStatusCard status={status} loading={loading} />
        <ObsidianConfig
          currentPath={status?.vault_path ?? null}
          isDocker={status?.is_docker ?? false}
          onSaved={refresh}
        />
      </div>

      {/* Sync */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: "10px 24px",
            background: "var(--accent)",
            border: "none",
            borderRadius: 6,
            color: "#000",
            fontWeight: 600,
            fontSize: 13,
            cursor: syncing ? "wait" : "pointer",
            opacity: syncing ? 0.6 : 1,
          }}
        >
          {syncing ? "Syncing vault..." : "Sync Vault → ChromaDB"}
        </button>
        {syncResult && (
          <span style={{ marginLeft: 12, fontSize: 13, color: syncResult.status === "ok" ? "var(--success, #4caf50)" : "var(--error, #f44336)" }}>
            {syncResult.status === "ok"
              ? `Indexed ${syncResult.indexed} notes from ${syncResult.indexed} chunks`
              : syncResult.message}
          </span>
        )}
      </div>

      {/* Similarity Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Similarity Search</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search past situations and recommendations..."
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            style={{
              padding: "8px 20px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  background: "var(--bg-secondary)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                    {String(r.metadata.source || r.id)}
                  </span>
                  {r.distance !== null && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Distance: {r.distance.toFixed(3)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {r.document.length > 500 ? r.document.slice(0, 500) + "..." : r.document}
                </div>
              </div>
            ))}
          </div>
        )}
        {results.length === 0 && query && !searching && (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No results found.</div>
        )}
      </div>
    </div>
  );
}
