import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";

interface TickerResult {
  symbol: string;
  name: string;
}

interface TickerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (ticker: TickerResult) => void;
  disabled?: boolean;
}

export function TickerAutocomplete({ value, onChange, onSelect, disabled }: TickerAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TickerResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchTickers = useCallback(async (q: string) => {
    try {
      const data = await api.get<TickerResult[]>(`/api/tickers/search?q=${encodeURIComponent(q)}`);
      setResults(data);
      setOpen(true);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTickers(val), 300);
  };

  const handleFocus = () => {
    if (results.length > 0 || !query) {
      fetchTickers(query);
    }
  };

  const handleSelect = (ticker: TickerResult) => {
    setQuery(ticker.symbol);
    onChange(ticker.symbol);
    setOpen(false);
    onSelect(ticker);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0 && results[highlightIdx]) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        id="ticker"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="AAPL, TSLA, NVDA..."
        className="uppercase"
        disabled={disabled}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[240px] overflow-y-auto z-50 rounded-md border border-c-border bg-c-bg-elevated shadow-lg">
          {results.map((ticker, i) => (
            <div
              key={ticker.symbol}
              onClick={() => handleSelect(ticker)}
              className={`flex justify-between items-center px-3 py-2 cursor-pointer transition-colors hover:bg-c-bg-hover ${i === highlightIdx ? "bg-[var(--color-accent-subtle)]" : "bg-transparent"}`}
            >
              <span className="font-semibold text-sm text-c-text-primary">
                {ticker.symbol}
              </span>
              <span className="text-xs text-c-text-muted ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
                {ticker.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
