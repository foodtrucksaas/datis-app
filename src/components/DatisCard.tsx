"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DatisFields } from "@/lib/datis-parser";
import { phoneticLetter } from "@/lib/datis-parser";
import { translateRemarks } from "@/lib/remarks-translator";
import { RawDataBlock } from "./RawDataBlock";

interface DatisCardProps {
  fields: DatisFields;
  raw: string;
  receivedAt: string;
}

function ageMinutes(isoDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
}

function cloudLabel(type: string): string {
  switch (type) {
    case "FEW": return "Quelques";
    case "SCT": return "Épars";
    case "BKN": return "Fragmenté";
    case "OVC": return "Couvert";
    default: return type;
  }
}

function visColor(vis: string): string | undefined {
  if (vis === "CAVOK") return "var(--fresh)";
  const m = vis.match(/^(\d+)/);
  if (m) {
    const v = parseInt(m[1]);
    if (vis.includes("km")) {
      if (v >= 10) return "var(--fresh)";
      if (v >= 5) return undefined;
      return "var(--warm)";
    }
    if (v < 1500) return "var(--stale)";
    if (v < 5000) return "var(--warm)";
  }
  return undefined;
}

function rscdStateColor(state: string): string {
  const s = state.toUpperCase();
  if (["WET", "DAMP", "SLUSH"].some((k) => s.includes(k))) return "var(--warm)";
  if (["SNOW", "ICE", "FROST", "CONTAMINATED", "FLOODED"].some((k) => s.includes(k)))
    return "var(--stale)";
  return "var(--text-secondary)";
}

