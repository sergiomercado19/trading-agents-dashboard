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
      fetchJson<HealthData>("/health/detailed"),
      fetchJson<DockerInfo>("/docker/info").catch(() => ({ is_docker: false, hostname: "", env_path: "" })),
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
      const result = await postJson<{ success: boolean; installed: string[]; errors: string[] }>("/install_missing", {});
      setInstallResult(result);
      refresh();
    } catch (e: unknown) {
      setInstallResult({ success: false, installed: [], errors: [String(e)] });
    }
    setInstalling(false);
  };

  if (loading) return <div style={{ padding: "var(--space-6)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading health checks...</div>;
  if (error) return <div style={{ padding: "var(--space-6)", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>Error: {error}</div>;
  if (!health) return null;

  const checks = [
    { label: "Backend API", ok: health.status === "ok" || health.status === "degraded", detail: health.status },
    { label: "Python", ok: true, detail: health.python },
    { label: "TradingAgents Engine", ok: health.tradingagents, detail: health.tradingagents ? "Installed" : "Not found" },
    { label: ".env File", ok: health.env_file, detail: health.env_file ? "Present" : "Missing" },
    { label: "All Dependencies", ok: health.missing_deps.length === 0, detail: health.missing_deps.length === 0 ? "All installed" : `${health.missing_deps.length} missing` },
  ];

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 800, display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>Setup</h2>

      {/* Health checks */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Health Checks</span>
          <span className={`badge ${checks.every((c) => c.ok) ? "badge-success" : "badge-warning"}`}>
            {checks.every((c) => c.ok) ? "All OK" : "Issues found"}
          </span>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {checks.map((check) => (
              <div
                key={check.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-elevated)",
                  borderLeft: `2px solid ${check.ok ? "var(--color-success)" : "var(--color-error)"}`,
                }}
              >
                <span style={{ color: check.ok ? "var(--color-success)" : "var(--color-error)", fontSize: "var(--text-sm)", width: 16, textAlign: "center" }}>
                  {check.ok ? "✓" : "✗"}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{check.label}</span>
                {check.detail && (
                  <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>{check.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docker info */}
      {docker && (
        <section className="panel">
          <div className="panel-header">
            <span className="panel-title">Docker</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--space-1)" }}>Running in Docker</div>
                <div style={{ color: "var(--color-text-primary)" }}>{docker.is_docker ? "Yes" : "No"}</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--space-1)" }}>Hostname</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{docker.hostname || "—"}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--space-1)" }}>.env Path</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", wordBreak: "break-all", color: "var(--color-text-secondary)" }}>{docker.env_path || "—"}</div>
              </div>
            </div>
            {docker.is_docker && (
              <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", background: "var(--color-warning-subtle)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                When running in Docker, mount your Obsidian vault and .env file into the container.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Missing deps */}
      {health.missing_deps.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <span className="panel-title">Missing Dependencies</span>
            <span className="badge badge-warning">{health.missing_deps.length}</span>
          </div>
          <div className="panel-body">
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-warning)", marginBottom: "var(--space-3)", fontFamily: "var(--font-mono)" }}>
              {health.missing_deps.join(", ")}
            </div>
            <button onClick={handleInstall} disabled={installing} className="btn btn-primary">
              {installing ? "Installing..." : "Install Missing"}
            </button>
          </div>
        </section>
      )}

      {/* Install result */}
      {installResult && (
        <section className="panel">
          <div className="panel-header">
            <span className="panel-title">Install Result</span>
            <span className={`badge ${installResult.success ? "badge-success" : "badge-error"}`}>
              {installResult.success ? "Success" : "Failed"}
            </span>
          </div>
          <div className="panel-body">
            {installResult.installed.length > 0 && (
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-success)", marginBottom: "var(--space-2)" }}>
                Installed: {installResult.installed.join(", ")}
              </div>
            )}
            {installResult.errors.length > 0 && (
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                Errors: {installResult.errors.join("; ")}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Quick Links</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <a href="/api/docs" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>API Docs</a>
            <a href="/api/health" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Health</a>
            <a href="/api/health/detailed" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Detailed Health</a>
          </div>
        </div>
      </section>
    </div>
  );
}
