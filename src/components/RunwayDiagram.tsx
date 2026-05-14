"use client";

import { useEffect, useState } from "react";
import type { AtisRecord } from "@/lib/types";

interface RunwayDiagramProps {
  icao: string;
  atisMessages: AtisRecord[];
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

function parseWind(wind: string): { dir: number; speed: number; gust?: number } | null {
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

/** Convert lat/lon to local x/y in meters relative to center */
function latLonToXY(
  lat: number, lon: number,
  centerLat: number, centerLon: number
): { x: number; y: number } {
  const R = 6371000;
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  return { x: R * dLon * cosLat, y: -R * dLat }; // y inverted for SVG
}

export function RunwayDiagram({ icao, atisMessages }: RunwayDiagramProps) {
  const [runways, setRunways] = useState<RunwayData[]>([]);
  const [loading, setLoading] = useState(true);

  const windStr = atisMessages.find((a) => a.fields.wind && a.fields.wind !== "N/A")?.fields.wind ?? "";
  const wind = parseWind(windStr);

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

  // Check if we have coordinates for at least one runway
  const hasCoords = runways.some((r) => r.le_lat != null && r.le_lon != null && r.he_lat != null && r.he_lon != null);

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Pistes & composantes de vent
      </h3>

      {/* Wind legend */}
      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
        <WindArrowIcon dir={wind.dir} size={20} />
        <span className="font-mono">
          {wind.dir}° / {wind.speed} kt{wind.gust ? ` G${wind.gust}` : ""}
        </span>
      </div>

      {/* Airport plan */}
      {hasCoords && (
        <AirportPlan
          runways={runways}
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
          ].map(({ ident, hdg }) => {
            const comp = windComponents(wind.dir, wind.speed, hdg);
            const isActive = activeRunways.has(ident);
            const isArr = arrRunways.has(ident);
            const isDep = depRunways.has(ident);

            return (
              <ComponentCard
                key={ident}
                rwy={ident}
                comp={comp}
                active={isActive}
                role={isArr && isDep ? "ARR/DEP" : isArr ? "ARR" : isDep ? "DEP" : null}
              />
            );
          });
        })}
      </div>
    </div>
  );
}

/* ─── Airport Plan SVG ─── */

