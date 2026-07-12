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
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
        Ticker Symbol
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => query && setShowDropdown(true)}
        placeholder="e.g. AAPL, 005930 (KRX)"
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: 14,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          outline: "none",
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 200,
            overflow: "auto",
            zIndex: 100,
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => handleSelect(s)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                background: "transparent",
                border: "none",
                color: "var(--text)",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 600 }}>{s.symbol}</span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
          Searching...
        </span>
      )}
    </div>
  );
}
