"use client";

import { useEffect, useState } from "react";
import type { AtisRecord } from "@/lib/types";

interface RunwayDiagramProps {
  icao: string;
  atisMessages: AtisRecord[];
  metarRaw?: string;
}

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

function parseMetarWind(metar: string): { dir: number; speed: number; gust?: number } | null {
  if (!metar) return null;
  const m = metar.match(/\b(\d{3})(\d{2,3})(G(\d{2,3}))?KT\b/);
  if (!m) return null;
  return { dir: parseInt(m[1]), speed: parseInt(m[2]), gust: m[4] ? parseInt(m[4]) : undefined };
}

function parseAtisWind(wind: string): { dir: number; speed: number; gust?: number } | null {
  if (!wind || wind === "N/A" || wind.startsWith("VRB")) return null;
  const m = wind.match(/(\d{3})°\/(\d+)\s*kt(?:\s*G(\d+))?/i);
  if (!m) return null;
  return { dir: parseInt(m[1]), speed: parseInt(m[2]), gust: m[3] ? parseInt(m[3]) : undefined };
}

function windComponents(windDir: number, windSpeed: number, rwyHdg: number) {
  const angle = ((windDir - rwyHdg) * Math.PI) / 180;
  return {
    headwind: Math.round(windSpeed * Math.cos(angle)),
    crosswind: Math.round(windSpeed * Math.sin(angle)),
  };
}

function ftToM(ft: number): number {
  return Math.round(ft * 0.3048);
}

function latLonToXY(lat: number, lon: number, cLat: number, cLon: number) {
  const R = 6371000;
  const dLat = ((lat - cLat) * Math.PI) / 180;
  const dLon = ((lon - cLon) * Math.PI) / 180;
  const cosLat = Math.cos((cLat * Math.PI) / 180);
  return { x: R * dLon * cosLat, y: -R * dLat };
}

function getRoleTag(ident: string, arr: Set<string>, dep: Set<string>): string | null {
  const a = arr.has(ident), d = dep.has(ident);
  return a && d ? "ARR/DEP" : a ? "ARR" : d ? "DEP" : null;
}

