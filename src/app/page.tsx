"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { IcaoInput } from "@/components/IcaoInput";
import { getFavorites, getRecents } from "@/lib/store";
import Link from "next/link";

const AirportMap = dynamic(() => import("@/components/AirportMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#000010]" />
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

      {/* Full-screen dark container */}
      <div className="relative flex min-h-dvh flex-col bg-[#000010] text-white">

        {/* Globe background — fills entire viewport */}
        <div className="absolute inset-0 z-0">
          <AirportMap favorites={favorites} recents={recents} />
        </div>

        {/* Overlay content */}
        <div className="relative z-10 flex min-h-dvh flex-col pointer-events-none">

          {/* Header */}
          <header className="flex items-center justify-between px-5 py-4 pointer-events-auto">
            <span className="font-mono text-base font-semibold tracking-wide text-sky-400">
              ATIS·EU
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-white/50">
              <UtcClockInline />
            </span>
          </header>

          {/* Center content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                D-ATIS Europe
              </h1>
              <p className="mt-1.5 text-sm text-white/50">
                Recherche par code ICAO
              </p>
            </div>

            <div className="w-full max-w-md pointer-events-auto">
              <IcaoInput variant="dark" />
            </div>

            {/* Quick access pills */}
            {(favorites.length > 0 || recents.length > 0) && (
              <div className="flex flex-wrap justify-center gap-2 pointer-events-auto">
                {favorites.map((icao) => (
                  <Link
                    key={icao}
                    href={`/atis/${icao}`}
                    className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400 backdrop-blur-sm transition-colors hover:bg-amber-400/20"
                  >
                    {icao}
                  </Link>
                ))}
                {recents.filter((r) => !favorites.includes(r)).map((icao) => (
                  <Link
                    key={icao}
                    href={`/atis/${icao}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white/80"
                  >
                    {icao}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between px-5 py-4 pointer-events-auto">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">
              Not for operational use
            </span>
            <Link
              href="/legal"
              className="font-mono text-[9px] text-white/25 hover:text-white/50 transition-colors"
            >
              Mentions légales
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
}

/** Inline UTC clock for the dark header */
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

  return <>{time}</>;
}
