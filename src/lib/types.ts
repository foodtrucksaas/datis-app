/** Airport identity */
export interface Airport {
  icao: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lon?: number;
}

/** Parsed key fields extracted from an ATIS message */
export interface AtisFields {
  letter: string;
  type: "ARR" | "DEP" | null;
  arrivalRunways: string[];
  departureRunways: string[];
  wind: string;
  qnh: number;
  visibility: string;
  transitionLevel: string;
  temperature: number | null;
  dewpoint: number | null;
  remarks: string | null;
}

/** A single D-ATIS record as received */
export interface AtisRecord {
  icao: string;
  raw: string;
  fields: AtisFields;
  receivedAt: string; // ISO 8601
  emittedAt: string; // ISO 8601
}

/** A raw + decoded METAR */
export interface MetarRecord {
  icao: string;
  raw: string;
  receivedAt: string;
}

/** A raw + decoded TAF */
export interface TafRecord {
  icao: string;
  raw: string;
  receivedAt: string;
}

/** Full data bundle for a given ICAO */
export interface AirportData {
  airport: Airport;
  atis: AtisRecord[];
  metar: MetarRecord | null;
  taf: TafRecord | null;
}

/** User favorite */
export interface Favorite {
  icao: string;
  addedAt: string; // ISO 8601
}

/** Recent lookup entry */
export interface RecentLookup {
  icao: string;
  viewedAt: string; // ISO 8601
}

/** User preferences */
export interface UserSettings {
  disclaimerAccepted: boolean;
  weatherDisplayMode: "raw" | "decoded";
}
