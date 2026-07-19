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
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <Input
        ref={inputRef}
        id="ticker"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="AAPL, TSLA, NVDA..."
        style={{ textTransform: "uppercase" }}
        disabled={disabled}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {results.map((ticker, i) => (
            <div
              key={ticker.symbol}
              onClick={() => handleSelect(ticker)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: i === highlightIdx ? "var(--color-accent-subtle)" : "transparent",
                transition: "background 0.1s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i === highlightIdx ? "var(--color-accent-subtle)" : "transparent")}
            >
              <span style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                {ticker.symbol}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ticker.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
