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
      <label className="block text-xs text-c-text-muted mb-1">
        {type === "quick" ? "Quick" : "Deep"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-xs p-2"
      >
        {options.length === 0 && <option value={value}>{value || "Select provider"}</option>}
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
