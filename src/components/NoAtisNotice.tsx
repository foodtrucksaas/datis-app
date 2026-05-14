"use client";

import { Headphones, Radio } from "lucide-react";
import type { Airport } from "@/lib/types";
import type { ServiceTier } from "@/lib/types";

interface NoAtisNoticeProps {
  airport: Airport;
  tier: ServiceTier;
}

export function NoAtisNotice({ airport, tier }: NoAtisNoticeProps) {
  const hasVhf = !!airport.frequencies?.atisVhf_mhz;
  const hasPhone = !!airport.frequencies?.atisPhone;

  if (tier === 2) {
    return (
      <div className="mx-3.5 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[var(--text-muted)]/25 bg-[var(--text-muted)]/10">
            <Headphones className="h-4.5 w-4.5 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[var(--text-primary)]">
              D-ATIS non disponible sur ce terrain
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
              {airport.name} diffuse l&apos;ATIS en voix VHF uniquement
            </p>
          </div>
        </div>

        {/* Alternatives */}
        {(hasVhf || hasPhone) && (
          <div className="grid grid-cols-2 gap-3 border-t-[0.5px] border-[var(--border)] px-4 py-3">
            {hasVhf && (
              <div className="rounded-[5px] border-[0.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
                  ATIS Voix · VHF
                </p>
                <p className="mt-0.5 font-mono text-[15px] font-medium text-[var(--text-primary)]">
                  {airport.frequencies!.atisVhf_mhz} MHz
                </p>
                {airport.atisHours && (
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                    {airport.atisHours}
                  </p>
                )}
              </div>
            )}
            {hasPhone && (
              <div className="rounded-[5px] border-[0.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
                  ATIS Voix · Téléphone
                </p>
                <p className="mt-0.5 font-mono text-[15px] font-medium text-[var(--text-primary)]">
                  {airport.frequencies!.atisPhone}
                </p>
                <a
                  href={`tel:${airport.frequencies!.atisPhone!.replace(/[\s.]/g, "")}`}
                  className="mt-1 inline-block rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                  style={{
                    border: "0.5px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                  }}
                >
                  Appeler
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (tier === 3) {
    return (
      <div className="mx-3.5 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[var(--text-muted)]/25 bg-[var(--text-muted)]/10">
            <Radio className="h-4.5 w-4.5 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[var(--text-primary)]">
              Pas d&apos;ATIS sur ce terrain
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
              Conditions ci-dessous via METAR et TAF.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tier 4
  return (
    <div className="mx-3.5 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[var(--text-muted)]/25 bg-[var(--text-muted)]/10">
          <Radio className="h-4.5 w-4.5 text-[var(--text-muted)]" />
        </div>
        <div>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            Pas de service météo officiel
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            Météo de référence du terrain le plus proche ci-dessous.
          </p>
        </div>
      </div>
    </div>
  );
}
