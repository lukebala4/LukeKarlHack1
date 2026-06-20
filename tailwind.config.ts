import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0e0f12",
        fern: "#1f7a52",
        fernlight: "#34a06b",
        tierA: "#16a34a",
        tierB: "#d97706",
        tierC: "#64748b",
      },
    },
  },
  plugins: [],
};

export default config;