export function RunwayDiagram({ icao, atisMessages, metarRaw }: RunwayDiagramProps) {
  const [runways, setRunways] = useState<RunwayData[]>([]);
  const [loading, setLoading] = useState(true);

  const metarWind = parseMetarWind(metarRaw ?? "");
  const atisWind = parseAtisWind(
    atisMessages.find((a) => a.fields.wind && a.fields.wind !== "N/A")?.fields.wind ?? ""
  );
  const wind = metarWind ?? atisWind;
  const windSource = metarWind ? "METAR" : "ATIS";

  const arrRunways = new Set<string>();
  const depRunways = new Set<string>();
  for (const msg of atisMessages) {
    for (const r of msg.fields.arrivalRunways) arrRunways.add(r);
    for (const r of msg.fields.departureRunways) depRunways.add(r);
  }
  const activeRunways = new Set([...arrRunways, ...depRunways]);

  useEffect(() => {
    fetch(`/api/runways/${icao}`)
      .then((r) => r.json())
      .then((data) => { if (data.runways) setRunways(data.runways); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [icao]);

  if (loading || !wind || runways.length === 0) return null;

  const validRunways = runways.filter(
    (r) => r.le_lat != null && r.le_lon != null && r.he_lat != null && r.he_lon != null
  );

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Pistes & composantes de vent
      </h3>

      {/* Wind legend */}
      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
        <WindArrowIcon dir={wind.dir} size={18} />
        <span className="font-mono">
          {wind.dir}° / {wind.speed} kt{wind.gust ? ` G${wind.gust}` : ""}
        </span>
        <span className="text-[var(--text-muted)] text-[10px]">({windSource})</span>
      </div>

      {/* Airport plan */}
      {validRunways.length > 0 && (
        <AirportPlan
          runways={validRunways}
          windDir={wind.dir}
          activeRunways={activeRunways}
          arrRunways={arrRunways}
          depRunways={depRunways}
        />
      )}

      {/* Wind components grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {runways.map((rwy) => {
          const hdgA = rwy.le_heading_degT ?? parseInt(rwy.le_ident.replace(/[LRC]/g, "")) * 10;
          const hdgB = rwy.he_heading_degT ?? parseInt(rwy.he_ident.replace(/[LRC]/g, "")) * 10;
          return [
            { ident: rwy.le_ident, hdg: hdgA },
            { ident: rwy.he_ident, hdg: hdgB },
          ].map(({ ident, hdg }) => (
            <ComponentCard
              key={ident}
              rwy={ident}
              comp={windComponents(wind.dir, wind.speed, hdg)}
              active={activeRunways.has(ident)}
              role={getRoleTag(ident, arrRunways, depRunways)}
            />
          ));
        })}
      </div>
    </div>
  );
}

/* ─── Airport Plan (HTML/CSS based, not SVG) ─── */

function AirportPlan({
  runways, windDir, activeRunways, arrRunways, depRunways,
}: {
  runways: RunwayData[];
  windDir: number;
  activeRunways: Set<string>;
  arrRunways: Set<string>;
  depRunways: Set<string>;
}) {
  // Compute geographic center
  const allCoords: { lat: number; lon: number }[] = [];
  for (const r of runways) {
    allCoords.push({ lat: r.le_lat!, lon: r.le_lon! });
    allCoords.push({ lat: r.he_lat!, lon: r.he_lon! });
  }
  const cLat = allCoords.reduce((s, c) => s + c.lat, 0) / allCoords.length;
  const cLon = allCoords.reduce((s, c) => s + c.lon, 0) / allCoords.length;

  // Convert to local meters
  const rwyData = runways.map((r) => {
    const le = latLonToXY(r.le_lat!, r.le_lon!, cLat, cLon);
    const he = latLonToXY(r.he_lat!, r.he_lon!, cLat, cLon);
    return { ...r, le, he };
  });

  // Compute bounds
  const allPts = rwyData.flatMap((r) => [r.le, r.he]);
  const minX = Math.min(...allPts.map((p) => p.x));
  const maxX = Math.max(...allPts.map((p) => p.x));
  const minY = Math.min(...allPts.map((p) => p.y));
  const maxY = Math.max(...allPts.map((p) => p.y));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Add padding for labels (in meters, proportional to airport size)
  const longestDim = Math.max(rangeX, rangeY);
  const padX = longestDim * 0.2;
  const padY = longestDim * 0.15;

  const totalW = rangeX + padX * 2;
  const totalH = rangeY + padY * 2;

  // SVG dimensions — use actual aspect ratio, cap height
  const svgW = 600;
  const svgH = svgW * (totalH / totalW);
  const scale = svgW / totalW;

  // Transform from meters to SVG coords
  const toX = (x: number) => (x - minX + padX) * scale;
  const toY = (y: number) => (y - minY + padY) * scale;

  // Sizing units relative to the longest runway
  const maxRwyLen = Math.max(...rwyData.map((r) => r.length_ft));
  const maxRwyPx = maxRwyLen * 0.3048 * scale;
  // Runway thickness: proportional but readable
  const rwyThickness = Math.max(8, maxRwyPx * 0.025);
  const fontSize = Math.max(11, maxRwyPx * 0.035);
  const roleSize = fontSize * 0.65;
  const dimSize = fontSize * 0.6;
  const labelGap = fontSize * 1.8;

  return (
    <div className="flex justify-center mb-2 overflow-hidden rounded-md bg-[var(--surface-elevated)] border border-[var(--border)]">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-xl"
        style={{ maxHeight: "320px" }}
      >
        {/* Wind arrow indicator */}
        <g transform={`translate(${svgW - 35}, 35)`}>
          <circle r="22" fill="none" stroke="var(--border)" strokeWidth="1" />
          <g transform={`rotate(${windDir + 180})`}>
            <line x1="0" y1="-15" x2="0" y2="12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="0,-17 -4,-11 4,-11" fill="var(--accent)" />
          </g>
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central"
            fontSize="6" fontWeight="700" fontFamily="var(--font-mono), monospace"
            fill="var(--text-muted)" opacity="0.5">W</text>
        </g>

        {/* Runways */}
        {rwyData.map((r) => {
          const x1 = toX(r.le.x), y1 = toY(r.le.y);
          const x2 = toX(r.he.x), y2 = toY(r.he.y);
          const isActiveA = activeRunways.has(r.le_ident);
          const isActiveB = activeRunways.has(r.he_ident);
          const isActive = isActiveA || isActiveB;

          // Direction vector
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len, uy = dy / len;

          // Label positions — beyond the runway ends
          const leLabel = { x: x1 - ux * labelGap, y: y1 - uy * labelGap };
          const heLabel = { x: x2 + ux * labelGap, y: y2 + uy * labelGap };

          // Dimension label — offset perpendicular
          const nx = -uy, ny = ux;
          const dimOffset = rwyThickness / 2 + dimSize * 1.5;
          const dimPos = {
            x: (x1 + x2) / 2 + nx * dimOffset,
            y: (y1 + y2) / 2 + ny * dimOffset,
          };

          const roleA = getRoleTag(r.le_ident, arrRunways, depRunways);
          const roleB = getRoleTag(r.he_ident, arrRunways, depRunways);

          return (
            <g key={`${r.le_ident}-${r.he_ident}`}>
              {/* Runway surface */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? "var(--text-primary)" : "var(--text-secondary)"}
                strokeWidth={rwyThickness}
                strokeLinecap="butt"
                opacity={isActive ? 0.9 : 0.35}
              />

              {/* Center dashes */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--surface-elevated)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.6}
              />

              {/* Threshold bars */}
              {[
                { px: x1, py: y1, active: isActiveA },
                { px: x2, py: y2, active: isActiveB },
              ].map((t, i) => (
                <line key={i}
                  x1={t.px + nx * rwyThickness * 0.6}
                  y1={t.py + ny * rwyThickness * 0.6}
                  x2={t.px - nx * rwyThickness * 0.6}
                  y2={t.py - ny * rwyThickness * 0.6}
                  stroke={t.active ? "var(--fresh)" : "var(--text-muted)"}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={t.active ? 1 : 0.4}
                />
              ))}

              {/* LE label */}
              <text x={leLabel.x} y={leLabel.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={fontSize} fontWeight="700"
                fontFamily="var(--font-mono), monospace"
                fill={isActiveA ? "var(--fresh)" : "var(--text-muted)"}
              >
                {r.le_ident}
              </text>
              {roleA && (
                <text x={leLabel.x} y={leLabel.y + fontSize * 0.9}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={roleSize} fontWeight="700"
                  fontFamily="var(--font-mono), monospace"
                  fill="var(--accent)"
                >
                  {roleA}
                </text>
              )}

              {/* HE label */}
              <text x={heLabel.x} y={heLabel.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={fontSize} fontWeight="700"
                fontFamily="var(--font-mono), monospace"
                fill={isActiveB ? "var(--fresh)" : "var(--text-muted)"}
              >
                {r.he_ident}
              </text>
              {roleB && (
                <text x={heLabel.x} y={heLabel.y + fontSize * 0.9}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={roleSize} fontWeight="700"
                  fontFamily="var(--font-mono), monospace"
                  fill="var(--accent)"
                >
                  {roleB}
                </text>
              )}

              {/* Dimensions */}
              <text x={dimPos.x} y={dimPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={dimSize}
                fontFamily="var(--font-mono), monospace"
                fill="var(--text-muted)" opacity="0.6"
              >
                {ftToM(r.length_ft)} x {ftToM(r.width_ft)}m
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Wind Component Cards ─── */

function ComponentCard({ rwy, comp, active, role }: {
  rwy: string;
  comp: { headwind: number; crosswind: number };
  active: boolean;
  role: string | null;
}) {
  const { headwind, crosswind } = comp;
  const hwLabel = headwind >= 0 ? "face" : "arr.";
  const xwAbs = Math.abs(crosswind);
  const xwSide = crosswind > 0 ? "dr." : crosswind < 0 ? "ga." : "";
  const hwColor = headwind >= 0 ? "text-[var(--fresh)]" : "text-[var(--stale)]";

  return (
    <div className={`rounded-md border p-2 ${
      active
        ? "border-[var(--fresh)]/30 bg-[var(--fresh)]/5"
        : "border-[var(--border)] bg-[var(--surface-elevated)]"
    }`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`font-mono text-[10px] font-bold ${
          active ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
        }`}>
          {rwy}
        </span>
        {role && (
          <span className="text-[8px] font-bold text-[var(--accent)]">{role}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className={`font-mono font-semibold ${hwColor}`}>
          {headwind >= 0 ? "+" : ""}{headwind} kt
        </span>
        <span className="text-[var(--text-muted)]">{hwLabel}</span>
        {xwAbs > 0 && (
          <>
            <span className="text-[var(--border)]">|</span>
            <span className="font-mono font-semibold text-[var(--text-secondary)]">{xwAbs} kt</span>
            <span className="text-[var(--text-muted)]">{xwSide}</span>
          </>
        )}
      </div>
    </div>
  );
}

function WindArrowIcon({ dir, size = 18 }: { dir: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ transform: `rotate(${dir + 180}deg)` }}>
      <path d="M12 2L12 22M12 2L7 8M12 2L17 8"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
