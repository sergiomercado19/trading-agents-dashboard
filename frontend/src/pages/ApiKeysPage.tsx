import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";

interface KeyEntry {
  envKey: string;
  label: string;
  provider: string;
  category: string;
}

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 13,
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  outline: "none",
};

export default function ApiKeysPage() {
  const [envData, setEnvData] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [vaultPath, setVaultPath] = useState("");

  useEffect(() => {
    fetchJson<Record<string, string>>("/env").then((data) => {
      setEnvData(data);
      setVaultPath(data.TRADINGAGENTS_OBSIDIAN_PATH || data.OBSIDIAN_VAULT_PATH || "");
    }).catch(() => {});
  }, []);

  const handleKeyChange = (envKey: string, value: string) => {
    setEdits((prev) => ({ ...prev, [envKey]: value }));
  };

  const handleSaveAll = async () => {
    const updates: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v !== undefined) updates[k] = v || null;
    }
    if (vaultPath) updates.TRADINGAGENTS_OBSIDIAN_PATH = vaultPath;
    if (Object.keys(updates).length > 0) {
      await postJson("/env", updates);
      const fresh = await fetchJson<Record<string, string>>("/env");
      setEnvData(fresh);
      setEdits({});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async (entry: KeyEntry) => {
    const key = edits[entry.envKey] || envData[entry.envKey] || "";
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

  const categories = [...new Set(KEY_GROUPS.map((k) => k.category))];

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 18 }}>API Keys</h2>

      {categories.map((cat) => (
        <section key={cat}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>{cat}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {KEY_GROUPS.filter((k) => k.category === cat).map((entry) => {
              const masked = envData[entry.envKey] || "";
              const editVal = edits[entry.envKey];
              const displayVal = editVal !== undefined ? editVal : (masked ? "********" : "");
              const testResult = testResults[entry.envKey];
              const isTesting = testing === entry.envKey;

              return (
                <div key={entry.envKey} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, width: 140, flexShrink: 0 }}>{entry.label}</span>
                  <input
                    type="text"
                    value={displayVal}
                    onChange={(e) => handleKeyChange(entry.envKey, e.target.value)}
                    placeholder={masked ? "Set (enter new to change)" : "Not set"}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => handleTest(entry)}
                    disabled={isTesting}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      background: testResult?.valid ? "var(--success)" : testResult && !testResult.valid ? "var(--error)" : "var(--bg-tertiary)",
                      color: testResult ? "#fff" : "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      cursor: "pointer",
                      minWidth: 60,
                    }}
                  >
                    {isTesting ? "..." : testResult?.valid ? "Valid" : testResult ? "Invalid" : "Test"}
                  </button>
                  {testResult && (
                    <span style={{ fontSize: 11, color: testResult.valid ? "var(--success)" : "var(--error)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Obsidian Vault Path</h3>
        <input
          type="text"
          value={vaultPath}
          onChange={(e) => setVaultPath(e.target.value)}
          placeholder="/path/to/vault/TradingAgents/Reports"
          style={inputStyle}
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Optional: Path to Obsidian vault for auto-saving reports
        </p>
      </section>

      <button
        onClick={handleSaveAll}
        style={{
          alignSelf: "flex-start",
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          background: saved ? "var(--success)" : "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {saved ? "Saved!" : "Save Keys"}
      </button>
    </div>
  );
}
