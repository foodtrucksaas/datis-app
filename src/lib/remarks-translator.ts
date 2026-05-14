/**
 * Translates D-ATIS telegraphic remarks into readable French.
 * Unknown patterns are returned as-is.
 */

interface RemarkPattern {
  pattern: RegExp;
  render: (m: RegExpMatchArray) => string;
}

const patterns: RemarkPattern[] = [
  { pattern: /^TWY (\S+) PARTIALLY CLSD$/i, render: (m) => `TWY ${m[1]} partiellement fermé` },
  { pattern: /^TWY (\S+) CLSD$/i, render: (m) => `TWY ${m[1]} fermé` },
  { pattern: /^RWY (\S+) CLSD$/i, render: (m) => `Piste ${m[1]} fermée` },
  { pattern: /^RWY (\S+) CLOSED$/i, render: (m) => `Piste ${m[1]} fermée` },
  { pattern: /^AD CLSD$/i, render: () => `Aérodrome fermé` },
  { pattern: /^BIRD ACTIVITY RPRTD$/i, render: () => `Activité oiseaux signalée` },
  { pattern: /^BIRD ACT(?:IVITY)?$/i, render: () => `Activité oiseaux` },
  { pattern: /^LOW LEVEL WIND SHEAR$/i, render: () => `Cisaillement de vent en basse couche` },
  { pattern: /^LLWS$/i, render: () => `Cisaillement de vent (LLWS)` },
  { pattern: /^CONFIRM ATIS (\w) ON FIRST CTC (\d+)$/i, render: (m) => `Confirmer ATIS ${m[1]} au premier contact · ${m[2]}` },
  { pattern: /^CONFIRM ATIS (\w)$/i, render: (m) => `Confirmer ATIS ${m[1]}` },
  { pattern: /^ACK ATIS (\w)$/i, render: (m) => `Accuser réception ATIS ${m[1]}` },
  { pattern: /^ILS (\S+) NOT AVBL$/i, render: (m) => `ILS ${m[1]} indisponible` },
  { pattern: /^ILS (\S+) U\/S$/i, render: (m) => `ILS ${m[1]} hors service` },
  { pattern: /^VOR (\S+) NOT AVBL$/i, render: (m) => `VOR ${m[1]} indisponible` },
  { pattern: /^VOR (\S+) U\/S$/i, render: (m) => `VOR ${m[1]} hors service` },
  { pattern: /^DVOR (\S+) U\/S$/i, render: (m) => `DVOR ${m[1]} hors service` },
  { pattern: /^DME (\S+) U\/S$/i, render: (m) => `DME ${m[1]} hors service` },
  { pattern: /^SID (\S+) NOT AVBL$/i, render: (m) => `SID ${m[1]} indisponible` },
  { pattern: /^STAR (\S+) NOT AVBL$/i, render: (m) => `STAR ${m[1]} indisponible` },
  { pattern: /^APRON (\S+) CLSD$/i, render: (m) => `Parking ${m[1]} fermé` },
  { pattern: /^CRANE[S]? (\d+)\s*FT/i, render: (m) => `Grue(s) ${m[1]} ft` },
  { pattern: /^CONSTRUCTION IN PROGRESS/i, render: () => `Travaux en cours` },
  { pattern: /^WIP/i, render: () => `Travaux en cours` },
  { pattern: /^CAUTION (?:WORK IN PROGRESS|WIP)/i, render: () => `Attention travaux en cours` },
  { pattern: /^FOD RISK/i, render: () => `Risque FOD` },
  { pattern: /^NO INTERSECTION DEP/i, render: () => `Pas de décollage intersection` },
  { pattern: /^FOLLOW ME AVBL/i, render: () => `Follow-me disponible` },
  { pattern: /^DEP FREQ (\S+)/i, render: (m) => `Fréquence départ ${m[1]}` },
  { pattern: /^APP FREQ (\S+)/i, render: (m) => `Fréquence approche ${m[1]}` },
  { pattern: /^SNOWTAM/i, render: () => `SNOWTAM en vigueur` },
];

export function translateRemark(raw: string): { text: string; translated: boolean } {
  const trimmed = raw.trim();
  for (const { pattern, render } of patterns) {
    const match = trimmed.match(pattern);
    if (match) return { text: render(match), translated: true };
  }
  return { text: trimmed, translated: false };
}

export function translateRemarks(rawRemarks: string[]): { text: string; translated: boolean }[] {
  return rawRemarks.map(translateRemark);
}
