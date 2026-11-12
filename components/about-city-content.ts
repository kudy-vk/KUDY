// Issue #200 — the «Пра горад» guide's link wiring and the small orientation
// schematic's layout. Pure data: every URL lands on the official page the
// guide's sources table (docs/content/about-city-sources.md) cites with its
// check date and conditions, and nothing here fetches — the screen opens the
// rows through Linking and renders the whole document offline. Lives in
// components/, not app/: expo-router treats every app/ file as a route
// (docs/architecture/19_class_and_module_map.md — the components zone — the WalkButton precedent).
import type { AboutCityStrings } from "../contracts/ui-message-types";

export type AboutCityLinkKey = keyof AboutCityStrings["links"];
export type AboutCitySectionId = "airport" | "transport" | "city" | "food" | "karta" | "malbork";

// One official URL per link label; a change to a URL is a change to the
// guide's sources table row (same PR).
export const ABOUT_CITY_VERIFIED_ON = "2026-11-10";

export const ABOUT_CITY_LINK_URLS = {
  airportBuses: "https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus",
  airportTrains: "https://www.airport.gdansk.pl/en/before-travel/getting-to-the-airport/train",
  ztmSchedule: "https://ztm.gda.pl/rozklady",
  ztmTickets: "https://ztm.gda.pl/bilety",
  skmSearch: "https://www.skm.pkp.pl/dla-pasazera/wyszukaj-polaczenie",
  jakdojade: "https://jakdojade.pl/gdansk/trasa/",
  mzkzg: "https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/",
  visitGdanskMap: "https://visitgdansk.com/cmsImages/dokumenty/mapa-centrum-gdanska.pdf",
  kartaTurysty: "https://kartaturysty.visitgdansk.com/cennik",
  muzeumGdanska: "https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/free-entrance/?L=1",
  muzeum1939: "https://www.muzeum1939.pl/en/visit-and-tickets/wwii-museum-visit/sightseeing/visiting-rules",
  pysznePayment: "https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl",
  blikHow: "https://www.blik.com/en/how-to-use-blik",
  malborkVisit: "https://zamek.malbork.pl/en/home/visit/",
  trainSchedule: "https://portalpasazera.pl",
  unesco: "https://whc.unesco.org/en/list/847",
} satisfies Record<AboutCityLinkKey, string>;

// The official pages each section sends the reader to, in reading order.
// The four entry sections carry their own links below; the karta and
// malbork blocks sit further down (issue criterion 8) and hold theirs.
export const ABOUT_CITY_SECTION_LINKS = {
  airport: ["airportBuses", "airportTrains", "ztmSchedule"],
  transport: ["ztmSchedule", "ztmTickets", "skmSearch", "jakdojade", "mzkzg"],
  city: ["visitGdanskMap"],
  food: ["pysznePayment", "blikHow"],
  karta: ["kartaTurysty", "muzeumGdanska", "muzeum1939"],
  malbork: ["malborkVisit", "trainSchedule", "unesco"],
} satisfies Record<AboutCitySectionId, readonly AboutCityLinkKey[]>;

// The orientation schematic: label anchors in percent of the box, laid out
// from the north (the bay at the top). Relative geography, not cartography —
// the caption says proportions are approximate; the official map link in the
// same section is the geographically exact source. `dx` shifts each label
// left from its anchor so the anchor names the place itself.
export const ABOUT_CITY_MAP_BOX_RATIO = 0.9;
export const ABOUT_CITY_MAP_ITEMS = [
  { id: "mapStation", x: 34, y: 60, dx: -28 },
  { id: "mapStare", x: 47, y: 51, dx: -28 },
  { id: "mapGlowne", x: 59, y: 57, dx: -28 },
  { id: "mapMotlawa", x: 71, y: 47, dx: -12 },
  { id: "mapWrzeszcz", x: 39, y: 34, dx: -28 },
  { id: "mapOliwa", x: 14, y: 26, dx: -20 },
  { id: "mapBrzezno", x: 44, y: 14, dx: -25 },
  { id: "mapJelitkowo", x: 58, y: 11, dx: -30 },
  { id: "mapStogi", x: 82, y: 33, dx: -20 },
  { id: "mapSobieszewo", x: 84, y: 55, dx: -35 },
] as const;

export type AboutCityMapItemId = (typeof ABOUT_CITY_MAP_ITEMS)[number]["id"];
