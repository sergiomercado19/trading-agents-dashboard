import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/utils/api";

interface Settings {
  theme: string;
  default_ticker: string;
  default_provider: string;
  default_model: string;
  perplefina_url: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: "dark",
    default_ticker: "",
    default_provider: "openai",
    default_model: "gpt-4o-mini",
    perplefina_url: "http://localhost:3000",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get<any>("/api/settings");
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSave = async (section: string, data: any) => {
    setSaving(true);
    try {
      await api.patch("/api/settings", { [section]: data });
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-6)" }}>
        Settings
      </h1>

      <Tabs defaultValue="general">
        <TabsList style={{ marginBottom: "var(--space-6)" }}>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          <TabsTrigger value="alpaca">Alpaca</TabsTrigger>
          <TabsTrigger value="perplefina">Perplefina</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your dashboard preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="input"
                    style={{ marginTop: "var(--space-2)", maxWidth: 200 }}
                  >
                    <option value="dark">Dark (Default)</option>
                    <option value="high-contrast">High Contrast</option>
                    <option value="mono">Monochrome</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="default_ticker">Default Ticker</Label>
                  <Input
                    id="default_ticker"
                    value={settings.default_ticker}
                    onChange={(e) => setSettings({ ...settings, default_ticker: e.target.value })}
                    placeholder="AAPL"
                    style={{ marginTop: "var(--space-2)", maxWidth: 200 }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("general", { theme: settings.theme, default_ticker: settings.default_ticker })} disabled={saving}>
                {saving ? "Saving..." : "Save General Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>Configure AI providers, models, and per-agent settings</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
                  Default Provider
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <div>
                    <Label htmlFor="default_provider">Provider</Label>
                    <select
                      id="default_provider"
                      value={settings.default_provider}
                      onChange={(e) => setSettings({ ...settings, default_provider: e.target.value })}
                      className="input"
                      style={{ marginTop: "var(--space-2)" }}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="default_model">Model</Label>
                    <Input id="default_model" value={settings.default_model} onChange={(e) => setSettings({ ...settings, default_model: e.target.value })} style={{ marginTop: "var(--space-2)" }} />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
                  API Keys (stored encrypted)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--space-4)" }}>
                  <div>
                    <Label>OpenAI API Key</Label>
                    <Input type="password" placeholder="sk-..." style={{ marginTop: "var(--space-2)" }} />
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Required for GPT models</p>
                  </div>
                  <div>
                    <Label>Anthropic API Key</Label>
                    <Input type="password" placeholder="sk-ant-..." style={{ marginTop: "var(--space-2)" }} />
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Required for Claude models</p>
                  </div>
                  <div>
                    <Label>Google API Key</Label>
                    <Input type="password" placeholder="..." style={{ marginTop: "var(--space-2)" }} />
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Required for Gemini models</p>
                  </div>
                  <div>
                    <Label>DeepSeek API Key</Label>
                    <Input type="password" placeholder="..." style={{ marginTop: "var(--space-2)" }} />
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Required for DeepSeek models</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
                  Per-Agent Configuration
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-3)" }}>
                  {AGENTS.map((agent) => (
                    <div key={agent.name} style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ fontWeight: "var(--weight-medium)", marginBottom: "var(--space-2)" }}>{agent.name} <span style={{ color: "var(--color-text-muted)", fontWeight: "normal", fontSize: "var(--text-xs)" }}>({agent.phase})</span></div>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <Input placeholder="Max tokens" style={{ width: 100 }} />
                        <select className="input" style={{ width: 150 }}>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google</option>
                          <option value="deepseek">DeepSeek</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase" }}>
                  Provider Failover
                </h4>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ fontSize: "var(--text-sm)" }}>Enable automatic failover between providers</span>
                </label>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>
                  If primary provider fails, automatically retry with next available provider
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("ai", { default_provider: settings.default_provider, default_model: settings.default_model })} disabled={saving}>
                {saving ? "Saving..." : "Save AI Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="alpaca">
          <Card>
            <CardHeader>
              <CardTitle>Alpaca Paper Trading</CardTitle>
              <CardDescription>Configure your Alpaca API credentials for paper trading</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 500 }}>
              <div>
                <Label htmlFor="alpaca_api_key">API Key</Label>
                <Input id="alpaca_api_key" type="password" placeholder="PK..." style={{ marginTop: "var(--space-2)" }} />
              </div>
              <div>
                <Label htmlFor="alpaca_api_secret">API Secret</Label>
                <Input id="alpaca_api_secret" type="password" placeholder="..." style={{ marginTop: "var(--space-2)" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked />
                <span style={{ fontSize: "var(--text-sm)" }}>Paper Trading Mode</span>
              </label>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Get your API keys from <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>alpaca.markets</a>
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("alpaca", {})} disabled={saving}>
                {saving ? "Saving..." : "Save Alpaca Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="perplefina">
          <Card>
            <CardHeader>
              <CardTitle>Perplefina Configuration</CardTitle>
              <CardDescription>Configure local Perplefina service for news and social analysis</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 500 }}>
              <div>
                <Label htmlFor="perplefina_url">Perplefina URL</Label>
                <Input
                  id="perplefina_url"
                  value={settings.perplefina_url}
                  onChange={(e) => setSettings({ ...settings, perplefina_url: e.target.value })}
                  placeholder="http://localhost:3000"
                  style={{ marginTop: "var(--space-2)" }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked />
                <span style={{ fontSize: "var(--text-sm)" }}>Enable Perplefina Integration</span>
              </label>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Perplefina provides news sentiment and social media analysis for trading agents
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("perplefina", { perplefina_url: settings.perplefina_url })} disabled={saving}>
                {saving ? "Saving..." : "Save Perplefina Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}