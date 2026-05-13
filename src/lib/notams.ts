/** Fetch and filter operational NOTAMs from ICAO API */

export interface Notam {
  id: string;
  subject: string;
  condition: string;
  message: string;
  startDate: string;
  endDate: string;
  raw: string;
  severity: "high" | "medium" | "low";
}

/** Subjects we care about for operational awareness */
const OPERATIONAL_SUBJECTS = new Set([
  "Runway",
  "Taxiway(s)",
  "Instrument landing system",
  "Aerodrome",
  "Parking area",
  "Apron",
  "Lighting",
  "VOR",
  "DME",
  "NDB",
  "Firefighting and rescue",
  "Aerodrome operating minima",
  "Standard instrument departure",
  "Instrument approach procedure",
  "Fuel availability",
]);

/** Conditions that indicate high severity */
const HIGH_CONDITIONS = new Set([
  "Closed",
  "Unserviceable",
  "Withdrawn from service",
]);

const MEDIUM_CONDITIONS = new Set([
  "Limitations",
  "Limited to",
  "Restricted",
  "Operating but with limitations",
  "Availability",
]);

function getSeverity(condition: string, message: string): "high" | "medium" | "low" {
  if (HIGH_CONDITIONS.has(condition)) return "high";
  // Check message for closure/unserviceable keywords
  const upper = message.toUpperCase();
  if (upper.includes("CLSD") || upper.includes("CLOSED") || upper.includes("U/S")) return "high";
  if (MEDIUM_CONDITIONS.has(condition)) return "medium";
  if (upper.includes("LIMITED") || upper.includes("RESTRICTED") || upper.includes("NOT AVBL")) return "medium";
  return "low";
}

/** Clean NOTAM message: remove CREATED/SOURCE lines, trim */
function cleanMessage(msg: string): string {
  return msg
    .replace(/\nCREATED:[\s\S]*$/, "")
    .replace(/\nSOURCE:[\s\S]*$/, "")
    .trim();
}

/** Build a short summary from subject + message */
function buildSummary(subject: string, message: string): string {
  const clean = cleanMessage(message);
  // Take first meaningful line
  const firstLine = clean.split("\n")[0].trim();
  if (firstLine.length <= 80) return firstLine;
  return firstLine.slice(0, 77) + "...";
}

interface IcaoNotam {
  id: string;
  Subject: string;
  Condition: string;
  message: string;
  startdate: string;
  enddate: string;
  all: string;
  location: string;
}

export async function fetchNotams(icao: string): Promise<Notam[]> {
  const url = `https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/states/notams/notams-list?api_key=test&format=json&locations=${encodeURIComponent(icao)}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data: IcaoNotam[] = await res.json();

  const now = new Date();

  return data
    .filter((n) => {
      // Only operational subjects
      if (!OPERATIONAL_SUBJECTS.has(n.Subject)) return false;
      // Only for our specific ICAO (API sometimes returns FIR-wide NOTAMs)
      if (n.location !== icao) return false;
      // Must be currently active
      const start = new Date(n.startdate);
      const end = new Date(n.enddate);
      if (start > now || end < now) return false;
      return true;
    })
    .map((n) => ({
      id: n.id,
      subject: n.Subject,
      condition: n.Condition,
      message: cleanMessage(n.message),
      startDate: n.startdate,
      endDate: n.enddate,
      raw: n.all,
      severity: getSeverity(n.Condition, n.message),
    }))
    .sort((a, b) => {
      // High severity first
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 15); // Cap to avoid huge lists
}

export function notamSummary(n: Notam): string {
  return buildSummary(n.subject, n.message);
}
