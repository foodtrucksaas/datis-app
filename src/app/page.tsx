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
    <div className="flex-1 bg-[#0a0f1a]" />
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

      <div className="flex min-h-dvh flex-col bg-[#0a0f1a] text-white">

        {/* Top bar: logo + clock */}
        <header className="flex items-center justify-between px-5 py-3">
          <span className="font-mono text-base font-semibold tracking-wide text-sky-400">
            ATIS·EU
          </span>
          <UtcClockInline />
        </header>

        {/* Search section */}
        <div className="flex flex-col items-center gap-4 px-5 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-white">
            D-ATIS Europe
          </h1>

          <div className="w-full max-w-md">
            <IcaoInput variant="dark" />
          </div>

          {/* Quick access pills */}
          {(favorites.length > 0 || recents.length > 0) && (
            <div className="flex flex-wrap justify-center gap-2">
              {favorites.map((icao) => (
                <Link
                  key={icao}
                  href={`/atis/${icao}`}
                  className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
                >
                  {icao}
                </Link>
              ))}
              {recents.filter((r) => !favorites.includes(r)).map((icao) => (
                <Link
                  key={icao}
                  href={`/atis/${icao}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
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
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/20">
              Not for operational use
            </span>
            <Link
              href="/legal"
              className="font-mono text-[9px] text-white/20 hover:text-white/40 transition-colors"
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
    <span className="font-mono text-xs font-semibold tabular-nums text-white/40">
      {time}
    </span>
  );
}