function AirportPlan({
  runways, windDir, activeRunways, arrRunways, depRunways,
}: {
  runways: RunwayData[];
  windDir: number;
  activeRunways: Set<string>;
  arrRunways: Set<string>;
  depRunways: Set<string>;
}) {
  const coords: { lat: number; lon: number }[] = [];
  for (const r of runways) {
    if (r.le_lat != null && r.le_lon != null) coords.push({ lat: r.le_lat, lon: r.le_lon });
    if (r.he_lat != null && r.he_lon != null) coords.push({ lat: r.he_lat, lon: r.he_lon });
  }
  if (coords.length === 0) return null;

  const centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const centerLon = coords.reduce((s, c) => s + c.lon, 0) / coords.length;

  const svgRunways = runways
    .filter((r) => r.le_lat != null && r.le_lon != null && r.he_lat != null && r.he_lon != null)
    .map((r) => {
      const le = latLonToXY(r.le_lat!, r.le_lon!, centerLat, centerLon);
      const he = latLonToXY(r.he_lat!, r.he_lon!, centerLat, centerLon);
      const isActiveA = activeRunways.has(r.le_ident);
      const isActiveB = activeRunways.has(r.he_ident);
      return { ...r, le, he, isActiveA, isActiveB, isActive: isActiveA || isActiveB };
    });

  if (svgRunways.length === 0) return null;

  // Compute bounds in meters
  const allPts = svgRunways.flatMap((r) => [r.le, r.he]);
  const minX = Math.min(...allPts.map((p) => p.x));
  const maxX = Math.max(...allPts.map((p) => p.x));
  const minY = Math.min(...allPts.map((p) => p.y));
  const maxY = Math.max(...allPts.map((p) => p.y));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const span = Math.max(rangeX, rangeY);
  const padding = span * 0.3;

  // Normalize to a 0–1000 coordinate system for predictable sizing
  const totalSpan = span + padding * 2;
  const svgSize = 1000;
  const scale = svgSize / totalSpan;
  const offsetX = minX - padding - (totalSpan - rangeX - padding * 2) / 2;
  const offsetY = minY - padding - (totalSpan - rangeY - padding * 2) / 2;

  const toSvg = (pt: { x: number; y: number }) => ({
    x: (pt.x - offsetX) * scale,
    y: (pt.y - offsetY) * scale,
  });

  // Unit size relative to SVG (for strokes, fonts, etc.)
  const u = svgSize / 100; // 1u = 1% of svg

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="w-full max-w-lg"
        style={{ aspectRatio: "1" }}
      >
        {/* Wind arrow top-right */}
        <g transform={`translate(${svgSize - u * 8}, ${u * 8})`}>
          <g transform={`rotate(${windDir + 180})`}>
            <line x1="0" y1={-u * 4} x2="0" y2={u * 4} stroke="var(--accent)" strokeWidth={u * 0.5} strokeLinecap="round" />
            <polygon points={`0,${-u * 4.5} ${-u * 1.2},${-u * 3} ${u * 1.2},${-u * 3}`} fill="var(--accent)" />
          </g>
          <text
            x={0} y={u * 7}
            textAnchor="middle"
            fontSize={u * 1.2}
            fontFamily="var(--font-mono), monospace"
            fill="var(--text-muted)"
          >
            WIND
          </text>
        </g>

        {/* North indicator top-left */}
        <g transform={`translate(${u * 6}, ${u * 6})`}>
          <line x1="0" y1={u * 2} x2="0" y2={-u * 3} stroke="var(--text-muted)" strokeWidth={u * 0.3} strokeLinecap="round" />
          <polygon points={`0,${-u * 3.5} ${-u * 0.8},${-u * 2} ${u * 0.8},${-u * 2}`} fill="var(--text-muted)" />
          <text
            x={0} y={-u * 4.5}
            textAnchor="middle"
            fontSize={u * 1.5}
            fontWeight="700"
            fontFamily="var(--font-mono), monospace"
            fill="var(--text-muted)"
          >
            N
          </text>
        </g>

        {/* Runways */}
        {svgRunways.map((r) => {
          const a = toSvg(r.le);
          const b = toSvg(r.he);
          const rwyWidth = Math.max(u * 0.8, r.width_ft * 0.3048 * scale * 0.6);
          const color = r.isActive ? "var(--text-primary)" : "var(--text-muted)";
          const opacity = r.isActive ? 0.7 : 0.25;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux2 = dx / len;
          const uy = dy / len;
          const labelDist = u * 4;

          return (
            <g key={`${r.le_ident}-${r.he_ident}`}>
              {/* Runway surface */}
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color}
                strokeWidth={rwyWidth}
                strokeLinecap="butt"
                opacity={opacity}
              />

              {/* Center line */}
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--bg)"
                strokeWidth={u * 0.15}
                strokeDasharray={`${u * 0.8} ${u * 0.5}`}
                opacity={0.5}
              />

              {/* Threshold marks */}
              {[
                { pt: a, active: r.isActiveA },
                { pt: b, active: r.isActiveB },
              ].map((t, i) => {
                const nx = -uy;
                const ny2 = ux2;
                const hw = rwyWidth / 2;
                return (
                  <line
                    key={i}
                    x1={t.pt.x + nx * hw} y1={t.pt.y + ny2 * hw}
                    x2={t.pt.x - nx * hw} y2={t.pt.y - ny2 * hw}
                    stroke={t.active ? "var(--fresh)" : "var(--text-muted)"}
                    strokeWidth={u * 0.4}
                    opacity={t.active ? 1 : 0.4}
                  />
                );
              })}

              {/* Designator labels */}
              {[
                { pt: a, dir: -1, ident: r.le_ident, active: r.isActiveA },
                { pt: b, dir: 1, ident: r.he_ident, active: r.isActiveB },
              ].map((label) => {
                const lx = label.pt.x - ux2 * labelDist * label.dir;
                const ly = label.pt.y - uy * labelDist * label.dir;
                const role = getRoleTag(label.ident, arrRunways, depRunways);
                return (
                  <g key={label.ident}>
                    <text
                      x={lx} y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={u * 1.8}
                      fontWeight="700"
                      fontFamily="var(--font-mono), monospace"
                      fill={label.active ? "var(--fresh)" : "var(--text-muted)"}
                    >
                      {label.ident}
                    </text>
                    {role && (
                      <text
                        x={lx} y={ly + u * 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={u * 1.1}
                        fontWeight="700"
                        fontFamily="var(--font-mono), monospace"
                        fill="var(--accent)"
                      >
                        {role}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Dimensions */}
              <text
                x={(a.x + b.x) / 2 + (-uy) * (rwyWidth / 2 + u * 2)}
                y={(a.y + b.y) / 2 + ux2 * (rwyWidth / 2 + u * 2)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={u * 1}
                fontFamily="var(--font-mono), monospace"
                fill="var(--text-muted)"
                opacity="0.5"
              >
                {ftToM(r.length_ft)}m
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getRoleTag(ident: string, arrRunways: Set<string>, depRunways: Set<string>): string | null {
  const isArr = arrRunways.has(ident);
  const isDep = depRunways.has(ident);
  if (isArr && isDep) return "ARR/DEP";
  if (isArr) return "ARR";
  if (isDep) return "DEP";
  return null;
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

function WindArrowIcon({ dir, size = 20 }: { dir: number; size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: `rotate(${dir + 180}deg)` }}
    >
      <path
        d="M12 2L12 22M12 2L7 8M12 2L17 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
