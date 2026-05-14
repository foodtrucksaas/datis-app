"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("atis-live:theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--accent)] active:scale-95"
      aria-label={light ? "Mode sombre" : "Mode clair"}
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
