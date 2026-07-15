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
    <div style={{ padding: "var(--space-6)", maxWidth: 720, display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>Configuration</h2>

      {/* Provider */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">LLM Provider</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "var(--space-1)" }}>
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`btn btn-sm ${selectedProvider === p.id ? "btn-primary" : "btn-secondary"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Models</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>Quick Think</label>
              <select value={quickModel} onChange={(e) => setQuickModel(e.target.value)} className="input">
                {providerModels?.quick.map((m) => <option key={m} value={m}>{m}</option>)}
                {!providerModels && <option value={quickModel}>{quickModel}</option>}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", display: "block" }}>Deep Think</label>
              <select value={deepModel} onChange={(e) => setDeepModel(e.target.value)} className="input">
                {providerModels?.deep.map((m) => <option key={m} value={m}>{m}</option>)}
                {!providerModels && <option value={deepModel}>{deepModel}</option>}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Data Vendors */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Data Vendors</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {DATA_VENDOR_CATEGORIES.map((cat) => (
              <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-sm)", width: 180, color: "var(--color-text-secondary)" }}>{cat.label}</span>
                <select
                  value={vendors[cat.key] || cat.options[0]}
                  onChange={(e) => setVendors((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  className="input"
                  style={{ width: 180 }}
                >
                  {cat.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Profile */}
      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Risk Profile</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {RISK_PROFILES.map((rp) => (
              <button
                key={rp.id}
                onClick={() => setRiskProfile(rp.id)}
                className={`btn ${riskProfile === rp.id ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1, padding: "var(--space-3)", textAlign: "center", flexDirection: "column" }}
              >
                <div style={{ fontWeight: "var(--weight-semibold)" }}>{rp.label}</div>
                <div style={{ fontSize: "var(--text-xs)", opacity: 0.7, marginTop: "var(--space-1)" }}>{rp.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <button onClick={handleSave} className={`btn ${saved ? "btn-primary" : "btn-primary"}`}
        style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-6)", background: saved ? "var(--color-success)" : undefined }}>
        {saved ? "Saved!" : "Save Configuration"}
      </button>
    </div>
  );
}
