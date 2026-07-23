import { useSettings } from "./SettingsContext";
import { SectionHeading } from "./SettingsShared";
import { KEY_GROUPS } from "./SettingsConstants";
import { Button } from "@/components/ui/button";

export function ApiKeysSection() {
  const {
    envData,
    keyEdits,
    testResults,
    testing,
    vaultPath,
    setVaultPath,
    handleKeyChange,
    handleTest,
  } = useSettings();

  const keyCategories = [...new Set(KEY_GROUPS.map((k) => k.category))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>API Keys</h2>

      {/* Obsidian Vault Path */}
      <section>
        <SectionHeading>Obsidian Vault Path</SectionHeading>
        <input
          value={vaultPath}
          onChange={(e) => setVaultPath(e.target.value)}
          placeholder="/path/to/vault/TradingAgents/Reports"
          className="input"
          style={{ width: "100%" }}
        />
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "var(--space-2)" }}>
          Optional: Path to Obsidian vault for auto-saving reports
        </p>
      </section>

      {/* Key Groups by Category */}
      {keyCategories.map((category) => (
        <section key={category}>
          <SectionHeading>{category}</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {KEY_GROUPS.filter((k) => k.category === category).map((entry) => {
              const currentKey = keyEdits[entry.envKey] || envData[entry.envKey] || "";
              const displayVal = currentKey ? "********" : "";
              const testResult = testResults[entry.envKey];
              const isTesting = testing === entry.envKey;

              return (
                <div key={entry.envKey} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", width: 140, flexShrink: 0, color: "var(--color-text-secondary)" }}>
                    {entry.label}
                  </span>
                  <input
                    type="text"
                    value={displayVal}
                    onChange={(e) => handleKeyChange(entry.envKey, e.target.value)}
                    placeholder={currentKey ? "Set (enter new to change)" : "Not set"}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleTest(entry)}
                    disabled={isTesting}
                    style={{
                      minWidth: 60,
                      background: testResult?.valid
                        ? "var(--color-success)"
                        : testResult && !testResult.valid
                        ? "var(--color-error)"
                        : "var(--color-bg-elevated)",
                      color: testResult ? "#fff" : "var(--color-text-muted)",
                    }}
                  >
                    {isTesting ? "..." : testResult?.valid ? "Valid" : testResult ? "Invalid" : "Test"}
                  </Button>
                  {testResult && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: testResult.valid ? "var(--color-success)" : "var(--color-error)",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {testResult.message}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}