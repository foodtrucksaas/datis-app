/**
 * Set of all ICAO codes known to emit D-ATIS (source: atis.guru).
 * Used to determine serviceTier = 1.
 */

import type { ServiceTier } from "./types";

const DATIS_AIRPORTS = new Set([
  // Canada
  "BIKF","CYAM","CYBW","CYCD","CYEG","CYFC","CYHC","CYHM","CYHU","CYHZ",
  "CYKF","CYLW","CYMM","CYMX","CYNJ","CYOO","CYOW","CYPK","CYQB","CYQF",
  "CYQM","CYQR","CYQT","CYQX","CYRC","CYSB","CYTZ","CYUL","CYVR","CYWG",
  "CYWH","CYXE","CYXU","CYXX","CYYC","CYYJ","CYYR","CYYT","CYYZ","CZBB",
  "CZVL",
  // Tunisia
  "DTMB","DTNH","DTTJ",
  // Germany
  "EDDB","EDDC","EDDE","EDDF","EDDG","EDDH","EDDK","EDDL","EDDM","EDDN",
  "EDDP","EDDR","EDDS","EDDV","EDDW",
  // Belgium
  "EBAW","EBBR","EBCI","EBLG","EBOS",
  // Finland
  "EFET","EFHK","EFIV","EFJO","EFJY","EFKE","EFKI","EFKK","EFKS","EFKT",
  "EFKU","EFLP","EFMA","EFOU","EFPO","EFRO","EFSA","EFSI","EFTP","EFTU",
  "EFVA",
  // UK & Ireland
  "EGCC","EGKK","EGLL","EGPD","EICK","EIDW","EINN",
  // Netherlands
  "EHAM",
  // Denmark
  "EKCH",
  // Norway
  "ENAT","ENBO","ENBR","ENEV","ENGM","ENTC","ENVA","ENZV",
  // Poland
  "EPGD","EPKK","EPPO","EPWA",
  // Sweden
  "ESGG","ESSA",
  // Latvia
  "EVRA",
  // Lithuania
  "EYVI",
  // South Africa
  "FACT","FALA","FALE","FAOR",
  // DR Congo
  "FZAA",
  // Canary Islands
  "GCFV","GCLA","GCLP","GCRR","GCTS","GCXO",
  // Morocco
  "GMAD","GMFF","GMFO","GMME","GMMH","GMMI","GMMN","GMMX","GMMZ","GMTA",
  "GMTT",
  // Kenya
  "HKEL","HKJK","HKKI","HKMO",
  // USA
  "KABQ","KADW","KALB","KATL","KAUS","KBDL","KBNA","KBOI","KBOS","KBUF",
  "KBUR","KBWI","KCHS","KCLE","KCLT","KCMH","KCVG","KDAL","KDCA","KDEN",
  "KDFW","KDTW","KELP","KEWR","KFLL","KGSO","KHND","KHOU","KHPN","KHXD",
  "KIAD","KIAH","KILN","KIND","KJAC","KJAX","KJFK","KLAS","KLAX","KLGA",
  "KLIT","KMCI","KMCO","KMDW","KMEM","KMGA","KMIA","KMKE","KMSP","KMSY",
  "KNUQ","KOAK","KOKC","KOMA","KONT","KORD","KPBI","KPDX","KPHL","KPHX",
  "KPIT","KPVD","KRDU","KRNO","KRSW","KSAN","KSAT","KSBD","KSDF","KSEA",
  "KSFO","KSJC","KSLC","KSMF","KSNA","KSTC","KSTL","KTEB","KTPA","KTUL",
  "KUNV","KVNY","PANC",
  // Bulgaria
  "LBSF",
  // Spain
  "LEAL","LEAM","LEBL","LECO","LECU","LEGE","LEGR","LEIB","LEJR","LEMD",
  "LEMG","LEMH","LEPA","LERS","LEST","LEVC","LEVT","LEVX","LEZL",
  // France
  "LFBP","LFLL","LFMN","LFPB","LFPG","LFPO",
  // Italy
  "LIMC","LIRF",
  // Czech Republic
  "LKPR",
  // Israel
  "LLBG","LLER",
  // Austria
  "LOWG","LOWI","LOWK","LOWL","LOWS","LOWW",
  // Portugal
  "LPFR","LPMA","LPPD","LPPR","LPPT",
  // Switzerland
  "LSGG","LSZH",
  // Turkey
  "LTAC","LTAI","LTBA","LTBJ","LTBS","LTCE","LTCG","LTFE","LTFJ","LTFM",
  // Central America & Caribbean
  "MGGT","MHLM","MHTG","MKJP","MKJS","MMMX","MNMG","MRLB","MROC","MZBZ",
  // New Zealand
  "NZAA","NZCH","NZDN","NZGS","NZHN","NZNP","NZNR","NZNS","NZNV","NZOH",
  "NZQN","NZRO","NZTG","NZWB","NZWN","NZWP",
  // Saudi Arabia
  "OEAB","OEAH","OEAO","OEDF","OEGN","OEGS","OEHL","OEJN","OEMA","OENG",
  "OERK","OETB","OETF","OEYN",
  // Jordan
  "OJAI",
  // Kuwait
  "OKKK",
  // Lebanon
  "OLBA",
  // UAE
  "OMAA","OMAL","OMDB","OMDW",
  // Qatar
  "OTBD","OTHH",
  // Taiwan
  "RCKH","RCMQ","RCSS","RCTP",
  // Japan
  "RJAA","RJBB","RJBE","RJCC","RJCH","RJFF","RJFK","RJFM","RJFO","RJFT",
  "RJFU","RJGG","RJOA","RJOK","RJOM","RJOO","RJOT","RJSN","RJSS","RJTT",
  // South Korea
  "RKJJ","RKJY","RKPC","RKPK","RKPU","RKSI","RKSS","RKTN",
  // Okinawa
  "ROAH","ROIG",
  // Brazil
  "SABE","SBBE","SBBR","SBBV","SBCF","SBCG","SBCT","SBCY","SBEG","SBFI",
  "SBFL","SBFZ","SBGL","SBGR","SBKP","SBMO","SBNT","SBPA","SBPS","SBPV",
  "SBRB","SBRF","SBRJ","SBSJ","SBSL","SBSP","SBSV",
  // Colombia
  "SKBG","SKBO","SKBQ","SKCG","SKMD","SKMR","SKPE","SKRG","SKSM","SKSP",
  // Puerto Rico
  "TJSJ",
  // Curaçao
  "TNCA",
  // India
  "VAAH","VAAU","VABB","VABO","VABP","VAID","VANP","VASU","VAUD","VEBN",
  "VEBS","VECC","VEGT","VEGY","VEKO","VEMN","VEPT","VERC","VERP","VIAR",
  "VIDN","VIDP","VIJP","VILK","VOBL","VOBZ","VOCB","VOCI","VOCL","VOHB",
  "VOHS","VOMD","VOML","VOMM","VOTP","VOTR","VOTV",
  // Myanmar
  "VBBG",
  // Sri Lanka
  "VCBI",
  // Cambodia
  "VDPP","VDSA","VDTI",
  // Hong Kong
  "VHHH",
  // Bangladesh
  "VICT",
  // Thailand
  "VTBD","VTBS","VTBU","VTCC","VTCT","VTSB","VTSG","VTSP","VTSS","VTUU",
  // Vietnam
  "VVCR","VVDN","VVNB","VVTS",
  // Malaysia & Singapore
  "WMKK","WSSL","WSSS",
  // Australia
  "YBBN","YBCG","YBCS","YBTL","YMAV","YMHB","YMML","YPAD","YPDN","YPEA",
  "YPPH","YPTN","YSCB","YSSY","YWLM",
  // China
  "ZBAA","ZBAD","ZBDS","ZBHH","ZBLA","ZBSJ","ZBTJ","ZBYN","ZGGG","ZGHA",
  "ZGKL","ZGNN","ZGOW","ZGSD","ZGSZ","ZGZJ","ZHCC","ZHEC","ZHHH","ZJHK",
  "ZJSY","ZLIC","ZLLL","ZLXN","ZLXY","ZLYL","ZPDL","ZPLJ","ZPMS","ZPPP",
  "ZSAM","ZSCN","ZSFZ","ZSHC","ZSJN","ZSLQ","ZSLY","ZSNB","ZSNJ","ZSNT",
  "ZSOF","ZSPD","ZSQD","ZSQZ","ZSRZ","ZSSS","ZSWX","ZSWZ","ZSXZ","ZSYA",
  "ZSYN","ZSYT","ZUCK","ZUGY","ZULS","ZULZ","ZUMY","ZUTF","ZUTR","ZUUU",
  "ZUZY","ZWAK","ZWWW","ZYCC","ZYHB","ZYTL","ZYTX",
]);

/** Check if an airport has D-ATIS coverage */
export function hasDatis(icao: string): boolean {
  return DATIS_AIRPORTS.has(icao.toUpperCase());
}

/**
 * Determine the service tier for an airport.
 * - Tier 1: D-ATIS available (in atis.guru list)
 * - Tier 2: ATIS voice only (manually curated, has frequencies.atisVhf_mhz)
 * - Tier 3: METAR/TAF only (airport exists in DB but no ATIS)
 * - Tier 4: No weather service (tiny airfields)
 */
export function getServiceTier(
  icao: string,
  airport?: { frequencies?: { atisVhf_mhz?: string } } | null
): ServiceTier {
  if (DATIS_AIRPORTS.has(icao.toUpperCase())) return 1;
  if (airport?.frequencies?.atisVhf_mhz) return 2;
  // Default: most airports in our DB have METAR
  return 3;
}
