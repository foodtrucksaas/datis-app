export interface DecodedToken {
  label: string;
  value: string;
  color?: "fresh" | "warm" | "stale";
  raw: string;
}

/**
 * Parse a METAR string into human-readable decoded tokens.
 * Designed to never throw — unrecognised tokens are returned raw.
 */
export function parseMetar(raw: string): DecodedToken[] {
  const tokens: DecodedToken[] = [];
  // Remove "METAR" prefix and ICAO
  let str = raw.trim();
  if (str.startsWith("METAR")) str = str.slice(5).trim();
  // Remove ICAO (4 uppercase letters)
  str = str.replace(/^[A-Z]{4}\s*/, "");

  const parts = str.split(/\s+/);
  let i = 0;

  while (i < parts.length) {
    const p = parts[i];

    // Time group: ddhhmmZ
    if (/^\d{6}Z$/.test(p)) {
      const dd = p.slice(0, 2);
      const hh = p.slice(2, 4);
      const mm = p.slice(4, 6);
      tokens.push({
        label: "Observation",
        value: `Jour ${dd} à ${hh}:${mm} UTC`,
        raw: p,
      });
      i++;
      continue;
    }

    // Wind: dddffGffKT (with optional variable)
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

      let color: DecodedToken["color"];
      const gustMatch = p.match(/G(\d+)/);
      const spdMatch = p.match(/\d{3}(\d{2,3})/);
      const speed = spdMatch ? parseInt(spdMatch[1]) : 0;
      const gust = gustMatch ? parseInt(gustMatch[1]) : 0;
      if (gust >= 30 || speed >= 30) color = "stale";
      else if (gust >= 20 || speed >= 20) color = "warm";

      tokens.push({ label: "Vent", value, color, raw: p });

      // Check variable wind direction next
      if (i + 1 < parts.length && /^\d{3}V\d{3}$/.test(parts[i + 1])) {
        i++;
        const [from, to] = parts[i].split("V");
        tokens.push({
          label: "Direction variable",
          value: `${from}° à ${to}°`,
          raw: parts[i],
        });
      }
      i++;
      continue;
    }

    // CAVOK
    if (p === "CAVOK") {
      tokens.push({
        label: "Visibilité",
        value: "CAVOK (plafond et visibilité OK)",
        color: "fresh",
        raw: p,
      });
      i++;
      continue;
    }

    // Visibility in meters
    if (/^\d{4}$/.test(p) && parseInt(p) <= 9999) {
      const vis = parseInt(p);
      let color: DecodedToken["color"];
      if (vis < 1500) color = "stale";
      else if (vis < 5000) color = "warm";
      tokens.push({
        label: "Visibilité",
        value: vis === 9999 ? "10 km ou plus" : `${vis} m`,
        color,
        raw: p,
      });
      i++;
      continue;
    }

    // Weather phenomena
    if (/^[-+]?(VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)+$/.test(p)) {
      const wxMap: Record<string, string> = {
        DZ: "bruine", RA: "pluie", SN: "neige", SG: "neige en grains",
        IC: "cristaux de glace", PL: "granules de glace", GR: "grêle",
        GS: "grésil", UP: "précipitations non identifiées",
        BR: "brume", FG: "brouillard", FU: "fumée", VA: "cendres volcaniques",
        DU: "poussière", SA: "sable", HZ: "brume sèche",
        PO: "tourbillons de poussière", SQ: "grains", FC: "trombe",
        SS: "tempête de sable", DS: "tempête de poussière",
        TS: "orage", SH: "averses", FZ: "givrant",
        MI: "mince", PR: "partiel", BC: "bancs", DR: "chasse basse",
        BL: "chasse élevée",
      };
      let intensity = "";
      let cleaned = p;
      if (cleaned.startsWith("+")) { intensity = "fort "; cleaned = cleaned.slice(1); }
      else if (cleaned.startsWith("-")) { intensity = "faible "; cleaned = cleaned.slice(1); }
      if (cleaned.startsWith("VC")) { intensity += "au voisinage "; cleaned = cleaned.slice(2); }

      const translated = cleaned.match(/.{2}/g)?.map(c => wxMap[c] || c).join(", ") || cleaned;
      let color: DecodedToken["color"];
      if (p.includes("TS") || p.includes("FG") || p.includes("+")) color = "stale";
      else if (p.includes("RA") || p.includes("SN") || p.includes("BR")) color = "warm";

      tokens.push({
        label: "Temps présent",
        value: `${intensity}${translated}`,
        color,
        raw: p,
      });
      i++;
      continue;
    }

    // Cloud layers
    if (/^(FEW|SCT|BKN|OVC|SKC|NSC|NCD|CLR)\d{0,3}(CB|TCU)?$/.test(p)) {
      const coverMap: Record<string, string> = {
        FEW: "Quelques (1-2/8)", SCT: "Épars (3-4/8)",
        BKN: "Fragmenté (5-7/8)", OVC: "Couvert (8/8)",
        SKC: "Ciel clair", NSC: "Pas de nuage significatif",
        NCD: "Aucun nuage détecté", CLR: "Ciel clair",
      };
      const cover = p.slice(0, 3);
      const altStr = p.slice(3).replace(/CB|TCU/, "");
      const suffix = p.includes("CB") ? " (cumulonimbus)" : p.includes("TCU") ? " (cumulus bourgeonnant)" : "";
      let value: string;
      if (altStr) {
        const feet = parseInt(altStr) * 100;
        value = `${coverMap[cover] || cover} à ${feet} ft${suffix}`;
      } else {
        value = `${coverMap[cover] || cover}${suffix}`;
      }

      let color: DecodedToken["color"];
      if (altStr) {
        const feet = parseInt(altStr) * 100;
        if ((cover === "BKN" || cover === "OVC") && feet < 500) color = "stale";
        else if ((cover === "BKN" || cover === "OVC") && feet < 1500) color = "warm";
      }
      if (p.includes("CB")) color = "stale";

      tokens.push({ label: "Nuages", value, color, raw: p });
      i++;
      continue;
    }

    // Temperature / dewpoint
    if (/^M?\d{2}\/M?\d{2}$/.test(p)) {
      const [tStr, dStr] = p.split("/");
      const temp = tStr.startsWith("M") ? -parseInt(tStr.slice(1)) : parseInt(tStr);
      const dew = dStr.startsWith("M") ? -parseInt(dStr.slice(1)) : parseInt(dStr);
      tokens.push({
        label: "Température / Point de rosée",
        value: `${temp}°C / ${dew}°C`,
        raw: p,
      });
      i++;
      continue;
    }

    // QNH
    if (/^Q\d{4}$/.test(p)) {
      const qnh = parseInt(p.slice(1));
      tokens.push({
        label: "QNH",
        value: `${qnh} hPa`,
        raw: p,
      });
      i++;
      continue;
    }

    // NOSIG / TEMPO / BECMG trend
    if (p === "NOSIG") {
      tokens.push({
        label: "Tendance",
        value: "Pas de changement significatif prévu",
        raw: p,
      });
      i++;
      continue;
    }

    if (p === "TEMPO" || p === "BECMG") {
      const trend = p === "TEMPO" ? "Temporairement" : "Évoluant vers";
      const remaining = parts.slice(i + 1).join(" ");
      tokens.push({
        label: "Tendance",
        value: `${trend} : ${remaining}`,
        color: "warm",
        raw: parts.slice(i).join(" "),
      });
      // consume rest
      i = parts.length;
      continue;
    }

    // Unrecognised — pass through
    tokens.push({
      label: "Donnée",
      value: `${p} (non décodé)`,
      raw: p,
    });
    i++;
  }

  return tokens;
}
