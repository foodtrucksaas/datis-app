"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AtisRecord } from "@/lib/types";
import { FreshnessBadge } from "./FreshnessBadge";
import { MetricTile } from "./MetricTile";

interface AtisCardProps {
  atis: AtisRecord;
}

function formatUtcTime(isoDate: string): string {
  const d = new Date(isoDate);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}${mm}Z`;
}

function visibilityColor(vis: string): string | undefined {
  if (vis === "CAVOK") return "var(--fresh)";
  const match = vis.match(/^(\d+)/);
  if (match) {
    const meters = parseInt(match[1]);
    if (meters < 1500) return "var(--stale)";
    if (meters < 5000) return "var(--warm)";
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

  return (
    <div className="mx-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      {/* Letter */}
      <div className="text-center">
        <p className="font-mono text-5xl font-bold tracking-wider text-[var(--accent)]">
          {fields.type ? `${fields.type} ` : ""}INFO {fields.letter}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <FreshnessBadge receivedAt={atis.receivedAt} />
          <span className="text-sm text-[var(--text-muted)]">·</span>
          <span className="font-mono text-sm text-[var(--text-secondary)]">
            {formatUtcTime(atis.emittedAt)}
          </span>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <MetricTile
          label="Arrivée"
          value={fields.arrivalRunways.join(" · ")}
        />
        <MetricTile
          label="Vent"
          value={fields.wind}
          valueColor={windColor(fields.wind)}
        />
        <MetricTile label="QNH" value={`${fields.qnh} hPa`} />
        <MetricTile
          label="Visibilité"
          value={fields.visibility}
          valueColor={visibilityColor(fields.visibility)}
        />
      </div>

      {/* Secondary info */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-[var(--text-muted)]">
        <span>
          DEP {fields.departureRunways.join(" · ")}
        </span>
        <span>TRL {fields.transitionLevel}</span>
        {fields.temperature !== null && fields.dewpoint !== null && (
          <span>
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
