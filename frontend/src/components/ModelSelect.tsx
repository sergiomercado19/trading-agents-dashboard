import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

interface Props {
  provider: string;
  value: string;
  onChange: (model: string) => void;
  type?: "quick" | "deep";
}

export default function ModelSelect({ provider, value, onChange, type = "quick" }: Props) {
  const [models, setModels] = useState<Record<string, { quick: string[]; deep: string[] }>>({});

  useEffect(() => {
    fetchJson<Record<string, { quick: string[]; deep: string[] }>>("/models")
      .then(setModels)
      .catch(() => {});
  }, []);

  const providerModels = models[provider];
  const options = providerModels?.[type] ?? [];

  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
        {type === "quick" ? "Quick Think Model" : "Deep Think Model"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: 13,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          outline: "none",
        }}
      >
        {options.length === 0 && <option value={value}>{value || "Select provider first"}</option>}
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
