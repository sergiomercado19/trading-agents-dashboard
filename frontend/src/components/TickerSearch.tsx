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
      <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
        Ticker
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
        placeholder="AAPL, TSLA, 005930..."
        className="input"
        style={{ fontSize: "var(--text-sm)", textTransform: "uppercase", letterSpacing: "0.04em" }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            marginTop: "var(--space-1)",
            maxHeight: 200,
            overflow: "auto",
            zIndex: "var(--z-elevated)",
            boxShadow: "var(--shadow-lg)",
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
                padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--text-sm)",
                background: "transparent",
                border: "none",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background var(--duration-fast) var(--ease-out)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: "var(--weight-semibold)", fontFamily: "var(--font-mono)" }}>{s.symbol}</span>
              <span style={{ color: "var(--color-text-muted)", marginLeft: "var(--space-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-1)", display: "block" }}>
          Searching...
        </span>
      )}
    </div>
  );
}
