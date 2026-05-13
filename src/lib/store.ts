/**
 * Abstraction layer for data access.
 *
 * Phase 1: reads from mock data + localStorage.
 * Phase 2: replace internals with Supabase calls — no component changes needed.
 */

import type {
  AirportData,
  AtisRecord,
  Favorite,
  RecentLookup,
  UserSettings,
} from "./types";
import { findAirport } from "./airports";
import { getMockAtis, getMockMetar, getMockTaf } from "./mock-data";

const STORAGE_KEYS = {
  favorites: "atis-eu:favorites",
  recents: "atis-eu:recents",
  settings: "atis-eu:settings",
} as const;

// ---------------------------------------------------------------------------
// Airport data — live API with mock fallback
// ---------------------------------------------------------------------------

export function getAirportData(icao: string): AirportData | null {
  const airport = findAirport(icao);
  if (!airport) return null;

  return {
    airport,
    atis: getMockAtis(icao),
    metar: getMockMetar(icao),
    taf: getMockTaf(icao),
  };
}

/** Live ATIS response from our API route */
export interface LiveAtisResponse {
  icao: string;
  airport: { icao: string; name: string; city: string; country: string } | null;
  messages: Array<{
    icao: string;
    type: "ARR" | "DEP";
    letter: string;
    body: string;
    timestamp: string;
    raw: string;
  }>;
  metar: { icao: string; raw: string; fetchedAt: string } | null;
  taf: { icao: string; raw: string; fetchedAt: string } | null;
  fetchedAt: string;
  error?: string;
}

/**
 * Fetch live ATIS data from our Next.js API route.
 * Returns null on network error.
 */
