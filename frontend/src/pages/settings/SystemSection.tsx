import { useSettings } from "./SettingsContext";
import { SectionHeading, Card } from "./SettingsShared";

export function SystemSection() {
  const {
    health,
    docker,
    installing,
    installResult,
    setInstalling,
    setInstallResult,
    refresh,
  } = useSettings();

  const checks = health
    ? [
        { label: "Backend API", ok: health.status === "ok" || health.status === "degraded", detail: health.status },
        { label: "Python", ok: true, detail: health.python },
        { label: "TradingAgents Engine", ok: health.tradingagents, detail: health.tradingagents ? "Installed" : "Not found" },
        { label: ".env File", ok: health.env_file, detail: health.env_file ? "Present" : "Missing" },
        { label: "All Dependencies", ok: health.missing_deps.length === 0, detail: health.missing_deps.length === 0 ? "All installed" : `${health.missing_deps.length} missing` },
      ]
    : [];

  const handleRefresh = async () => {
    await refresh();
  };

  const handleInstall = async () => {
    setInstalling(true);
    setInstallResult(null);
    try {
      const result = await fetch("/api/install_missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.json());
      setInstallResult(result);
      await refresh();
    } catch (e: unknown) {
      setInstallResult({ success: false, installed: [], errors: [String(e)] });
    }
    setInstalling(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>System</h2>

      {/* Health Checks */}
      {health && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <SectionHeading>Health Checks</SectionHeading>
            <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
              Refresh
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
            {checks.map((check) => (
              <Card key={check.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span
                  style={{
                    color: check.ok ? "var(--color-success)" : "var(--color-error)",
                    fontSize: "var(--text-sm)",
                    width: 16,
                    textAlign: "center",
                  }}
                >
                  {check.ok ? "✓" : "✗"}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                  {check.label}
                </span>
                {check.detail && (
                  <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>
                    {check.detail}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Missing Dependencies */}
      {health && health.missing_deps.length > 0 && (
        <section>
          <SectionHeading>Missing Dependencies</SectionHeading>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-warning)", marginBottom: "var(--space-3)", fontFamily: "var(--font-mono)" }}>
            {health.missing_deps.join(", ")}
          </div>
          <button onClick={handleInstall} disabled={installing} className="btn btn-primary" style={{ width: "fit-content" }}>
            {installing ? "Installing..." : "Install Missing"}
          </button>
          {installResult && (
            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                background: installResult.success ? "var(--color-success-subtle)" : "var(--color-error-subtle)",
                border: `1px solid ${installResult.success ? "var(--color-success)" : "var(--color-error)"}`,
              }}
            >
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
          )}
        </section>
      )}

      {/* Docker Info */}
      {docker && (
        <section>
          <SectionHeading>Docker Info</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
            <Card>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>In Docker</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{docker.is_docker ? "Yes" : "No"}</div>
            </Card>
            <Card>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Hostname</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{docker.hostname || "—"}</div>
            </Card>
            <Card style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Env Path</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", wordBreak: "break-all", color: "var(--color-text-secondary)" }}>
                {docker.env_path || "—"}
              </div>
            </Card>
          </div>
          {docker.is_docker && (
            <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", background: "var(--color-warning-subtle)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
              When running in Docker, mount your Obsidian vault and .env file into the container.
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <section>
        <SectionHeading>Quick Links</SectionHeading>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <a href="/api/docs" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            API Docs
          </a>
          <a href="/api/health" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Health
          </a>
          <a href="/api/health/detailed" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Detailed Health
          </a>
        </div>
      </section>
    </div>
  );
}