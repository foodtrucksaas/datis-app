import type { Airport } from "./types";

export const AIRPORTS: Airport[] = [
  { icao: "LFPG", name: "Paris-Charles de Gaulle", city: "Paris", country: "FR" },
  { icao: "LFPO", name: "Paris-Orly", city: "Paris", country: "FR" },
  { icao: "LFPB", name: "Paris-Le Bourget", city: "Paris", country: "FR" },
  { icao: "LFMN", name: "Nice Côte d'Azur", city: "Nice", country: "FR" },
  { icao: "LFLL", name: "Lyon-Saint Exupéry", city: "Lyon", country: "FR" },
  { icao: "LFML", name: "Marseille Provence", city: "Marseille", country: "FR" },
  { icao: "LFBO", name: "Toulouse-Blagnac", city: "Toulouse", country: "FR" },
  { icao: "LFBD", name: "Bordeaux-Mérignac", city: "Bordeaux", country: "FR" },
  { icao: "LFSB", name: "Bâle-Mulhouse", city: "Bâle", country: "FR" },
  { icao: "LFST", name: "Strasbourg-Entzheim", city: "Strasbourg", country: "FR" },
  { icao: "EGLL", name: "London Heathrow", city: "London", country: "GB" },
  { icao: "EGKK", name: "London Gatwick", city: "London", country: "GB" },
  { icao: "EGSS", name: "London Stansted", city: "London", country: "GB" },
  { icao: "EGLC", name: "London City", city: "London", country: "GB" },
  { icao: "EGCC", name: "Manchester", city: "Manchester", country: "GB" },
  { icao: "EGPH", name: "Edinburgh", city: "Edinburgh", country: "GB" },
  { icao: "EDDF", name: "Frankfurt am Main", city: "Frankfurt", country: "DE" },
  { icao: "EDDM", name: "München Franz Josef Strauss", city: "München", country: "DE" },
  { icao: "EDDB", name: "Berlin Brandenburg", city: "Berlin", country: "DE" },
  { icao: "EDDL", name: "Düsseldorf", city: "Düsseldorf", country: "DE" },
  { icao: "EDDH", name: "Hamburg", city: "Hamburg", country: "DE" },
  { icao: "EDDK", name: "Köln/Bonn", city: "Köln", country: "DE" },
  { icao: "EHAM", name: "Amsterdam Schiphol", city: "Amsterdam", country: "NL" },
  { icao: "EBBR", name: "Brussels", city: "Brussels", country: "BE" },
  { icao: "ELLX", name: "Luxembourg Findel", city: "Luxembourg", country: "LU" },
  { icao: "LSZH", name: "Zürich", city: "Zürich", country: "CH" },
  { icao: "LSGG", name: "Genève-Cointrin", city: "Genève", country: "CH" },
  { icao: "LIRF", name: "Roma Fiumicino", city: "Roma", country: "IT" },
  { icao: "LIMC", name: "Milano Malpensa", city: "Milano", country: "IT" },
  { icao: "LIPZ", name: "Venezia Marco Polo", city: "Venezia", country: "IT" },
  { icao: "LEMD", name: "Madrid Barajas", city: "Madrid", country: "ES" },
  { icao: "LEBL", name: "Barcelona El Prat", city: "Barcelona", country: "ES" },
  { icao: "LEPA", name: "Palma de Mallorca", city: "Palma", country: "ES" },
  { icao: "LPPT", name: "Lisboa Humberto Delgado", city: "Lisboa", country: "PT" },
  { icao: "LPPR", name: "Porto Francisco Sá Carneiro", city: "Porto", country: "PT" },
  { icao: "EKCH", name: "København Kastrup", city: "København", country: "DK" },
  { icao: "ESSA", name: "Stockholm Arlanda", city: "Stockholm", country: "SE" },
  { icao: "ENGM", name: "Oslo Gardermoen", city: "Oslo", country: "NO" },
  { icao: "EFHK", name: "Helsinki-Vantaa", city: "Helsinki", country: "FI" },
  { icao: "EPWA", name: "Warszawa Chopina", city: "Warszawa", country: "PL" },
  { icao: "LKPR", name: "Praha Václav Havel", city: "Praha", country: "CZ" },
  { icao: "LOWW", name: "Wien Schwechat", city: "Wien", country: "AT" },
  { icao: "LHBP", name: "Budapest Liszt Ferenc", city: "Budapest", country: "HU" },
  { icao: "LGAV", name: "Athína Elefthérios Venizélos", city: "Athína", country: "GR" },
  { icao: "LTFM", name: "İstanbul", city: "İstanbul", country: "TR" },
  { icao: "LTBA", name: "İstanbul Atatürk", city: "İstanbul", country: "TR" },
  { icao: "EIDW", name: "Dublin", city: "Dublin", country: "IE" },
  { icao: "LROP", name: "Bucureşti Henri Coandă", city: "Bucureşti", country: "RO" },
  { icao: "LYBE", name: "Beograd Nikola Tesla", city: "Beograd", country: "RS" },
  { icao: "LDZA", name: "Zagreb Franjo Tuđman", city: "Zagreb", country: "HR" },
];

/** Look up an airport by ICAO code */
export function findAirport(icao: string): Airport | undefined {
  return AIRPORTS.find((a) => a.icao === icao.toUpperCase());
}

/** Search airports by ICAO prefix or name substring */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.toUpperCase().trim();
  if (!q) return [];
  return AIRPORTS.filter(
    (a) =>
      a.icao.startsWith(q) ||
      a.name.toUpperCase().includes(q) ||
      a.city.toUpperCase().includes(q)
  ).slice(0, limit);
}
