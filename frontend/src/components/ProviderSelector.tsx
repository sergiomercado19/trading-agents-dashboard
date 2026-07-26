import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

interface Provider {
  id: string;
  name: string;
  requires_key: boolean;
  env_key: string | null;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function ProviderSelector({ value, onChange }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [envData, setEnvData] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetchJson<Provider[]>("/providers"),
      fetchJson<Record<string, string>>("/env"),
    ]).then(([provs, env]) => {
      setProviders(provs);
      setEnvData(env);
    }).catch(() => {});
  }, []);

  const available = providers.filter(
    (p) => !p.env_key || envData[p.env_key]
  );

  useEffect(() => {
    if (available.length > 0 && !available.some((p) => p.id === value)) {
      onChange(available[0]!.id);
    }
  }, [available, value, onChange]);

  return (
    <div>
      <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
        Provider
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "var(--space-1)" }}>
        {available.map((p) => (
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