export function DatisCard({ fields, raw, receivedAt }: DatisCardProps) {
  const [rawOpen, setRawOpen] = useState(false);
  const age = ageMinutes(receivedAt);
  const isDep = fields.type === "DEP";
  const primaryRunways = isDep ? fields.departureRunways : fields.arrivalRunways;
  const secondaryRunways = isDep ? fields.arrivalRunways : fields.departureRunways;

  const translatedRemarks = translateRemarks(fields.remarks);

  const cloudsStr =
    fields.clouds.length > 0
      ? fields.clouds
          .map(
            (c) =>
              `${cloudLabel(c.type)} ${c.base_ft} ft${c.cb ? " CB" : ""}`
          )
          .join(", ")
      : "SKC";

  return (
    <div className="mx-3.5 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      {/* ── Header ── */}
      <div
        className="flex items-start gap-3.5 px-4 py-4"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--accent) 4%, transparent), transparent)",
        }}
      >
        {/* Letter tile */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "0.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        >
          <span className="font-mono text-[32px] font-medium text-[var(--accent)]">
            {fields.letter}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium text-[var(--text-primary)]">
            D-ATIS · Information {phoneticLetter(fields.letter)}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fresh)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--fresh)]" />
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              Reçu {fields.emissionTime ? `à ${fields.emissionTime}` : ""} · il y a {age} min
            </span>
          </div>
        </div>

        {/* LIVE badge */}
        <span
          className="mt-1 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{
            background: "color-mix(in srgb, var(--fresh) 10%, transparent)",
            color: "var(--fresh)",
          }}
        >
          Live
        </span>
      </div>

      {/* ── Body ── */}
      <div className="space-y-0 px-4 pb-4">
        {/* Approche attendue */}
        {fields.approachExpected && (
          <div className="mb-3">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
              Approche attendue
            </span>
            <div
              className="mt-1 rounded-r-[5px] py-2 pl-3 pr-3 font-mono text-[14px] text-[var(--text-primary)]"
              style={{
                background: "color-mix(in srgb, var(--accent) 5%, transparent)",
                borderLeft: "2px solid var(--accent)",
              }}
            >
              {fields.approachExpected}
            </div>
          </div>
        )}

        {/* Grid: Pistes + Conditions */}
        <div className="grid grid-cols-[1fr_1.4fr] gap-3">
          {/* Left: Pistes en service */}
          <div>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
              Pistes en service
            </span>
            <div className="mt-1 divide-y divide-[var(--border)]/50">
              {primaryRunways.length > 0 && (
                <div className="grid grid-cols-[36px_1fr] items-center py-1.5">
                  <span className="font-mono text-[9px] font-bold text-[var(--text-muted)]">
                    {isDep ? "DEP" : "ARR"}
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                    {primaryRunways.join(" · ")}
                  </span>
                </div>
              )}
              {secondaryRunways.length > 0 && (
                <div className="grid grid-cols-[36px_1fr] items-center py-1.5">
                  <span className="font-mono text-[9px] font-bold text-[var(--text-muted)]">
                    {isDep ? "ARR" : "DEP"}
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                    {secondaryRunways.join(" · ")}
                  </span>
                </div>
              )}
              {fields.sids.length > 0 && (
                <div className="grid grid-cols-[36px_1fr] items-center py-1.5">
                  <span className="font-mono text-[9px] font-bold text-[var(--text-muted)]">
                    SID
                  </span>
                  <span className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                    {fields.sids.join(" · ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Conditions */}
          <div>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
              Conditions
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <CondTile label="Vent" value={fields.windRaw} />
              <CondTile label="QNH" value={fields.qnh_hpa ? `${fields.qnh_hpa} hPa` : "N/A"} />
              <CondTile label="TL" value={fields.transitionLevel} />
              <CondTile
                label="Visi"
                value={fields.visibility}
                color={visColor(fields.visibility)}
              />
              <CondTile
                label="T/DP"
                value={
                  fields.temperature_c !== null && fields.dewpoint_c !== null
                    ? `${fields.temperature_c}° / ${fields.dewpoint_c}°`
                    : "N/A"
                }
              />
              <CondTile label="Nuages" value={cloudsStr} small={cloudsStr.length > 15} />
            </div>
          </div>
        </div>

        {/* RSCD */}
        {fields.rscd.length > 0 && (
          <div className="mt-3">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
              État des pistes · RSCD
            </span>
            <div className="mt-1 divide-y divide-[var(--border)]/50 font-mono text-[12px]">
              {fields.rscd.map((r, i) => (
                <div key={i} className="grid grid-cols-3 py-1">
                  <span className="text-[var(--text-primary)]">{r.runway}</span>
                  <span className="text-[var(--text-muted)]">{r.time}</span>
                  <span style={{ color: rscdStateColor(r.state) }}>{r.state}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remarks */}
        {translatedRemarks.length > 0 && (
          <div className="mt-3">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.10em] text-[var(--text-muted)]">
              Remarks · Ops infos
            </span>
            <ul className="mt-1 space-y-0.5">
              {translatedRemarks.map((r, i) => (
                <li
                  key={i}
                  className={`font-mono text-[12px] ${r.translated ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
                >
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirmation */}
        {fields.confirmation && (
          <p className="mt-2 font-mono text-[11px] font-medium text-[var(--accent)]">
            {fields.confirmation}
          </p>
        )}
      </div>

      {/* ── Footer: Raw ATIS toggle ── */}
      <button
        onClick={() => setRawOpen(!rawOpen)}
        className="flex w-full items-center gap-2 border-t-[0.5px] border-[var(--border)] px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-elevated)]/50"
      >
        {rawOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        )}
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Afficher le raw ATIS
        </span>
        {!rawOpen && (
          <span className="ml-auto max-w-[40%] truncate font-mono text-[10px] text-[var(--text-muted)]/60">
            {raw.slice(0, 60)}…
          </span>
        )}
      </button>
      {rawOpen && (
        <div className="px-4 pb-4">
          <RawDataBlock raw={raw} />
        </div>
      )}
    </div>
  );
}

function CondTile({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-[5px] border-[0.5px] border-[var(--border)] bg-[var(--bg)] px-2 py-1.5">
      <p className="font-mono text-[9px] text-[var(--text-muted)]">{label}</p>
      <p
        className={`font-mono font-medium leading-tight text-[var(--text-primary)] ${small ? "text-[10px]" : "text-[13px]"}`}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
