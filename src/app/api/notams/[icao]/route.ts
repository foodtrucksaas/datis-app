import { NextResponse } from "next/server";
import { fetchNotams } from "@/lib/notams";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ icao: string }> },
) {
  const { icao } = await params;
  const code = icao?.toUpperCase() ?? "";

  if (!/^[A-Z]{4}$/.test(code)) {
    return NextResponse.json([], { status: 400 });
  }

  const notams = await fetchNotams(code);
  return NextResponse.json(notams, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
  });
}
