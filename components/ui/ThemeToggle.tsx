"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("bw_theme", next ? "dark" : "light"); } catch { /* */ }
  };

  // Render a same-size placeholder to avoid layout shift before hydration
  if (!mounted) return <span className="w-9 h-9 inline-block" />;

  return (
    <button
      onClick={toggle}
      className="p-2.5 text-ink/70 hover:text-ink transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
