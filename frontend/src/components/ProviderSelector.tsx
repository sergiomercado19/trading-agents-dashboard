import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

interface Provider {
  id: string;
  name: string;
  requires_key: boolean;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function ProviderSelector({ value, onChange }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchJson<Provider[]>("/providers").then(setProviders).catch(() => {});
  }, []);

  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
        Provider
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{
              padding: "8px 10px",
              fontSize: 12,
              background: value === p.id ? "var(--accent)" : "var(--bg-tertiary)",
              color: value === p.id ? "#fff" : "var(--text)",
              border: `1px solid ${value === p.id ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
