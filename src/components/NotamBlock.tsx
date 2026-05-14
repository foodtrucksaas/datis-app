"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Notam } from "@/lib/notams";

interface NotamBlockProps {
  icao: string;
}

const SEVERITY_STYLE = {
  high: {
    dot: "bg-red-500",
    label: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/8",
  },
  medium: {
    dot: "bg-amber-500",
    label: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8",
  },
  low: {
    dot: "bg-blue-400",
    label: "text-[var(--text-secondary)]",
    bg: "",
  },
};

function formatEndDate(iso: string): string {
  const d = new Date(iso);
  if (d.getFullYear() > 2090) return "PERM";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function subjectLabel(subject: string): string {
  const map: Record<string, string> = {
    "Runway": "RWY",
    "Taxiway(s)": "TWY",
    "Instrument landing system": "ILS",
    "Aerodrome": "AD",
    "Parking area": "PARK",
    "Apron": "APRON",
    "Lighting": "LGT",
    "VOR": "VOR",
    "DME": "DME",
    "NDB": "NDB",
    "Firefighting and rescue": "RFFS",
    "Aerodrome operating minima": "OPS MIN",
    "Standard instrument departure": "SID",
    "Instrument approach procedure": "IAP",
    "Fuel availability": "FUEL",
  };
  return map[subject] ?? subject.slice(0, 6).toUpperCase();
}

export function NotamBlock({ icao }: NotamBlockProps) {
  const [notams, setNotams] = useState<Notam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/notams/${icao}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setNotams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [icao]);

  if (loading || notams.length === 0) return null;

  return (
    <div className="mx-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        NOTAMs
      </h3>
      <div className="space-y-1.5">
        {notams.map((n) => {
          const style = SEVERITY_STYLE[n.severity];
          const isExpanded = expanded === n.id;
          return (
            <div
              key={n.id}
              className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden ${style.bg}`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : n.id)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[var(--surface-elevated,var(--surface))] border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--text-muted)]">
                      {subjectLabel(n.subject)}
                    </span>
                    <span className={`text-xs font-medium ${style.label} truncate`}>
                      {n.message.split("\n")[0].slice(0, 80)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {n.id} · jusqu&apos;au {formatEndDate(n.endDate)}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                )}
              </button>
              {isExpanded && (
                <div className="border-t border-[var(--border)] px-3 py-2.5">
                  <pre className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-[var(--text-secondary)]">
                    {n.message}
                  </pre>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                      NOTAM brut
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] font-mono leading-relaxed text-[var(--text-muted)]">
                      {n.raw}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
