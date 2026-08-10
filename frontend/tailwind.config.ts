import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-suisse)", "sans-serif"],
        display: ["var(--font-agrandir)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;