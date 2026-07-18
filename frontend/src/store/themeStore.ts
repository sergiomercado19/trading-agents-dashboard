import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

type Theme = "dark" | "high-contrast" | "mono";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const themes: Theme[] = ["dark", "high-contrast", "mono"];

type ThemePersist = PersistOptions<ThemeState>;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme: Theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      toggleTheme: () => {
        const current = get().theme;
        const index = themes.indexOf(current);
        const next = themes[(index + 1) % themes.length] ?? "dark";
        set({ theme: next });
        document.documentElement.setAttribute("data-theme", next);
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    } as ThemePersist
  )
);