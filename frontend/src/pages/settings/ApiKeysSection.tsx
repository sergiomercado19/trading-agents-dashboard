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
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-c-text-primary">API Keys</h2>

      {/* Obsidian Vault Path */}
      <section>
        <SectionHeading>Obsidian Vault Path</SectionHeading>
        <input
          value={vaultPath}
          onChange={(e) => setVaultPath(e.target.value)}
          placeholder="/path/to/vault/TradingAgents/Reports"
          className="input w-full"
        />
        <p className="text-xs text-c-text-faint mt-2">
          Optional: Path to Obsidian vault for auto-saving reports
        </p>
      </section>

      {/* Key Groups by Category */}
      {keyCategories.map((category) => (
        <section key={category}>
          <SectionHeading>{category}</SectionHeading>
          <div className="flex flex-col gap-3">
            {KEY_GROUPS.filter((k) => k.category === category).map((entry) => {
              const currentKey = keyEdits[entry.envKey] || envData[entry.envKey] || "";
              const displayVal = currentKey ? "********" : "";
              const testResult = testResults[entry.envKey];
              const isTesting = testing === entry.envKey;

              return (
                <div key={entry.envKey} className="flex items-center gap-2">
                  <span className="text-sm w-[140px] shrink-0 text-c-text-secondary">
                    {entry.label}
                  </span>
                  <input
                    type="text"
                    value={displayVal}
                    onChange={(e) => handleKeyChange(entry.envKey, e.target.value)}
                    placeholder={currentKey ? "Set (enter new to change)" : "Not set"}
                    className="input flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleTest(entry)}
                    disabled={isTesting}
                    className={`min-w-[60px] ${testResult?.valid ? 'bg-c-success' : testResult && !testResult.valid ? 'bg-c-error' : 'bg-c-bg-elevated'} ${testResult ? 'text-white' : 'text-c-text-muted'}`}
                  >
                    {isTesting ? "..." : testResult?.valid ? "Valid" : testResult ? "Invalid" : "Test"}
                  </Button>
                  {testResult && (
                    <span
                      className={`text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px] ${testResult.valid ? 'text-c-success' : 'text-c-error'}`}
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
