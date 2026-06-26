"use client";

import { useEffect, useState } from "react";
import Switch from "@/components/ui/Switch";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("bw_theme", next ? "dark" : "light"); } catch { /* */ }
  };

  // Same-size placeholder to avoid layout shift before hydration.
  if (!mounted) return <span className="inline-block w-10 h-[22px]" />;

  return (
    <Switch
      size="sm"
      checked={dark}
      onChange={toggle}
      ariaLabel={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="mr-1"
    />
  );
}
