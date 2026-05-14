/** Fetch and filter operational NOTAMs — Notamify (worldwide) + ICAO fallback (France) */

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
  "Taxiway",
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

/** Keywords in Q-code or message that indicate operational relevance */
const OPERATIONAL_QCODE_PREFIXES = [
  "QM", // Movement area
  "QF", // Facilities
  "QL", // Lighting
  "QN", // Navaids
  "QR", // Restricted
  "QA", // Aerodrome
];

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
  const upper = message.toUpperCase();
  if (upper.includes("CLSD") || upper.includes("CLOSED") || upper.includes("U/S")) return "high";
  if (MEDIUM_CONDITIONS.has(condition)) return "medium";
  if (upper.includes("LIMITED") || upper.includes("RESTRICTED") || upper.includes("NOT AVBL")) return "medium";
  return "low";
}

function cleanMessage(msg: string): string {
  return msg
    .replace(/\nCREATED:[\s\S]*$/, "")
    .replace(/\nSOURCE:[\s\S]*$/, "")
    .replace(/\\n/g, "\n")
    .trim();
}

/** Guess subject from Q-code or message content */
function guessSubject(qcode: string, message: string): string {
  const upper = message.toUpperCase();
  if (/\bRWY\b|\bRUNWAY\b/.test(upper)) return "Runway";
  if (/\bTWY\b|\bTAXIWAY\b/.test(upper)) return "Taxiway(s)";
  if (/\bILS\b/.test(upper)) return "Instrument landing system";
  if (/\bVOR\b/.test(upper)) return "VOR";
  if (/\bDME\b/.test(upper)) return "DME";
  if (/\bNDB\b/.test(upper)) return "NDB";
  if (/\bPAPI\b|\bLIGHT\b|\bLGT\b/.test(upper)) return "Lighting";
  if (/\bFUEL\b/.test(upper)) return "Fuel availability";
  if (/\bAPRON\b|\bPARKING\b/.test(upper)) return "Parking area";
  if (/\bSID\b|\bDEPARTURE\b/.test(upper)) return "Standard instrument departure";
  if (/\bSTAR\b|\bAPPROACH\b|\bIAP\b/.test(upper)) return "Instrument approach procedure";
  if (qcode.startsWith("QM")) return "Runway";
  if (qcode.startsWith("QN")) return "NDB";
  if (qcode.startsWith("QL")) return "Lighting";
  if (qcode.startsWith("QF")) return "Aerodrome";
  return "Aerodrome";
}

/** Guess condition from Q-code modifier */
function guessCondition(qcode: string, message: string): string {
  const upper = message.toUpperCase();
  if (upper.includes("CLSD") || upper.includes("CLOSED")) return "Closed";
  if (upper.includes("U/S") || upper.includes("UNSERVICEABLE")) return "Unserviceable";
  if (upper.includes("LIMITED") || upper.includes("RESTRICTED")) return "Limitations";
  // Q-code last two chars indicate condition
  if (qcode.endsWith("LC") || qcode.endsWith("CL")) return "Closed";
  if (qcode.endsWith("AS") || qcode.endsWith("US")) return "Unserviceable";
  if (qcode.endsWith("LT")) return "Limitations";
  return "Other";
}

// ─── Notamify source (worldwide) ───

interface NotamifyEntry {
  raw_id: string;
  icao: string;
  location: string;
  message: string;
  starts_at: string;
  ends_at: string;
  icao_message: string;
  all: string;
  Subject?: string;
  Condition?: string;
  Qcode?: string;
  has_active_range?: boolean;
}

function isOperational(subject: string, qcode: string, message: string): boolean {
  if (OPERATIONAL_SUBJECTS.has(subject)) return true;
  if (OPERATIONAL_QCODE_PREFIXES.some((p) => qcode.startsWith(p))) return true;
  // Check message keywords
  const upper = message.toUpperCase();
  return /\bRWY\b|\bTWY\b|\bILS\b|\bVOR\b|\bDME\b|\bNDB\b|\bPAPI\b|\bCLSD\b|\bU\/S\b|\bFUEL\b/.test(upper);
}

