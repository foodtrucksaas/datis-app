/**
 * Airframes.io API client.
 * Fetches D-ATIS messages and parses them into our domain types.
 * Runs server-side only (uses AIRFRAMES_API_KEY env var).
 */

const API_BASE = "https://api.airframes.io";

interface AirframesMessage {
  id: number;
  text: string | null;
  timestamp: string;
  label: string | null;
  frequency: number | null;
  source: string | null;
}

interface ParsedAtisMessage {
  icao: string;
  type: "ARR" | "DEP";
  letter: string;
  body: string;
  timestamp: string;
  raw: string;
}

async function fetchMessages(params: Record<string, string>): Promise<AirframesMessage[]> {
  const key = process.env.AIRFRAMES_API_KEY;
  if (!key) throw new Error("AIRFRAMES_API_KEY not set");

  const url = new URL(`${API_BASE}/messages`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 60 }, // cache for 60s
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
  // Match: /STATION.TI2/ICAO ARR|DEP ATIS LETTER
  const match = text.match(/\/([A-Z]{4})\s+(ARR|DEP)\s+ATIS\s+([A-Z])/);
  if (!match) return null;

  const icao = match[1];
  const type = match[2] as "ARR" | "DEP";
  const letter = match[3];

  // Extract body (everything after the header line)
  const headerEnd = text.indexOf(letter) + 1;
  const body = text.slice(headerEnd).trim();

  // Clean up: remove tabs, normalize whitespace, remove trailing checksums
  const cleaned = body
    .replace(/\t/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[A-F0-9]{4}$/, "") // remove 4-char hex checksum at end
    .trim();

  return { icao, type, letter, body: cleaned, timestamp, raw: text };
}

/**
 * Fetch recent ATIS messages for a given ICAO code.
 * Returns deduplicated messages, most recent first.
 */
export async function fetchAtisForAirport(icao: string): Promise<ParsedAtisMessage[]> {
  const upperIcao = icao.toUpperCase();

  // Fetch recent ATIS messages — we search broadly and filter client-side
  // because the text search param doesn't support exact ICAO filtering well
  const pages = await Promise.all([
    fetchMessages({ text: "ATIS", limit: "100", offset: "0" }),
    fetchMessages({ text: "ATIS", limit: "100", offset: "100" }),
    fetchMessages({ text: "ATIS", limit: "100", offset: "200" }),
  ]);

  const allMessages = pages.flat();

  const parsed: ParsedAtisMessage[] = [];
  const seen = new Set<string>();

  for (const msg of allMessages) {
    if (!msg.text) continue;

    const atis = parseAtisText(msg.text, msg.timestamp);
    if (!atis || atis.icao !== upperIcao) continue;

    // Deduplicate by letter + type (keep most recent)
    const key = `${atis.type}_${atis.letter}`;
    if (seen.has(key)) continue;
    seen.add(key);

    parsed.push(atis);
  }

  // Sort: most recent first
  parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return parsed;
}

/**
 * Fetch recent ATIS messages for ALL European airports in one go.
 * Useful for the search to know which airports have data.
 */
export async function fetchAllRecentAtis(): Promise<Map<string, ParsedAtisMessage>> {
  const pages = await Promise.all([
    fetchMessages({ text: "ATIS", limit: "100", offset: "0" }),
    fetchMessages({ text: "ATIS", limit: "100", offset: "100" }),
    fetchMessages({ text: "ATIS", limit: "100", offset: "200" }),
  ]);

  const allMessages = pages.flat();
  const byAirport = new Map<string, ParsedAtisMessage>();

  for (const msg of allMessages) {
    if (!msg.text) continue;

    const atis = parseAtisText(msg.text, msg.timestamp);
    if (!atis) continue;

    // Keep only the most recent per airport (ARR preferred over DEP)
    const existing = byAirport.get(atis.icao);
    if (!existing || new Date(atis.timestamp) > new Date(existing.timestamp)) {
      byAirport.set(atis.icao, atis);
    }
  }

  return byAirport;
}
