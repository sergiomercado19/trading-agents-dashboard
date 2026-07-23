import { useState } from "react";
import { useTickerSearch, type TickerSuggestion } from "../hooks/useTickerSearch";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TickerSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const { suggestions, loading } = useTickerSearch(query);

  const handleSelect = (s: TickerSuggestion) => {
    onChange(s.symbol);
    setQuery(s.symbol);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs text-c-text-muted mb-1">
        Ticker
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setShowDropdown(true);
          onChange(value); // Call onChange when user types
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => query && setShowDropdown(true)}
        placeholder="AAPL, TSLA, 005930..."
        className="input text-sm uppercase tracking-[0.04em]"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-auto z-50 rounded-md border border-c-border bg-c-bg-elevated shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => handleSelect(s)}
              className="flex w-full justify-between px-3 py-2 text-sm bg-transparent border-none text-c-text-primary cursor-pointer text-left transition-colors hover:bg-c-bg-hover"
            >
              <span className="font-semibold font-mono">{s.symbol}</span>
              <span className="text-c-text-muted ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <span className="block text-xs text-c-text-faint mt-1">
          Searching...
        </span>
      )}
    </div>
  );
}
