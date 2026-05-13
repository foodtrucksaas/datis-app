"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane, Loader2 } from "lucide-react";
import {
  getSettings,
  updateSettings,
  addRecent,
  fetchLiveAtis,
  liveMessageToAtisRecord,
} from "@/lib/store";
import type { AirportData } from "@/lib/types";
import { findAirport } from "@/lib/airports";
import { WarningBanner } from "@/components/WarningBanner";
import { FirstLaunchDisclaimer } from "@/components/FirstLaunchDisclaimer";
import { AirportHeader } from "@/components/AirportHeader";
import { AtisCard } from "@/components/AtisCard";
import { RawDataBlock } from "@/components/RawDataBlock";
import { WeatherBlock } from "@/components/WeatherBlock";
import { PageFooter } from "@/components/PageFooter";
import { Meteogram } from "@/components/Meteogram";
import { NotamBlock } from "@/components/NotamBlock";

export default function AtisPage() {
  const params = useParams<{ icao: string }>();
  const router = useRouter();
  const icao = params.icao?.toUpperCase() ?? "";

  const [data, setData] = useState<AirportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [weatherMode, setWeatherMode] = useState<"raw" | "decoded">("raw");

  const loadData = useCallback(async () => {
    setLoading(true);

    // Try live API first
    const liveResponse = await fetchLiveAtis(icao);

    // Build METAR/TAF from live response
    const liveMetar = liveResponse?.metar
      ? { icao: liveResponse.metar.icao, raw: liveResponse.metar.raw, receivedAt: liveResponse.metar.fetchedAt }
      : null;
    const liveTaf = liveResponse?.taf
      ? { icao: liveResponse.taf.icao, raw: liveResponse.taf.raw, receivedAt: liveResponse.taf.fetchedAt }
      : null;

    if (liveResponse && liveResponse.messages && liveResponse.messages.length > 0) {
      // We got live ATIS data — convert all messages (ARR + DEP)
      const airport = liveResponse.airport
        ? liveResponse.airport
        : findAirport(icao) ?? { icao, name: icao, city: "", country: "" };

      const atisRecords = liveResponse.messages.map(liveMessageToAtisRecord);

      setData({
        airport,
        atis: atisRecords,
        metar: liveMetar,
        taf: liveTaf,
      });
      setNotFound(false);
      setIsLive(true);
      addRecent(icao);
    } else {
      // No live ATIS — show airport with live METAR/TAF if available
      const airport = liveResponse?.airport ?? findAirport(icao);
      if (airport || liveMetar || liveTaf) {
        setData({
          airport: airport ?? { icao, name: icao, city: "", country: "" },
          atis: [],
          metar: liveMetar,
          taf: liveTaf,
        });
        setNotFound(false);
        addRecent(icao);
      } else {
        setNotFound(true);
        setData(null);
      }
      setIsLive(false);
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

  const handleRefresh = () => {
    loadData();
  };

  // Loading state
  if (loading) {
    return (
      <>
        <header className="flex items-center gap-3 px-5 py-4">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-mono text-base font-semibold tracking-wide text-[var(--accent)]">
            ATIS·EU
          </span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            Recherche D-ATIS {icao}...
          </p>
        </main>
      </>
    );
  }

  // Unknown airport / no data at all
  if (notFound && !data) {
    return (
      <>
        <header className="flex items-center gap-3 px-5 py-4">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-mono text-base font-semibold tracking-wide text-[var(--accent)]">
            ATIS·EU
          </span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-16 text-center">
          <Plane className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-mono text-lg font-semibold text-[var(--text-primary)]">
            {icao}
          </p>
          <p className="max-w-xs text-sm text-[var(--text-secondary)]">
            Aéroport non trouvé dans notre base. Vérifie le code ICAO (4 lettres).
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

  if (!data) return null;

  const hasAtis = data.atis.length > 0;

  return (
    <>
      {disclaimerOpen && (
        <FirstLaunchDisclaimer
          forceOpen
          onClose={() => setDisclaimerOpen(false)}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="font-mono text-base font-semibold tracking-wide text-[var(--accent)]">
          ATIS·EU
        </span>
        {isLive && (
          <span className="ml-auto rounded-full bg-[var(--fresh)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--fresh)]">
            LIVE
          </span>
        )}
      </header>

      {/* Warning banner */}
      <WarningBanner onClickDetails={() => setDisclaimerOpen(true)} />

      {/* Airport header */}
      <AirportHeader airport={data.airport} />

      <main className="flex flex-1 flex-col gap-5 pb-4">
        {/* ATIS Cards — one per message (ARR + DEP) */}
        {hasAtis ? (
          data.atis.map((atis, i) => (
            <div key={i}>
              <AtisCard atis={atis} />
              <div className="mx-5 mt-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Raw ATIS{atis.fields.type ? ` ${atis.fields.type}` : ""}
                </h3>
                <RawDataBlock raw={atis.raw} />
              </div>
            </div>
          ))
        ) : (
          <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Pas de D-ATIS récent capté pour ce terrain.
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Réessaye dans quelques minutes ou consulte le voix ATIS.
            </p>
          </div>
        )}

        {/* NOTAMs */}
        <NotamBlock icao={icao} />

        {/* Meteogram */}
        {data.airport.lat != null && data.airport.lon != null && (
          <Meteogram lat={data.airport.lat} lon={data.airport.lon} />
        )}

        {/* METAR */}
        {data.metar && (
          <WeatherBlock
            label="METAR"
            raw={data.metar.raw}
            receivedAt={data.metar.receivedAt}
            type="metar"
            mode={weatherMode}
            onToggle={toggleWeatherMode}
          />
        )}

        {/* TAF */}
        {data.taf && (
          <WeatherBlock
            label="TAF"
            raw={data.taf.raw}
            receivedAt={data.taf.receivedAt}
            type="taf"
            mode={weatherMode}
            onToggle={toggleWeatherMode}
          />
        )}
      </main>

      <PageFooter onRefresh={handleRefresh} />
    </>
  );
}
