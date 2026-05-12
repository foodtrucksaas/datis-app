export interface TafPeriod {
  type: "base" | "TEMPO" | "BECMG" | "PROB30" | "PROB40" | "FM";
  from: string;
  to: string;
  tokens: TafToken[];
}

export interface TafToken {
  label: string;
  value: string;
  color?: "fresh" | "warm" | "stale";
  raw: string;
}

/**
 * Parse a TAF string into periods with decoded tokens.
 * Never throws — unrecognised tokens are returned raw.
 */
export function parseTaf(raw: string): { validity: string; issuedAt: string; periods: TafPeriod[] } {
  let str = raw.trim();
  if (str.startsWith("TAF")) str = str.slice(3).trim();
  // Remove ICAO
  str = str.replace(/^[A-Z]{4}\s*/, "");

  const parts = str.split(/\s+/);
  let i = 0;

  // Issued time
  let issuedAt = "";
  if (i < parts.length && /^\d{6}Z$/.test(parts[i])) {
    const p = parts[i];
    issuedAt = `${p.slice(0, 2)}/${p.slice(2, 4)}:${p.slice(4, 6)} UTC`;
    i++;
  }

  // Validity period
  let validity = "";
  if (i < parts.length && /^\d{4}\/\d{4}$/.test(parts[i])) {
    const [from, to] = parts[i].split("/");
    validity = `${from.slice(0, 2)}j ${from.slice(2)}:00 → ${to.slice(0, 2)}j ${to.slice(2)}:00 UTC`;
    i++;
  }

  const periods: TafPeriod[] = [];
  let currentPeriod: TafPeriod = { type: "base", from: "", to: "", tokens: [] };

  while (i < parts.length) {
    const p = parts[i];

    // New period markers
    if (p === "TEMPO" || p === "BECMG") {
      if (currentPeriod.tokens.length > 0 || currentPeriod.type === "base") {
        periods.push(currentPeriod);
      }
      currentPeriod = { type: p, from: "", to: "", tokens: [] };
      // Check for time range next
      if (i + 1 < parts.length && /^\d{4}\/\d{4}$/.test(parts[i + 1])) {
        i++;
        const [from, to] = parts[i].split("/");
        currentPeriod.from = `${from.slice(0, 2)}j ${from.slice(2)}:00`;
        currentPeriod.to = `${to.slice(0, 2)}j ${to.slice(2)}:00`;
      }
      i++;
      continue;
    }

    if (/^PROB(30|40)$/.test(p)) {
      if (currentPeriod.tokens.length > 0 || currentPeriod.type === "base") {
        periods.push(currentPeriod);
      }
      currentPeriod = { type: p as TafPeriod["type"], from: "", to: "", tokens: [] };
      // Optional TEMPO after PROB
      if (i + 1 < parts.length && parts[i + 1] === "TEMPO") {
        i++;
      }
      if (i + 1 < parts.length && /^\d{4}\/\d{4}$/.test(parts[i + 1])) {
        i++;
        const [from, to] = parts[i].split("/");
        currentPeriod.from = `${from.slice(0, 2)}j ${from.slice(2)}:00`;
        currentPeriod.to = `${to.slice(0, 2)}j ${to.slice(2)}:00`;
      }
      i++;
      continue;
    }

    if (/^FM\d{6}$/.test(p)) {
      if (currentPeriod.tokens.length > 0 || currentPeriod.type === "base") {
        periods.push(currentPeriod);
      }
      const hh = p.slice(2, 4);
      const mm = p.slice(4, 6);
      currentPeriod = {
        type: "FM",
        from: `${p.slice(2, 4)}:${mm}`,
        to: "",
        tokens: [],
      };
      void hh; // used above in from
      i++;
      continue;
    }

    // Decode individual tokens (reuse METAR-like logic)
    const token = decodeTafToken(p);
    currentPeriod.tokens.push(token);
    i++;
  }

  if (currentPeriod.tokens.length > 0 || periods.length === 0) {
    periods.push(currentPeriod);
  }

  return { validity, issuedAt, periods };
}

