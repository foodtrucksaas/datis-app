"use client";

import { useEffect, useState, useRef } from "react";

interface MeteogramProps {
  lat: number;
  lon: number;
}

interface HourData {
  time: string;
  hour: string;
  temp: number;
  dewpoint: number;
  wind: number;
  gusts: number;
  windDir: number;
  qnh: number;
  cloud: number;
  precip: number;
  weatherCode: number;
}

function weatherIcon(code: number, cloud: number): string {
  if (code >= 95) return "⛈";
  if (code >= 80) return "🌧";
  if (code >= 71) return "🌨";
  if (code >= 61) return "🌧";
  if (code >= 51) return "🌦";
  if (code >= 45) return "🌫";
  if (cloud >= 80) return "☁";
  if (cloud >= 40) return "⛅";
  if (cloud >= 10) return "🌤";
  return "☀";
}

function windArrow(deg: number): string {
  const arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  return arrows[Math.round(deg / 45) % 8];
}

/** Temperature gradient: blue (cold) → green → yellow → orange → red (hot) */
function tempBg(t: number): string {
  if (t <= 0) return "rgba(59,130,246,0.25)";
  if (t <= 5) return "rgba(59,130,246,0.15)";
  if (t <= 10) return "rgba(34,197,94,0.12)";
  if (t <= 15) return "rgba(34,197,94,0.18)";
  if (t <= 20) return "rgba(234,179,8,0.15)";
  if (t <= 25) return "rgba(234,179,8,0.25)";
  if (t <= 30) return "rgba(249,115,22,0.2)";
  return "rgba(239,68,68,0.2)";
}

/** Wind gradient */
function windBg(kt: number): string {
  if (kt < 5) return "transparent";
  if (kt < 10) return "rgba(34,197,94,0.12)";
  if (kt < 15) return "rgba(34,197,94,0.22)";
  if (kt < 20) return "rgba(234,179,8,0.18)";
  if (kt < 25) return "rgba(249,115,22,0.18)";
  if (kt < 30) return "rgba(239,68,68,0.18)";
  return "rgba(239,68,68,0.3)";
}

function gustBg(kt: number): string {
  if (kt < 15) return "transparent";
  if (kt < 25) return "rgba(234,179,8,0.12)";
  if (kt < 35) return "rgba(249,115,22,0.15)";
  return "rgba(239,68,68,0.2)";
}

function precipBg(mm: number): string {
  if (mm <= 0) return "transparent";
  if (mm < 1) return "rgba(59,130,246,0.12)";
  if (mm < 3) return "rgba(59,130,246,0.22)";
  return "rgba(59,130,246,0.35)";
}

export function Meteogram({ lat, lon }: MeteogramProps) {
  const [hours, setHours] = useState<HourData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,dewpoint_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,precipitation,weather_code&wind_speed_unit=kn&timezone=UTC&forecast_days=2`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const h = d.hourly;
        const data: HourData[] = h.time.map((t: string, i: number) => ({
          time: t,
          hour: t.slice(11, 13),
          temp: Math.round(h.temperature_2m[i]),
          dewpoint: Math.round(h.dewpoint_2m[i]),
          wind: Math.round(h.wind_speed_10m[i]),
          gusts: Math.round(h.wind_gusts_10m[i]),
          windDir: h.wind_direction_10m[i],
          qnh: Math.round(h.pressure_msl[i]),
          cloud: h.cloud_cover[i],
          precip: h.precipitation[i],
          weatherCode: h.weather_code[i],
        }));

        // Every 3 hours starting from current hour
        const nowHour = new Date().getUTCHours();
        const nowIdx = data.findIndex((d) => parseInt(d.hour) >= nowHour);
        const start = Math.max(0, nowIdx);
        setHours(
          data.filter((_, i) => i >= start && (i - start) % 3 === 0).slice(0, 16)
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lat, lon]);

  if (loading || hours.length === 0) return null;

  // Group hours by day
  const days: { label: string; count: number }[] = [];
  let curDay = "";
  for (const h of hours) {
    const day = h.time.slice(0, 10);
    if (day !== curDay) {
      const d = new Date(day + "T00:00:00Z");
      const lbl = d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
      days.push({ label: lbl.charAt(0).toUpperCase() + lbl.slice(1), count: 1 });
      curDay = day;
    } else {
      days[days.length - 1].count++;
    }
  }

  const cell = "px-2.5 py-1.5 text-center font-mono text-[11px] leading-tight";
  const label =
    "sticky left-0 z-10 bg-[var(--surface)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap border-r border-[var(--border)]";

  return (
    <div className="mx-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Météogramme · ECMWF
      </h3>
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]"
      >
        <table className="w-max border-collapse">
          <thead>
            <tr>
              <th className={label} />
              {days.map((d, i) => (
                <th
                  key={i}
                  colSpan={d.count}
                  className="px-2 py-2 text-center text-[11px] font-bold tracking-wide text-[var(--text-primary)] border-b border-l border-[var(--border)]"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Hours */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>UTC</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cell} font-semibold text-[var(--text-secondary)]`}>
                  {h.hour}Z
                </td>
              ))}
            </tr>

            {/* Weather */}
            <tr className="border-b border-[var(--border)]">
              <td className={label} />
              {hours.map((h, i) => (
                <td key={i} className={`${cell} text-sm`}>
                  {weatherIcon(h.weatherCode, h.cloud)}
                </td>
              ))}
            </tr>

            {/* Temp */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>°C</td>
              {hours.map((h, i) => (
                <td
                  key={i}
                  className={`${cell} font-bold text-[var(--text-primary)]`}
                  style={{ backgroundColor: tempBg(h.temp) }}
                >
                  {h.temp}°
                </td>
              ))}
            </tr>

            {/* Dewpoint */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>Rosée</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cell} text-[var(--text-muted)]`}>
                  {h.dewpoint}°
                </td>
              ))}
            </tr>

            {/* Wind direction + speed */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>Vent kt</td>
              {hours.map((h, i) => (
                <td
                  key={i}
                  className={`${cell} font-bold`}
                  style={{ backgroundColor: windBg(h.wind) }}
                >
                  <span className="opacity-60 mr-0.5">{windArrow(h.windDir)}</span>
                  {h.wind}
                </td>
              ))}
            </tr>

            {/* Gusts */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>Raf.</td>
              {hours.map((h, i) => (
                <td
                  key={i}
                  className={`${cell} text-[var(--text-muted)]`}
                  style={{ backgroundColor: gustBg(h.gusts) }}
                >
                  {h.gusts}
                </td>
              ))}
            </tr>

            {/* QNH */}
            <tr className="border-b border-[var(--border)]">
              <td className={label}>hPa</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cell} text-[var(--text-secondary)]`}>
                  {h.qnh}
                </td>
              ))}
            </tr>

            {/* Precip */}
            <tr>
              <td className={label}>Pluie</td>
              {hours.map((h, i) => (
                <td
                  key={i}
                  className={cell}
                  style={{ backgroundColor: precipBg(h.precip) }}
                >
                  <span className={h.precip > 0 ? "font-semibold text-[var(--accent)]" : "text-[var(--text-muted)]"}>
                    {h.precip > 0 ? h.precip.toFixed(1) : "—"}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
        Source : ECMWF IFS via Open-Meteo · Résolution 9 km
      </p>
    </div>
  );
}
