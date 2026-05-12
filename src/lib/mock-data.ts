import type { AtisRecord, MetarRecord, TafRecord } from "./types";

/**
 * Mock data for 5 European airports.
 * Times are relative — receivedAt is "now minus N minutes" computed at runtime.
 */

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

function utcTime(hoursAgo: number = 0): string {
  const d = new Date(Date.now() - hoursAgo * 3_600_000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}${mm}`;
}

function today(): string {
  return String(new Date().getUTCDate()).padStart(2, "0");
}

export function getMockAtis(icao: string): AtisRecord | null {
  const dd = today();
  const time = utcTime(0.2); // ~12 min ago

  const data: Record<string, AtisRecord> = {
    LFPG: {
      icao: "LFPG",
      raw: `LFPG ARR ATIS B ${dd}${time}Z RWY 27R 26L TRL FL070 WIND 250/12KT QNH 1018 TEMPO 25015G25KT VIS 9999 FEW040 T14/08 NOSIG`,
      fields: {
        letter: "B",
        arrivalRunways: ["27R", "26L"],
        departureRunways: ["27R"],
        wind: "250°/12 kt",
        qnh: 1018,
        visibility: "CAVOK",
        transitionLevel: "FL070",
        temperature: 14,
        dewpoint: 8,
        remarks: "TEMPO 25015G25KT",
      },
      receivedAt: minutesAgo(12),
      emittedAt: minutesAgo(14),
    },
    LFPB: {
      icao: "LFPB",
      raw: `LFPB ATIS D ${dd}${utcTime(0.5)}Z RWY 07 TRL FL060 WIND 070/08KT QNH 1019 VIS 9999 SCT035 T12/07`,
      fields: {
        letter: "D",
        arrivalRunways: ["07"],
        departureRunways: ["07"],
        wind: "070°/08 kt",
        qnh: 1019,
        visibility: "9999 m",
        transitionLevel: "FL060",
        temperature: 12,
        dewpoint: 7,
        remarks: null,
      },
      receivedAt: minutesAgo(30),
      emittedAt: minutesAgo(33),
    },
    EGLL: {
      icao: "EGLL",
      raw: `EGLL ATIS K ${dd}${utcTime(0.1)}Z RWY 27L ARR 27R DEP TRL FL070 WIND 260/18G28KT QNH 1012 VIS 8000 RA SCT012 BKN020 T09/07 TEMPO 4000 +RA BKN008`,
      fields: {
        letter: "K",
        arrivalRunways: ["27L"],
        departureRunways: ["27R"],
        wind: "260°/18 kt G28",
        qnh: 1012,
        visibility: "8000 m",
        transitionLevel: "FL070",
        temperature: 9,
        dewpoint: 7,
        remarks: "TEMPO 4000 +RA BKN008",
      },
      receivedAt: minutesAgo(6),
      emittedAt: minutesAgo(8),
    },
    EDDF: {
      icao: "EDDF",
      raw: `EDDF ATIS M ${dd}${utcTime(0.3)}Z RWY 25C ARR 25L DEP TRL FL070 WIND 240/14KT QNH 1015 CAVOK T16/09`,
      fields: {
        letter: "M",
        arrivalRunways: ["25C"],
        departureRunways: ["25L"],
        wind: "240°/14 kt",
        qnh: 1015,
        visibility: "CAVOK",
        transitionLevel: "FL070",
        temperature: 16,
        dewpoint: 9,
        remarks: null,
      },
      receivedAt: minutesAgo(18),
      emittedAt: minutesAgo(20),
    },
    EHAM: {
      icao: "EHAM",
      raw: `EHAM ATIS R ${dd}${utcTime(0.8)}Z RWY 18R ARR 24 DEP TRL FL040 WIND 190/22G35KT QNH 1008 VIS 5000 -SHRA FEW008CB BKN015 T11/09 TEMPO 2000 +TSRA SCT008CB`,
      fields: {
        letter: "R",
        arrivalRunways: ["18R"],
        departureRunways: ["24"],
        wind: "190°/22 kt G35",
        qnh: 1008,
        visibility: "5000 m",
        transitionLevel: "FL040",
        temperature: 11,
        dewpoint: 9,
        remarks: "TEMPO 2000 +TSRA SCT008CB",
      },
      receivedAt: minutesAgo(48),
      emittedAt: minutesAgo(52),
    },
  };

  return data[icao.toUpperCase()] ?? null;
}

export function getMockMetar(icao: string): MetarRecord | null {
  const dd = today();
  const time = utcTime(0.15);

  const data: Record<string, MetarRecord> = {
    LFPG: {
      icao: "LFPG",
      raw: `METAR LFPG ${dd}${time}Z 25012KT 9999 FEW040 14/08 Q1018 NOSIG`,
      receivedAt: minutesAgo(9),
    },
    LFPB: {
      icao: "LFPB",
      raw: `METAR LFPB ${dd}${utcTime(0.4)}Z 07008KT 9999 SCT035 12/07 Q1019 NOSIG`,
      receivedAt: minutesAgo(24),
    },
    EGLL: {
      icao: "EGLL",
      raw: `METAR EGLL ${dd}${time}Z 26018G28KT 8000 RA SCT012 BKN020 09/07 Q1012 TEMPO 4000 +RA BKN008`,
      receivedAt: minutesAgo(5),
    },
    EDDF: {
      icao: "EDDF",
      raw: `METAR EDDF ${dd}${time}Z 24014KT CAVOK 16/09 Q1015 NOSIG`,
      receivedAt: minutesAgo(10),
    },
    EHAM: {
      icao: "EHAM",
      raw: `METAR EHAM ${dd}${time}Z 19022G35KT 5000 -SHRA FEW008CB BKN015 11/09 Q1008 TEMPO 2000 +TSRA SCT008CB`,
      receivedAt: minutesAgo(7),
    },
  };

  return data[icao.toUpperCase()] ?? null;
}

export function getMockTaf(icao: string): TafRecord | null {
  const dd = today();
  const ddNum = parseInt(dd);
  const nextDay = String(ddNum + 1).padStart(2, "0");

  const data: Record<string, TafRecord> = {
    LFPG: {
      icao: "LFPG",
      raw: `TAF LFPG ${dd}1100Z ${dd}12/${nextDay}18 25012KT 9999 FEW040 TEMPO ${dd}14/${dd}18 25015G25KT SCT030 BECMG ${nextDay}02/${nextDay}05 18008KT`,
      receivedAt: minutesAgo(120),
    },
    LFPB: {
      icao: "LFPB",
      raw: `TAF LFPB ${dd}0800Z ${dd}09/${nextDay}12 07008KT 9999 SCT035 BECMG ${dd}18/${dd}20 VRB03KT`,
      receivedAt: minutesAgo(180),
    },
    EGLL: {
      icao: "EGLL",
      raw: `TAF EGLL ${dd}1100Z ${dd}12/${nextDay}18 26018G28KT 8000 RA SCT012 BKN020 TEMPO ${dd}12/${dd}20 4000 +RA BKN008 BECMG ${nextDay}00/${nextDay}03 24010KT 9999 SCT025`,
      receivedAt: minutesAgo(90),
    },
    EDDF: {
      icao: "EDDF",
      raw: `TAF EDDF ${dd}1100Z ${dd}12/${nextDay}18 24014KT CAVOK BECMG ${dd}20/${dd}23 20008KT SCT040 PROB30 TEMPO ${nextDay}02/${nextDay}06 3000 BR BKN004`,
      receivedAt: minutesAgo(110),
    },
    EHAM: {
      icao: "EHAM",
      raw: `TAF EHAM ${dd}1100Z ${dd}12/${nextDay}18 19022G35KT 5000 -SHRA FEW008CB BKN015 TEMPO ${dd}12/${dd}18 2000 +TSRA SCT008CB BECMG ${nextDay}00/${nextDay}04 25012KT 9999 SCT030`,
      receivedAt: minutesAgo(95),
    },
  };

  return data[icao.toUpperCase()] ?? null;
}
