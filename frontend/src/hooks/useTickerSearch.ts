import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

export interface TickerSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export function useTickerSearch(query: string) {
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchJson<TickerSuggestion[]>(`/ticker/search?q=${encodeURIComponent(query)}`);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { suggestions, loading };
}
