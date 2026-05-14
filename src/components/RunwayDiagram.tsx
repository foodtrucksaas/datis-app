"use client";

import type { AtisFields } from "@/lib/types";

interface RunwayDiagramProps {
  fields: AtisFields;
}

/** Parse wind string like "220°/9 kt" or "220°/9 kt G15" into { dir, speed, gust } */
function parseWind(wind: string): { dir: number; speed: number; gust?: number } | null {
  if (!wind || wind === "N/A" || wind.startsWith("VRB")) return null;
  const m = wind.match(/(\d{3})°\/(\d+)\s*kt(?:\s*G(\d+))?/i);
  if (!m) return null;
  return { dir: parseInt(m[1]), speed: parseInt(m[2]), gust: m[3] ? parseInt(m[3]) : undefined };
}

/** Extract runway heading from runway designator like "26L" → 260, "09R" → 90 */
function rwyHeading(rwy: string): number {
  const num = parseInt(rwy.replace(/[LRC]/g, ""));
  return num * 10;
}

/** Get the reciprocal designator */
function reciprocal(rwy: string): string {
  const suffix = rwy.match(/[LRC]$/)?.[0] ?? "";
  const num = parseInt(rwy.replace(/[LRC]/g, ""));
  const recNum = ((num + 18 - 1) % 36) + 1;
  const recSuffix = suffix === "L" ? "R" : suffix === "R" ? "L" : suffix;
  return String(recNum).padStart(2, "0") + recSuffix;
}

/** Compute headwind and crosswind components. Positive headwind = favorable. */
function windComponents(windDir: number, windSpeed: number, rwyHdg: number) {
  const angle = ((windDir - rwyHdg) * Math.PI) / 180;
  const headwind = Math.round(windSpeed * Math.cos(angle));
  const crosswind = Math.round(windSpeed * Math.sin(angle));
  return { headwind, crosswind };
}

/** Deduplicate runway pairs — e.g. if we have 26L and 08R, they're the same physical strip */
function getUniqueStrips(runways: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rwy of runways) {
    const rec = reciprocal(rwy);
    const key = [rwy, rec].sort().join("-");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(rwy);
    }
  }
  return result;
}

export function RunwayDiagram({ fields }: RunwayDiagramProps) {
  const wind = parseWind(fields.wind);
  const allRunways = [...fields.arrivalRunways, ...fields.departureRunways];
  const strips = getUniqueStrips(allRunways);

  if (strips.length === 0 || !wind) return null;

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Composantes de vent
      </h3>

      {/* Wind arrow legend */}
      <div className="mb-5 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
        <WindArrow dir={wind.dir} size={20} />
        <span className="font-mono">
          {wind.dir}° / {wind.speed} kt{wind.gust ? ` G${wind.gust}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {strips.map((rwy) => {
          const hdg = rwyHeading(rwy);
          const rec = reciprocal(rwy);
          const comp = windComponents(wind.dir, wind.speed, hdg);
          const compRec = windComponents(wind.dir, wind.speed, rwyHeading(rec));

          return (
            <RunwayStrip
              key={rwy}
              rwyA={rwy}
              rwyB={rec}
              heading={hdg}
              windDir={wind.dir}
              compA={comp}
              compB={compRec}
              activeRunways={allRunways}
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
  compA: { headwind: number; crosswind: number };
  compB: { headwind: number; crosswind: number };
  activeRunways: string[];
}

function RunwayStrip({ rwyA, rwyB, heading, windDir, compA, compB, activeRunways }: RunwayStripProps) {
  const rotation = heading - 90; // CSS rotation (0° = East, runway 09 = East)
  const isActiveA = activeRunways.includes(rwyA);
  const isActiveB = activeRunways.includes(rwyB);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Rotated runway visualization */}
      <div className="relative h-32 w-full flex items-center justify-center">
        <div
          className="absolute flex items-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Left designator */}
          <span
            className={`font-mono text-[11px] font-bold mr-2 ${
              isActiveA ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
            }`}
            style={{ transform: `rotate(${-rotation}deg)` }}
          >
            {rwyA}
          </span>

          {/* Runway bar */}
          <div className="relative">
            <div className={`h-2.5 w-40 rounded-sm ${
              isActiveA || isActiveB
                ? "bg-[var(--text-secondary)]"
                : "bg-[var(--text-muted)]/40"
            }`}>
              {/* Center line dashes */}
              <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-center">
                <div className="h-px w-full border-t border-dashed border-[var(--bg)]/50" />
              </div>
              {/* Threshold markers */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-sm ${
                isActiveA ? "bg-[var(--fresh)]" : "bg-[var(--text-muted)]"
              }`} />
              <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-sm ${
                isActiveB ? "bg-[var(--fresh)]" : "bg-[var(--text-muted)]"
              }`} />
            </div>

            {/* Wind arrow on runway */}
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2"
              style={{ transform: `translateX(-50%) rotate(${windDir - heading}deg)` }}
            >
              <WindArrow dir={0} size={16} color="var(--accent)" />
            </div>
          </div>

          {/* Right designator */}
          <span
            className={`font-mono text-[11px] font-bold ml-2 ${
              isActiveB ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
            }`}
            style={{ transform: `rotate(${-rotation}deg)` }}
          >
            {rwyB}
          </span>
        </div>
      </div>

      {/* Wind components table */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        <ComponentCard
          rwy={rwyA}
          headwind={compA.headwind}
          crosswind={compA.crosswind}
          active={isActiveA}
        />
        <ComponentCard
          rwy={rwyB}
          headwind={compB.headwind}
          crosswind={compB.crosswind}
          active={isActiveB}
        />
      </div>
    </div>
  );
}

interface ComponentCardProps {
  rwy: string;
  headwind: number;
  crosswind: number;
  active: boolean;
}

function ComponentCard({ rwy, headwind, crosswind, active }: ComponentCardProps) {
  const hwLabel = headwind >= 0 ? "Vent de face" : "Vent arrière";
  const hwAbs = Math.abs(headwind);
  const xwSide = crosswind > 0 ? "droite" : crosswind < 0 ? "gauche" : "";
  const xwAbs = Math.abs(crosswind);
  const hwColor = headwind >= 0 ? "text-[var(--fresh)]" : "text-[var(--stale)]";

  return (
    <div className={`rounded-md border p-2.5 text-center ${
      active
        ? "border-[var(--fresh)]/30 bg-[var(--fresh)]/5"
        : "border-[var(--border)] bg-[var(--surface-elevated)]"
    }`}>
      <div className={`font-mono text-xs font-bold mb-1.5 ${
        active ? "text-[var(--fresh)]" : "text-[var(--text-muted)]"
      }`}>
        RWY {rwy}
      </div>
      <div className="space-y-0.5 text-[11px]">
        <div className="flex items-center justify-center gap-1">
          <span className={`font-mono font-semibold ${hwColor}`}>
            {headwind >= 0 ? "+" : ""}{headwind} kt
          </span>
          <span className="text-[var(--text-muted)]">{hwLabel}</span>
        </div>
        {xwAbs > 0 && (
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono font-semibold text-[var(--text-secondary)]">
              {xwAbs} kt
            </span>
            <span className="text-[var(--text-muted)]">traversier {xwSide}</span>
          </div>
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
