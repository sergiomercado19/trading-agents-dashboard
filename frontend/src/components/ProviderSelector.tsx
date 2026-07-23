import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";
import { Button } from "@/components/ui/button";

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
      <label className="block text-xs text-c-text-muted mb-1">
        Provider
      </label>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1">
        {providers.map((p) => (
          <Button
            key={p.id}
            variant={value === p.id ? "default" : "secondary"}
            size="sm"
            onClick={() => onChange(p.id)}
            className="text-xs py-2"
          >
            {p.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