function decodeTafToken(p: string): TafToken {
  // Wind
  if (/^\d{3}\d{2,3}(G\d{2,3})?KT$/.test(p) || p === "00000KT" || /^VRB\d{2,3}KT$/.test(p)) {
    let value: string;
    if (p === "00000KT") {
      value = "Calme";
    } else if (p.startsWith("VRB")) {
      const speed = p.match(/VRB(\d{2,3})KT/)?.[1];
      value = `Variable à ${speed} kt`;
    } else {
      const dir = p.slice(0, 3);
      const rest = p.slice(3).replace("KT", "");
      if (rest.includes("G")) {
        const [spd, gust] = rest.split("G");
        value = `${dir}° / ${parseInt(spd)} kt, rafales ${parseInt(gust)} kt`;
      } else {
        value = `${dir}° / ${parseInt(rest)} kt`;
      }
    }
    let color: TafToken["color"];
    const gustMatch = p.match(/G(\d+)/);
    if (gustMatch && parseInt(gustMatch[1]) >= 30) color = "stale";
    else if (gustMatch && parseInt(gustMatch[1]) >= 20) color = "warm";
    return { label: "Vent", value, color, raw: p };
  }

  // CAVOK
  if (p === "CAVOK") {
    return { label: "Visibilité", value: "CAVOK", color: "fresh", raw: p };
  }

  // Visibility
  if (/^\d{4}$/.test(p) && parseInt(p) <= 9999) {
    const vis = parseInt(p);
    let color: TafToken["color"];
    if (vis < 1500) color = "stale";
    else if (vis < 5000) color = "warm";
    return {
      label: "Visibilité",
      value: vis === 9999 ? "10 km ou plus" : `${vis} m`,
      color,
      raw: p,
    };
  }

  // Weather
  if (/^[-+]?(VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)+$/.test(p)) {
    const wxMap: Record<string, string> = {
      DZ: "bruine", RA: "pluie", SN: "neige", SG: "neige en grains",
      IC: "cristaux de glace", PL: "granules de glace", GR: "grêle",
      GS: "grésil", BR: "brume", FG: "brouillard", FU: "fumée",
      HZ: "brume sèche", TS: "orage", SH: "averses", FZ: "givrant",
      "+": "fort", "-": "faible",
    };
    let intensity = "";
    let cleaned = p;
    if (cleaned.startsWith("+")) { intensity = "fort "; cleaned = cleaned.slice(1); }
    else if (cleaned.startsWith("-")) { intensity = "faible "; cleaned = cleaned.slice(1); }
    const translated = cleaned.match(/.{2}/g)?.map(c => wxMap[c] || c).join(", ") || cleaned;
    let color: TafToken["color"];
    if (p.includes("TS") || p.includes("+")) color = "stale";
    else if (p.includes("RA") || p.includes("SN")) color = "warm";
    return { label: "Temps", value: `${intensity}${translated}`, color, raw: p };
  }

  // Clouds
  if (/^(FEW|SCT|BKN|OVC|SKC|NSC)\d{0,3}(CB|TCU)?$/.test(p)) {
    const coverMap: Record<string, string> = {
      FEW: "Quelques", SCT: "Épars", BKN: "Fragmenté", OVC: "Couvert",
      SKC: "Ciel clair", NSC: "Pas de nuage significatif",
    };
    const cover = p.slice(0, 3);
    const altStr = p.slice(3).replace(/CB|TCU/, "");
    const suffix = p.includes("CB") ? " CB" : p.includes("TCU") ? " TCU" : "";
    let value: string;
    if (altStr) {
      value = `${coverMap[cover] || cover} ${parseInt(altStr) * 100} ft${suffix}`;
    } else {
      value = `${coverMap[cover] || cover}${suffix}`;
    }
    let color: TafToken["color"];
    if (p.includes("CB")) color = "stale";
    else if (altStr && parseInt(altStr) * 100 < 1500 && (cover === "BKN" || cover === "OVC")) color = "warm";
    return { label: "Nuages", value, color, raw: p };
  }

  // NSC
  if (p === "NSC") return { label: "Nuages", value: "Pas de nuage significatif", raw: p };

  // Unrecognised
  return { label: "Donnée", value: `${p} (non décodé)`, raw: p };
}
