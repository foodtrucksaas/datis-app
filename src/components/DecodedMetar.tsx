import { parseMetar } from "@/lib/metar-parser";
import type { DecodedToken } from "@/lib/metar-parser";

interface DecodedMetarProps {
  raw: string;
}

function tokenColor(color?: DecodedToken["color"]): string {
  if (color === "fresh") return "var(--fresh)";
  if (color === "warm") return "var(--warm)";
  if (color === "stale") return "var(--stale)";
  return "var(--text-primary)";
}

export function DecodedMetar({ raw }: DecodedMetarProps) {
  const tokens = parseMetar(raw);

  return (
    <div className="space-y-1.5 p-3">
      {tokens.map((t, i) => (
        <div key={i} className="flex items-baseline gap-2 text-xs">
          <span className="shrink-0 w-28 text-right text-[var(--text-muted)]">
            {t.label}
          </span>
          <span
            className="font-mono"
            style={{ color: tokenColor(t.color) }}
          >
            {t.value}
          </span>
        </div>
      ))}
    </div>
  );
}