export async function fetchLiveAtis(icao: string): Promise<LiveAtisResponse | null> {
  try {
    const res = await fetch(`/api/atis/${icao.toUpperCase()}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Convert a live API ATIS message into our AtisRecord domain type.
 * Extracts key fields from the raw ATIS body text.
 */
export function liveMessageToAtisRecord(
  msg: LiveAtisResponse["messages"][0]
): AtisRecord {
  const body = msg.body;

  // Extract runways — handles many formats:
  // "ARR RWY 27L AND 26L", "RWY IN USE 22L", "LANDING RWY 09R", "DEP RWY 27L"
  const rwyInUseMatch = body.match(/RWY\s+IN\s+USE\s*([\w\s\/]+?)(?=\s*\n|\s*$)/im);
  const arrRwyMatch =
    body.match(/(?:LANDING|ARR(?:IVAL)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]DEP|\s+SID|\s*\n|\s*$)/i) ||
    (msg.type === "ARR" ? rwyInUseMatch : null);
  const depRwyMatch =
    body.match(/(?:[\/\s]DEP(?:ARTURE)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]ARR|\s+SID|\s*[\/]|\s*\n|\s*$)/i) ||
    body.match(/(?:DEP(?:ARTURE)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]ARR|\s+SID|\s*[\/]|\s*\n|\s*$)/i) ||
    (msg.type === "DEP" ? rwyInUseMatch : null);

  // Extract wind — handles "WIND 250/07 KT", "WIND 150 4 KT", "25007KT", "250/07KT"
  const windMatch =
    body.match(/WIND\s+(\d{3})\s*[\/]?\s*(\d{1,3})\s*(G\s*(\d{1,3}))?\s*KT/i) ||
    body.match(/(\d{3})(\d{2,3})(G(\d{2,3}))?KT/);

  // Extract QNH — handles "QNH 1005", "Q1005", "QNH 998" (3 or 4 digits)
  const qnhMatch = body.match(/QNH\s*(\d{3,4})/i) || body.match(/Q(\d{4})/i);

  // Extract visibility — handles "CAVOK", "VIS 10KM", "VIS 8000", "9999"
  // Exclude raw 4-digit fallback — too many false positives (RSCD timestamps, codes)
  let visibility = "N/A";
  if (/CAVOK/i.test(body)) {
    visibility = "CAVOK";
  } else {
    const visKmMatch = body.match(/VIS\s+(\d+)\s*KM/i);
    const visMetersMatch = body.match(/VIS\s+(\d{4})/i);
    if (visKmMatch) {
      visibility = `${visKmMatch[1]} km`;
    } else if (visMetersMatch) {
      const m = parseInt(visMetersMatch[1]);
      visibility = m === 9999 ? "10 km+" : `${m} m`;
    }
  }

  // Extract transition level
  const tlMatch = body.match(/(?:TRANSITION[- ]?LEVEL|TRL?)\s*:?\s*(FL\s*\d+|\d+)/i);

  // Extract temperature — handles "T+10 DP+05", "T10/DP5", "M10/05", "10/05"
  const tempAtisFmt = body.match(/T\s*([+-]?\d{1,2})\s+DP\s*([+-]?\d{1,2})/i);
  const tempMetarFmt = body.match(/(?:^|\s)(M?\d{2})\/(M?\d{2})(?:\s|$)/m);
  const tempMatch = tempAtisFmt || tempMetarFmt;

  // Extract emission time from body
  const timeMatch = body.match(/(\d{4})Z/);

  const parseTemp = (s: string): number | null => {
    if (!s) return null;
    const cleaned = s.replace(/^\+/, "");
    if (cleaned.startsWith("M")) return -parseInt(cleaned.slice(1));
    return parseInt(cleaned);
  };

  const parseRunways = (s: string | undefined): string[] => {
    if (!s) return [];
    return s.split(/(?:\s+AND\s+|[\/,\s]+)/i).filter(r => /^\d{2}[LRC]?$/.test(r));
  };

  let windStr = "N/A";
  if (windMatch) {
    const dir = windMatch[1];
    const spd = windMatch[2];
    const gust = windMatch[4];
    windStr = `${dir}°/${parseInt(spd)} kt${gust ? ` G${parseInt(gust)}` : ""}`;
  }

  return {
    icao: msg.icao,
    raw: msg.raw.replace(/\t/g, " ").replace(/\r/g, ""),
    fields: {
      letter: msg.letter,
      type: msg.type,
      arrivalRunways: parseRunways(arrRwyMatch?.[1]),
      departureRunways: parseRunways(depRwyMatch?.[1]),
      wind: windStr,
      qnh: qnhMatch ? parseInt(qnhMatch[1]) : 0,
      visibility,
      transitionLevel: tlMatch
        ? (() => {
            const raw = tlMatch[1].replace(/\s/g, "").toUpperCase();
            return raw.startsWith("FL") ? raw : `FL${raw.padStart(3, "0")}`;
          })()
        : "N/A",
      temperature: tempMatch ? parseTemp(tempMatch[1]) : null,
      dewpoint: tempMatch ? parseTemp(tempMatch[2]) : null,
      remarks: null,
    },
    receivedAt: msg.timestamp,
    emittedAt: timeMatch
      ? new Date(new Date(msg.timestamp).toISOString().slice(0, 11) + timeMatch[1].slice(0, 2) + ":" + timeMatch[1].slice(2) + ":00Z").toISOString()
      : msg.timestamp,
  };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: UserSettings = {
  disclaimerAccepted: false,
  weatherDisplayMode: "raw",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings(): UserSettings {
  return readJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function updateSettings(partial: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const next = { ...current, ...partial };
  writeJson(STORAGE_KEYS.settings, next);
  return next;
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function getFavorites(): Favorite[] {
  return readJson<Favorite[]>(STORAGE_KEYS.favorites, []);
}

export function addFavorite(icao: string): Favorite[] {
  const favs = getFavorites().filter((f) => f.icao !== icao.toUpperCase());
  favs.unshift({ icao: icao.toUpperCase(), addedAt: new Date().toISOString() });
  writeJson(STORAGE_KEYS.favorites, favs);
  return favs;
}

export function removeFavorite(icao: string): Favorite[] {
  const favs = getFavorites().filter((f) => f.icao !== icao.toUpperCase());
  writeJson(STORAGE_KEYS.favorites, favs);
  return favs;
}

export function isFavorite(icao: string): boolean {
  return getFavorites().some((f) => f.icao === icao.toUpperCase());
}

// ---------------------------------------------------------------------------
// Recents
// ---------------------------------------------------------------------------

const MAX_RECENTS = 10;

export function getRecents(): RecentLookup[] {
  return readJson<RecentLookup[]>(STORAGE_KEYS.recents, []);
}

export function addRecent(icao: string): RecentLookup[] {
  const recents = getRecents().filter((r) => r.icao !== icao.toUpperCase());
  recents.unshift({ icao: icao.toUpperCase(), viewedAt: new Date().toISOString() });
  const trimmed = recents.slice(0, MAX_RECENTS);
  writeJson(STORAGE_KEYS.recents, trimmed);
  return trimmed;
}
