"use client";

import { parseMetar } from "@/lib/metar-parser";
import { RawDataBlock } from "./RawDataBlock";

interface PromotedMetarCardProps {
  raw: string;
  receivedAt: string;
}

function ageMinutes(isoDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
}

function extractMetarFields(raw: string) {
  const tokens = parseMetar(raw);
  const get = (label: string) =>
    tokens.find((t) => t.label === label)?.value ?? "N/A";

  return {
    wind: get("Vent"),
    qnh: get("QNH"),
    visibility: get("Visibilité"),
    tempDp: get("Température"),
    clouds: get("Nuages"),
    weather: get("Phénomène"),
  };
}

function visColor(vis: string): string | undefined {
  if (/CAVOK/i.test(vis)) return "var(--fresh)";
  const m = vis.match(/(\d+)\s*m/);
  if (m) {
    const v = parseInt(m[1]);
    if (v < 1500) return "var(--stale)";
    if (v < 5000) return "var(--warm)";
  }
  return undefined;
}

export function PromotedMetarCard({ raw, receivedAt }: PromotedMetarCardProps) {
  const age = ageMinutes(receivedAt);
  const fields = extractMetarFields(raw);

  return (
    <div className="mx-3.5 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            METAR · Conditions actuelles
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
            il y a {age} min
          </p>
        </div>
        <span className="font-mono text-[9px] text-[var(--text-muted)]">
          Source · NOAA
        </span>
      </div>

      {/* Conditions grid */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pb-3">
        <CondTile label="Vent" value={fields.wind} />
        <CondTile label="QNH" value={fields.qnh} />
        <CondTile label="Visi" value={fields.visibility} color={visColor(fields.visibility)} />
        <CondTile label="T/DP" value={fields.tempDp} />
        <CondTile label="Nuages" value={fields.clouds} small={fields.clouds.length > 15} />
        {fields.weather !== "N/A" && (
          <CondTile label="Phénomène" value={fields.weather} />
        )}
      </div>

      {/* Raw METAR */}
      <div className="border-t-[0.5px] border-[var(--border)] px-4 py-3">
        <RawDataBlock raw={raw} />
      </div>
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
