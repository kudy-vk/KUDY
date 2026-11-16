// Issue #252 — the «Пра горад» wheel screen's facts and link wiring, the
// typed port of the mockup's about-content.mjs (docs/design/production/,
// #202 approved 2026-11-12). Pure data: every URL lands on the official page
// the guide's sources table (docs/content/about-city-sources.md) cites with
// its check date, and nothing here fetches — the screen renders the whole
// guide offline and opens the link rows through Linking. Lives in
// components/, not app/: expo-router treats every app/ file as a route
// (docs/architecture/19_class_and_module_map.md — the components zone).
import BusIcon from "lucide-react-native/icons/bus";
import ClockIcon from "lucide-react-native/icons/clock";
import FootprintsIcon from "lucide-react-native/icons/footprints";
import LandmarkIcon from "lucide-react-native/icons/landmark";
import MapIcon from "lucide-react-native/icons/map";
import MapPinIcon from "lucide-react-native/icons/map-pin";
import MoonIcon from "lucide-react-native/icons/moon";
import PlaneIcon from "lucide-react-native/icons/plane";
import RefreshCwIcon from "lucide-react-native/icons/refresh-cw";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";
import UtensilsCrossedIcon from "lucide-react-native/icons/utensils-crossed";

import type { AboutCityStrings } from "../contracts/ui-message-types";
import type { CanonGlyph } from "./canon-icon";

export type AboutCitySectionId = "airport" | "transport" | "city" | "food" | "card";
export type AboutCityLinkKey = keyof AboutCityStrings["links"];

// One official URL per link label; a change to a URL is a change to the
// guide's sources table row (same PR).
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
} satisfies Record<AboutCityLinkKey, string>;

// The carousel, in its order (decision M10 — five sections; «Побач з
// горадам» moved to the main menu). «Аэрапорт» comes first: it is what a
// visitor who just landed needs. The official pages each section sends the
// reader to, in reading order, ride beside it.
export const ABOUT_CITY_SECTIONS = [
  { id: "airport", icon: PlaneIcon, links: ["airportBuses", "airportTrains", "ztmSchedule"] },
  { id: "transport", icon: TramFrontIcon, links: ["ztmSchedule", "ztmTickets", "skmSearch", "jakdojade", "mzkzg"] },
  { id: "city", icon: MapIcon, links: ["visitGdanskMap"] },
  { id: "food", icon: UtensilsCrossedIcon, links: ["pysznePayment", "blikHow"] },
  { id: "card", icon: LandmarkIcon, links: ["kartaTurysty", "muzeumGdanska", "muzeum1939"] },
] as const satisfies readonly { id: AboutCitySectionId; icon: CanonGlyph; links: readonly AboutCityLinkKey[] }[];

// The signs the ride facts and the airport steps use; a fact names its sign
// by key and the section resolves it to the glyph.
export const ABOUT_CITY_FACT_ICONS = {
  clock: ClockIcon,
  "refresh-cw": RefreshCwIcon,
  moon: MoonIcon,
  "map-pin": MapPinIcon,
} as const satisfies Record<string, CanonGlyph>;

export type AboutCityFactName = keyof typeof ABOUT_CITY_FACT_ICONS;

// A fact rides a sign and a dictionary key with its parameters; a detail row
// is a label key and a value that is a key or a literal.
export type AboutCityParams = Readonly<Record<string, string | number>>;
export type AboutCityFact = readonly [
  sign: AboutCityFactName,
  key: string,
  params?: AboutCityParams,
];
export type AboutCityDetailRow = readonly [label: string, value: string];

// Rides between the airport and the city. `from` is the trip out of the
// airport, `to` the trip to it.
export type AboutCityRide = {
  id: string;
  kind: "bus" | "night" | "train";
  line: string;
  from: { facts: readonly AboutCityFact[]; rows: readonly AboutCityDetailRow[] };
  to: { facts: readonly AboutCityFact[]; rows: readonly AboutCityDetailRow[] };
};

