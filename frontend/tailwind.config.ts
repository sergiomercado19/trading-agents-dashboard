import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(0.24 0.005 260)",
        "border-subtle": "oklch(0.20 0.005 260)",
        "border-accent": "oklch(0.62 0.17 255 / 0.4)",
        input: "oklch(0.19 0.005 260)",
        ring: "oklch(0.62 0.17 255)",
        background: "oklch(0.13 0.005 260)",
        foreground: "oklch(0.93 0.005 260)",
        primary: {
          DEFAULT: "oklch(0.62 0.17 255)",
          foreground: "oklch(1 0 0)",
          hover: "oklch(0.56 0.17 255)",
          subtle: "oklch(0.62 0.17 255 / 0.12)",
          muted: "oklch(0.62 0.17 255 / 0.25)",
        },
        secondary: {
          DEFAULT: "oklch(0.16 0.005 260)",
          foreground: "oklch(0.72 0.005 260)",
          hover: "oklch(0.22 0.008 260)",
        },
        destructive: {
          DEFAULT: "oklch(0.65 0.2 25)",
          foreground: "oklch(1 0 0)",
          subtle: "oklch(0.65 0.2 25 / 0.12)",
        },
        success: {
          DEFAULT: "oklch(0.72 0.19 155)",
          subtle: "oklch(0.72 0.19 155 / 0.12)",
        },
        warning: {
          DEFAULT: "oklch(0.82 0.17 85)",
          subtle: "oklch(0.82 0.17 85 / 0.12)",
        },
        muted: {
          DEFAULT: "oklch(0.19 0.005 260)",
          foreground: "oklch(0.52 0.005 260)",
        },
        accent: {
          DEFAULT: "oklch(0.19 0.005 260)",
          foreground: "oklch(0.93 0.005 260)",
          subtle: "oklch(0.62 0.17 255 / 0.12)",
        },
        card: {
          DEFAULT: "oklch(0.16 0.005 260)",
          foreground: "oklch(0.93 0.005 260)",
        },
        popover: {
          DEFAULT: "oklch(0.16 0.005 260)",
          foreground: "oklch(0.93 0.005 260)",
        },
        "text-primary": "oklch(0.93 0.005 260)",
        "text-secondary": "oklch(0.72 0.005 260)",
        "text-muted": "oklch(0.52 0.005 260)",
        "text-faint": "oklch(0.38 0.005 260)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "ui-monospace", "SFMono-Regular", "monospace"],
        ui: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "Roboto", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.8125rem", { lineHeight: "1.5" }],
        base: ["0.875rem", { lineHeight: "1.5" }],
        md: ["0.9375rem", { lineHeight: "1.5" }],
        lg: ["1.0625rem", { lineHeight: "1.5" }],
        xl: ["1.375rem", { lineHeight: "1.25" }],
        "2xl": ["1.75rem", { lineHeight: "1.25" }],
      },
      spacing: {
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px oklch(0 0 0 / 0.3)",
        md: "0 4px 12px oklch(0 0 0 / 0.4)",
        lg: "0 8px 24px oklch(0 0 0 / 0.5)",
        "glow-accent": "0 0 20px oklch(0.62 0.17 255 / 0.15)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "200ms",
        slow: "350ms",
        morph: "450ms",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      zIndex: {
        base: "0",
        elevated: "10",
        sticky: "20",
        drawer: "30",
        overlay: "40",
        modal: "50",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        slideInLeft: {
          from: { transform: "translateX(-20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
        slideInRight: "slideInRight 350ms ease-out",
        slideOutRight: "slideOutRight 200ms ease-in",
        slideInLeft: "slideInLeft 350ms ease-out",
        pulse: "pulse 2s infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;