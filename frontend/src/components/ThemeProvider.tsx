import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeId = "terminal" | "modern" | "bloomberg";

interface ThemeVars {
  [key: string]: string;
}

const THEMES: Record<ThemeId, ThemeVars> = {
  terminal: {
    "--bg": "#0a0a0a",
    "--bg-secondary": "#141414",
    "--bg-tertiary": "#1e1e1e",
    "--border": "#2a2a2a",
    "--text-primary": "#e0e0e0",
    "--text-secondary": "#b0b0b0",
    "--text-muted": "#888",
    "--accent": "#3b82f6",
    "--accent-hover": "#2563eb",
    "--success": "#22c55e",
    "--warning": "#eab308",
    "--error": "#ef4444",
    "--danger": "#ef4444",
  },
  modern: {
    "--bg": "#f8fafc",
    "--bg-secondary": "#ffffff",
    "--bg-tertiary": "#f1f5f9",
    "--border": "#e2e8f0",
    "--text-primary": "#0f172a",
    "--text-secondary": "#475569",
    "--text-muted": "#94a3b8",
    "--accent": "#6366f1",
    "--accent-hover": "#4f46e5",
    "--success": "#10b981",
    "--warning": "#f59e0b",
    "--error": "#ef4444",
    "--danger": "#ef4444",
  },
  bloomberg: {
    "--bg": "#000000",
    "--bg-secondary": "#0d0d0d",
    "--bg-tertiary": "#1a1a1a",
    "--border": "#333333",
    "--text-primary": "#ff8800",
    "--text-secondary": "#cc6600",
    "--text-muted": "#666666",
    "--accent": "#ff6600",
    "--accent-hover": "#ff4400",
    "--success": "#00ff00",
    "--warning": "#ffff00",
    "--error": "#ff0000",
    "--danger": "#ff0000",
  },
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "terminal", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem("ta-theme") as ThemeId) || "terminal";
    } catch {
      return "terminal";
    }
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    try { localStorage.setItem("ta-theme", t); } catch {}
  };

  useEffect(() => {
    const vars = THEMES[theme];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    // Set text color alias
    root.style.setProperty("--text", vars["--text-primary"] ?? "#e0e0e0");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const THEME_IDS: ThemeId[] = ["terminal", "modern", "bloomberg"];
export const THEME_LABELS: Record<ThemeId, string> = {
  terminal: "Terminal",
  modern: "Modern",
  bloomberg: "Bloomberg",
};
