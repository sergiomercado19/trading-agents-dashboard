import type { MemoryStatus } from "../hooks/useMemoryStatus";

interface Props {
  status: MemoryStatus | null;
  loading: boolean;
}

export default function MemoryStatusCard({ status, loading }: Props) {
  if (loading && !status) {
    return <div className="px-5 py-4 border border-c-border rounded-lg bg-c-bg-elevated">Loading...</div>;
  }

  const count = status?.note_count ?? 0;
  const lastSync = status?.last_synced
    ? new Date(status.last_synced).toLocaleString()
    : "Never";
  const vault = status?.vault_path ?? "Not configured";
  const docker = status?.is_docker ?? false;

  return (
    <div className="px-5 py-4 border border-c-border rounded-lg bg-c-bg-elevated">
      <div className="font-semibold text-sm mb-2.5">ChromaDB Status</div>
      <div className="grid grid-cols-2 gap-2.5 text-[13px]">
        <div>
          <div className="text-[11px] text-c-text-muted uppercase tracking-wider mb-0.5">Collection</div>
          <div className="text-c-text-primary">{status?.collection ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] text-c-text-muted uppercase tracking-wider mb-0.5">Notes Indexed</div>
          <div className="text-c-text-primary">{count}</div>
        </div>
        <div>
          <div className="text-[11px] text-c-text-muted uppercase tracking-wider mb-0.5">Last Synced</div>
          <div className="text-c-text-primary">{lastSync}</div>
        </div>
        <div>
          <div className="text-[11px] text-c-text-muted uppercase tracking-wider mb-0.5">Docker</div>
          <div className="text-c-text-primary">{docker ? "Yes" : "No"}</div>
        </div>
      </div>
      <div className="mt-2.5">
        <div className="text-[11px] text-c-text-muted uppercase tracking-wider mb-0.5">Vault Path</div>
        <div className="text-c-text-primary font-mono text-xs break-all">{vault}</div>
      </div>
    </div>
  );
}
