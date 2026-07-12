import { useEffect, useState } from "react";
import { fetchJson } from "../api/client";

interface HealthData {
  status: string;
  python: string;
  tradingagents: boolean;
  env_file: boolean;
  missing_deps: string[];
}

export default function SetupPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<HealthData>("/api/health/detailed")
      .then(setHealth)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>Loading health checks...</div>;
  if (error) return <div style={{ color: "var(--error)" }}>Error: {error}</div>;
  if (!health) return null;

  const checks = [
    { label: "Backend API", ok: health.status === "ok" || health.status === "degraded" },
    { label: "Python", ok: true, detail: health.python },
    { label: "TradingAgents Engine", ok: health.tradingagents },
    { label: ".env File", ok: health.env_file },
    { label: "All Dependencies", ok: health.missing_deps.length === 0 },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Setup</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((check) => (
          <div
            key={check.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "var(--bg-secondary)",
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ color: check.ok ? "var(--success)" : "var(--error)", fontSize: 14 }}>
              {check.ok ? "\u2713" : "\u2717"}
            </span>
            <span style={{ fontSize: 13 }}>{check.label}</span>
            {check.detail && (
              <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>
                {check.detail}
              </span>
            )}
          </div>
        ))}
      </div>
      {health.missing_deps.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 13, color: "var(--warning)", marginBottom: 8 }}>
            Missing dependencies: {health.missing_deps.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
