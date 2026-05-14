"use client";

import { useEffect, useState } from "react";
import type { DatisFields } from "@/lib/datis-parser";
import type { WindInput } from "@/lib/wind-components";
import {
  windComponents,
  formatHeadwind,
  formatCrosswind,
  headwindColor,
  crosswindColor,
} from "@/lib/wind-components";

interface RunwayData {
  le_ident: string;
  he_ident: string;
  le_heading_degT: number | null;
  he_heading_degT: number | null;
}

interface WindComponentsStripProps {
  icao: string;
  allFields: DatisFields[];
  metarRaw?: string;
}

function parseMetarWind(raw?: string): WindInput | null {
  if (!raw) return null;
  const m = raw.match(/\b(\d{3})(\d{2,3})(G(\d{2,3}))?KT\b/);
  if (m) {
    return {
      direction: parseInt(m[1]),
      speed_kt: parseInt(m[2]),
      gust_kt: m[4] ? parseInt(m[4]) : undefined,
    };
  }
  const vrb = raw.match(/\bVRB(\d{2,3})KT\b/);
  if (vrb) {
    return { direction: "VRB", speed_kt: parseInt(vrb[1]) };
  }
  return null;
}

export function WindComponentsStrip({
  icao,
  allFields,
  metarRaw,
}: WindComponentsStripProps) {
  const [runways, setRunways] = useState<RunwayData[]>([]);

  useEffect(() => {
    fetch(`/api/runways/${icao}`)
      .then((r) => r.json())
      .then((d) => setRunways(d.runways ?? []))
      .catch(() => {});
  }, [icao]);

  // Get wind — prefer METAR, fallback to ATIS
  const metarWind = parseMetarWind(metarRaw);
  const atisWind = allFields.find((f) => f.wind)?.wind ?? null;
  const wind: WindInput | null = metarWind ?? atisWind;
  const windSource = metarWind ? "METAR" : "ATIS";

  if (!wind || runways.length === 0) return null;

  // Collect active runways from all ATIS messages
  const activeSet = new Map<string, "ARR" | "DEP" | "ARR+DEP">();
  for (const f of allFields) {
    for (const r of f.arrivalRunways) {
      const existing = activeSet.get(r);
      activeSet.set(r, existing === "DEP" ? "ARR+DEP" : "ARR");
    }
    for (const r of f.departureRunways) {
      const existing = activeSet.get(r);
      activeSet.set(r, existing === "ARR" ? "ARR+DEP" : "DEP");
    }
  }

  // Calculate components for active runways
  const components = Array.from(activeSet.entries())
    .map(([designator, role]) => {
      // Find runway heading from OurAirports data
      for (const rwy of runways) {
        if (rwy.le_ident === designator && rwy.le_heading_degT != null) {
          return windComponents(wind, designator, rwy.le_heading_degT, role);
        }
        if (rwy.he_ident === designator && rwy.he_heading_degT != null) {
          return windComponents(wind, designator, rwy.he_heading_degT, role);
        }
      }
      // Fallback: estimate heading from designator
      const num = parseInt(designator);
      if (!isNaN(num)) {
        return windComponents(wind, designator, num * 10, role);
      }
      return null;
    })
    .filter(Boolean);

  if (components.length === 0) return null;

  return (
    <div className="mx-3.5 rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Composantes vent · Pistes actives
        </span>
        <span className="font-mono text-[9px] text-[var(--text-muted)]">
          source · {windSource}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {components.map((c) => {
          if (!c) return null;
          const roleLabel =
            c.role === "ARR+DEP" ? "ARR+DEP" : c.role ?? "";
          return (
            <div
              key={c.runway}
              className="rounded-[5px] border-[0.5px] border-[var(--border)] bg-[var(--bg)] py-1.5 pl-2.5 pr-2"
              style={{ borderLeft: "2px solid var(--accent)" }}
            >
              <p className="font-mono text-[12px] font-medium text-[var(--text-primary)]">
                {c.runway}
                {roleLabel && (
                  <span className="ml-1.5 text-[9px] font-bold text-[var(--text-muted)]">
                    {roleLabel}
                  </span>
                )}
              </p>
              <p className="mt-0.5 font-mono text-[10px]">
                <span style={{ color: headwindColor(c.headwind_kt) }}>
                  {formatHeadwind(c.headwind_kt)}
                </span>
                <span className="mx-1 text-[var(--text-muted)]">·</span>
                <span style={{ color: crosswindColor(c.crosswind_kt) }}>
                  {formatCrosswind(c.crosswind_kt)}
                </span>
                {c.gustHeadwind_kt !== undefined && (
                  <>
                    <span className="mx-1 text-[var(--text-muted)]">·</span>
                    <span className="text-[var(--warm)]">
                      raf {Math.abs(c.gustCrosswind_kt ?? 0) > Math.abs(c.gustHeadwind_kt) ? Math.abs(c.gustCrosswind_kt!) : Math.abs(c.gustHeadwind_kt)}
                    </span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
