import { useState } from "react";
import { postJson } from "../api/client";

interface Props {
  currentPath: string | null;
  isDocker: boolean;
  onSaved: () => void;
}

export default function ObsidianConfig({ currentPath, isDocker, onSaved }: Props) {
  const [path, setPath] = useState(currentPath || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await postJson("/memory/vault", { path });
      setMessage("Saved");
      onSaved();
    } catch {
      setMessage("Error saving");
    }
    setSaving(false);
  };

  return (
    <div className="px-5 py-4 border border-c-border rounded-lg bg-c-bg-secondary">
      <div className="font-semibold text-sm mb-[10px]">Obsidian Vault</div>
      {isDocker && (
        <div className="px-3 py-2 bg-[var(--warning-bg,rgba(255,200,0,0.1))] border border-[var(--warning,#f0ad4e)] rounded-md text-xs text-[var(--warning,#f0ad4e)] mb-[10px]">
          Running in Docker — mount your vault to a container path and enter that path here.
        </div>
      )}
      <div className="text-xs text-c-text-muted mb-2">
        Path to your Obsidian vault. Reports will be saved to <code>TradingAgents/Reports/</code> inside this vault.
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 px-3 py-2 bg-c-bg-tertiary border border-c-border rounded-md text-c-text-primary text-[13px] font-mono"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder={isDocker ? "/vault/tradingagents" : "~/tradingagents-vault"}
        />
        <button
          className="input px-4 py-2 bg-c-accent border-none rounded-md text-black font-semibold text-[13px] cursor-pointer"
          onClick={handleSave}
          disabled={saving || !path.trim()}
          style={{ opacity: saving || !path.trim() ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-xs" style={{ color: message === "Saved" ? "var(--success, #4caf50)" : "var(--error, #f44336)" }}>
          {message}
        </div>
      )}
    </div>
  );
}
