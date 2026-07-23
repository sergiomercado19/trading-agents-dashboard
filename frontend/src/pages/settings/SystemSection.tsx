import { useSettings } from "./SettingsContext";
import { SectionHeading, Card } from "./SettingsShared";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-c-text-primary">System</h2>

      {/* Health Checks */}
      {health && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <SectionHeading>Health Checks</SectionHeading>
            <Button variant="secondary" size="sm" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {checks.map((check) => (
              <Card key={check.label} className="flex items-center gap-2">
                <span
                  className={`text-sm w-4 text-center ${check.ok ? "text-c-success" : "text-c-error"}`}
                >
                  {check.ok ? "✓" : "✗"}
                </span>
                <span className="text-sm font-medium text-c-text-primary">
                  {check.label}
                </span>
                {check.detail && (
                  <span className="ml-auto text-c-text-muted text-xs font-mono">
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
          <div className="text-sm text-c-warning mb-3 font-mono">
            {health.missing_deps.join(", ")}
          </div>
          <Button onClick={handleInstall} disabled={installing} className="w-fit">
            {installing ? "Installing..." : "Install Missing"}
          </Button>
          {installResult && (
            <div
              className="mt-3 p-3 rounded-md"
              style={{
                background: installResult.success ? "var(--color-success-subtle, oklch(0.72 0.19 155 / 0.12))" : "var(--color-error-subtle)",
                border: `1px solid ${installResult.success ? "var(--color-success)" : "var(--color-error)"}`,
              }}
            >
              {installResult.installed.length > 0 && (
                <div className="text-sm text-c-success mb-2">
                  Installed: {installResult.installed.join(", ")}
                </div>
              )}
              {installResult.errors.length > 0 && (
                <div className="text-sm text-c-error">
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            <Card>
              <div className="text-xs text-c-text-muted mb-1">In Docker</div>
              <div className="font-mono text-sm text-c-text-primary">{docker.is_docker ? "Yes" : "No"}</div>
            </Card>
            <Card>
              <div className="text-xs text-c-text-muted mb-1">Hostname</div>
              <div className="font-mono text-sm text-c-text-primary">{docker.hostname || "—"}</div>
            </Card>
            <Card className="col-span-full">
              <div className="text-xs text-c-text-muted mb-1">Env Path</div>
              <div className="font-mono text-xs text-c-text-secondary break-all">
                {docker.env_path || "—"}
              </div>
            </Card>
          </div>
          {docker.is_docker && (
            <div className="mt-3 py-2 px-3 rounded-md text-xs text-c-warning" style={{ background: "var(--color-warning-subtle, oklch(0.82 0.17 85 / 0.12))", border: "1px solid var(--color-warning)" }}>
              When running in Docker, mount your Obsidian vault and .env file into the container.
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <section>
        <SectionHeading>Quick Links</SectionHeading>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/docs" target="_blank" className="no-underline">
            <Button variant="secondary" size="sm">API Docs</Button>
          </a>
          <a href="/api/health" target="_blank" className="no-underline">
            <Button variant="secondary" size="sm">Health</Button>
          </a>
          <a href="/api/health/detailed" target="_blank" className="no-underline">
            <Button variant="secondary" size="sm">Detailed Health</Button>
          </a>
        </div>
      </section>
    </div>
  );
}
