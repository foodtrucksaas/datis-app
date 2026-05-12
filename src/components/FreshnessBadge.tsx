interface FreshnessBadgeProps {
  receivedAt: string;
}

function getAge(isoDate: string): { minutes: number; label: string } {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(ms / 60_000);

  if (minutes < 1) return { minutes, label: "à l'instant" };
  if (minutes < 60) return { minutes, label: `il y a ${minutes} min` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { minutes, label: `il y a ${hours}h${minutes % 60 > 0 ? String(minutes % 60).padStart(2, "0") : ""}` };
  return { minutes, label: `il y a ${Math.floor(hours / 24)}j` };
}

function getFreshnessColor(minutes: number): string {
  if (minutes <= 15) return "var(--fresh)";
  if (minutes <= 45) return "var(--warm)";
  if (minutes <= 120) return "var(--stale)";
  return "var(--cold)";
}

export function FreshnessBadge({ receivedAt }: FreshnessBadgeProps) {
  const { minutes, label } = getAge(receivedAt);
  const color = getFreshnessColor(minutes);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function FreshnessInline({ receivedAt }: FreshnessBadgeProps) {
  const { minutes, label } = getAge(receivedAt);
  const color = getFreshnessColor(minutes);

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
