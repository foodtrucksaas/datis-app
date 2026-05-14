import { NextResponse } from "next/server";

interface RunwayData {
  le_ident: string;
  he_ident: string;
  length_ft: number;
  width_ft: number;
  le_heading_degT: number | null;
  he_heading_degT: number | null;
  le_lat: number | null;
  le_lon: number | null;
  he_lat: number | null;
  he_lon: number | null;
  surface: string;
}

const RUNWAYS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/runways.csv";

let cache: Map<string, RunwayData[]> | null = null;
let cacheTimestamp = 0; // Reset on deploy
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
  const iLeLat = idx("le_latitude_deg");
  const iLeLon = idx("le_longitude_deg");
  const iHeLat = idx("he_latitude_deg");
  const iHeLon = idx("he_longitude_deg");
  const iSurface = idx("surface");

  const map = new Map<string, RunwayData[]>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

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
      le_lat: cols[iLeLat] ? parseFloat(cols[iLeLat]) : null,
      le_lon: cols[iLeLon] ? parseFloat(cols[iLeLon]) : null,
      he_lat: cols[iHeLat] ? parseFloat(cols[iHeLat]) : null,
      he_lon: cols[iHeLon] ? parseFloat(cols[iHeLon]) : null,
      surface: cols[iSurface] || "",
    };

    // Skip helipads (H1, 08H, etc.), closed runways, very short strips
    if (/H/i.test(rwy.le_ident) || /H/i.test(rwy.he_ident) || rwy.length_ft < 1500) continue;

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
