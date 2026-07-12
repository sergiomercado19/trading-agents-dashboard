import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";

interface HealthData {
  status: string;
  python: string;
  tradingagents: boolean;
  env_file: boolean;
  required_deps: string[];
  missing_deps: string[];
}

interface DockerInfo {
  is_docker: boolean;
  hostname: string;
  env_path: string;
}

export default function SetupPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [docker, setDocker] = useState<DockerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ success: boolean; installed: string[]; errors: string[] } | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetchJson<HealthData>("/api/health/detailed"),
      fetchJson<DockerInfo>("/api/docker/info").catch(() => ({ is_docker: false, hostname: "", env_path: "" })),
    ])
      .then(([h, d]) => { setHealth(h); setDocker(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleInstall = async () => {
    setInstalling(true);
    setInstallResult(null);
    try {
      const result = await postJson<{ success: boolean; installed: string[]; errors: string[] }>("/api/install_missing", {});
      setInstallResult(result);
      refresh();
    } catch (e: unknown) {
      setInstallResult({ success: false, installed: [], errors: [String(e)] });
    }
    setInstalling(false);
  };

  if (loading) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Loading health checks...</div>;
  if (error) return <div style={{ padding: 20, color: "var(--error, #f44336)" }}>Error: {error}</div>;
  if (!health) return null;

  const checks = [
    { label: "Backend API", ok: health.status === "ok" || health.status === "degraded", detail: health.status },
    { label: "Python", ok: true, detail: health.python },
    { label: "TradingAgents Engine", ok: health.tradingagents, detail: health.tradingagents ? "Installed" : "Not found" },
    { label: ".env File", ok: health.env_file, detail: health.env_file ? "Present" : "Missing" },
    { label: "All Dependencies", ok: health.missing_deps.length === 0, detail: health.missing_deps.length === 0 ? "All installed" : `${health.missing_deps.length} missing` },
  ];

  return (
    <div style={{ padding: "20px 28px", maxWidth: 800 }}>
      <h2 style={{ fontSize: 18, marginBottom: 20 }}>Setup</h2>

      {/* Health checks */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Health Checks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {checks.map((check) => (
            <div key={check.label} style={rowStyle}>
              <span style={{ color: check.ok ? "var(--success, #4caf50)" : "var(--error, #f44336)", fontSize: 16 }}>
                {check.ok ? "\u2713" : "\u2717"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{check.label}</span>
              {check.detail && (
                <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>{check.detail}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Docker info */}
      {docker && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Docker</div>
          <div style={cardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
              <div>
                <div style={labelStyle}>Running in Docker</div>
                <div>{docker.is_docker ? "Yes" : "No"}</div>
              </div>
              <div>
                <div style={labelStyle}>Hostname</div>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{docker.hostname || "—"}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={labelStyle}>.env Path</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{docker.env_path || "—"}</div>
              </div>
            </div>
            {docker.is_docker && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,200,0,0.08)", border: "1px solid var(--warning, #f0ad4e)", borderRadius: 6, fontSize: 12, color: "var(--warning, #f0ad4e)" }}>
                When running in Docker, mount your Obsidian vault and .env file into the container.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missing deps */}
      {health.missing_deps.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Missing Dependencies</div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: "var(--warning, #f0ad4e)", marginBottom: 10 }}>
              {health.missing_deps.join(", ")}
            </div>
            <button
              onClick={handleInstall}
              disabled={installing}
              style={{
                padding: "8px 20px",
                background: "var(--accent)",
                border: "none",
                borderRadius: 6,
                color: "#000",
                fontWeight: 600,
                fontSize: 13,
                cursor: installing ? "wait" : "pointer",
                opacity: installing ? 0.6 : 1,
              }}
            >
              {installing ? "Installing..." : "Install Missing"}
            </button>
          </div>
        </div>
      )}

      {/* Install result */}
      {installResult && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Install Result</div>
          <div style={cardStyle}>
            {installResult.installed.length > 0 && (
              <div style={{ fontSize: 13, color: "var(--success, #4caf50)", marginBottom: 6 }}>
                Installed: {installResult.installed.join(", ")}
              </div>
            )}
            {installResult.errors.length > 0 && (
              <div style={{ fontSize: 13, color: "var(--error, #f44336)" }}>
                Errors: {installResult.errors.join("; ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Quick Links</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/api/docs" target="_blank" style={linkStyle}>API Docs (Swagger)</a>
          <a href="/api/health" target="_blank" style={linkStyle}>Health Endpoint</a>
          <a href="/api/health/detailed" target="_blank" style={linkStyle}>Detailed Health</a>
        </div>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
};

const cardStyle: React.CSSProperties = {
  padding: "14px 18px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--bg-secondary)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  marginBottom: 2,
};

const linkStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--accent, #2196f3)",
  fontSize: 13,
  textDecoration: "none",
};
