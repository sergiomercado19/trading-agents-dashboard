import { useEffect, useState, useMemo } from "react";
import { fetchJson, postJson } from "../api/client";
import { GeneralIcon, ApiKeysIcon, SystemIcon } from "../components/icons";

/*
|-------------------------------------------------------------------------------
| Types
|-------------------------------------------------------------------------------
*/

interface Provider {
  id: string;
  name: string;
}

interface Models {
  [provider: string]: { quick: string[]; deep: string[] };
}

interface KeyEntry {
  envKey: string;
  label: string;
  provider: string;
  category: string;
}

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

/*
|-------------------------------------------------------------------------------
| Constants
|-------------------------------------------------------------------------------
*/

const KEY_GROUPS: KeyEntry[] = [
  { envKey: "OPENAI_API_KEY", label: "OpenAI", provider: "openai", category: "LLM Providers" },
  { envKey: "ANTHROPIC_API_KEY", label: "Anthropic", provider: "anthropic", category: "LLM Providers" },
  { envKey: "GOOGLE_API_KEY", label: "Google GenAI", provider: "google", category: "LLM Providers" },
  { envKey: "XAI_API_KEY", label: "xAI (Grok)", provider: "xai", category: "LLM Providers" },
  { envKey: "DEEPSEEK_API_KEY", label: "DeepSeek", provider: "deepseek", category: "LLM Providers" },
  { envKey: "OPENROUTER_API_KEY", label: "OpenRouter", provider: "openrouter", category: "LLM Providers" },
  { envKey: "MISTRAL_API_KEY", label: "Mistral", provider: "mistral", category: "LLM Providers" },
  { envKey: "GROQ_API_KEY", label: "Groq", provider: "groq", category: "LLM Providers" },
  { envKey: "NVIDIA_API_KEY", label: "NVIDIA", provider: "nvidia", category: "LLM Providers" },
  { envKey: "FRED_API_KEY", label: "FRED (Federal Reserve)", provider: "fred", category: "Data Providers" },
];

const DATA_VENDOR_CATEGORIES = [
  { key: "core_stock_apis", label: "Core Stock APIs", options: ["yfinance", "alpha_vantage"] },
  { key: "technical_indicators", label: "Technical Indicators", options: ["yfinance", "alpha_vantage"] },
  { key: "fundamental_data", label: "Fundamental Data", options: ["yfinance", "alpha_vantage"] },
  { key: "news_data", label: "News Data", options: ["yfinance", "alpha_vantage"] },
  { key: "macro_data", label: "Macro Data (FRED)", options: ["fred"] },
  { key: "prediction_markets", label: "Prediction Markets", options: ["polymarket"] },
];

const RISK_PROFILES = [
  { id: "conservative", label: "Conservative", desc: "Lower risk, fewer trades, stricter validation" },
  { id: "neutral", label: "Neutral", desc: "Balanced risk/reward approach" },
  { id: "aggressive", label: "Aggressive", desc: "Higher risk tolerance, more opportunities" },
];

type SettingsSection = "general" | "api-keys" | "system";

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "api-keys", label: "API Keys" },
  { id: "system", label: "System" },
];

