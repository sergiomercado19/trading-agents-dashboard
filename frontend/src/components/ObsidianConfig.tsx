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
    <div style={cardStyle}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Obsidian Vault</div>
      {isDocker && (
        <div style={{
          padding: "8px 12px",
          background: "var(--warning-bg, rgba(255,200,0,0.1))",
          border: "1px solid var(--warning, #f0ad4e)",
          borderRadius: 6,
          fontSize: 12,
          color: "var(--warning, #f0ad4e)",
          marginBottom: 10,
        }}>
          Running in Docker — mount your vault to a container path and enter that path here.
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
        Path to your Obsidian vault. Reports will be saved to <code>TradingAgents/Reports/</code> inside this vault.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder={isDocker ? "/vault/tradingagents" : "~/tradingagents-vault"}
          style={inputStyle}
        />
        <button
          onClick={handleSave}
          disabled={saving || !path.trim()}
          style={{
            ...btnStyle,
            opacity: saving || !path.trim() ? 0.5 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {message && (
        <div style={{ marginTop: 8, fontSize: 12, color: message === "Saved" ? "var(--success, #4caf50)" : "var(--error, #f44336)" }}>
          {message}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "16px 20px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--bg-secondary)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "monospace",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--accent)",
  border: "none",
  borderRadius: 6,
  color: "#000",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
