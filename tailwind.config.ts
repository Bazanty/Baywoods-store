import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          DEFAULT: "rgb(var(--c-beige) / <alpha-value>)",
          dark: "rgb(var(--c-beige-dark) / <alpha-value>)",
        },
        cream: "rgb(var(--c-cream) / <alpha-value>)",
        forest: {
          DEFAULT: "rgb(var(--c-forest) / <alpha-value>)",
          dark: "rgb(var(--c-forest-dark) / <alpha-value>)",
          light: "rgb(var(--c-forest-light) / <alpha-value>)",
          muted: "rgb(var(--c-forest-muted) / <alpha-value>)",
        },
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        stone: {
          DEFAULT: "rgb(var(--c-stone) / <alpha-value>)",
          light: "rgb(var(--c-stone-light) / <alpha-value>)",
        },
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        cobalt: "#2563EB",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["5rem", { lineHeight: "1.0" }],
        "display-xl": ["4rem", { lineHeight: "1.05" }],
        "display-lg": ["2.75rem", { lineHeight: "1.1" }],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        "ticker": "ticker 30s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
