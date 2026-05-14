"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";
import { IcaoInput } from "@/components/IcaoInput";
import { UtcClock } from "@/components/UtcClock";
import { Wordmark } from "@/components/Wordmark";
import {
  getSettings,
  updateSettings,
  addRecent,
  fetchLiveAtis,
} from "@/lib/store";
import type { LiveAtisResponse } from "@/lib/store";
import type { Airport } from "@/lib/types";
import type { ServiceTier } from "@/lib/types";
import { findAirport } from "@/lib/airports";
import { getServiceTier } from "@/lib/datis-coverage";
import { parseDatis } from "@/lib/datis-parser";
import type { DatisFields } from "@/lib/datis-parser";
import { WarningBanner } from "@/components/WarningBanner";
import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { AirportHeader } from "@/components/AirportHeader";
import { DatisCard } from "@/components/DatisCard";
import { WindComponentsStrip } from "@/components/WindComponentsStrip";
import { NoAtisNotice } from "@/components/NoAtisNotice";
import { PromotedMetarCard } from "@/components/PromotedMetarCard";
import { DataAccordion } from "@/components/DataAccordion";
import { RawDataBlock } from "@/components/RawDataBlock";
import { DecodedMetar } from "@/components/DecodedMetar";
import { DecodedTaf } from "@/components/DecodedTaf";
import { PageFooter } from "@/components/PageFooter";
import { Meteogram } from "@/components/Meteogram";
import { NotamBlock } from "@/components/NotamBlock";
import { SunTimes } from "@/components/SunTimes";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ParsedMessage {
  fields: DatisFields;
  raw: string;
  receivedAt: string;
}