/** Extract a field value from a chunk of double-escaped RSC JSON */
function extractField(chunk: string, field: string): string {
  // Handles both \\"field\\":\\"value\\" and "field":"value"
  const re = new RegExp(`\\\\?"${field}\\\\?":\\s*\\\\?"((?:[^"\\\\]|\\\\.)*)\\\\?"`);
  const m = chunk.match(re);
  if (!m) return "";
  return m[1].replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\\\"/g, '"').replace(/\\"/g, '"');
}

async function fetchFromNotamify(icao: string): Promise<Notam[]> {
  try {
    const res = await fetch(`https://notamify.com/notams/${icao}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ATIS-EU/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const html = await res.text();

    // Find each raw_id occurrence and extract surrounding fields
    const entries: NotamifyEntry[] = [];
    const rawIdRe = /\\?"raw_id\\?":\s*\\?"([A-Z]\d{3,5}\/\d{2})\\?"/g;
    let idMatch;
    while ((idMatch = rawIdRe.exec(html)) !== null) {
      // Grab a window around this NOTAM (they're ~1500 chars each)
      const start = Math.max(0, idMatch.index - 200);
      const end = Math.min(html.length, idMatch.index + 2500);
      const chunk = html.slice(start, end);

      const entryIcao = extractField(chunk, "icao");
      if (entryIcao !== icao) continue;

      const rawId = idMatch[1];
      const message = extractField(chunk, "message");
      const startsAt = extractField(chunk, "starts_at");
      const endsAt = extractField(chunk, "ends_at");
      const icaoMessage = extractField(chunk, "icao_message");
      const all = icaoMessage || extractField(chunk, "all");

      if (!message || !startsAt) continue;

      entries.push({
        raw_id: rawId,
        icao: entryIcao,
        location: entryIcao,
        message,
        starts_at: startsAt,
        ends_at: endsAt,
        icao_message: icaoMessage,
        all,
      });
    }

    if (entries.length === 0) return [];

    const now = new Date();

    return entries
      .filter((n) => {
        const start = new Date(n.starts_at);
        const end = new Date(n.ends_at);
        if (start > now || end < now) return false;
        const qMatch = n.all.match(/Q\)\s*\w+\/(\w+)\//);
        const qcode = qMatch?.[1] ?? "";
        const subject = guessSubject(qcode, n.message);
        return isOperational(subject, qcode, n.message);
      })
      .map((n) => {
        const qMatch = n.all.match(/Q\)\s*\w+\/(\w+)\//);
        const qcode = qMatch?.[1] ?? "";
        const subject = guessSubject(qcode, n.message);
        const condition = guessCondition(qcode, n.message);
        return {
          id: n.raw_id,
          subject,
          condition,
          message: cleanMessage(n.message),
          startDate: n.starts_at,
          endDate: n.ends_at,
          raw: n.all,
          severity: getSeverity(condition, n.message),
        };
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 15);
  } catch {
    return [];
  }
}

// ─── ICAO source (France fallback) ───

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

async function fetchFromIcao(icao: string): Promise<Notam[]> {
  try {
    const url = `https://v4p4sz5ijk.execute-api.us-east-1.amazonaws.com/anbdata/states/notams/notams-list?api_key=test&format=json&locations=${encodeURIComponent(icao)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data: IcaoNotam[] = await res.json();
    const now = new Date();

    return data
      .filter((n) => {
        if (!OPERATIONAL_SUBJECTS.has(n.Subject)) return false;
        if (n.location !== icao) return false;
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
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 15);
  } catch {
    return [];
  }
}

// ─── Main fetch: try Notamify first, fallback to ICAO for French airports ───

export async function fetchNotams(icao: string): Promise<Notam[]> {
  // Try Notamify first (worldwide coverage)
  const notamify = await fetchFromNotamify(icao);
  if (notamify.length > 0) return notamify;

  // Fallback to ICAO API (only works for French airports LF*)
  if (icao.startsWith("LF")) {
    return fetchFromIcao(icao);
  }

  return [];
}
