/**
 * Airframes.io API client with Upstash Redis persistent cache.
 * Each ATIS message is stored in Redis with a 12h TTL.
 * Scans are throttled to once per minute.
 */

import { Redis } from "@upstash/redis";

const API_BASE = "https://api.airframes.io";
const PAGES_TO_FETCH = 10;
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 hours
const SCAN_COOLDOWN_MS = 60_000; // 1 min between scans

// ---------------------------------------------------------------------------
// Redis client (lazy init to avoid errors when env vars missing in dev)
// ---------------------------------------------------------------------------
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// In-memory fallback when Redis is not available (local dev without Upstash)
const memoryCache = new Map<string, ParsedAtisMessage>();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AirframesMessage {
  id: number;
  text: string | null;
  timestamp: string;
  label: string | null;
  frequency: number | null;
  source: string | null;
}

export interface ParsedAtisMessage {
  icao: string;
  type: "ARR" | "DEP";
  letter: string;
  body: string;
  timestamp: string;
  raw: string;
}

// ---------------------------------------------------------------------------
// Airframes API
// ---------------------------------------------------------------------------

async function fetchMessages(params: Record<string, string>): Promise<AirframesMessage[]> {
  const key = process.env.AIRFRAMES_API_KEY;
  if (!key) throw new Error("AIRFRAMES_API_KEY not set");

  const url = new URL(`${API_BASE}/messages`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airframes API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function parseAtisText(text: string, timestamp: string): ParsedAtisMessage | null {
  const match = text.match(/\/([A-Z]{4})\s+(ARR|DEP)\s+ATIS\s+([A-Z])/);
  if (!match) return null;

  const icao = match[1];
  const type = match[2] as "ARR" | "DEP";
  const letter = match[3];

  const fullMatch = match[0];
  const matchIndex = text.indexOf(fullMatch);
  const bodyStart = matchIndex + fullMatch.length;
  const body = text
    .slice(bodyStart)
    .trim()
    .replace(/\t/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[A-F0-9]{4}\s*$/, "")
    .trim();

  return { icao, type, letter, body, timestamp, raw: text };
}

// ---------------------------------------------------------------------------
// Cache operations
// ---------------------------------------------------------------------------

/** Redis key format: atis:ICAO:TYPE (e.g. atis:EGLL:ARR) */
function cacheKey(icao: string, type: string): string {
  return `atis:${icao}:${type}`;
}

/** Should we replace existing cached message with the new one? */
function shouldReplace(existing: ParsedAtisMessage, incoming: ParsedAtisMessage): boolean {
  // Different letter = newer ATIS revision, compare by timestamp
  if (existing.letter !== incoming.letter) {
    return new Date(incoming.timestamp) > new Date(existing.timestamp);
  }
  // Same letter = same ATIS, prefer longer body (complete vs truncated)
  if (incoming.body.length > existing.body.length) return true;
  // Same length or shorter, prefer newer
  return new Date(incoming.timestamp) > new Date(existing.timestamp);
}

async function cacheSet(msg: ParsedAtisMessage): Promise<void> {
  const r = getRedis();
  const key = cacheKey(msg.icao, msg.type);

  if (r) {
    const existing = await r.get<ParsedAtisMessage>(key);
    if (existing && !shouldReplace(existing, msg)) return;
    await r.set(key, msg, { ex: CACHE_TTL_SECONDS });
  } else {
    const existing = memoryCache.get(key);
    if (existing && !shouldReplace(existing, msg)) return;
    memoryCache.set(key, msg);
  }
}

async function cacheGetForAirport(icao: string): Promise<ParsedAtisMessage[]> {
  const r = getRedis();
  const upper = icao.toUpperCase();
  const results: ParsedAtisMessage[] = [];

  if (r) {
    // Try both ARR and DEP
    const [arr, dep] = await Promise.all([
      r.get<ParsedAtisMessage>(cacheKey(upper, "ARR")),
      r.get<ParsedAtisMessage>(cacheKey(upper, "DEP")),
    ]);
    if (arr) results.push(arr);
    if (dep) results.push(dep);
  } else {
    const arr = memoryCache.get(cacheKey(upper, "ARR"));
    const dep = memoryCache.get(cacheKey(upper, "DEP"));
    if (arr) results.push(arr);
    if (dep) results.push(dep);
  }

  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return results;
}

// ---------------------------------------------------------------------------
// Scan & ingest
// ---------------------------------------------------------------------------

let lastScanAt = 0;

async function scanAndCache(): Promise<number> {
  const now = Date.now();
  if (now - lastScanAt < SCAN_COOLDOWN_MS) return 0;
  lastScanAt = now;

  let ingested = 0;

  try {
    // Fetch in 2 parallel batches of 5
    const batch1 = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        fetchMessages({ text: "ATIS", limit: "100", offset: String(i * 100) })
      )
    );
    const batch2 = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        fetchMessages({ text: "ATIS", limit: "100", offset: String((i + 5) * 100) })
      )
    );

    const allMessages = [...batch1.flat(), ...batch2.flat()];

    for (const msg of allMessages) {
      if (!msg.text) continue;
      const parsed = parseAtisText(msg.text, msg.timestamp);
      if (parsed) {
        await cacheSet(parsed);
        ingested++;
      }
    }
  } catch (err) {
    console.error("Airframes scan error:", err);
  }

  return ingested;
}

// ---------------------------------------------------------------------------
// Targeted fetch for a specific airport
// ---------------------------------------------------------------------------

const targetedCooldowns = new Map<string, number>();
const TARGETED_COOLDOWN_MS = 60_000;

async function fetchTargetedAtis(icao: string): Promise<number> {
  const upper = icao.toUpperCase();
  const now = Date.now();
  const last = targetedCooldowns.get(upper) ?? 0;
  if (now - last < TARGETED_COOLDOWN_MS) return 0;
  targetedCooldowns.set(upper, now);

  let ingested = 0;

  try {
    // Fetch 500 ATIS messages in parallel (5 pages)
    const batches = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        fetchMessages({ text: "ATIS", limit: "100", offset: String(i * 100) })
      )
    );

    for (const msg of batches.flat()) {
      if (!msg.text) continue;
      const parsed = parseAtisText(msg.text, msg.timestamp);
      if (!parsed) continue;
      await cacheSet(parsed);
      ingested++;
    }
  } catch (err) {
    console.error(`Targeted ATIS fetch error for ${upper}:`, err);
  }
  return ingested;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch ATIS for an airport.
 * 1. Check cache first
 * 2. If empty, do a targeted search on airframes for this specific ICAO
 * 3. Also trigger the broad scan in background (non-blocking)
 */
export async function fetchAtisForAirport(icao: string): Promise<ParsedAtisMessage[]> {
  // Check cache first
  let cached = await cacheGetForAirport(icao);

  // Cache miss — targeted search to find ATIS for this airport
  if (cached.length === 0) {
    await fetchTargetedAtis(icao);
    cached = await cacheGetForAirport(icao);
  }

  // Broad scan in background (non-blocking, respects cooldown)
  scanAndCache().catch(() => {});

  return cached;
}

/**
 * Dedicated scan endpoint — call from Vercel Cron to keep cache warm.
 */
export async function runScan(): Promise<{ ingested: number; scannedAt: string }> {
  const ingested = await scanAndCache();
  return { ingested, scannedAt: new Date().toISOString() };
}
