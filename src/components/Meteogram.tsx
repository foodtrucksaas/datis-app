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
  if (code >= 95) return "⛈️";
  if (code >= 80) return "🌧️";
  if (code >= 71) return "🌨️";
  if (code >= 61) return "🌧️";
  if (code >= 51) return "🌦️";
  if (code >= 45) return "🌫️";
  if (cloud >= 80) return "☁️";
  if (cloud >= 40) return "⛅";
  if (cloud >= 10) return "🌤️";
  return "☀️";
}

function windArrow(deg: number): string {
  // Arrow points in the direction wind is going TO (opposite of FROM)
  const arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  const idx = Math.round(deg / 45) % 8;
  return arrows[idx];
}

function windColor(kt: number): string {
  if (kt >= 30) return "var(--stale)";
  if (kt >= 20) return "var(--warm)";
  if (kt >= 10) return "var(--accent)";
  return "var(--text-secondary)";
}

function gustColor(kt: number): string {
  if (kt >= 40) return "var(--stale)";
  if (kt >= 25) return "var(--warm)";
  return "var(--text-muted)";
}

export function Meteogram({ lat, lon }: MeteogramProps) {
  const [hours, setHours] = useState<HourData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,dewpoint_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,precipitation,weather_code&wind_speed_unit=kn&timezone=UTC&forecast_days=2`;

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

        // Show every 3 hours, starting from current hour
        const nowHour = new Date().getUTCHours();
        const nowIdx = data.findIndex(
          (d) => parseInt(d.hour) >= nowHour
        );
        const start = Math.max(0, nowIdx);
        const filtered = data.filter((_, i) => i >= start && (i - start) % 3 === 0).slice(0, 16);
        setHours(filtered);
        setLoading(false);

        // Scroll to start
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;
      })
      .catch(() => setLoading(false));
  }, [lat, lon]);

  if (loading) return null;
  if (hours.length === 0) return null;

  // Group by day
  const days: { label: string; count: number }[] = [];
  let currentDay = "";
  for (const h of hours) {
    const day = h.time.slice(0, 10);
    if (day !== currentDay) {
      const d = new Date(day + "T00:00:00Z");
      const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" });
      days.push({ label: label.charAt(0).toUpperCase() + label.slice(1), count: 1 });
      currentDay = day;
    } else {
      days[days.length - 1].count++;
    }
  }

  const cellClass = "px-2 py-1 text-center whitespace-nowrap font-mono text-xs";
  const labelClass = "sticky left-0 z-10 bg-[var(--surface)] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap border-r border-[var(--border)]";

  return (
    <div className="mx-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Météogramme
      </h3>
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]"
      >
        <table className="w-max border-collapse">
          <thead>
            {/* Day headers */}
            <tr className="border-b border-[var(--border)]">
              <th className={labelClass} />
              {days.map((day, i) => (
                <th
                  key={i}
                  colSpan={day.count}
                  className="px-2 py-1.5 text-center text-[11px] font-semibold text-[var(--text-primary)] border-l border-[var(--border)]"
                >
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Hours */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Heure Z</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cellClass} text-[var(--text-secondary)]`}>
                  {h.hour}
                </td>
              ))}
            </tr>

            {/* Weather icons */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Météo</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cellClass} text-base`}>
                  {weatherIcon(h.weatherCode, h.cloud)}
                </td>
              ))}
            </tr>

            {/* Temperature */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Temp °C</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cellClass} font-semibold text-[var(--text-primary)]`}>
                  {h.temp}°
                </td>
              ))}
            </tr>

            {/* Dewpoint */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Rosée °C</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cellClass} text-[var(--text-muted)]`}>
                  {h.dewpoint}°
                </td>
              ))}
            </tr>

            {/* Wind */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Vent kt</td>
              {hours.map((h, i) => (
                <td key={i} className={cellClass}>
                  <span className="text-[var(--text-muted)]">{windArrow(h.windDir)}</span>
                  <span className="ml-0.5 font-semibold" style={{ color: windColor(h.wind) }}>
                    {h.wind}
                  </span>
                </td>
              ))}
            </tr>

            {/* Gusts */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>Raf. kt</td>
              {hours.map((h, i) => (
                <td key={i} className={cellClass} style={{ color: gustColor(h.gusts) }}>
                  {h.gusts}
                </td>
              ))}
            </tr>

            {/* QNH */}
            <tr className="border-b border-[var(--border)]">
              <td className={labelClass}>QNH hPa</td>
              {hours.map((h, i) => (
                <td key={i} className={`${cellClass} text-[var(--text-secondary)]`}>
                  {h.qnh}
                </td>
              ))}
            </tr>

            {/* Precipitation */}
            <tr>
              <td className={labelClass}>Pluie mm</td>
              {hours.map((h, i) => (
                <td
                  key={i}
                  className={cellClass}
                  style={{ color: h.precip > 0 ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {h.precip > 0 ? h.precip.toFixed(1) : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
