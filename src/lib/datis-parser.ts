/**
 * Enhanced D-ATIS parser.
 * Extracts structured fields from raw ATIS body text.
 */

export interface DatisFields {
  letter: string;
  type: "ARR" | "DEP" | null;
  emissionTime: string | null; // "1412Z"
  approachExpected: string | null; // "Expect ILS 27R"
  arrivalRunways: string[];
  departureRunways: string[];
  sids: string[];
  transitionLevel: string; // "FL070" or "N/A"
  wind: { direction: number | "VRB"; speed_kt: number; gust_kt?: number } | null;
  windRaw: string; // "250°/12 kt G25"
  visibility: string; // "CAVOK", "8000 m", "10 km+"
  clouds: { type: string; base_ft: number; cb?: boolean }[];
  temperature_c: number | null;
  dewpoint_c: number | null;
  qnh_hpa: number | null;
  rscd: { runway: string; time: string; state: string }[];
  remarks: string[];
  confirmation: string | null; // "Confirm ATIS X on first CTC 1234"
}

const PHONETIC: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
  F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliet",
  K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
  P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
  U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray",
  Y: "Yankee", Z: "Zulu",
};

export function phoneticLetter(letter: string): string {
  return PHONETIC[letter.toUpperCase()] ?? letter;
}

function parseTemp(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/^\+/, "");
  if (cleaned.startsWith("M")) return -parseInt(cleaned.slice(1));
  return parseInt(cleaned);
}

function parseRunways(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(/(?:\s+AND\s+|[\/,\s]+)/i)
    .filter((r) => /^\d{2}[LRC]?$/.test(r));
}

