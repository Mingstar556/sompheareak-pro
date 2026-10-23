import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        secondary: {
          DEFAULT: "#059669",
          light: "#10b981",
          dark: "#064e3b",
          darker: "#022c22",
          surface: "#065f46",
          mint: "#34d399",
        },
        toy: {
          purple: "#6366f1",
          purpleDark: "#4338ca",
          pink: "#f43f5e",
          pinkLight: "#fda4af",
          yellow: "#fbbf24",
          yellowDark: "#d97706",
          orange: "#f97316",
          cyan: "#06b6d4",
          cyanDark: "#0891b2",
          green: "#10b981",
          greenDark: "#059669",
          greenDeep: "#064e3b",
          greenForest: "#047857",
          greenMint: "#34d399",
          darkBg: "#0b0f19",
          darkCard: "#131b2e",
          darkSurface: "#1e293b",
          lightBg: "#f8fafc",
          lightCard: "#ffffff",
        },
      },
      fontFamily: {
        fredoka: ["var(--font-fredoka)", "sans-serif"],
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
      boxShadow: {
        "toy-pop": "0 8px 0px 0px rgba(0,0,0,0.15)",
        "toy-glow": "0 0 30px rgba(244, 63, 94, 0.35)",
        "toy-cyan-glow": "0 0 30px rgba(6, 182, 212, 0.4)",
        "toy-green-glow": "0 0 30px rgba(16, 185, 129, 0.45)",
        "toy-darkgreen-glow": "0 0 35px rgba(6, 78, 59, 0.65)",
        "toy-button-green": "0 6px 0px 0px #064e3b",
        "toy-card": "0 14px 34px -10px rgba(15, 23, 42, 0.12)",
        "toy-card-dark": "0 14px 34px -10px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "float-delayed": "float 5s ease-in-out 1.5s infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        marquee: "marquee 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
