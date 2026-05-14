"use client";

import { useEffect, useState } from "react";

export function UtcClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, "0");
      const mm = String(now.getUTCMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}Z`);
    }
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
      {time}
    </span>
  );
}