/*
|-------------------------------------------------------------------------------
| SettingsPage
|-------------------------------------------------------------------------------
*/

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  /* ── General state ── */
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Models>({});
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [quickModel, setQuickModel] = useState("gpt-5.4-mini");
  const [deepModel, setDeepModel] = useState("gpt-5.5");
  const [riskProfile, setRiskProfile] = useState("neutral");
  const [vendors, setVendors] = useState<Record<string, string>>({});

  /* ── API Keys state ── */
  const [envData, setEnvData] = useState<Record<string, string>>({});
  const [keyEdits, setKeyEdits] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [vaultPath, setVaultPath] = useState("");

  /* ── System state ── */
  const [health, setHealth] = useState<HealthData | null>(null);
  const [docker, setDocker] = useState<DockerInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ success: boolean; installed: string[]; errors: string[] } | null>(null);

  /* ── Shared ── */
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  /*
  |-------------------------------------------------------------------------------
  | Data fetching
  |-------------------------------------------------------------------------------
  */

  useEffect(() => {
    Promise.all([
      fetchJson<Provider[]>("/providers").catch(() => []),
      fetchJson<Models>("/models").catch(() => ({})),
      fetchJson<Record<string, string>>("/env").catch(() => ({} as Record<string, string>)),
      fetchJson<HealthData>("/health/detailed").catch(() => null),
      fetchJson<DockerInfo>("/docker/info").catch(() => ({ is_docker: false, hostname: "", env_path: "" })),
      fetchJson<Record<string, string>>("/data_vendors").catch(() => ({})),
    ])
      .then(([provs, mods, env, hp, dk, dv]) => {
        setProviders(provs);
        setModels(mods);
        setEnvData(env);
        setVaultPath(env.TRADINGAGENTS_OBSIDIAN_PATH || env.OBSIDIAN_VAULT_PATH || "");
        setHealth(hp);
        setDocker(dk);
        const v: Record<string, string> = {};
        for (const [k, val] of Object.entries(dv)) {
          v[k] = Array.isArray(val) ? val[0] : String(val);
        }
        setVendors(v);
      })
      .finally(() => setLoading(false));
  }, []);

  /*
  |-------------------------------------------------------------------------------
  | API Keys handlers
  |-------------------------------------------------------------------------------
  */

  const handleKeyChange = (envKey: string, value: string) => {
    setKeyEdits((prev) => ({ ...prev, [envKey]: value }));
  };

  const handleTest = async (entry: KeyEntry) => {
    const key = keyEdits[entry.envKey] || envData[entry.envKey] || "";
    if (!key) {
      setTestResults((prev) => ({ ...prev, [entry.envKey]: { valid: false, message: "No key set" } }));
      return;
    }
    setTesting(entry.envKey);
    try {
      const result = await postJson<{ valid: boolean; message: string }>("/test_key", {
        provider: entry.provider,
        key,
        env_key: entry.envKey,
      });
      setTestResults((prev) => ({ ...prev, [entry.envKey]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [entry.envKey]: { valid: false, message: "Request failed" } }));
    } finally {
      setTesting(null);
    }
  };

  /*
  |-------------------------------------------------------------------------------
  | System handlers
  |-------------------------------------------------------------------------------
  */

  const refreshHealth = () => {
    Promise.all([
      fetchJson<HealthData>("/health/detailed"),
      fetchJson<DockerInfo>("/docker/info").catch(() => ({ is_docker: false, hostname: "", env_path: "" })),
    ])
      .then(([h, d]) => { setHealth(h); setDocker(d); })
      .catch(() => {});
  };

  const handleInstall = async () => {
    setInstalling(true);
    setInstallResult(null);
    try {
      const result = await postJson<{ success: boolean; installed: string[]; errors: string[] }>("/install_missing", {});
      setInstallResult(result);
      refreshHealth();
    } catch (e: unknown) {
      setInstallResult({ success: false, installed: [], errors: [String(e)] });
    }
    setInstalling(false);
  };

  /*
  |-------------------------------------------------------------------------------
  | Global save
  |-------------------------------------------------------------------------------
  */

  const handleSaveAll = async () => {
    const updates: Record<string, string | null> = {};

    // General
    updates.TRADINGAGENTS_LLM_PROVIDER = selectedProvider;
    updates.TRADINGAGENTS_QUICK_THINK_LLM = quickModel;
    updates.TRADINGAGENTS_DEEP_THINK_LLM = deepModel;

    // API Keys
    for (const [k, v] of Object.entries(keyEdits)) {
      if (v !== undefined) updates[k] = v || null;
    }
    if (vaultPath) updates.TRADINGAGENTS_OBSIDIAN_PATH = vaultPath;

    if (Object.keys(updates).length > 0) {
      await postJson("/env", updates);
      const fresh = await fetchJson<Record<string, string>>("/env");
      setEnvData(fresh);
      setKeyEdits({});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /*
  |-------------------------------------------------------------------------------
  | Derived
  |-------------------------------------------------------------------------------
  */

  const healthOk = useMemo(() => {
    if (!health) return null;
    return health.status === "ok" || health.status === "degraded";
  }, [health]);

  const keyCategories = useMemo(() => [...new Set(KEY_GROUPS.map((k) => k.category))], []);

  /*
  |-------------------------------------------------------------------------------
  | Render
  |-------------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div style={{ padding: "var(--space-6)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* ── Sidebar ── */}
      <nav
        style={{
          width: 200,
          minWidth: 200,
          borderRight: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-surface)",
          padding: "var(--space-4) 0",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
        }}
      >
        <div
          style={{
            padding: "0 var(--space-5) var(--space-4)",
            fontSize: "var(--text-md)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-text-primary)",
          }}
        >
          Settings
        </div>
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                width: "100%",
                padding: "var(--space-2) var(--space-5)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "var(--text-sm)",
                fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                textAlign: "left",
                transition: "all var(--duration-fast) var(--ease-out)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 16,
                    borderRadius: "0 2px 2px 0",
                    background: "var(--color-accent)",
                  }}
                />
              )}
              {section.id === "general" && <GeneralIcon />}
              {section.id === "api-keys" && <ApiKeysIcon />}
              {section.id === "system" && <SystemIcon />}
              {section.label}
              {section.id === "system" && healthOk === false && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-error)",
                    marginLeft: "auto",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
        <div style={{ maxWidth: 680 }}>
          {activeSection === "general" && (
            <GeneralSection
              providers={providers}
              models={models}
              selectedProvider={selectedProvider}
              quickModel={quickModel}
              deepModel={deepModel}
              riskProfile={riskProfile}
              vendors={vendors}
              onProviderChange={setSelectedProvider}
              onQuickModelChange={setQuickModel}
              onDeepModelChange={setDeepModel}
              onRiskProfileChange={setRiskProfile}
              onVendorChange={(key, val) => setVendors((prev) => ({ ...prev, [key]: val }))}
            />
          )}

          {activeSection === "api-keys" && (
            <ApiKeysSection
              envData={envData}
              keyEdits={keyEdits}
              testResults={testResults}
              testing={testing}
              vaultPath={vaultPath}
              keyCategories={keyCategories}
              onKeyChange={handleKeyChange}
              onTest={handleTest}
              onVaultPathChange={setVaultPath}
            />
          )}

          {activeSection === "system" && (
            <SystemSection
              health={health}
              docker={docker}
              installing={installing}
              installResult={installResult}
              onInstall={handleInstall}
            />
          )}
        </div>

        {/* ── Save bar ── */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "flex-end",
            padding: "var(--space-4) 0",
            marginTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg-root)",
          }}
        >
          <button
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{
              padding: "var(--space-2) var(--space-6)",
              background: saved ? "var(--color-success)" : undefined,
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|-------------------------------------------------------------------------------
| General Section
|-------------------------------------------------------------------------------
*/

function GeneralSection({
  providers,
  models,
  selectedProvider,
  quickModel,
  deepModel,
  riskProfile,
  vendors,
  onProviderChange,
  onQuickModelChange,
  onDeepModelChange,
  onRiskProfileChange,
  onVendorChange,
}: {
  providers: Provider[];
  models: Models;
  selectedProvider: string;
  quickModel: string;
  deepModel: string;
  riskProfile: string;
  vendors: Record<string, string>;
  onProviderChange: (v: string) => void;
  onQuickModelChange: (v: string) => void;
  onDeepModelChange: (v: string) => void;
  onRiskProfileChange: (v: string) => void;
  onVendorChange: (key: string, val: string) => void;
}) {
  const providerModels = models[selectedProvider];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>General</h2>

      {/* LLM Provider */}
      <section>
        <SectionHeading>LLM Provider</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "var(--space-1)" }}>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onProviderChange(p.id)}
              className={`btn btn-sm ${selectedProvider === p.id ? "btn-primary" : "btn-secondary"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* Models */}
      <section>
        <SectionHeading>Models</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div>
            <FieldLabel>Quick Think</FieldLabel>
            <select value={quickModel} onChange={(e) => onQuickModelChange(e.target.value)} className="input">
              {providerModels?.quick.map((m) => <option key={m} value={m}>{m}</option>)}
              {!providerModels && <option value={quickModel}>{quickModel}</option>}
            </select>
          </div>
          <div>
            <FieldLabel>Deep Think</FieldLabel>
            <select value={deepModel} onChange={(e) => onDeepModelChange(e.target.value)} className="input">
              {providerModels?.deep.map((m) => <option key={m} value={m}>{m}</option>)}
              {!providerModels && <option value={deepModel}>{deepModel}</option>}
            </select>
          </div>
        </div>
      </section>

      {/* Data Vendors */}
      <section>
        <SectionHeading>Data Vendors</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {DATA_VENDOR_CATEGORIES.map((cat) => (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-sm)", width: 180, color: "var(--color-text-secondary)" }}>{cat.label}</span>
              <select
                value={vendors[cat.key] || cat.options[0]}
                onChange={(e) => onVendorChange(cat.key, e.target.value)}
                className="input"
                style={{ width: 180 }}
              >
                {cat.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Profile */}
      <section>
        <SectionHeading>Risk Profile</SectionHeading>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {RISK_PROFILES.map((rp) => (
            <button
              key={rp.id}
              onClick={() => onRiskProfileChange(rp.id)}
              className={`btn ${riskProfile === rp.id ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1, padding: "var(--space-3)", textAlign: "center", flexDirection: "column" }}
            >
              <div style={{ fontWeight: "var(--weight-semibold)" }}>{rp.label}</div>
              <div style={{ fontSize: "var(--text-xs)", opacity: 0.7, marginTop: "var(--space-1)" }}>{rp.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/*
|-------------------------------------------------------------------------------
| API Keys Section
|-------------------------------------------------------------------------------
*/

function ApiKeysSection({
  envData,
  keyEdits,
  testResults,
  testing,
  vaultPath,
  keyCategories,
  onKeyChange,
  onTest,
  onVaultPathChange,
}: {
  envData: Record<string, string>;
  keyEdits: Record<string, string>;
  testResults: Record<string, { valid: boolean; message: string }>;
  testing: string | null;
  vaultPath: string;
  keyCategories: string[];
  onKeyChange: (envKey: string, value: string) => void;
  onTest: (entry: KeyEntry) => void;
  onVaultPathChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>API Keys</h2>

      {keyCategories.map((cat) => (
        <section key={cat}>
          <SectionHeading>{cat}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {KEY_GROUPS.filter((k) => k.category === cat).map((entry) => {
              const masked = envData[entry.envKey] || "";
              const editVal = keyEdits[entry.envKey];
              const displayVal = editVal !== undefined ? editVal : (masked ? "********" : "");
              const testResult = testResults[entry.envKey];
              const isTesting = testing === entry.envKey;

              return (
                <div key={entry.envKey} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", width: 140, flexShrink: 0, color: "var(--color-text-secondary)" }}>{entry.label}</span>
                  <input
                    type="text"
                    value={displayVal}
                    onChange={(e) => onKeyChange(entry.envKey, e.target.value)}
                    placeholder={masked ? "Set (enter new to change)" : "Not set"}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => onTest(entry)}
                    disabled={isTesting}
                    className="btn btn-sm"
                    style={{
                      background: testResult?.valid ? "var(--color-success)" : testResult && !testResult.valid ? "var(--color-error)" : "var(--color-bg-elevated)",
                      color: testResult ? "#fff" : "var(--color-text-muted)",
                      minWidth: 60,
                    }}
                  >
                    {isTesting ? "..." : testResult?.valid ? "Valid" : testResult ? "Invalid" : "Test"}
                  </button>
                  {testResult && (
                    <span style={{ fontSize: "var(--text-xs)", color: testResult.valid ? "var(--color-success)" : "var(--color-error)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {testResult.message}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Vault Path */}
      <section>
        <SectionHeading>Obsidian Vault Path</SectionHeading>
        <input
          type="text"
          value={vaultPath}
          onChange={(e) => onVaultPathChange(e.target.value)}
          placeholder="/path/to/vault/TradingAgents/Reports"
          className="input"
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-2)" }}>
          Optional: Path to Obsidian vault for auto-saving reports
        </div>
      </section>
    </div>
  );
}

/*
|-------------------------------------------------------------------------------
| System Section
|-------------------------------------------------------------------------------
*/

function SystemSection({
  health,
  docker,
  installing,
  installResult,
  onInstall,
}: {
  health: HealthData | null;
  docker: DockerInfo | null;
  installing: boolean;
  installResult: { success: boolean; installed: string[]; errors: string[] } | null;
  onInstall: () => void;
}) {
  const checks = health
    ? [
        { label: "Backend API", ok: health.status === "ok" || health.status === "degraded", detail: health.status },
        { label: "Python", ok: true, detail: health.python },
        { label: "TradingAgents Engine", ok: health.tradingagents, detail: health.tradingagents ? "Installed" : "Not found" },
        { label: ".env File", ok: health.env_file, detail: health.env_file ? "Present" : "Missing" },
        { label: "All Dependencies", ok: health.missing_deps.length === 0, detail: health.missing_deps.length === 0 ? "All installed" : `${health.missing_deps.length} missing` },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>System</h2>

      {/* Health Checks */}
      {health && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <SectionHeading style={{ marginBottom: 0 }}>Health Checks</SectionHeading>
            <span className={`badge ${checks.every((c) => c.ok) ? "badge-success" : "badge-warning"}`}>
              {checks.every((c) => c.ok) ? "All OK" : "Issues found"}
            </span>
          </div>
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
        </section>
      )}

      {/* Docker */}
      {docker && (
        <section>
          <SectionHeading>Docker</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
            <div>
              <FieldLabel>Running in Docker</FieldLabel>
              <div style={{ color: "var(--color-text-primary)" }}>{docker.is_docker ? "Yes" : "No"}</div>
            </div>
            <div>
              <FieldLabel>Hostname</FieldLabel>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{docker.hostname || "—"}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>.env Path</FieldLabel>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", wordBreak: "break-all", color: "var(--color-text-secondary)" }}>{docker.env_path || "—"}</div>
            </div>
          </div>
          {docker.is_docker && (
            <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", background: "var(--color-warning-subtle)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
              When running in Docker, mount your Obsidian vault and .env file into the container.
            </div>
          )}
        </section>
      )}

      {/* Missing Dependencies */}
      {health && health.missing_deps.length > 0 && (
        <section>
          <SectionHeading>Missing Dependencies</SectionHeading>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-warning)", marginBottom: "var(--space-3)", fontFamily: "var(--font-mono)" }}>
            {health.missing_deps.join(", ")}
          </div>
          <button onClick={onInstall} disabled={installing} className="btn btn-primary">
            {installing ? "Installing..." : "Install Missing"}
          </button>
        </section>
      )}

      {/* Install Result */}
      {installResult && (
        <section>
          <SectionHeading>Install Result</SectionHeading>
          <div
            style={{
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
        </section>
      )}

      {/* Quick Links */}
      <section>
        <SectionHeading>Quick Links</SectionHeading>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <a href="/api/docs" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>API Docs</a>
          <a href="/api/health" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Health</a>
          <a href="/api/health/detailed" target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Detailed Health</a>
        </div>
      </section>
    </div>
  );
}

/*
|-------------------------------------------------------------------------------
| Shared small components
|-------------------------------------------------------------------------------
*/

function SectionHeading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h3
      style={{
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--color-text-secondary)",
        marginBottom: "var(--space-3)",
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>
      {children}
    </label>
  );
}
