/**
 * Fallback D-ATIS source: scrape atis.guru HTML.
 * Used when airframes.io doesn't have ATIS for a given airport.
 */

import type { ParsedAtisMessage } from "./airframes";

const GURU_BASE = "https://atis.guru/atis";
const FETCH_TIMEOUT_MS = 8_000;

/**
 * Fetch ATIS messages from atis.guru by parsing their server-rendered HTML.
 * Returns parsed messages (ARR and/or DEP) or empty array on failure.
 */
export async function fetchAtisFromGuru(icao: string): Promise<ParsedAtisMessage[]> {
  const upper = icao.toUpperCase();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(`${GURU_BASE}/${upper}`, {
      signal: controller.signal,
      headers: { "User-Agent": "ATIS-EU/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();

    // Extract ATIS blocks from Blazor server-rendered HTML
    const blocks = html.match(/<div class="atis">([\s\S]*?)<\/div>/g);
    if (!blocks) return [];

    const results: ParsedAtisMessage[] = [];

    for (const block of blocks) {
      const inner = block
        .replace(/<div class="atis">/, "")
        .replace(/<\/div>/, "")
        .replace(/&#xA;/g, "\n")
        .replace(/&#xD;/g, "")
        .trim();

      // Match ATIS pattern: ICAO ARR|DEP ATIS LETTER
      const match = inner.match(/^([A-Z]{4})\s+(ARR|DEP)\s+ATIS\s+([A-Z])/);
      if (!match || match[1] !== upper) continue;

      const type = match[2] as "ARR" | "DEP";
      const letter = match[3];
      const body = inner.slice(match[0].length).trim();

      results.push({
        icao: upper,
        type,
        letter,
        body,
        timestamp: new Date().toISOString(),
        raw: inner,
      });
    }

    return results;
  } catch {
    return [];
  }
}