export function parseDatis(
  body: string,
  meta: { letter: string; type: "ARR" | "DEP" | null }
): DatisFields {
  // --- Emission time ---
  const timeMatch = body.match(/(\d{4})Z/);

  // --- Approach expected ---
  const approachMatch =
    body.match(/EXP(?:ECT)?\s+([\w\s\/]+?(?:ILS|RNAV|VOR|NDB|LOC|RNP|VISUAL)[\w\s\/]*?)(?=\s*\n|\s*RWY|\s*TRL|\s*WIND|$)/i) ||
    body.match(/EXP(?:ECT)?\s+(.*?)(?=\s*\n|\s*$)/im);

  // --- Runways ---
  const rwyInUseMatch = body.match(
    /RWY\s+IN\s+USE\s*([\w\s\/]+?)(?=\s*\n|\s*$)/im
  );
  const rwyForLanding = body.match(
    /RWY\s+(\d{2}[LRC]?)\s+FOR\s+LAND/i
  );
  const rwyForTakeoff = body.match(
    /RWY\s+(\d{2}[LRC]?)\s+FOR\s+(?:TAKE\s*OFF|DEP)/i
  );
  const arrRwyMatch =
    body.match(
      /(?:LANDING|ARR(?:IVAL)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]DEP|\s+SID|\s*\n|\s*$)/i
    ) ||
    body.match(
      /(?:LDG)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]DEP|\s+SID|\s*\n|\s*$)/i
    ) ||
    rwyForLanding ||
    (meta.type === "ARR" ? rwyInUseMatch : null);
  const depRwyMatch =
    body.match(
      /(?:[\/\s]DEP(?:ARTURE)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]ARR|\s+SID|\s*[\/]|\s*\n|\s*$)/i
    ) ||
    body.match(
      /(?:DEP(?:ARTURE)?)\s+RWY\s*([\w\s]+?)(?=\s*[\/\s]ARR|\s+SID|\s*[\/]|\s*\n|\s*$)/i
    ) ||
    rwyForTakeoff ||
    (meta.type === "DEP" ? rwyInUseMatch : null);

  // --- SIDs ---
  const sidMatch = body.match(/SID[S]?\s+([\w\s,\/]+?)(?=\s*\n|\s*WIND|\s*TRL|\s*$)/i);
  const sids = sidMatch
    ? sidMatch[1].split(/[,\/\s]+/).filter((s) => s.length > 1)
    : [];

  // --- Wind ---
  const vrbMatch = body.match(
    /VRB\s*\/?\s*(\d{1,3})\s*(G\s*(\d{1,3}))?\s*KT/i
  );
  const windMatch =
    body.match(
      /WIND\s+(\d{3})\s*[\/]?\s*(\d{1,3})\s*(G\s*(\d{1,3}))?\s*KT/i
    ) || body.match(/(\d{3})(\d{2,3})(G(\d{2,3}))?KT/);

  let wind: DatisFields["wind"] = null;
  let windRaw = "N/A";
  if (vrbMatch) {
    const spd = parseInt(vrbMatch[1]);
    const gust = vrbMatch[3] ? parseInt(vrbMatch[3]) : undefined;
    wind = { direction: "VRB", speed_kt: spd, gust_kt: gust };
    windRaw = `VRB ${spd} kt${gust ? ` G${gust}` : ""}`;
  } else if (windMatch) {
    const dir = parseInt(windMatch[1]);
    const spd = parseInt(windMatch[2]);
    const gust = windMatch[4] ? parseInt(windMatch[4]) : undefined;
    wind = { direction: dir, speed_kt: spd, gust_kt: gust };
    windRaw = `${dir}°/${spd} kt${gust ? ` G${gust}` : ""}`;
  }

  // --- QNH ---
  const qnhMatch =
    body.match(/QNH\s*(\d{3,4})/i) || body.match(/Q(\d{4})/i);

  // --- Visibility ---
  let visibility = "N/A";
  if (/CAVOK/i.test(body)) {
    visibility = "CAVOK";
  } else {
    const visKm = body.match(/VIS\s+(\d+)\s*KM/i);
    const visM = body.match(/VIS\s+(\d{4})\s*M?(?:\s|$)/i);
    if (visKm) {
      visibility = `${visKm[1]} km`;
    } else if (visM) {
      const m = parseInt(visM[1]);
      visibility = m === 9999 ? "10 km+" : `${m} m`;
    }
  }

  // --- Transition level ---
  const tlMatch = body.match(
    /(?:TRANSITION[- ]?LEVEL|TRL?)\s*:?\s*(FL\s*\d+|\d+)/i
  );
  let transitionLevel = "N/A";
  if (tlMatch) {
    const raw = tlMatch[1].replace(/\s/g, "").toUpperCase();
    transitionLevel = raw.startsWith("FL") ? raw : `FL${raw.padStart(3, "0")}`;
  }

  // --- Clouds ---
  const cloudPattern =
    /\b(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?\b/gi;
  const clouds: DatisFields["clouds"] = [];
  let cloudMatch;
  while ((cloudMatch = cloudPattern.exec(body)) !== null) {
    clouds.push({
      type: cloudMatch[1].toUpperCase(),
      base_ft: parseInt(cloudMatch[2]) * 100,
      cb: cloudMatch[3]?.toUpperCase() === "CB" || undefined,
    });
  }

  // --- Temperature / Dewpoint ---
  const tempAtisFmt = body.match(
    /T\s*([+-]?\d{1,2})\s+DP\s*([+-]?\d{1,2})/i
  );
  const tempMetarFmt = body.match(/(?:^|\s)(M?\d{2})\/(M?\d{2})(?:\s|$)/m);
  const tempMatch = tempAtisFmt || tempMetarFmt;

  // --- RSCD (Runway Surface Condition) ---
  const rscd: DatisFields["rscd"] = [];
  const rscdPattern =
    /(?:RWY\s+)?(\d{2}[LRC]?)\s+(?:AT\s+)?(\d{4}Z?)\s+(WET|DRY|DAMP|ICE|SNOW|SLUSH|FROST|FLOODED|CONTAMINATED|[\d\/]+)/gi;
  let rscdMatch;
  while ((rscdMatch = rscdPattern.exec(body)) !== null) {
    rscd.push({
      runway: rscdMatch[1],
      time: rscdMatch[2],
      state: rscdMatch[3],
    });
  }

  // --- Remarks ---
  const remarks: string[] = [];
  const remarksSection = body.match(
    /(?:REMARKS?|OPS?\s*INFO|NOTAM|INFO)\s*[:\-]?\s*([\s\S]+?)(?=\s*CONFIRM|\s*ACK|\s*$)/i
  );
  if (remarksSection) {
    const lines = remarksSection[1]
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
    remarks.push(...lines);
  }

  // --- Confirmation ---
  const confirmMatch = body.match(
    /CONFIRM\s+ATIS\s+(\w)\s+(?:ON\s+)?(?:FIRST\s+)?(?:CTC|CONTACT)\s*(\d*)/i
  );

  return {
    letter: meta.letter,
    type: meta.type,
    emissionTime: timeMatch ? `${timeMatch[1]}Z` : null,
    approachExpected: approachMatch?.[1]?.trim() ?? null,
    arrivalRunways: parseRunways(arrRwyMatch?.[1]),
    departureRunways: parseRunways(depRwyMatch?.[1]),
    sids,
    transitionLevel,
    wind,
    windRaw,
    visibility,
    clouds,
    temperature_c: tempMatch ? parseTemp(tempMatch[1]) : null,
    dewpoint_c: tempMatch ? parseTemp(tempMatch[2]) : null,
    qnh_hpa: qnhMatch ? parseInt(qnhMatch[1]) : null,
    rscd,
    remarks,
    confirmation: confirmMatch
      ? `Confirmer ATIS ${confirmMatch[1]}${confirmMatch[2] ? ` au premier contact · ${confirmMatch[2]}` : ""}`
      : null,
  };
}
