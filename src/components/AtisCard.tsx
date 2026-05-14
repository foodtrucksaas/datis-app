"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AtisRecord } from "@/lib/types";
import { FreshnessBadge } from "./FreshnessBadge";
import { MetricTile } from "./MetricTile";

interface AtisCardProps {
  atis: AtisRecord;
}

function visibilityColor(vis: string): string | undefined {
  if (vis === "CAVOK") return "var(--fresh)";
  const match = vis.match(/^(\d+)/);
  if (match) {
    const meters = parseInt(match[1]);
    if (meters < 1500) return "#C026D3"; // LIFR — magenta
    if (meters < 5000) return "var(--stale)"; // IFR — red
    if (meters < 8000) return "var(--accent)"; // MVFR — blue
    return "var(--fresh)"; // VFR — green
  }
  return undefined;
}

function windColor(wind: string): string | undefined {
  if (wind.includes("G")) {
    const gustMatch = wind.match(/G(\d+)/);
    if (gustMatch && parseInt(gustMatch[1]) >= 30) return "var(--stale)";
    return "var(--warm)";
  }
  const ktMatch = wind.match(/\/(\d+)\s*kt/i);
  if (ktMatch && parseInt(ktMatch[1]) >= 25) return "var(--warm)";
  return undefined;
}

export function AtisCard({ atis }: AtisCardProps) {
  const [remarksOpen, setRemarksOpen] = useState(false);
  const { fields } = atis;
  const isDep = fields.type === "DEP";
  const primaryRunways = isDep ? fields.departureRunways : fields.arrivalRunways;
  const secondaryRunways = isDep ? fields.arrivalRunways : fields.departureRunways;

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      {/* Hero letter */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--accent)]/40 bg-[var(--accent)]/8">
          <span className="font-mono text-4xl font-bold text-[var(--accent)]">
            {fields.letter}
          </span>
        </div>
        {fields.type && (
          <span className="rounded-full bg-[var(--accent)]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
            {fields.type === "ARR" ? "Arrival" : "Departure"}
          </span>
        )}
        <FreshnessBadge receivedAt={atis.receivedAt} />
      </div>

      {/* 2x2 grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <MetricTile
          label={isDep ? "Départ" : "Arrivée"}
          value={primaryRunways.join(" · ")}
        />
        <MetricTile
          label="Vent"
          value={fields.wind}
          valueColor={windColor(fields.wind)}
        />
        <MetricTile label="QNH" value={fields.qnh ? `${fields.qnh} hPa` : "N/A"} />
        <MetricTile
          label="Visibilité"
          value={fields.visibility}
          valueColor={visibilityColor(fields.visibility)}
        />
      </div>

      {/* Secondary info pills */}
      <div className="mt-3 flex flex-wrap gap-1.5 px-1">
        {secondaryRunways.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-muted)]">{isDep ? "ARR" : "DEP"}</span>
            {secondaryRunways.join(" · ")}
          </span>
        )}
        {fields.transitionLevel !== "N/A" && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-muted)]">TRL</span>
            {fields.transitionLevel}
          </span>
        )}
        {fields.temperature !== null && fields.dewpoint !== null && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-muted)]">TEMP</span>
            {fields.temperature}°C / {fields.dewpoint}°C
          </span>
        )}
      </div>

      {/* Remarks */}
      {fields.remarks && (
        <button
          onClick={() => setRemarksOpen(!remarksOpen)}
          className="mt-3 flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {remarksOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Remarks / NOTAMs
        </button>
      )}
      {remarksOpen && fields.remarks && (
        <div className="mt-1 rounded bg-[var(--mono-bg)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
          {fields.remarks}
        </div>
      )}
    </div>
  );
}
