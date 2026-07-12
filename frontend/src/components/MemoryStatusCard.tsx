import type { MemoryStatus } from "../hooks/useMemoryStatus";

interface Props {
  status: MemoryStatus | null;
  loading: boolean;
}

export default function MemoryStatusCard({ status, loading }: Props) {
  if (loading && !status) {
    return <div style={cardStyle}>Loading...</div>;
  }

  const count = status?.note_count ?? 0;
  const lastSync = status?.last_synced
    ? new Date(status.last_synced).toLocaleString()
    : "Never";
  const vault = status?.vault_path ?? "Not configured";
  const docker = status?.is_docker ?? false;

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>ChromaDB Status</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
        <div>
          <div style={labelStyle}>Collection</div>
          <div style={valueStyle}>{status?.collection ?? "—"}</div>
        </div>
        <div>
          <div style={labelStyle}>Notes Indexed</div>
          <div style={valueStyle}>{count}</div>
        </div>
        <div>
          <div style={labelStyle}>Last Synced</div>
          <div style={valueStyle}>{lastSync}</div>
        </div>
        <div>
          <div style={labelStyle}>Docker</div>
          <div style={valueStyle}>{docker ? "Yes" : "No"}</div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={labelStyle}>Vault Path</div>
        <div style={{ ...valueStyle, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
          {vault}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "16px 20px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--bg-secondary)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  color: "var(--text-primary)",
};
