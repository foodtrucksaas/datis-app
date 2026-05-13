interface MeteogramProps {
  lat: number;
  lon: number;
}

export function Meteogram({ lat, lon }: MeteogramProps) {
  const src = `https://embed.windy.com/embed.html?type=forecast&location=coordinates&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&metricWind=kt&metricTemp=%C2%B0C&metricRain=mm`;

  return (
    <div className="mx-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Météogramme
      </h3>
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <iframe
          src={src}
          className="w-full"
          height={450}
          frameBorder={0}
          title="Météogramme Windy"
        />
      </div>
    </div>
  );
}
