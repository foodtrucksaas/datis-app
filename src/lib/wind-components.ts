/**
 * Wind component calculations for runway operations.
 */

export interface WindInput {
  direction: number | "VRB";
  speed_kt: number;
  gust_kt?: number;
}

export interface WindComponent {
  runway: string;
  qfu: number;
  headwind_kt: number; // positive = face, negative = tailwind
  crosswind_kt: number; // positive = from right, negative = from left
  gustHeadwind_kt?: number;
  gustCrosswind_kt?: number;
  role?: "ARR" | "DEP" | "ARR+DEP";
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function computeComponents(
  windDir: number,
  windSpeed: number,
  rwyHeading: number
): { headwind: number; crosswind: number } {
  const diff = deg2rad(windDir - rwyHeading);
  return {
    headwind: Math.round(windSpeed * Math.cos(diff)),
    crosswind: Math.round(windSpeed * Math.sin(diff)),
  };
}

/**
 * Calculate wind components for a runway.
 * @param wind - Wind direction and speed
 * @param rwyDesignator - e.g. "27R"
 * @param qfu - Runway heading in degrees (magnetic)
 * @param role - ARR, DEP, or ARR+DEP
 */
export function windComponents(
  wind: WindInput,
  rwyDesignator: string,
  qfu: number,
  role?: "ARR" | "DEP" | "ARR+DEP"
): WindComponent | null {
  if (wind.direction === "VRB") {
    return {
      runway: rwyDesignator,
      qfu,
      headwind_kt: 0,
      crosswind_kt: 0,
      role,
    };
  }

  const { headwind, crosswind } = computeComponents(
    wind.direction,
    wind.speed_kt,
    qfu
  );

  const result: WindComponent = {
    runway: rwyDesignator,
    qfu,
    headwind_kt: headwind,
    crosswind_kt: crosswind,
    role,
  };

  if (wind.gust_kt) {
    const gust = computeComponents(wind.direction, wind.gust_kt, qfu);
    result.gustHeadwind_kt = gust.headwind;
    result.gustCrosswind_kt = gust.crosswind;
  }

  return result;
}

/**
 * Format a wind component for display.
 */
export function formatComponent(value: number, positiveLabel: string, negativeLabel: string): string {
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${positiveLabel}`;
  return `${abs} ${value > 0 ? positiveLabel : negativeLabel}`;
}

export function formatHeadwind(hw: number): string {
  return formatComponent(hw, "face", "arrière");
}

export function formatCrosswind(xw: number): string {
  return formatComponent(xw, "droite", "gauche");
}

/**
 * Color for headwind value.
 */
export function headwindColor(hw: number): string {
  if (hw < 0) return "var(--stale)"; // tailwind
  return "var(--fresh)";
}

/**
 * Color for crosswind value.
 */
export function crosswindColor(xw: number): string {
  const abs = Math.abs(xw);
  if (abs > 20) return "var(--stale)";
  if (abs >= 10) return "var(--warm)";
  return "var(--text-primary)";
}
