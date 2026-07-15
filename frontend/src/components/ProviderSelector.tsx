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
      <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
        Provider
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "var(--space-1)" }}>
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`btn btn-sm ${value === p.id ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "var(--text-xs)", padding: "var(--space-2)" }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
