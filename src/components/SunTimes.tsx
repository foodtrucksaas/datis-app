"use client";

import { useEffect, useState } from "react";

interface SunTimesProps {
  lat: number;
  lon: number;
}

function formatUtc(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}Z`;
}

/** Simple sunrise/sunset calculation using the solar declination formula */
function computeSunTimes(lat: number, lon: number, date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getUTCFullYear(), 0, 0).getTime()) / 86400000
  );
  const decl = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  const latRad = lat * (Math.PI / 180);
  const declRad = decl * (Math.PI / 180);

  const cosH = -Math.tan(latRad) * Math.tan(declRad);
  if (cosH > 1 || cosH < -1) return null; // polar night or midnight sun

  const H = Math.acos(cosH) * (180 / Math.PI);
  const solarNoon = 12 - lon / 15; // hours UTC

  const riseHours = solarNoon - H / 15;
  const setHours = solarNoon + H / 15;

  const riseDate = new Date(date);
  riseDate.setUTCHours(0, 0, 0, 0);
  riseDate.setUTCMinutes(Math.round(riseHours * 60));

  const setDate = new Date(date);
  setDate.setUTCHours(0, 0, 0, 0);
  setDate.setUTCMinutes(Math.round(setHours * 60));

  return { rise: riseDate, set: setDate };
}

export function SunTimes({ lat, lon }: SunTimesProps) {
  const [times, setTimes] = useState<{ rise: Date; set: Date } | null>(null);

  useEffect(() => {
    const result = computeSunTimes(lat, lon, new Date());
    setTimes(result);
  }, [lat, lon]);

  if (!times) return null;

  return (
    <div className="mx-5 flex items-center gap-4 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-sm">&#9788;</span>
        <span className="font-mono font-medium text-[var(--text-secondary)]">
          {formatUtc(times.rise)}
        </span>
      </div>
      <div className="h-px flex-1 bg-[var(--border)]" />
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-sm">&#9790;</span>
        <span className="font-mono font-medium text-[var(--text-secondary)]">
          {formatUtc(times.set)}
        </span>
      </div>
    </div>
  );
}
