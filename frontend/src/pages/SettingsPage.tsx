import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme, THEME_IDS, THEME_LABELS } from "@/components/ThemeProvider";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AgentConfig {
  name: string;
  phase: string;
  max_tokens: number;
  temperature: number;
  provider?: string;
  model?: string;
}

interface SettingsData {
  default_provider: string;
  default_model: string;
  default_ticker: string | null;
  agent_configs: Record<string, AgentConfig>;
  failover_enabled: boolean;
  failover_order: string[];
  perplefina_url: string;
  perplefina_enabled: boolean;
  api_keys_configured: Record<string, boolean>;
}

interface ProviderInfo {
  name: string;
  models: { id: string; name: string }[];
}

interface AlpacaConfigData {
  is_connected: boolean;
  paper_trading: boolean;
  last_sync: string | null;
}

interface HealthData {
  status: string;
  python: string;
  tradingagents: boolean;
  env_file: boolean;
}

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

interface ActivityData {
  total_analyses: number;
  analyses_by_status: Record<string, number>;
  total_trades: number;
  recent_analyses: { id: number; ticker: string; status: string; created_at: string }[];
  recent_trades: { id: number; ticker: string; side: string; quantity: number; price: number; status: string; created_at: string }[];
  last_login: string | null;
  member_since: string;
}

const AGENTS = [
  { name: "Macro Analyst", phase: "Data Analysis" },
  { name: "Market Analyst", phase: "Data Analysis" },
  { name: "News Analyst", phase: "Data Analysis" },
  { name: "Social Analyst", phase: "Data Analysis" },
  { name: "Fundamentals Analyst", phase: "Data Analysis" },
  { name: "Bull Researcher", phase: "Research" },
  { name: "Bear Researcher", phase: "Research" },
  { name: "Trader", phase: "Trading" },
  { name: "Risky Analyst", phase: "Risk" },
  { name: "Safe Analyst", phase: "Risk" },
  { name: "Neutral Analyst", phase: "Risk" },
  { name: "Risk Manager", phase: "Risk" },
  { name: "Portfolio Manager", phase: "Portfolio" },
];

