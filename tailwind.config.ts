import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#F6F4EF",
        surface1: "#FFFFFF",
        surface2: "#F8FAFD",
        surface3: "#EEF3FB",
        ink: "#182233",
        "ink-hover": "#24324A",
        accent: "#5B84E6",
        "accent-hover": "#4D76DE",
        borderSubtle: "#DDE4EE",
        textPrimary: "#182233",
        textSecondary: "#64748B",
        stripBlue: "#5B84E6",
        stripAmber: "#C08A2D",
        stripGreen: "#2F9E73"
      },
      fontFamily: {
        sans: ["Inter", '"Noto Sans SC"', "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