export default function AtisPage() {
  const params = useParams<{ icao: string }>();
  const router = useRouter();
  const icao = params.icao?.toUpperCase() ?? "";

  const [liveResponse, setLiveResponse] = useState<LiveAtisResponse | null>(null);
  const [airport, setAirport] = useState<Airport | null>(null);
  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[]>([]);
  const [tier, setTier] = useState<ServiceTier>(3);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [weatherMode, setWeatherMode] = useState<"raw" | "decoded">("raw");

  const loadData = useCallback(async () => {
    setLoading(true);

    const response = await fetchLiveAtis(icao);
    setLiveResponse(response);

    if (response) {
      const apt: Airport = response.airport
        ? response.airport
        : findAirport(icao) ?? { icao, name: icao, city: "", country: "" };
      setAirport(apt);

      // Determine tier
      const serviceTier = getServiceTier(icao, apt);
      // If tier 1 but no ATIS messages received, still show as tier 1 (data might be stale)
      setTier(serviceTier);

      // Parse D-ATIS messages
      if (response.messages && response.messages.length > 0) {
        const parsed = response.messages.map((msg) => ({
          fields: parseDatis(msg.body, { letter: msg.letter, type: msg.type }),
          raw: msg.raw.replace(/\t/g, " ").replace(/\r/g, ""),
          receivedAt: msg.timestamp,
        }));
        setParsedMessages(parsed);
      } else {
        setParsedMessages([]);
      }

      setNotFound(false);
      addRecent(icao);
    } else {
      const apt = findAirport(icao);
      if (apt) {
        setAirport(apt);
        setTier(getServiceTier(icao, apt));
        setNotFound(false);
        addRecent(icao);
      } else {
        setNotFound(true);
        setAirport(null);
      }
      setParsedMessages([]);
    }

    setLoading(false);
  }, [icao]);

  useEffect(() => {
    if (!icao) return;
    loadData();
    const settings = getSettings();
    setWeatherMode(settings.weatherDisplayMode);
  }, [icao, loadData]);

  const toggleWeatherMode = () => {
    setWeatherMode((prev) => {
      const next = prev === "raw" ? "decoded" : "raw";
      updateSettings({ weatherDisplayMode: next });
      return next;
    });
  };

  // Shared header
  const header = (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/95 px-5 py-3 backdrop-blur-sm">
      <Link
        href="/"
        className="-ml-1 p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <Wordmark size="sm" />
      <span className="font-mono text-xs font-medium text-[var(--text-muted)]">
        · {icao}
      </span>
      {tier !== 1 && (
        <TierBadge tier={tier} />
      )}
      <div className="ml-auto flex items-center gap-3">
        <IcaoInput />
        <UtcClock />
        <ThemeToggle />
      </div>
    </header>
  );

  // Loading skeleton
  if (loading) {
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col gap-5 px-5 py-6">
          <div className="space-y-2">
            <div className="h-7 w-24 animate-pulse rounded bg-[var(--surface-elevated)]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--surface-elevated)]" />
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-[10px] bg-[var(--surface-elevated)]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-elevated)]" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-md bg-[var(--surface-elevated)]"
                />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  // Not found
  if (notFound && !airport) {
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-16 text-center">
          <Plane className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-mono text-lg font-semibold text-[var(--text-primary)]">
            {icao}
          </p>
          <p className="max-w-xs text-sm text-[var(--text-secondary)]">
            Aéroport non trouvé dans notre base. Vérifie le code ICAO (4
            lettres).
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-md bg-[var(--surface-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Retour à la recherche
          </button>
        </main>
      </>
    );
  }

  if (!airport) return null;

  const metar = liveResponse?.metar;
  const taf = liveResponse?.taf;
  const hasAtis = parsedMessages.length > 0;
  const allFields = parsedMessages.map((m) => m.fields);

  // METAR preview for accordion
  const metarPreview = metar
    ? metar.raw.slice(metar.raw.indexOf("Z") + 2, metar.raw.indexOf("Z") + 40) + "…"
    : undefined;

  // Sun times preview
  const sunPreview =
    airport.lat != null && airport.lon != null ? "Lever · Coucher" : undefined;

  return (
    <>
      {disclaimerOpen && (
        <FirstLaunchDisclaimer
          forceOpen
          onClose={() => setDisclaimerOpen(false)}
        />
      )}

      {header}

      <WarningBanner onClickDetails={() => setDisclaimerOpen(true)} />

      <AirportHeader airport={airport} />

      {airport.lat != null && airport.lon != null && (
        <SunTimes lat={airport.lat} lon={airport.lon} />
      )}

      <main className="flex flex-1 flex-col gap-4 pt-2 pb-4">
        {/* ── TIER 1: D-ATIS ── */}
        {tier === 1 && (
          <>
            {hasAtis ? (
              parsedMessages.map((msg, i) => (
                <DatisCard
                  key={i}
                  fields={msg.fields}
                  raw={msg.raw}
                  receivedAt={msg.receivedAt}
                />
              ))
            ) : (
              <div className="mx-3.5 rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Pas de D-ATIS récent capté pour ce terrain.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Réessaye dans quelques minutes ou consulte l&apos;ATIS voix.
                </p>
              </div>
            )}

            {/* Wind components strip */}
            {hasAtis && (
              <WindComponentsStrip
                icao={icao}
                allFields={allFields}
                metarRaw={metar?.raw}
              />
            )}

            {/* Accordions */}
            {metar && (
              <DataAccordion label="METAR" preview={metarPreview}>
                <div className="p-3">
                  {weatherMode === "raw" ? (
                    <RawDataBlock raw={metar.raw} />
                  ) : (
                    <DecodedMetar raw={metar.raw} />
                  )}
                  <button
                    onClick={toggleWeatherMode}
                    className="mt-2 font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {weatherMode === "raw" ? "Décoder" : "Voir brut"}
                  </button>
                </div>
              </DataAccordion>
            )}

            {taf && (
              <DataAccordion label="TAF" preview="Prévisions">
                <div className="p-3">
                  {weatherMode === "raw" ? (
                    <RawDataBlock raw={taf.raw} />
                  ) : (
                    <DecodedTaf raw={taf.raw} />
                  )}
                  <button
                    onClick={toggleWeatherMode}
                    className="mt-2 font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {weatherMode === "raw" ? "Décoder" : "Voir brut"}
                  </button>
                </div>
              </DataAccordion>
            )}

            <DataAccordion label="NOTAMs" preview="Actifs">
              <div className="p-3">
                <NotamBlock icao={icao} />
              </div>
            </DataAccordion>

            {airport.lat != null && airport.lon != null && (
              <DataAccordion label="Forecast" preview="Météogramme ECMWF · 36h">
                <div className="p-3">
                  <Meteogram lat={airport.lat} lon={airport.lon} />
                </div>
              </DataAccordion>
            )}

            {airport.lat != null && airport.lon != null && (
              <DataAccordion label="Éphéméride" preview={sunPreview}>
                <div className="p-3">
                  <SunTimes lat={airport.lat} lon={airport.lon} />
                </div>
              </DataAccordion>
            )}
          </>
        )}

        {/* ── TIER 2: ATIS Voix ── */}
        {tier === 2 && (
          <>
            <NoAtisNotice airport={airport} tier={2} />

            {metar && (
              <PromotedMetarCard raw={metar.raw} receivedAt={metar.fetchedAt} />
            )}

            {taf && (
              <DataAccordion label="TAF" preview="Prévisions" defaultOpen>
                <div className="p-3">
                  {weatherMode === "raw" ? (
                    <RawDataBlock raw={taf.raw} />
                  ) : (
                    <DecodedTaf raw={taf.raw} />
                  )}
                  <button
                    onClick={toggleWeatherMode}
                    className="mt-2 font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {weatherMode === "raw" ? "Décoder" : "Voir brut"}
                  </button>
                </div>
              </DataAccordion>
            )}

            {/* Wind strip if METAR wind available */}
            {metar && allFields.length === 0 && (
              <WindComponentsStrip
                icao={icao}
                allFields={[]}
                metarRaw={metar.raw}
              />
            )}

            <DataAccordion label="NOTAMs" preview="Actifs">
              <div className="p-3">
                <NotamBlock icao={icao} />
              </div>
            </DataAccordion>

            {airport.lat != null && airport.lon != null && (
              <DataAccordion label="Forecast" preview="Météogramme ECMWF · 36h">
                <div className="p-3">
                  <Meteogram lat={airport.lat} lon={airport.lon} />
                </div>
              </DataAccordion>
            )}
          </>
        )}

        {/* ── TIER 3: METAR/TAF seuls ── */}
        {tier === 3 && (
          <>
            <NoAtisNotice airport={airport} tier={3} />

            {metar && (
              <PromotedMetarCard raw={metar.raw} receivedAt={metar.fetchedAt} />
            )}

            {taf && (
              <DataAccordion label="TAF" preview="Prévisions" defaultOpen>
                <div className="p-3">
                  {weatherMode === "raw" ? (
                    <RawDataBlock raw={taf.raw} />
                  ) : (
                    <DecodedTaf raw={taf.raw} />
                  )}
                  <button
                    onClick={toggleWeatherMode}
                    className="mt-2 font-mono text-[10px] text-[var(--accent)] hover:underline"
                  >
                    {weatherMode === "raw" ? "Décoder" : "Voir brut"}
                  </button>
                </div>
              </DataAccordion>
            )}

            <DataAccordion label="NOTAMs" preview="Actifs">
              <div className="p-3">
                <NotamBlock icao={icao} />
              </div>
            </DataAccordion>

            {airport.lat != null && airport.lon != null && (
              <DataAccordion label="Forecast" preview="Météogramme ECMWF · 36h">
                <div className="p-3">
                  <Meteogram lat={airport.lat} lon={airport.lon} />
                </div>
              </DataAccordion>
            )}
          </>
        )}

        {/* ── TIER 4: Pas de météo ── */}
        {tier === 4 && (
          <>
            <NoAtisNotice airport={airport} tier={4} />

            {/* Nearest METAR reference — would need nearestMetarIcao in airport data */}
            {metar && (
              <PromotedMetarCard raw={metar.raw} receivedAt={metar.fetchedAt} />
            )}

            <DataAccordion label="NOTAMs" preview="Actifs">
              <div className="p-3">
                <NotamBlock icao={icao} />
              </div>
            </DataAccordion>
          </>
        )}
      </main>

      <PageFooter onRefresh={loadData} />
    </>
  );
}

function TierBadge({ tier }: { tier: ServiceTier }) {
  const labels: Record<ServiceTier, string> = {
    1: "D-ATIS",
    2: "ATIS VOIX",
    3: "METAR ONLY",
    4: "VFR ONLY",
  };
  const colors: Record<ServiceTier, string> = {
    1: "var(--fresh)",
    2: "var(--accent)",
    3: "var(--text-muted)",
    4: "var(--text-muted)",
  };
  return (
    <span
      className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: `color-mix(in srgb, ${colors[tier]} 12%, transparent)`,
        color: colors[tier],
      }}
    >
      {labels[tier]}
    </span>
  );
}
