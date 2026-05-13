/**
 * Live METAR/TAF from aviationweather.gov (free, no API key needed).
 * Runs server-side only.
 */

const AWC_BASE = "https://aviationweather.gov/api/data";

export interface LiveMetar {
  icao: string;
  raw: string;
  fetchedAt: string;
}

export interface LiveTaf {
  icao: string;
  raw: string;
  fetchedAt: string;
}

export async function fetchMetar(icao: string): Promise<LiveMetar | null> {
  try {
    const res = await fetch(
      `${AWC_BASE}/metar?ids=${icao.toUpperCase()}&format=raw`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    if (!text || text.startsWith("No")) return null;
    return {
      icao: icao.toUpperCase(),
      raw: text,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchTaf(icao: string): Promise<LiveTaf | null> {
  try {
    const res = await fetch(
      `${AWC_BASE}/taf?ids=${icao.toUpperCase()}&format=raw`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    if (!text || text.startsWith("No")) return null;
    // TAF can be multi-line — join into single block
    return {
      icao: icao.toUpperCase(),
      raw: text,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
