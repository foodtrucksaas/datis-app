import { NextResponse } from "next/server";
import { fetchAtisForAirport } from "@/lib/airframes";
import { fetchMetar, fetchTaf } from "@/lib/weather";
import { findAirport } from "@/lib/airports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icao: string }> }
) {
  const { icao } = await params;
  const upperIcao = icao.toUpperCase();

  const airport = findAirport(upperIcao);

  try {
    // Fetch ATIS, METAR, TAF in parallel
    const [messages, metar, taf] = await Promise.all([
      fetchAtisForAirport(upperIcao),
      fetchMetar(upperIcao),
      fetchTaf(upperIcao),
    ]);

    return NextResponse.json({
      icao: upperIcao,
      airport: airport ?? null,
      messages,
      metar,
      taf,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching ATIS for ${upperIcao}:`, message);
    return NextResponse.json(
      { error: "Failed to fetch ATIS data", detail: message, icao: upperIcao },
      { status: 502 }
    );
  }
}
