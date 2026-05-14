import { NextResponse } from "next/server";

interface RunwayData {
  le_ident: string;
  he_ident: string;
  length_ft: number;
  width_ft: number;
  le_heading_degT: number | null;
  he_heading_degT: number | null;
  surface: string;
}

const RUNWAYS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/runways.csv";

// In-memory cache: ICAO → RunwayData[]
let cache: Map<string, RunwayData[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

async function loadRunways(): Promise<Map<string, RunwayData[]>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL) return cache;

  const res = await fetch(RUNWAYS_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch runways CSV: ${res.status}`);
  const text = await res.text();

  const lines = text.split("\n");
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  const idx = (name: string) => header.indexOf(name);
  const iAirport = idx("airport_ident");
  const iLeIdent = idx("le_ident");
  const iHeIdent = idx("he_ident");
  const iLength = idx("length_ft");
  const iWidth = idx("width_ft");
  const iLeHdg = idx("le_heading_degT");
  const iHeHdg = idx("he_heading_degT");
  const iSurface = idx("surface");

  const map = new Map<string, RunwayData[]>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (OurAirports uses simple format, no quoted commas in fields we need)
    const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());

    const airport = cols[iAirport];
    if (!airport) continue;

    const rwy: RunwayData = {
      le_ident: cols[iLeIdent] || "",
      he_ident: cols[iHeIdent] || "",
      length_ft: parseInt(cols[iLength]) || 0,
      width_ft: parseInt(cols[iWidth]) || 0,
      le_heading_degT: cols[iLeHdg] ? parseFloat(cols[iLeHdg]) : null,
      he_heading_degT: cols[iHeHdg] ? parseFloat(cols[iHeHdg]) : null,
      surface: cols[iSurface] || "",
    };

    // Skip helipads, closed runways, very short strips
    if (rwy.le_ident.startsWith("H") || rwy.length_ft < 500) continue;

    const list = map.get(airport) || [];
    list.push(rwy);
    map.set(airport, list);
  }

  cache = map;
  cacheTimestamp = Date.now();
  return map;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icao: string }> }
) {
  const { icao } = await params;
  const upperIcao = icao.toUpperCase();

  try {
    const map = await loadRunways();
    const runways = map.get(upperIcao) || [];

    return NextResponse.json(
      { icao: upperIcao, runways },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching runways for ${upperIcao}:`, message);
    return NextResponse.json(
      { error: "Failed to fetch runway data", detail: message },
      { status: 502 }
    );
  }
}
