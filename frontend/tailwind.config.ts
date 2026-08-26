import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0D12",
        panel: "#12161D",
        panel2: "#171C25",
        line: "#232936",
        ink: "#E7E9EC",
        "ink-dim": "#8A93A3",
        "ink-faint": "#5B6472",
        amber: {
          DEFAULT: "#F5A524",
          dim: "#8A6420",
          glow: "rgba(245,165,36,0.18)",
        },
        crimson: {
          DEFAULT: "#E5484D",
          dim: "#7A2B2E",
          glow: "rgba(229,72,77,0.18)",
        },
        steel: {
          DEFAULT: "#5B8CA8",
          dim: "#33495A",
          glow: "rgba(91,140,168,0.16)",
        },
        sage: {
          DEFAULT: "#5FAE84",
          dim: "#2E4B3B",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        scan: "scan 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
