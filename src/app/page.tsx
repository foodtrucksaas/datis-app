"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { IcaoInput } from "@/components/IcaoInput";
import { getFavorites, getRecents } from "@/lib/store";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

const AirportMap = dynamic(() => import("@/components/AirportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[var(--bg)]" />
  ),
});

export default function Home() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites().map((f) => f.icao));
    setRecents(getRecents().map((r) => r.icao));
  }, []);

  return (
    <>
      <FirstLaunchDisclaimer />

      <div className="flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--text-primary)]">

        {/* Top bar: logo + clock */}
        <header className="flex items-center justify-between px-5 py-3">
          <Wordmark size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UtcClockInline />
          </div>
        </header>

        {/* Search section */}
        <div className="flex flex-col items-center gap-4 px-5 pb-4">
          <Wordmark size="lg" />

          <div className="w-full max-w-md">
            <IcaoInput />
          </div>

          {/* Quick access pills */}
          {(favorites.length > 0 || recents.length > 0) && (
            <div className="flex flex-wrap justify-center gap-2">
              {favorites.map((icao) => (
                <Link
                  key={icao}
                  href={`/atis/${icao}`}
                  className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 font-mono text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
                >
                  {icao}
                </Link>
              ))}
              {recents.filter((r) => !favorites.includes(r)).map((icao) => (
                <Link
                  key={icao}
                  href={`/atis/${icao}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                >
                  {icao}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Globe fills remaining space */}
        <div className="relative flex-1 min-h-[400px]">
          <AirportMap favorites={favorites} recents={recents} />

          {/* Footer overlaid at bottom of globe */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]/50">
              Not for operational use
            </span>
            <Link
              href="/legal"
              className="font-mono text-[9px] text-[var(--text-muted)]/50 hover:text-[var(--text-muted)] transition-colors"
            >
              Mentions légales
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}

function UtcClockInline() {
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

  return (
    <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-muted)]">
      {time}
    </span>
  );
}
