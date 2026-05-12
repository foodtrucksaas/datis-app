import { NextResponse } from "next/server";
import { fetchAtisForAirport } from "@/lib/airframes";
import { findAirport } from "@/lib/airports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icao: string }> }
) {
  const { icao } = await params;
  const upperIcao = icao.toUpperCase();

  const airport = findAirport(upperIcao);

  try {
    const messages = await fetchAtisForAirport(upperIcao);

    return NextResponse.json({
      icao: upperIcao,
      airport: airport ?? null,
      messages,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error fetching ATIS for ${upperIcao}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch ATIS data", icao: upperIcao },
      { status: 502 }
    );
  }
}
