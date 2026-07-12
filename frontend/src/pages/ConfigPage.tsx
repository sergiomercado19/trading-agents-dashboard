import { useEffect, useState } from "react";
import { fetchJson, postJson } from "../api/client";

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

export default function ConfigPage() {
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [models, setModels] = useState<Record<string, { quick: string[]; deep: string[] }>>({});
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [quickModel, setQuickModel] = useState("gpt-5.4-mini");
  const [deepModel, setDeepModel] = useState("gpt-5.5");
  const [riskProfile, setRiskProfile] = useState("neutral");
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchJson<Array<{ id: string; name: string }>>("/providers").then(setProviders).catch(() => {});
    fetchJson<Record<string, { quick: string[]; deep: string[] }>>("/models").then(setModels).catch(() => {});
    fetchJson<Record<string, string>>("/data_vendors").then((data) => {
      const v: Record<string, string> = {};
      for (const [k, val] of Object.entries(data)) {
        v[k] = Array.isArray(val) ? val[0] : String(val);
      }
      setVendors(v);
    }).catch(() => {});
  }, []);

  const providerModels = models[selectedProvider];

  const handleSave = async () => {
    const updates: Record<string, string> = {
      TRADINGAGENTS_LLM_PROVIDER: selectedProvider,
      TRADINGAGENTS_QUICK_THINK_LLM: quickModel,
      TRADINGAGENTS_DEEP_THINK_LLM: deepModel,
    };
    await postJson("/env", updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 18 }}>Configuration</h2>

      {/* Provider */}
      <section>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>LLM Provider</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              style={{
                padding: "8px 10px",
                fontSize: 12,
                background: selectedProvider === p.id ? "var(--accent)" : "var(--bg-tertiary)",
                color: selectedProvider === p.id ? "#fff" : "var(--text)",
                border: `1px solid ${selectedProvider === p.id ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* Models */}
      <section>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Models</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Quick Think</label>
            <select value={quickModel} onChange={(e) => setQuickModel(e.target.value)} style={inputStyle}>
              {providerModels?.quick.map((m) => <option key={m} value={m}>{m}</option>)}
              {!providerModels && <option value={quickModel}>{quickModel}</option>}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Deep Think</label>
            <select value={deepModel} onChange={(e) => setDeepModel(e.target.value)} style={inputStyle}>
              {providerModels?.deep.map((m) => <option key={m} value={m}>{m}</option>)}
              {!providerModels && <option value={deepModel}>{deepModel}</option>}
            </select>
          </div>
        </div>
      </section>

      {/* Data Vendors */}
      <section>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Data Vendors</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DATA_VENDOR_CATEGORIES.map((cat) => (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, width: 180 }}>{cat.label}</span>
              <select
                value={vendors[cat.key] || cat.options[0]}
                onChange={(e) => setVendors((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                style={{ ...inputStyle, width: 180 }}
              >
                {cat.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Profile */}
      <section>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Risk Profile</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {RISK_PROFILES.map((rp) => (
            <button
              key={rp.id}
              onClick={() => setRiskProfile(rp.id)}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: 13,
                background: riskProfile === rp.id ? "var(--accent)" : "var(--bg-tertiary)",
                color: riskProfile === rp.id ? "#fff" : "var(--text)",
                border: `1px solid ${riskProfile === rp.id ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{rp.label}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{rp.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleSave}
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
        {saved ? "Saved!" : "Save Configuration"}
      </button>
    </div>
  );
}
