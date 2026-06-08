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
        // Brutalist aliases — same RGB vars, semantic names for new components
        paper: "rgb(var(--c-cream) / <alpha-value>)",
        carbon: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          deep: "rgb(var(--c-forest-dark) / <alpha-value>)",
        },
        citrine: {
          DEFAULT: "rgb(var(--c-forest-light) / <alpha-value>)",
          soft: "rgb(var(--c-forest-muted) / <alpha-value>)",
        },
        smoke: {
          1: "rgb(var(--c-beige-dark) / <alpha-value>)",
          2: "rgb(var(--c-stone) / <alpha-value>)",
          deep: "rgb(var(--c-muted) / <alpha-value>)",
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
        // `serif` stays as the class name so existing markup keeps working,
        // but it now resolves to a grotesk (display) font.
        serif: ["var(--font-display)", "Inter Tight", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter Tight", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-2xl": ["6rem", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "display-xl":  ["4.5rem", { lineHeight: "0.92", letterSpacing: "-0.025em" }],
        "display-lg":  ["3rem", { lineHeight: "0.96", letterSpacing: "-0.02em" }],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
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
        slideUp: {
          from: { opacity: "0", transform: "translateY(28px)" },
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
