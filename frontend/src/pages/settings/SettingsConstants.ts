export const KEY_GROUPS = [
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
] as const;

export type KeyEntry = (typeof KEY_GROUPS)[number];

export const DATA_VENDOR_CATEGORIES = [
  { key: "core_stock_apis", label: "Core Stock APIs", options: ["yfinance", "alpha_vantage"] },
  { key: "technical_indicators", label: "Technical Indicators", options: ["yfinance", "alpha_vantage"] },
  { key: "fundamental_data", label: "Fundamental Data", options: ["yfinance", "alpha_vantage"] },
  { key: "news_data", label: "News Data", options: ["yfinance", "alpha_vantage"] },
  { key: "macro_data", label: "Macro Data (FRED)", options: ["fred"] },
  { key: "prediction_markets", label: "Prediction Markets", options: ["polymarket"] },
] as const;

export const RISK_PROFILES = [
  { id: "conservative", label: "Conservative", desc: "Lower risk, fewer trades, stricter validation" },
  { id: "neutral", label: "Neutral", desc: "Balanced risk/reward approach" },
  { id: "aggressive", label: "Aggressive", desc: "Higher risk tolerance, more opportunities" },
] as const;

export type SettingsSection = "general" | "api-keys" | "system";

export const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "api-keys", label: "API Keys" },
  { id: "system", label: "System" },
];