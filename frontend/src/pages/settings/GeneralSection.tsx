import { useSettings } from "./SettingsContext";
import { SectionHeading, FieldLabel } from "./SettingsShared";
import { DATA_VENDOR_CATEGORIES, RISK_PROFILES } from "./SettingsConstants";
import { Button } from "@/components/ui/button";

export function GeneralSection() {
  const {
    providers,
    models,
    selectedProvider,
    setSelectedProvider,
    quickModel,
    setQuickModel,
    deepModel,
    setDeepModel,
    riskProfile,
    setRiskProfile,
    vendors,
    setVendors,
  } = useSettings();

  const providerModels = models[selectedProvider];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>General</h2>

      {/* LLM Provider */}
      <section>
        <SectionHeading>LLM Provider</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "var(--space-2)" }}>
          {providers.map((p) => (
            <Button
              key={p.id}
              variant={selectedProvider === p.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedProvider(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </section>

      {/* Models */}
      <section>
        <SectionHeading>Models</SectionHeading>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div>
            <FieldLabel>Quick Think</FieldLabel>
            <select value={quickModel} onChange={(e) => setQuickModel(e.target.value)} className="input">
              {providerModels?.quick?.map((m) => <option key={m} value={m}>{m}</option>)}
              {!providerModels && <option value={quickModel}>{quickModel}</option>}
            </select>
          </div>
          <div>
            <FieldLabel>Deep Think</FieldLabel>
            <select value={deepModel} onChange={(e) => setDeepModel(e.target.value)} className="input">
              {providerModels?.deep?.map((m) => <option key={m} value={m}>{m}</option>)}
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
                onChange={(e) => setVendors({ ...vendors, [cat.key]: e.target.value })}
                className="input"
                style={{ width: 200 }}
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
            <Button
              key={rp.id}
              variant={riskProfile === rp.id ? "default" : "secondary"}
              onClick={() => setRiskProfile(rp.id)}
              className="flex-1 py-3 text-center flex-col"
            >
              <div style={{ fontWeight: "var(--weight-semibold)" }}>{rp.label}</div>
              <div style={{ fontSize: "var(--text-xs)", opacity: 0.7, marginTop: "var(--space-1)" }}>{rp.desc}</div>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}