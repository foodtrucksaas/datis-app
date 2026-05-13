"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface FreshnessBadgeProps {
  receivedAt: string;
}

function getAge(isoDate: string): { minutes: number; label: string } {
  const ms = Date.now() - new Date(isoDate).getTime();
  const totalMin = Math.max(0, Math.round(ms / 60_000));

  if (totalMin < 1) return { minutes: totalMin, label: "à l'instant" };

  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;

  let label = "il y a ";
  if (days > 0) label += `${days}j `;
  if (hours > 0) label += `${hours}h`;
  if (days === 0 && mins > 0) label += `${mins.toString().padStart(2, "0")}min`;

  return { minutes: totalMin, label: label.trim() };
}

type Freshness = "fresh" | "warm" | "stale" | "cold";

function getFreshness(minutes: number): Freshness {
  if (minutes <= 30) return "fresh";
  if (minutes <= 90) return "warm";
  if (minutes <= 240) return "stale";
  return "cold";
}

function getFreshnessColor(f: Freshness): string {
  switch (f) {
    case "fresh": return "var(--fresh)";
    case "warm": return "var(--warm)";
    case "stale": return "var(--stale)";
    case "cold": return "var(--cold)";
  }
}

function formatAbsoluteDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month} à ${hh}:${mm} UTC`;
}

export function FreshnessBadge({ receivedAt }: FreshnessBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const { minutes, label } = getAge(receivedAt);
  const freshness = getFreshness(minutes);
  const color = getFreshnessColor(freshness);
  const isOld = freshness === "stale" || freshness === "cold";

  return (
    <span className="relative inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span style={isOld ? { color } : undefined}>Reçu {label}</span>
      <button
        onClick={() => setTooltipOpen(!tooltipOpen)}
        className="inline-flex items-center justify-center rounded-full hover:text-[var(--text-primary)] transition-colors"
        aria-label="Informations sur la fraîcheur"
      >
        <HelpCircle className="h-3.5 w-3.5" style={isOld ? { color } : undefined} />
      </button>

      {tooltipOpen && (
        <div className="absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg text-xs leading-relaxed text-[var(--text-secondary)]">
          <button
            onClick={() => setTooltipOpen(false)}
            className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p>
            Les D-ATIS sont captés lorsqu'un avion en demande un via sa liaison de données (ACARS).
            Sans demande d'un avion, aucune mise à jour n'est possible.
          </p>
          <p className="mt-2 font-medium" style={{ color }}>
            Dernière réception : {formatAbsoluteDate(receivedAt)} ({label})
          </p>
          {isOld && (
            <p className="mt-1 text-[var(--text-muted)]">
              Cette information peut ne plus être à jour. Vérifiez auprès d'une source officielle.
            </p>
          )}
        </div>
      )}
    </span>
  );
}

export function FreshnessInline({ receivedAt }: FreshnessBadgeProps) {
  const { minutes, label } = getAge(receivedAt);
  const color = getFreshnessColor(getFreshness(minutes));

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
