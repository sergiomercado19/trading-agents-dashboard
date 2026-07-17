import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchJson, postJson } from "../../api/client";
import type { SettingsSection } from "./SettingsConstants";

/* Types */
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

interface EnvData {
  [key: string]: string | undefined;
  TRADINGAGENTS_OBSIDIAN_PATH?: string;
  OBSIDIAN_VAULT_PATH?: string;
}

interface DockerInfo {
  is_docker: boolean;
  hostname: string;
  env_path: string;
}

interface SettingsState {
  /* General */
  providers: Provider[];
  models: Models;
  selectedProvider: string;
  quickModel: string;
  deepModel: string;
  riskProfile: string;
  vendors: Record<string, string>;

  /* API Keys */
  envData: EnvData;
  keyEdits: Record<string, string>;
  testResults: Record<string, { valid: boolean; message: string }>;
  testing: string | null;
  vaultPath: string;

  /* System */
  health: HealthData | null;
  docker: DockerInfo | null;
  installing: boolean;
  installResult: { success: boolean; installed: string[]; errors: string[] } | null;

  /* UI */
  activeSection: SettingsSection;
  saved: boolean;
  loading: boolean;
}

interface SettingsContextType extends SettingsState {
  setActiveSection: (section: SettingsSection) => void;
  setSelectedProvider: (v: string) => void;
  setQuickModel: (v: string) => void;
  setDeepModel: (v: string) => void;
  setRiskProfile: (v: string) => void;
  setVendors: (v: Record<string, string>) => void;
  setKeyEdits: (v: Record<string, string>) => void;
  setTestResults: (v: Record<string, { valid: boolean; message: string }>) => void;
  setTesting: (v: string | null) => void;
  handleKeyChange: (envKey: string, value: string) => void;
  handleTest: (entry: KeyEntry) => Promise<void>;
  handleSaveAll: () => Promise<void>;
  refresh: () => Promise<void>;
  setVaultPath: (v: string) => void;
  setInstalling: (v: boolean) => void;
  setInstallResult: (v: { success: boolean; installed: string[]; errors: string[] } | null) => void;
  setSaved: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  /* General state */
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Models>({});
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [quickModel, setQuickModel] = useState("gpt-5.4-mini");
  const [deepModel, setDeepModel] = useState("gpt-5.5");
  const [riskProfile, setRiskProfile] = useState("neutral");
  const [vendors, setVendors] = useState<Record<string, string>>({});

  /* API Keys state */
  const [envData, setEnvData] = useState<EnvData>({});
  const [keyEdits, setKeyEdits] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [vaultPath, setVaultPath] = useState("");

  /* System state */
  const [health, setHealth] = useState<HealthData | null>(null);
  const [docker, setDocker] = useState<DockerInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ success: boolean; installed: string[]; errors: string[] } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [provs, mods, env, hp, dk, dv] = await Promise.all([
        fetchJson<Provider[]>("/providers").catch(() => []),
        fetchJson<Models>("/models").catch(() => ({})),
        fetchJson<EnvData>("/env").catch(() => ({})),
        fetchJson<HealthData>("/health/detailed").catch(() => null),
        fetchJson<DockerInfo>("/docker/info").catch(() => ({ is_docker: false, hostname: "", env_path: "" })),
        fetchJson<Record<string, string>>("/data_vendors").catch(() => ({})),
      ]);

      setProviders(provs);
      setModels(mods);
      setEnvData(env);
      const vaultPathValue = (env as EnvData).TRADINGAGENTS_OBSIDIAN_PATH || (env as EnvData).OBSIDIAN_VAULT_PATH || "";
      setVaultPath(vaultPathValue);
      setHealth(hp);
      setDocker(dk);
      const v: Record<string, string> = {};
      for (const [k, val] of Object.entries(dv)) {
        v[k] = Array.isArray(val) ? val[0] : String(val);
      }
      setVendors(v);
    } catch (e) {
      console.error("Failed to refresh settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleKeyChange = useCallback((envKey: string, value: string) => {
    setKeyEdits((prev) => ({ ...prev, [envKey]: value }));
  }, []);

  const handleTest = useCallback(async (entry: KeyEntry) => {
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
  }, [keyEdits, envData]);

  const handleSaveAll = useCallback(async () => {
    const updates: Record<string, string | null> = {};

    updates.TRADINGAGENTS_LLM_PROVIDER = selectedProvider;
    updates.TRADINGAGENTS_QUICK_THINK_LLM = quickModel;
    updates.TRADINGAGENTS_DEEP_THINK_LLM = deepModel;

    for (const [k, v] of Object.entries(keyEdits)) {
      if (v !== undefined) updates[k] = v || null;
    }
    if (vaultPath) updates.TRADINGAGENTS_OBSIDIAN_PATH = vaultPath;

    if (Object.keys(updates).length > 0) {
      await postJson("/env", updates);
      const fresh = await fetchJson<EnvData>("/env");
      setEnvData(fresh);
      setKeyEdits({});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [selectedProvider, quickModel, deepModel, keyEdits, vaultPath]);

  return (
    <SettingsContext.Provider
      value={{
        providers,
        models,
        selectedProvider,
        quickModel,
        deepModel,
        riskProfile,
        vendors,
        envData,
        keyEdits,
        testResults,
        testing,
        vaultPath,
        health,
        docker,
        installing,
        installResult,
        activeSection,
        saved,
        loading,
        setActiveSection,
        setSelectedProvider,
        setQuickModel,
        setDeepModel,
        setRiskProfile,
        setVendors,
        setKeyEdits,
        setTestResults,
        setTesting,
        handleKeyChange,
        handleTest,
        handleSaveAll,
        refresh,
        setVaultPath,
        setInstalling,
        setInstallResult,
        setSaved,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}