export const ABOUT_CITY_RIDES: readonly AboutCityRide[] = [
  {
    id: "210", kind: "bus", line: "210",
    from: {
      facts: [["clock", "u.aboutMin", { n: 40 }], ["refresh-cw", "u.everyWeekdays", { n: 30 }]],
      rows: [["row.stop", "Port Lotniczy 01"], ["row.firstLast", "04:50 – 23:05"], ["row.sunday", "u.hourly"], ["row.centreStops", "Hucisko, Urząd Miejski, Hevelianum, Płowce, Focha"]],
    },
    to: {
      facts: [["clock", "u.aboutMin", { n: 40 }], ["refresh-cw", "u.everyWeekdays", { n: 30 }]],
      rows: [["row.stop", "Dworzec Główny 10, Podwale Grodzkie"], ["row.firstLast", "04:30 – 22:27"], ["row.centreStops", "Hucisko, Urząd Miejski, Hevelianum, Płowce, Focha"]],
    },
  },
  {
    id: "110", kind: "bus", line: "110",
    from: {
      facts: [["refresh-cw", "u.everyWeekdays", { n: 20 }]],
      rows: [["row.stop", "Port Lotniczy 02"], ["row.firstLast", "05:05 – 23:20"], ["row.also", "ride.110.also"]],
    },
    to: {
      facts: [["refresh-cw", "u.everyWeekdays", { n: 20 }]],
      rows: [["row.stop", "Gdańsk Wrzeszcz"], ["row.firstLast", "04:52 – 22:30"], ["row.also", "ride.110.also"]],
    },
  },
  {
    id: "n3", kind: "night", line: "N3",
    from: {
      facts: [["moon", "ride.n3.when"], ["refresh-cw", "u.hourly"]],
      rows: [["row.toCentre", "ride.n3.toCentre"], ["row.toWrzeszcz", "ride.n3.toWrzeszcz"], ["row.route", "ride.n3.route"]],
    },
    to: {
      facts: [["moon", "ride.n3.when"], ["refresh-cw", "u.hourly"]],
      rows: [["row.route", "ride.n3.route"]],
    },
  },
  {
    id: "train", kind: "train", line: "POLREGIO",
    from: {
      facts: [["clock", "u.aboutMin", { n: 25 }], ["refresh-cw", "u.aboutHourly"]],
      rows: [["row.stop", "Gdańsk Port Lotniczy"], ["row.toCentre", "ride.train.change"], ["row.operator", "ride.train.operator"]],
    },
    to: {
      facts: [["clock", "u.aboutMin", { n: 25 }], ["refresh-cw", "u.aboutHourly"]],
      rows: [["row.stop", "Gdańsk Wrzeszcz"], ["row.route", "ride.train.line"], ["row.operator", "ride.train.operator"]],
    },
  },
] as const;

// Ticket prices in złoty: [name key, full price, reduced price].
export const ABOUT_CITY_PRICES = {
  ztm: [["tk.singleRide", 4.8, 2.4], ["tk.75", 6, 3], ["tk.day24", 22, 11]],
  metro: [["tk.single.phone", 4.8, null], ["tk.single.paper", 5.2, null], ["tk.75", 6, 3], ["tk.day24", 24, 12], ["tk.72h", 48, 24]],
  rail: [["tk.24h.two", 30, 15], ["tk.24h.all", 34, 17], ["tk.72h", 68, 34]],
  cardTransport: [["tk.day24", 34, 17], ["tk.72h", 68, 34]],
} as const satisfies Record<string, readonly (readonly [key: string, full: number, reduced: number | null])[]>;

export type AboutCityPriceZone = keyof typeof ABOUT_CITY_PRICES;

// Places of the orientation schematic: the dot in percent of the box, where
// the name stands (right of the dot, left of it, or under it), what kind of
// place it is and the signs of how to get there. Relative geography, not
// cartography — the caption says proportions are approximate; the official
// map link in the same section is the geographically exact source.
export type AboutCityPlace = {
  readonly id: string;
  readonly name: string;
  readonly title?: string;
  readonly x: number;
  readonly y: number;
  readonly side: "right" | "left" | "below";
  readonly kind: keyof AboutCityStrings["kind"];
  readonly main?: boolean;
  readonly get: readonly (readonly [sign: CanonGlyph, key: string])[];
  readonly warn?: string;
};

