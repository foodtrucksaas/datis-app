/**
 * Airframes.io API client.
 * Fetches D-ATIS messages, parses them, and maintains a server-side cache
 * that accumulates over time for better coverage.
 * Runs server-side only (uses AIRFRAMES_API_KEY env var).
 */

const API_BASE = "https://api.airframes.io";
const PAGES_TO_FETCH = 10; // 10 × 100 = 1000 messages per scan
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // discard entries older than 6h

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
// In-memory cache — survives across requests within the same server instance.
// Key: "ICAO_TYPE" (e.g. "EGLL_ARR"), Value: most recent ParsedAtisMessage
// ---------------------------------------------------------------------------
const atisCache = new Map<string, ParsedAtisMessage>();
let lastScanAt = 0;
const MIN_SCAN_INTERVAL_MS = 60_000; // don't re-scan more than once per minute

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

/**
 * Parse the TI2 message format:
 * /STATION.TI2/ICAO ARR|DEP ATIS LETTER\n<body>
 */
function parseAtisText(text: string, timestamp: string): ParsedAtisMessage | null {
  const match = text.match(/\/([A-Z]{4})\s+(ARR|DEP)\s+ATIS\s+([A-Z])/);
  if (!match) return null;

  const icao = match[1];
  const type = match[2] as "ARR" | "DEP";
  const letter = match[3];

  // Find the position right after "ATIS X" in the matched portion
  const fullMatch = match[0];
  const matchIndex = text.indexOf(fullMatch);
  const bodyStart = matchIndex + fullMatch.length;
  const body = text.slice(bodyStart).trim();

  const cleaned = body
    .replace(/\t/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[A-F0-9]{4}\s*$/, "") // remove 4-char hex checksum at end
    .trim();

  return { icao, type, letter, body: cleaned, timestamp, raw: text };
}

/** Evict entries older than CACHE_MAX_AGE_MS */
function pruneCache() {
  const cutoff = Date.now() - CACHE_MAX_AGE_MS;
  for (const [key, msg] of atisCache) {
    if (new Date(msg.timestamp).getTime() < cutoff) {
      atisCache.delete(key);
    }
  }
}

/** Ingest a parsed message into the cache if newer than existing entry */
function ingestToCache(msg: ParsedAtisMessage) {
  const key = `${msg.icao}_${msg.type}`;
  const existing = atisCache.get(key);
  if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
    atisCache.set(key, msg);
  }
}

/**
 * Scan the airframes API for recent ATIS messages and populate the cache.
 * Fetches up to PAGES_TO_FETCH pages (1000 messages) in parallel batches.
 */
async function scanAndCache(): Promise<void> {
  const now = Date.now();
  if (now - lastScanAt < MIN_SCAN_INTERVAL_MS) return;
  lastScanAt = now;

  try {
    // Fetch in 2 parallel batches of 5 to avoid hammering the API
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
      if (parsed) ingestToCache(parsed);
    }

    pruneCache();
  } catch (err) {
    console.error("Airframes scan error:", err);
  }
}

/**
 * Fetch recent ATIS messages for a given ICAO code.
 * Triggers a background scan, then returns cached data.
 */
export async function fetchAtisForAirport(icao: string): Promise<ParsedAtisMessage[]> {
  const upperIcao = icao.toUpperCase();

  await scanAndCache();

  const results: ParsedAtisMessage[] = [];
  for (const [key, msg] of atisCache) {
    if (key.startsWith(`${upperIcao}_`)) {
      results.push(msg);
    }
  }

  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return results;
}

/**
 * Get all cached ATIS data (for listing which airports have data).
 */
export async function fetchAllRecentAtis(): Promise<Map<string, ParsedAtisMessage>> {
  await scanAndCache();

  const byAirport = new Map<string, ParsedAtisMessage>();
  for (const msg of atisCache.values()) {
    const existing = byAirport.get(msg.icao);
    if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
      byAirport.set(msg.icao, msg);
    }
  }
  return byAirport;
}

/** Get cache stats (for debugging) */
export function getCacheStats() {
  return {
    entries: atisCache.size,
    airports: new Set([...atisCache.values()].map((m) => m.icao)).size,
    lastScanAt: lastScanAt ? new Date(lastScanAt).toISOString() : null,
  };
}