const API_KEY_FIELDS = [
  { key: "openai", label: "OpenAI", placeholder: "sk-...", hint: "Required for GPT models" },
  { key: "anthropic", label: "Anthropic", placeholder: "sk-ant-...", hint: "Required for Claude models" },
  { key: "google", label: "Google", placeholder: "...", hint: "Required for Gemini models" },
  { key: "deepseek", label: "DeepSeek", placeholder: "...", hint: "Required for DeepSeek models" },
] as const;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  /* Settings state */
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* API key edits (local until save) */
  const [keyEdits, setKeyEdits] = useState<Record<string, string>>({});
  const [keyTestResults, setKeyTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [keyTesting, setKeyTesting] = useState<string | null>(null);

  /* Alpaca state */
  const [alpacaKey, setAlpacaKey] = useState("");
  const [alpacaSecret, setAlpacaSecret] = useState("");
  const [alpacaPaper, setAlpacaPaper] = useState(true);
  const [alpacaStatus, setAlpacaStatus] = useState<AlpacaConfigData | null>(null);
  const [alpacaTesting, setAlpacaTesting] = useState(false);
  const [alpacaTestResult, setAlpacaTestResult] = useState<{ connected: boolean } | null>(null);

  /* Health state */
  const [health, setHealth] = useState<HealthData | null>(null);

  /* API Keys state */
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  /* Activity state */
  const [activity, setActivity] = useState<ActivityData | null>(null);

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                     */
  /* ---------------------------------------------------------------- */

  const fetchAll = useCallback(async () => {
    try {
      const [s, p, h, keys, act] = await Promise.all([
        api.get<SettingsData>("/api/settings"),
        api.get<Record<string, ProviderInfo>>("/api/providers").catch(() => ({})),
        api.get<HealthData>("/api/settings/health").catch(() => null),
        api.get<ApiKeyItem[]>("/api/auth/api-keys").catch(() => []),
        api.get<ActivityData>("/api/auth/activity").catch(() => null),
      ]);
      setSettings(s);
      setProviders(p);
      setHealth(h);
      setApiKeys(keys);
      setActivity(act);

      /* Load Alpaca config status */
      const ac = await api.get<AlpacaConfigData>("/api/portfolio/config").catch(() => null);
      setAlpacaStatus(ac);
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ---------------------------------------------------------------- */
  /* Save general + AI settings                                        */
  /* ---------------------------------------------------------------- */

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch("/api/settings", {
        default_provider: settings.default_provider,
        default_model: settings.default_model,
        default_ticker: settings.default_ticker,
        perplefina_url: settings.perplefina_url,
        perplefina_enabled: settings.perplefina_enabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        default_provider: settings.default_provider,
        default_model: settings.default_model,
        agent_configs: settings.agent_configs,
        failover_enabled: settings.failover_enabled,
        failover_order: settings.failover_order,
      };

      /* Include any edited API keys */
      for (const [k, v] of Object.entries(keyEdits)) {
        if (v) payload[`${k}_api_key`] = v;
      }

      await api.patch("/api/settings", payload);
      setKeyEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      /* Refresh to get updated api_keys_configured */
      const fresh = await api.get<SettingsData>("/api/settings");
      setSettings(fresh);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Test API key                                                      */
  /* ---------------------------------------------------------------- */

  const handleTestKey = async (provider: string) => {
    const key = keyEdits[provider];
    if (!key) return;
    setKeyTesting(provider);
    try {
      const result = await api.post<{ valid: boolean; message: string }>("/api/settings/test-key", {
        provider,
        api_key: key,
      });
      setKeyTestResults((prev) => ({ ...prev, [provider]: result }));
    } catch {
      setKeyTestResults((prev) => ({ ...prev, [provider]: { valid: false, message: "Request failed" } }));
    } finally {
      setKeyTesting(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Alpaca                                                            */
  /* ---------------------------------------------------------------- */

  const handleSaveAlpaca = async () => {
    if (!alpacaKey || !alpacaSecret) return;
    setSaving(true);
    try {
      const result = await api.post<AlpacaConfigData>("/api/portfolio/config", {
        api_key: alpacaKey,
        api_secret: alpacaSecret,
        paper_trading: alpacaPaper,
      });
      setAlpacaStatus(result);
      setAlpacaKey("");
      setAlpacaSecret("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save Alpaca config:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlpaca = async () => {
    if (!alpacaKey || !alpacaSecret) return;
    setAlpacaTesting(true);
    try {
      const result = await api.post<{ connected: boolean }>("/api/portfolio/test", {
        api_key: alpacaKey,
        api_secret: alpacaSecret,
        paper_trading: alpacaPaper,
      });
      setAlpacaTestResult(result);
    } catch {
      setAlpacaTestResult({ connected: false });
    } finally {
      setAlpacaTesting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Agent config helpers                                              */
  /* ---------------------------------------------------------------- */

  const getAgentConfig = (name: string): AgentConfig => {
    if (settings?.agent_configs[name]) return settings.agent_configs[name];
    return { name, phase: "", max_tokens: 4000, temperature: 0.3 };
  };

  const updateAgentConfig = (name: string, field: keyof AgentConfig, value: unknown) => {
    if (!settings) return;
    const current = getAgentConfig(name);
    const updated = { ...current, [field]: value };
    setSettings({
      ...settings,
      agent_configs: { ...settings.agent_configs, [name]: updated },
    });
  };

  /* ---------------------------------------------------------------- */
  /* API Keys                                                          */
  /* ---------------------------------------------------------------- */

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const result = await api.post<{ api_key: string; key_info: ApiKeyItem }>("/api/auth/api-keys", {
        name: newKeyName.trim(),
      });
      setCreatedKey(result.api_key);
      setApiKeys((prev) => [result.key_info, ...prev]);
      setNewKeyName("");
      toast.success("API key created");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create key";
      toast.error(message);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: number) => {
    try {
      await api.delete(`/api/auth/api-keys/${keyId}`);
      setApiKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, is_active: false } : k));
      toast.success("API key revoked");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to revoke key";
      toast.error(message);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render helpers                                                    */
  /* ---------------------------------------------------------------- */

  const providerList = Object.entries(providers);
  const currentProviderModels = providers[settings?.default_provider || ""]?.models || [];

  if (loading) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <div className="text-[var(--color-text-muted)] text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Settings
        </h1>
        {saved && (
          <span className="text-sm text-[var(--color-success)]">Saved!</span>
        )}
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex overflow-x-auto flex-nowrap mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          <TabsTrigger value="alpaca">Alpaca</TabsTrigger>
          <TabsTrigger value="perplefina">Perplefina</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ */}
        {/* GENERAL TAB                                                   */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your dashboard preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as "terminal" | "modern" | "bloomberg")}
                    className="input mt-2 max-w-[200px]"
                  >
                    {THEME_IDS.map((id) => (
                      <option key={id} value={id}>{THEME_LABELS[id]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="default_ticker">Default Ticker</Label>
                  <Input
                    id="default_ticker"
                    value={settings?.default_ticker || ""}
                    onChange={(e) => setSettings((s) => s ? { ...s, default_ticker: e.target.value || null } : s)}
                    placeholder="AAPL"
                    className="mt-2 max-w-[200px]"
                  />
                </div>
                <div>
                  <Label htmlFor="default_provider">Default Provider</Label>
                  <select
                    id="default_provider"
                    value={settings?.default_provider || "openai"}
                    onChange={(e) => setSettings((s) => s ? { ...s, default_provider: e.target.value } : s)}
                    className="input mt-2 max-w-[200px]"
                  >
                    {providerList.map(([id, p]) => (
                      <option key={id} value={id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="default_model">Default Model</Label>
                  <select
                    id="default_model"
                    value={settings?.default_model || ""}
                    onChange={(e) => setSettings((s) => s ? { ...s, default_model: e.target.value } : s)}
                    className="input mt-2 max-w-[300px]"
                  >
                    {currentProviderModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving ? "Saving..." : "Save General Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* AI PROVIDERS TAB                                              */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>Configure API keys, per-agent settings, and failover</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">

              {/* API Keys */}
              <div>
                <h4 className={sectionClassName}>API Keys</h4>
                <div className="flex flex-col gap-3">
                  {API_KEY_FIELDS.map((field) => {
                    const isConfigured = settings?.api_keys_configured?.[field.key] && !keyEdits[field.key];
                    const testResult = keyTestResults[field.key];
                    const isTesting = keyTesting === field.key;

                    return (
                      <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-sm w-[100px] shrink-0 text-[var(--color-text-secondary)]">
                          {field.label}
                        </span>
                        <Input
                          type="password"
                          value={keyEdits[field.key] || ""}
                          onChange={(e) => setKeyEdits((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={isConfigured ? "Set (enter new to change)" : field.placeholder}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestKey(field.key)}
                          disabled={isTesting || !keyEdits[field.key]}
                          className="min-w-[60px]"
                        >
                          {isTesting ? "..." : testResult?.valid ? "Valid" : testResult ? "Fail" : "Test"}
                        </Button>
                        {testResult && (
                          <span className={cn(
                            "text-xs max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap",
                            testResult.valid ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                          )}>
                            {testResult.message}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Agent Configuration */}
              <div>
                <h4 className={sectionClassName}>Per-Agent Configuration</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {AGENTS.map((agent) => {
                    const cfg = getAgentConfig(agent.name);
                    return (
                      <div key={agent.name} className="p-3 bg-[var(--color-bg-elevated)] rounded-md">
                        <div className="font-medium mb-2 text-sm">
                          {agent.name}
                          <span className="text-[var(--color-text-muted)] font-normal text-xs ml-1">
                            ({agent.phase})
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={cfg.max_tokens}
                            onChange={(e) => updateAgentConfig(agent.name, "max_tokens", parseInt(e.target.value) || 4000)}
                            placeholder="Tokens"
                            className="w-[90px]"
                          />
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={cfg.temperature}
                            onChange={(e) => updateAgentConfig(agent.name, "temperature", parseFloat(e.target.value) || 0.3)}
                            placeholder="Temp"
                            className="w-[70px]"
                          />
                          <select
                            value={cfg.provider || settings?.default_provider || "openai"}
                            onChange={(e) => updateAgentConfig(agent.name, "provider", e.target.value)}
                            className="input flex-1 text-xs"
                          >
                            {providerList.map(([id, p]) => (
                              <option key={id} value={id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Provider Failover */}
              <div>
                <h4 className={sectionClassName}>Provider Failover</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.failover_enabled ?? true}
                    onChange={(e) => setSettings((s) => s ? { ...s, failover_enabled: e.target.checked } : s)}
                  />
                  <span className="text-sm">Enable automatic failover between providers</span>
                </label>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  If primary provider fails, automatically retry with next available provider
                </p>
              </div>

            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAI} disabled={saving}>
                {saving ? "Saving..." : "Save AI Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* ALPACA TAB                                                    */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="alpaca">
          <Card>
            <CardHeader>
              <CardTitle>Alpaca Paper Trading</CardTitle>
              <CardDescription>Configure your Alpaca API credentials for paper trading</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 max-w-[500px]">
              {alpacaStatus?.is_connected && (
                <div className="p-3 rounded-md text-sm text-[var(--color-success)]" style={{ background: "var(--color-success-subtle, oklch(0.95 0.02 155))", border: "1px solid var(--color-success)" }}>
                  Connected to Alpaca ({alpacaStatus.paper_trading ? "Paper" : "Live"})
                  {alpacaStatus.last_sync && <span className="ml-2 opacity-70">Last sync: {new Date(alpacaStatus.last_sync).toLocaleString()}</span>}
                </div>
              )}
              <div>
                <Label htmlFor="alpaca_api_key">API Key</Label>
                <Input
                  id="alpaca_api_key"
                  type="password"
                  value={alpacaKey}
                  onChange={(e) => setAlpacaKey(e.target.value)}
                  placeholder="PK..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="alpaca_api_secret">API Secret</Label>
                <Input
                  id="alpaca_api_secret"
                  type="password"
                  value={alpacaSecret}
                  onChange={(e) => setAlpacaSecret(e.target.value)}
                  placeholder="..."
                  className="mt-2"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alpacaPaper}
                  onChange={(e) => setAlpacaPaper(e.target.checked)}
                />
                <span className="text-sm">Paper Trading Mode</span>
              </label>
              {alpacaTestResult && (
                <div className={cn("text-sm", alpacaTestResult.connected ? "text-[var(--color-success)]" : "text-[var(--color-error)]")}>
                  {alpacaTestResult.connected ? "Connection successful" : "Connection failed"}
                </div>
              )}
              <p className="text-xs text-[var(--color-text-muted)]">
                Get your API keys from <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)]">alpaca.markets</a>
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={handleSaveAlpaca} disabled={saving || !alpacaKey || !alpacaSecret}>
                {saving ? "Saving..." : "Save Alpaca Settings"}
              </Button>
              <Button variant="outline" onClick={handleTestAlpaca} disabled={alpacaTesting || !alpacaKey || !alpacaSecret}>
                {alpacaTesting ? "Testing..." : "Test Connection"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* PERPLEFINA TAB                                                */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="perplefina">
          <Card>
            <CardHeader>
              <CardTitle>Perplefina Configuration</CardTitle>
              <CardDescription>Configure local Perplefina service for news and social analysis</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 max-w-[500px]">
              <div>
                <Label htmlFor="perplefina_url">Perplefina URL</Label>
                <Input
                  id="perplefina_url"
                  value={settings?.perplefina_url || ""}
                  onChange={(e) => setSettings((s) => s ? { ...s, perplefina_url: e.target.value } : s)}
                  placeholder="http://localhost:3000"
                  className="mt-2"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.perplefina_enabled ?? true}
                  onChange={(e) => setSettings((s) => s ? { ...s, perplefina_enabled: e.target.checked } : s)}
                />
                <span className="text-sm">Enable Perplefina Integration</span>
              </label>
              <p className="text-xs text-[var(--color-text-muted)]">
                Perplefina provides news sentiment and social media analysis for trading agents
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving ? "Saving..." : "Save Perplefina Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* API KEYS TAB                                                  */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Create new key */}
              <div className="flex gap-2 max-w-[400px]">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. production, staging)"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateApiKey()}
                />
                <Button onClick={handleCreateApiKey} disabled={creatingKey || !newKeyName.trim()}>
                  {creatingKey ? "Creating..." : "Create Key"}
                </Button>
              </div>

              {/* Show created key */}
              {createdKey && (
                <div className="p-3 rounded-md text-sm" style={{ background: "var(--color-success-subtle)", border: "1px solid var(--color-success)" }}>
                  <div className="font-semibold mb-1 text-[var(--color-success)]">
                    Key created (copy it now, it won't be shown again):
                  </div>
                  <code className="font-mono text-xs break-all">
                    {createdKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => { navigator.clipboard.writeText(createdKey); toast.success("Copied to clipboard"); }}
                  >
                    Copy
                  </Button>
                </div>
              )}

              {/* Key list */}
              {apiKeys.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No API keys yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)]">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{key.name}</span>
                        <code className="font-mono text-xs text-[var(--color-text-muted)]">
                          {key.key_prefix}...
                        </code>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-sm",
                          key.is_active ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]" : "bg-[var(--color-error-subtle)] text-[var(--color-error)]"
                        )}>
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        {key.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeApiKey(key.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* ACTIVITY TAB                                                  */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Your account activity and recent events</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {activity ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ActivityStat label="Total Analyses" value={activity.total_analyses} />
                    <ActivityStat label="Completed" value={activity.analyses_by_status.completed ?? 0} />
                    <ActivityStat label="Total Trades" value={activity.total_trades} />
                  </div>

                  {/* Recent analyses */}
                  {activity.recent_analyses.length > 0 && (
                    <div>
                      <h4 className={sectionClassName}>Recent Analyses</h4>
                      <div className="flex flex-col gap-2">
                        {activity.recent_analyses.map((a) => (
                          <div key={a.id} className="flex justify-between p-2 px-3 bg-[var(--color-bg-elevated)] rounded-sm text-sm">
                            <span><strong>{a.ticker}</strong></span>
                            <span className="text-[var(--color-text-muted)]">{a.status}</span>
                            <span className="text-[var(--color-text-muted)]">{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent trades */}
                  {activity.recent_trades.length > 0 && (
                    <div>
                      <h4 className={sectionClassName}>Recent Trades</h4>
                      <div className="flex flex-col gap-2">
                        {activity.recent_trades.map((t) => (
                          <div key={t.id} className="flex justify-between p-2 px-3 bg-[var(--color-bg-elevated)] rounded-sm text-sm">
                            <span>
                              <strong>{t.ticker}</strong>{" "}
                              <span className={t.side === "buy" ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>
                                {t.side.toUpperCase()}
                              </span>
                            </span>
                            <span className="text-[var(--color-text-muted)]">{t.quantity} @ ${t.price.toFixed(2)}</span>
                            <span className="text-[var(--color-text-muted)]">{new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Loading activity...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Health info (footer) */}
      {health && (
        <div className="mt-6 p-3 rounded-md bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex gap-4 text-xs text-[var(--color-text-muted)]">
          <span>Python {health.python}</span>
          <span>TradingAgents: {health.tradingagents ? "Installed" : "Missing"}</span>
          <span>.env: {health.env_file ? "Present" : "Missing"}</span>
          <span>Status: {health.status}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline styles                                                       */
/* ------------------------------------------------------------------ */

const sectionClassName = "text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase";

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 bg-[var(--color-bg-elevated)] rounded-md border border-[var(--color-border)] text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{label}</div>
    </div>
  );
}
