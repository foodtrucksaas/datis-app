"use client";

import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { IcaoInput } from "@/components/IcaoInput";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <FirstLaunchDisclaimer />

      {/* Header */}
      <header className="flex items-center px-5 py-4">
        <span className="font-mono text-base font-semibold tracking-wide text-[var(--accent)]">
          ATIS·EU
        </span>
      </header>

      {/* Main content — centered */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            D-ATIS Europe
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Recherche par code ICAO
          </p>
        </div>

        <IcaoInput />

        <p className="text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
          Usage informatif uniquement · Pas de cadre opérationnel · Données
          non officielles
        </p>

        {/* Recents & Favorites — placeholder sections */}
        <div className="w-full max-w-md space-y-6">
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Récents
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Aucune recherche récente
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Favoris
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Aucun favori enregistré
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-5 py-4 text-center">
        <Link
          href="/legal"
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Mentions légales
        </Link>
      </footer>
    </>
  );
}