export const ABOUT_CITY_PLACES: readonly AboutCityPlace[] = [
  { id: "jelitkowo", name: "Jelitkowo", x: 9, y: 19, side: "right", kind: "beach", get: [[TramFrontIcon, "get.jelitkowo"]] },
  { id: "brzezno", name: "Brzeźno", x: 30, y: 30, side: "right", kind: "beach", get: [[TramFrontIcon, "get.brzezno"]] },
  { id: "stogi", name: "Stogi", x: 72, y: 19, side: "right", kind: "beach", get: [[BusIcon, "get.stogi"]], warn: "place.stogi.warn" },
  { id: "sobieszewo", name: "Sobieszewo", title: "Wyspa Sobieszewska", x: 93, y: 28, side: "below", kind: "island", get: [[BusIcon, "get.sobieszewo"]] },
  { id: "oliwa", name: "Oliwa", x: 9, y: 40, side: "right", kind: "district", get: [[TramFrontIcon, "get.oliwa.tram"], [TrainFrontIcon, "get.oliwa.skm"]] },
  { id: "wrzeszcz", name: "Wrzeszcz", x: 30, y: 50, side: "right", kind: "district", get: [[TrainFrontIcon, "get.wrzeszcz"]] },
  { id: "stare", name: "Stare Miasto", x: 58, y: 63, side: "left", kind: "quarter", get: [] },
  { id: "station", name: "Gdańsk Główny", x: 50, y: 74, side: "left", kind: "station", get: [[FootprintsIcon, "get.station.walk"], [TrainFrontIcon, "get.station.skm"]] },
  { id: "glowne", name: "Główne Miasto", x: 58, y: 85, side: "left", kind: "centre", main: true, get: [[FootprintsIcon, "get.glowne"]] },
] as const;

// Delivery services and the payment methods their official pages confirm.
export const ABOUT_CITY_PAY_METHODS = ["card", "blik", "cash", "apple", "google", "paypal"] as const;
export type AboutCityPayMethod = (typeof ABOUT_CITY_PAY_METHODS)[number];

export type AboutCityDelivery = {
  readonly name: string;
  readonly pay: readonly AboutCityPayMethod[];
  readonly note?: string;
};

export const ABOUT_CITY_DELIVERY: readonly AboutCityDelivery[] = [
  { name: "Pyszne.pl", pay: ["card", "blik", "cash", "apple", "google", "paypal"] },
  { name: "Glovo", pay: ["card", "blik", "cash"] },
  { name: "Wolt", pay: ["card", "blik", "cash"] },
  { name: "Uber Eats", pay: ["card", "blik", "apple"] },
  { name: "Bolt Food", pay: ["card", "cash"], note: "food.bolt.note" },
];

// Gdańska Karta Turysty, November 2026: [full, reduced] per validity in hours.
export const ABOUT_CITY_CARD_HOURS = [24, 48, 72] as const;
export const ABOUT_CITY_CARD_PACKAGES = [
  { id: "odkrywca", name: "Odkrywca", prices: { 24: [75, 60], 48: [85, 70], 72: [95, 80] } },
  { id: "premium", name: "Odkrywca Premium", prices: { 24: [90, 70], 48: [110, 85], 72: [130, 100] } },
] as const;
export const ABOUT_CITY_CARD_SMAKI_PRICE = 216;

// Free museum days: weekday (1 = Monday) → lines of [state, museum key, text key].
export const ABOUT_CITY_FREE_DAYS: Readonly<Record<number, readonly (readonly ["free" | "closed", string, string])[]>> = {
  1: [["free", "museum.gdanska", "card.mon.gdanska"], ["closed", "museum.ww2", "card.mon.ww2"]],
  2: [["free", "museum.ww2", "card.tue.ww2"], ["closed", "museum.gdanska", "card.tue.gdanska"]],
};

// The guide's word resolver over the generated catalogue's nested shape: a
// key walks the path, a template calls its function, an unknown key is an
// error and not an empty string (the mockup translator's own rule). Returns
// also the membership test the fact/row data uses to tell a literal from a
// key.
export type AboutCityText = (key: string, params?: AboutCityParams) => string;

function resolveNode(strings: AboutCityStrings, key: string): unknown {
  let node: unknown = strings;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

export function aboutCityHasText(strings: AboutCityStrings, key: string): boolean {
  const node = resolveNode(strings, key);
  return typeof node === "string" || typeof node === "function";
}

export function aboutCityText(strings: AboutCityStrings): AboutCityText {
  return (key, params) => {
    const node = resolveNode(strings, key);
    if (typeof node === "function") {
      if (!params) throw new Error(`guide template needs parameters: ${key}`);
      // The generated templates take their parameters positionally, in the
      // record's parameter order — the caller's object supplies the values.
      return (node as unknown as (...values: (string | number)[]) => string)(...Object.values(params));
    }
    if (typeof node !== "string") throw new Error(`no guide text: ${key}`);
    return node;
  };
}

// A price in złoty in the guide language: «4,80 zł» / “4.80 zł”. `cents`
// shows grosze even for a whole sum, so one price list keeps one shape —
// the priceRows rule of the mockup.
export function aboutCityMoney(strings: AboutCityStrings, amount: number, cents?: boolean): string {
  const showCents = cents ?? !Number.isInteger(amount);
  const sum = showCents ? amount.toFixed(2).replace(".", strings.u.decimal) : String(amount);
  return `${sum} zł`;
}
