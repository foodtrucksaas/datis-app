"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { IcaoInput } from "@/components/IcaoInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UtcClock } from "@/components/UtcClock";
import { getFavorites, getRecents } from "@/lib/store";
import Link from "next/link";

const AirportMap = dynamic(() => import("@/components/AirportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[50vh] min-h-[300px] w-full animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
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

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-mono text-base font-semibold tracking-wide text-[var(--accent)]">
          ATIS·EU
        </span>
        <div className="flex items-center gap-3">
          <UtcClock />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-6 px-5 pb-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            D-ATIS Europe
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Recherche par code ICAO
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <IcaoInput />
        </div>

        {/* Map */}
        <AirportMap favorites={favorites} recents={recents} />

        {/* Disclaimer */}
        <p className="text-center font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Not for operational use
        </p>

        {/* Recents & Favorites */}
        {(recents.length > 0 || favorites.length > 0) && (
          <div className="mx-auto w-full max-w-md space-y-5">
            {favorites.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Favoris
                </h2>
                <div className="flex flex-wrap gap-2">
                  {favorites.map((icao) => (
                    <Link
                      key={icao}
                      href={`/atis/${icao}`}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-sm font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent-dim)] hover:bg-[var(--accent)]/5"
                    >
                      {icao}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {recents.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Récents
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recents.map((icao) => (
                    <Link
                      key={icao}
                      href={`/atis/${icao}`}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--text-primary)]"
                    >
                      {icao}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 py-4 text-center">
        <Link
          href="/legal"
          className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Mentions légales
        </Link>
      </footer>
    </>
  );
}
