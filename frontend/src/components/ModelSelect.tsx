import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";
import { getModelLabel } from "../model-labels";

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
  }, [provider]);

  const providerModels = models[provider];
  const options = providerModels?.[type] ?? [];

  // Reset to first available option if current value not in new provider's options
  useEffect(() => {
    if (options.length > 0 && !options.includes(value)) {
      onChange(options[0]);
    }
  }, [provider, options, value, onChange]);

  return (
    <div>
      <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
        {type === "quick" ? "Quick" : "Deep"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        style={{ fontSize: "var(--text-xs)", padding: "var(--space-2)" }}
      >
        {options.length === 0 && <option value={value}>{value || "Select provider"}</option>}
        {options.map((m) => (
          <option key={m} value={m}>{getModelLabel(m)}</option>
        ))}
      </select>
    </div>
  );
}
