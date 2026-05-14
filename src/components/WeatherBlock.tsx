"use client";

import { RawDecodedToggle } from "./RawDecodedToggle";
import { RawDataBlock } from "./RawDataBlock";
import { DecodedMetar } from "./DecodedMetar";
import { DecodedTaf } from "./DecodedTaf";
interface WeatherBlockProps {
  label: string;
  raw: string;
  receivedAt: string;
  type: "metar" | "taf";
  mode: "raw" | "decoded";
  onToggle: () => void;
}

export function WeatherBlock({
  label,
  raw,
  type,
  mode,
  onToggle,
}: WeatherBlockProps) {
  return (
    <div className="mx-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </h3>
        <RawDecodedToggle mode={mode} onToggle={onToggle} />
      </div>

      {mode === "raw" ? (
        <RawDataBlock raw={raw} />
      ) : (
        <div className={`rounded-md border bg-[var(--mono-bg)] ${
          type === "taf"
            ? "border-[var(--accent)]/20"
            : "border-[var(--border)]"
        }`}>
          {type === "metar" ? (
            <DecodedMetar raw={raw} />
          ) : (
            <DecodedTaf raw={raw} />
          )}
        </div>
      )}
    </div>
  );
}
