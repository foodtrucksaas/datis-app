import { parseTaf } from "@/lib/taf-parser";
import type { TafToken } from "@/lib/taf-parser";

interface DecodedTafProps {
  raw: string;
}

function tokenColor(color?: TafToken["color"]): string {
  if (color === "fresh") return "var(--fresh)";
  if (color === "warm") return "var(--warm)";
  if (color === "stale") return "var(--stale)";
  return "var(--text-primary)";
}

const periodLabels: Record<string, string> = {
  base: "Prévision de base",
  TEMPO: "TEMPO",
  BECMG: "BECMG",
  PROB30: "PROB 30%",
  PROB40: "PROB 40%",
  FM: "À partir de",
};

export function DecodedTaf({ raw }: DecodedTafProps) {
  const { validity, periods } = parseTaf(raw);

  return (
    <div className="space-y-3 p-3">
      {validity && (
        <div className="text-xs text-[var(--text-muted)]">
          Validité : {validity}
        </div>
      )}
      {periods.map((period, pi) => (
        <div key={pi} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[var(--accent)]">
              {periodLabels[period.type] || period.type}
            </span>
            {(period.from || period.to) && (
              <span className="text-[11px] text-[var(--text-muted)]">
                {period.from}{period.to ? ` → ${period.to}` : ""}
              </span>
            )}
          </div>
          {period.tokens.map((t, ti) => (
            <div key={ti} className="flex items-baseline gap-2 text-xs pl-2">
              <span className="shrink-0 w-24 text-right text-[var(--text-muted)]">
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
      ))}
    </div>
  );
}
