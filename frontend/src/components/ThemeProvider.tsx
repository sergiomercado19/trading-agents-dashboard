import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeId = "terminal" | "modern" | "bloomberg";

interface ThemeVars {
  [key: string]: string;
}

const THEMES: Record<ThemeId, ThemeVars> = {
  terminal: {
    "--color-bg-root": "oklch(0.13 0.005 260)",
    "--color-bg-surface": "oklch(0.16 0.005 260)",
    "--color-bg-elevated": "oklch(0.19 0.005 260)",
    "--color-bg-overlay": "oklch(0.22 0.005 260)",
    "--color-text-primary": "oklch(0.93 0.005 260)",
    "--color-text-secondary": "oklch(0.72 0.005 260)",
    "--color-text-muted": "oklch(0.52 0.005 260)",
    "--color-accent": "oklch(0.62 0.17 255)",
    "--color-accent-hover": "oklch(0.56 0.17 255)",
    "--color-success": "oklch(0.72 0.19 155)",
    "--color-warning": "oklch(0.82 0.17 85)",
    "--color-error": "oklch(0.65 0.2 25)",
    "--color-border": "oklch(0.24 0.005 260)",
  },
  modern: {
    "--color-bg-root": "oklch(0.97 0.005 260)",
    "--color-bg-surface": "oklch(1 0 0)",
    "--color-bg-elevated": "oklch(0.96 0.005 260)",
    "--color-bg-overlay": "oklch(0.94 0.005 260)",
    "--color-text-primary": "oklch(0.15 0.01 260)",
    "--color-text-secondary": "oklch(0.40 0.01 260)",
    "--color-text-muted": "oklch(0.58 0.01 260)",
    "--color-accent": "oklch(0.55 0.22 270)",
    "--color-accent-hover": "oklch(0.48 0.22 270)",
    "--color-success": "oklch(0.65 0.19 155)",
    "--color-warning": "oklch(0.75 0.17 85)",
    "--color-error": "oklch(0.60 0.22 25)",
    "--color-border": "oklch(0.90 0.005 260)",
  },
  bloomberg: {
    "--color-bg-root": "oklch(0.08 0.01 40)",
    "--color-bg-surface": "oklch(0.11 0.015 40)",
    "--color-bg-elevated": "oklch(0.14 0.02 40)",
    "--color-bg-overlay": "oklch(0.18 0.02 40)",
    "--color-text-primary": "oklch(0.85 0.12 65)",
    "--color-text-secondary": "oklch(0.70 0.10 60)",
    "--color-text-muted": "oklch(0.50 0.06 55)",
    "--color-accent": "oklch(0.72 0.18 50)",
    "--color-accent-hover": "oklch(0.65 0.18 50)",
    "--color-success": "oklch(0.80 0.20 145)",
    "--color-warning": "oklch(0.90 0.16 95)",
    "--color-error": "oklch(0.65 0.25 25)",
    "--color-border": "oklch(0.25 0.02 40)",
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
