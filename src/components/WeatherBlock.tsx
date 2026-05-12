"use client";

import { RawDecodedToggle } from "./RawDecodedToggle";
import { RawDataBlock } from "./RawDataBlock";
import { DecodedMetar } from "./DecodedMetar";
import { DecodedTaf } from "./DecodedTaf";
import { FreshnessInline } from "./FreshnessBadge";

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
  receivedAt,
  type,
  mode,
  onToggle,
}: WeatherBlockProps) {
  return (
    <div className="mx-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </h3>
          <FreshnessInline receivedAt={receivedAt} />
        </div>
        <RawDecodedToggle mode={mode} onToggle={onToggle} />
      </div>

      {mode === "raw" ? (
        <RawDataBlock raw={raw} />
      ) : (
        <div className="rounded-md border border-[var(--border)] bg-[var(--mono-bg)]">
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
