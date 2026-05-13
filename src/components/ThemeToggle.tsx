"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("atis-eu:theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--accent)]"
      aria-label={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
