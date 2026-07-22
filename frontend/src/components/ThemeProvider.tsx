import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeId = "terminal" | "modern" | "bloomberg";

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
    try { localStorage.setItem("ta-theme", t); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.className = theme;
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
