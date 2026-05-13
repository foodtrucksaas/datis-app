import { AlertTriangle } from "lucide-react";

interface FreshnessBadgeProps {
  receivedAt: string;
}

function getAge(isoDate: string): { minutes: number; label: string } {
  const ms = Date.now() - new Date(isoDate).getTime();
  const totalMin = Math.max(0, Math.round(ms / 60_000));

  if (totalMin < 1) return { minutes: totalMin, label: "à l'instant" };

  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;

  let label = "il y a ";
  if (days > 0) label += `${days}j `;
  if (hours > 0) label += `${hours}h`;
  if (days === 0 && mins > 0) label += `${mins.toString().padStart(2, "0")}min`;

  return { minutes: totalMin, label: label.trim() };
}

type Freshness = "fresh" | "warm" | "stale" | "cold";

function getFreshness(minutes: number): Freshness {
  if (minutes <= 30) return "fresh";
  if (minutes <= 90) return "warm";
  if (minutes <= 240) return "stale";
  return "cold";
}

function getFreshnessColor(f: Freshness): string {
  switch (f) {
    case "fresh": return "var(--fresh)";
    case "warm": return "var(--warm)";
    case "stale": return "var(--stale)";
    case "cold": return "var(--cold)";
  }
}

export function FreshnessBadge({ receivedAt }: FreshnessBadgeProps) {
  const { minutes, label } = getAge(receivedAt);
  const freshness = getFreshness(minutes);
  const color = getFreshnessColor(freshness);
  const isOld = freshness === "stale" || freshness === "cold";

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span style={isOld ? { color } : undefined}>{label}</span>
      {isOld && (
        <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />
      )}
    </span>
  );
}

export function FreshnessInline({ receivedAt }: FreshnessBadgeProps) {
  const { minutes, label } = getAge(receivedAt);
  const color = getFreshnessColor(getFreshness(minutes));

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
