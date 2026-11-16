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
import CompassIcon from "lucide-react-native/icons/compass";
import FootprintsIcon from "lucide-react-native/icons/footprints";
import LandmarkIcon from "lucide-react-native/icons/landmark";
import MapIcon from "lucide-react-native/icons/map";
import MapPinIcon from "lucide-react-native/icons/map-pin";
import MoonIcon from "lucide-react-native/icons/moon";
import PlaneIcon from "lucide-react-native/icons/plane";
import RefreshCwIcon from "lucide-react-native/icons/refresh-cw";
import SmartphoneIcon from "lucide-react-native/icons/smartphone";
import TicketIcon from "lucide-react-native/icons/ticket";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";
import UtensilsCrossedIcon from "lucide-react-native/icons/utensils-crossed";

import type { AboutCityStrings } from "../contracts/ui-message-types";
import type { CanonGlyph } from "./canon-icon";

export type AboutCitySectionId = "airport" | "transport" | "city" | "food" | "card";
export type AboutCityLinkKey = keyof AboutCityStrings["links"];

// One official URL per link label; a change to a URL is a change to the
// guide's sources table row (same PR). The map section sends the reader to
// Google Maps beside the map (M13) and carries no official-pages row.
export const ABOUT_CITY_LINK_URLS = {
  airportBuses: "https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus",
  airportTrains: "https://www.airport.gdansk.pl/en/before-travel/getting-to-the-airport/train",
  ztmSchedule: "https://ztm.gda.pl/rozklady",
  skmSearch: "https://www.skm.pkp.pl/dla-pasazera/wyszukaj-polaczenie",
  kartaTurysty: "https://kartaturysty.visitgdansk.com/cennik",
  muzeumGdanska: "https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/free-entrance/?L=1",
  muzeum1939: "https://www.muzeum1939.pl/en/visit-and-tickets/wwii-museum-visit/sightseeing/visiting-rules",
  pysznePayment: "https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl",
  blikHow: "https://www.blik.com/en/how-to-use-blik",
} satisfies Record<AboutCityLinkKey, string>;

// The ticket apps the transport section opens, in the owner's order
// (issue #254, 2026-11-16): jakdojade first, then FALA, then KomPas. The
// fares, the ticket catalogue and the activation rules stay out of the app —
// they live in these apps and on their official pages.
export const ABOUT_CITY_APPS = [
  { key: "jakdojade", url: "https://jakdojade.pl/gdansk/trasa/", glyph: SmartphoneIcon },
  { key: "fala", url: "https://systemfala.pl", glyph: TicketIcon },
  { key: "kompas", url: "https://skm.pkp.pl", glyph: CompassIcon },
] as const satisfies readonly { key: string; url: string; glyph: CanonGlyph }[];

// The carousel, in its order (decision M10 — five sections; «Побач з
// горадам» moved to the main menu). «Аэрапорт» comes first: it is what a
// visitor who just landed needs. The official pages each section sends the
// reader to, in reading order, ride beside it; the map section has none
// (decision M13 — the Google Maps button lives beside the map).
export const ABOUT_CITY_SECTIONS = [
  { id: "airport", icon: PlaneIcon, links: ["airportBuses", "airportTrains", "ztmSchedule"] },
  { id: "transport", icon: TramFrontIcon, links: ["ztmSchedule", "skmSearch"] },
  { id: "city", icon: MapIcon, links: [] },
  { id: "food", icon: UtensilsCrossedIcon, links: ["pysznePayment", "blikHow"] },
  { id: "card", icon: LandmarkIcon, links: ["kartaTurysty", "muzeumGdanska", "muzeum1939"] },
] as const satisfies readonly { id: AboutCitySectionId; icon: CanonGlyph; links: readonly AboutCityLinkKey[] }[];

// The signs the ride facts and the airport steps use; a fact names its sign
// by key and the section resolves it to the glyph. The map's zone ways use
// the same sign names as the mockup's about-content.mjs PLACE_WAYS.
export const ABOUT_CITY_FACT_ICONS = {
  bus: BusIcon,
  clock: ClockIcon,
  "footprints": FootprintsIcon,
  "map-pin": MapPinIcon,
  moon: MoonIcon,
  "refresh-cw": RefreshCwIcon,
  "tram-front": TramFrontIcon,
  "train-front": TrainFrontIcon,
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

// Ticket prices in złoty: [name key, full price, reduced price]. Only the
// airport's bus-ticket list and the tourist card's transport add-on keep
// their prices; the transport section itself shows none — the owner moved
// every fare detail to the apps and official pages (issue #254, 2026-11-16).
export const ABOUT_CITY_PRICES = {
  ztm: [["tk.singleRide", 4.8, 2.4], ["tk.75", 6, 3], ["tk.day24", 22, 11]],
  cardTransport: [["tk.day24", 34, 17], ["tk.72h", 68, 34]],
} as const satisfies Record<string, readonly (readonly [key: string, full: number, reduced: number | null])[]>;

export type AboutCityPriceZone = keyof typeof ABOUT_CITY_PRICES;

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
