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
  surface: string;
}

/** Parse wind string like "220°/9 kt" or "220°/9 kt G15" */
function parseWind(wind: string): { dir: number; speed: number; gust?: number } | null {
  if (!wind || wind === "N/A" || wind.startsWith("VRB")) return null;
  const m = wind.match(/(\d{3})°\/(\d+)\s*kt(?:\s*G(\d+))?/i);
  if (!m) return null;
  return { dir: parseInt(m[1]), speed: parseInt(m[2]), gust: m[3] ? parseInt(m[3]) : undefined };
}

/** Compute headwind and crosswind. Positive headwind = face. */
function windComponents(windDir: number, windSpeed: number, rwyHdg: number) {
  const angle = ((windDir - rwyHdg) * Math.PI) / 180;
  return {
    headwind: Math.round(windSpeed * Math.cos(angle)),
    crosswind: Math.round(windSpeed * Math.sin(angle)),
  };
}

/** Meters to display string */
function ftToM(ft: number): string {
  return `${Math.round(ft * 0.3048)}`;
}

export function RunwayDiagram({ icao, atisMessages }: RunwayDiagramProps) {
  const [runways, setRunways] = useState<RunwayData[]>([]);
  const [loading, setLoading] = useState(true);

  // Collect wind from first ATIS that has one
  const windStr = atisMessages.find((a) => a.fields.wind && a.fields.wind !== "N/A")?.fields.wind ?? "";
  const wind = parseWind(windStr);

  // Collect all active runways from all ATIS messages
  const activeRunways = new Set<string>();
  for (const msg of atisMessages) {
    for (const r of msg.fields.arrivalRunways) activeRunways.add(r);
    for (const r of msg.fields.departureRunways) activeRunways.add(r);
  }

  // Determine which are ARR vs DEP
  const arrRunways = new Set<string>();
  const depRunways = new Set<string>();
  for (const msg of atisMessages) {
    for (const r of msg.fields.arrivalRunways) arrRunways.add(r);
    for (const r of msg.fields.departureRunways) depRunways.add(r);
  }

  useEffect(() => {
    fetch(`/api/runways/${icao}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.runways) setRunways(data.runways);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [icao]);

  if (loading || !wind || runways.length === 0) return null;

  // Find the longest runway to scale others relative to it
  const maxLen = Math.max(...runways.map((r) => r.length_ft));

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Pistes & composantes de vent
      </h3>

      {/* Wind legend */}
      <div className="mb-5 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
        <WindArrow dir={wind.dir} size={20} />
        <span className="font-mono">
          {wind.dir}° / {wind.speed} kt{wind.gust ? ` G${wind.gust}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {runways.map((rwy) => {
          const hdgA = rwy.le_heading_degT ?? parseInt(rwy.le_ident.replace(/[LRC]/g, "")) * 10;
          const hdgB = rwy.he_heading_degT ?? parseInt(rwy.he_ident.replace(/[LRC]/g, "")) * 10;
          const compA = windComponents(wind.dir, wind.speed, hdgA);
          const compB = windComponents(wind.dir, wind.speed, hdgB);
          const isActiveA = activeRunways.has(rwy.le_ident);
          const isActiveB = activeRunways.has(rwy.he_ident);
          const isArr = (id: string) => arrRunways.has(id);
          const isDep = (id: string) => depRunways.has(id);
          const relativeWidth = Math.max(0.5, rwy.length_ft / maxLen);

          return (
            <RunwayStrip
              key={`${rwy.le_ident}-${rwy.he_ident}`}
              rwyA={rwy.le_ident}
              rwyB={rwy.he_ident}
              heading={hdgA}
              windDir={wind.dir}
              length_ft={rwy.length_ft}
              width_ft={rwy.width_ft}
              compA={compA}
              compB={compB}
              isActiveA={isActiveA}
              isActiveB={isActiveB}
              isArrA={isArr(rwy.le_ident)}
              isDepA={isDep(rwy.le_ident)}
              isArrB={isArr(rwy.he_ident)}
              isDepB={isDep(rwy.he_ident)}
              relativeWidth={relativeWidth}
            />
          );
        })}
      </div>
    </div>
  );
}

interface RunwayStripProps {
  rwyA: string;
  rwyB: string;
  heading: number;
  windDir: number;
  length_ft: number;
  width_ft: number;
  compA: { headwind: number; crosswind: number };
  compB: { headwind: number; crosswind: number };
  isActiveA: boolean;
  isActiveB: boolean;
  isArrA: boolean;
  isDepA: boolean;
  isArrB: boolean;
  isDepB: boolean;
  relativeWidth: number;
}

function RunwayStrip({
  rwyA, rwyB, heading, windDir, length_ft, width_ft,
  compA, compB, isActiveA, isActiveB,
  isArrA, isDepA, isArrB, isDepB, relativeWidth,
}: RunwayStripProps) {
  const rotation = heading - 90;
  const barWidth = Math.round(160 * relativeWidth);
  const lengthM = ftToM(length_ft);
  const widthM = ftToM(width_ft);

  function roleTag(id: string, isArr: boolean, isDep: boolean) {
    if (isArr && isDep) return "ARR/DEP";
    if (isArr) return "ARR";
    if (isDep) return "DEP";
    return null;
  }

  const roleA = roleTag(rwyA, isArrA, isDepA);
  const roleB = roleTag(rwyB, isArrB, isDepB);
  const isActive = isActiveA || isActiveB;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Rotated runway */}
      <div className="relative h-36 w-full flex items-center justify-center">
        <div
          className="absolute flex items-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Left designator */}
          <div className="flex flex-col items-center mr-2" style={{ transform: `rotate(${-rotation}deg)` }}>
            <span className={`font-mono text-[11px] font-bold ${
              isActiveA ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
            }`}>
              {rwyA}
            </span>
            {roleA && (
              <span className={`text-[8px] font-bold uppercase tracking-wide ${
                isArrA ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}>
                {roleA}
              </span>
            )}
          </div>

          {/* Runway bar */}
          <div className="relative">
            <div
              className={`h-3 rounded-[2px] ${
                isActive ? "bg-[var(--text-secondary)]" : "bg-[var(--text-muted)]/30"
              }`}
              style={{ width: `${barWidth}px` }}
            >
              {/* Center dashes */}
              <div className="absolute inset-y-0 left-3 right-3 flex items-center">
                <div className="h-px w-full border-t border-dashed border-[var(--bg)]/40" />
              </div>
              {/* Threshold left */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[2px] ${
                isActiveA ? "bg-[var(--fresh)]" : "bg-[var(--text-muted)]/60"
              }`} />
              {/* Threshold right */}
              <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-[2px] ${
                isActiveB ? "bg-[var(--fresh)]" : "bg-[var(--text-muted)]/60"
              }`} />
            </div>

            {/* Dimensions label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap"
              style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }}
            >
              <span className="font-mono text-[9px] text-[var(--text-muted)]">
                {lengthM} x {widthM} m
              </span>
            </div>

            {/* Wind arrow */}
            <div
              className="absolute -top-5 left-1/2"
              style={{ transform: `translateX(-50%) rotate(${windDir - heading}deg)` }}
            >
              <WindArrow dir={0} size={14} color="var(--accent)" />
            </div>
          </div>

          {/* Right designator */}
          <div className="flex flex-col items-center ml-2" style={{ transform: `rotate(${-rotation}deg)` }}>
            <span className={`font-mono text-[11px] font-bold ${
              isActiveB ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
            }`}>
              {rwyB}
            </span>
            {roleB && (
              <span className={`text-[8px] font-bold uppercase tracking-wide ${
                isArrB ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}>
                {roleB}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wind components */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        <ComponentCard rwy={rwyA} comp={compA} active={isActiveA} />
        <ComponentCard rwy={rwyB} comp={compB} active={isActiveB} />
      </div>
    </div>
  );
}

function ComponentCard({ rwy, comp, active }: {
  rwy: string;
  comp: { headwind: number; crosswind: number };
  active: boolean;
}) {
  const { headwind, crosswind } = comp;
  const hwLabel = headwind >= 0 ? "face" : "arrière";
  const xwAbs = Math.abs(crosswind);
  const xwSide = crosswind > 0 ? "dr." : crosswind < 0 ? "ga." : "";
  const hwColor = headwind >= 0 ? "text-[var(--fresh)]" : "text-[var(--stale)]";

  return (
    <div className={`rounded-md border p-2 ${
      active
        ? "border-[var(--fresh)]/30 bg-[var(--fresh)]/5"
        : "border-[var(--border)] bg-[var(--surface-elevated)]"
    }`}>
      <div className={`font-mono text-[10px] font-bold mb-1 ${
        active ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
      }`}>
        {rwy}
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className={`font-mono font-semibold ${hwColor}`}>
          {headwind >= 0 ? "+" : ""}{headwind} kt
        </span>
        <span className="text-[var(--text-muted)]">{hwLabel}</span>
        {xwAbs > 0 && (
          <>
            <span className="text-[var(--border)]">|</span>
            <span className="font-mono font-semibold text-[var(--text-secondary)]">
              {xwAbs} kt
            </span>
            <span className="text-[var(--text-muted)]">{xwSide}</span>
          </>
        )}
      </div>
    </div>
  );
}

function WindArrow({ dir, size = 20, color = "currentColor" }: { dir: number; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: `rotate(${dir + 180}deg)` }}
    >
      <path
        d="M12 2L12 22M12 2L7 8M12 2L17 8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
