// «Пра горад»: the guide's facts and the access to its words for the mockup.
//
// Words live in a dictionary keyed by id, one file per language
// (about-words-en.mjs, about-words-be.mjs). English is the full set: a
// language without its own file shows the English text (decision L1 in
// docs/design/brand/decisions.md), so today only Belarusian differs. Facts — line numbers, times,
// prices — are data, not sentences. Every fact comes from the #200 material
// and its sources table docs/content/about-city-sources.md, checked on
// 2026-11-10; the ZTM prices were re-read on the official page on 2026-11-12.
// These are proposals: they enter contracts/ui-messages after the verdict.
import { be } from './about-words-be.mjs';
import { en } from './about-words-en.mjs';

// Addresses of the official pages: ABOUT_CITY_LINK_URLS in
// components/about-city-content.ts.
export const LINKS = {
  airportBuses: 'https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus',
  airportTrains: 'https://www.airport.gdansk.pl/en/before-travel/getting-to-the-airport/train',
  ztmSchedule: 'https://ztm.gda.pl/rozklady',
  ztmTickets: 'https://ztm.gda.pl/bilety',
  skmSearch: 'https://www.skm.pkp.pl/dla-pasazera/wyszukaj-polaczenie',
  jakdojade: 'https://jakdojade.pl/gdansk/trasa/',
  mzkzg: 'https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/',
  visitGdanskMap: 'https://visitgdansk.com/cmsImages/dokumenty/mapa-centrum-gdanska.pdf',
  kartaTurysty: 'https://kartaturysty.visitgdansk.com/cennik',
  muzeumGdanska: 'https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/free-entrance/?L=1',
  muzeum1939: 'https://www.muzeum1939.pl/en/visit-and-tickets/wwii-museum-visit/sightseeing/visiting-rules',
  pysznePayment: 'https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl',
  blikHow: 'https://www.blik.com/en/how-to-use-blik',
};

// The carousel, in its order. «Аэрапорт» comes first: it is what a visitor who
// just landed needs.
export const SECTIONS = [
  { id: 'airport', icon: 'plane', links: ['airportBuses', 'airportTrains', 'ztmSchedule'] },
  { id: 'transport', icon: 'tram-front', links: ['ztmSchedule', 'ztmTickets', 'skmSearch', 'jakdojade', 'mzkzg'] },
  { id: 'city', icon: 'map', links: ['visitGdanskMap'] },
  { id: 'food', icon: 'utensils-crossed', links: ['pysznePayment', 'blikHow'] },
  { id: 'card', icon: 'landmark', links: ['kartaTurysty', 'muzeumGdanska', 'muzeum1939'] },
];

// Rides between the airport and the city. `from` is the trip out of the
// airport, `to` the trip to it. A fact is [sign, dictionary key, parameters];
// a detail row is [label key, value key or literal, parameters].
export const RIDES = [
  {
    id: '210', kind: 'bus', line: '210',
    from: {
      facts: [['clock', 'u.aboutMin', { n: 40 }], ['refresh-cw', 'u.everyWeekdays', { n: 30 }]],
      rows: [['row.stop', 'Port Lotniczy 01'], ['row.firstLast', '04:50 – 23:05'], ['row.sunday', 'u.hourly'], ['row.centreStops', 'Hucisko, Urząd Miejski, Hevelianum, Płowce, Focha']],
    },
    to: {
      facts: [['clock', 'u.aboutMin', { n: 40 }], ['refresh-cw', 'u.everyWeekdays', { n: 30 }]],
      rows: [['row.stop', 'Dworzec Główny 10, Podwale Grodzkie'], ['row.firstLast', '04:30 – 22:27'], ['row.centreStops', 'Hucisko, Urząd Miejski, Hevelianum, Płowce, Focha']],
    },
  },
  {
    id: '110', kind: 'bus', line: '110',
    from: {
      facts: [['refresh-cw', 'u.everyWeekdays', { n: 20 }]],
      rows: [['row.stop', 'Port Lotniczy 02'], ['row.firstLast', '05:05 – 23:20'], ['row.also', 'ride.110.also']],
    },
    to: {
      facts: [['refresh-cw', 'u.everyWeekdays', { n: 20 }]],
      rows: [['row.stop', 'Gdańsk Wrzeszcz'], ['row.firstLast', '04:52 – 22:30'], ['row.also', 'ride.110.also']],
    },
  },
  {
    id: 'n3', kind: 'night', line: 'N3',
    from: {
      facts: [['moon', 'ride.n3.when'], ['refresh-cw', 'u.hourly']],
      rows: [['row.toCentre', 'ride.n3.toCentre'], ['row.toWrzeszcz', 'ride.n3.toWrzeszcz'], ['row.route', 'ride.n3.route']],
    },
    to: {
      facts: [['moon', 'ride.n3.when'], ['refresh-cw', 'u.hourly']],
      rows: [['row.route', 'ride.n3.route']],
    },
  },
  {
    id: 'train', kind: 'train', line: 'POLREGIO',
    from: {
      facts: [['clock', 'u.aboutMin', { n: 25 }], ['refresh-cw', 'u.aboutHourly']],
      rows: [['row.stop', 'Gdańsk Port Lotniczy'], ['row.toCentre', 'ride.train.change'], ['row.operator', 'ride.train.operator']],
    },
    to: {
      facts: [['clock', 'u.aboutMin', { n: 25 }], ['refresh-cw', 'u.aboutHourly']],
      rows: [['row.stop', 'Gdańsk Wrzeszcz'], ['row.route', 'ride.train.line'], ['row.operator', 'ride.train.operator']],
    },
  },
];

// Ticket prices in złoty: [name key, full price, reduced price].
export const PRICES = {
  ztm: [['tk.single', 4.8, 2.4], ['tk.75', 6, 3], ['tk.24h', 22, 11]],
  metro: [['tk.single.phone', 4.8, null], ['tk.single.paper', 5.2, null], ['tk.75', 6, 3], ['tk.24h', 24, 12], ['tk.72h', 48, 24]],
  rail: [['tk.24h.two', 30, 15], ['tk.24h.all', 34, 17], ['tk.72h', 68, 34]],
  cardTransport: [['tk.24h', 34, 17], ['tk.72h', 68, 34]],
};

// Places of the orientation schematic: the dot in percent of the box, where
// the name stands (right of the dot, left of it, or under it), what kind of
// place it is and the signs of how to get there.
export const PLACES = [
  { id: 'jelitkowo', name: 'Jelitkowo', x: 9, y: 19, side: 'right', kind: 'beach', get: [['tram-front', 'get.jelitkowo']] },
  { id: 'brzezno', name: 'Brzeźno', x: 30, y: 30, side: 'right', kind: 'beach', get: [['tram-front', 'get.brzezno']] },
  { id: 'stogi', name: 'Stogi', x: 72, y: 19, side: 'right', kind: 'beach', get: [['bus', 'get.stogi']], warn: 'place.stogi.warn' },
  { id: 'sobieszewo', name: 'Sobieszewo', title: 'Wyspa Sobieszewska', x: 93, y: 28, side: 'below', kind: 'island', get: [['bus', 'get.sobieszewo']] },
  { id: 'oliwa', name: 'Oliwa', x: 9, y: 40, side: 'right', kind: 'district', get: [['tram-front', 'get.oliwa.tram'], ['train-front', 'get.oliwa.skm']] },
  { id: 'wrzeszcz', name: 'Wrzeszcz', x: 30, y: 50, side: 'right', kind: 'district', get: [['train-front', 'get.wrzeszcz']] },
  { id: 'stare', name: 'Stare Miasto', x: 58, y: 63, side: 'left', kind: 'quarter', get: [] },
  { id: 'station', name: 'Gdańsk Główny', x: 50, y: 74, side: 'left', kind: 'station', get: [['footprints', 'get.station.walk'], ['train-front', 'get.station.skm']] },
  { id: 'glowne', name: 'Główne Miasto', x: 58, y: 85, side: 'left', kind: 'centre', main: true, get: [['footprints', 'get.glowne']] },
];

// Delivery services and the payment methods their official pages confirm.
export const PAY_METHODS = ['card', 'blik', 'cash', 'apple', 'google', 'paypal'];
export const DELIVERY = [
  { name: 'Pyszne.pl', pay: ['card', 'blik', 'cash', 'apple', 'google', 'paypal'] },
  { name: 'Glovo', pay: ['card', 'blik', 'cash'] },
  { name: 'Wolt', pay: ['card', 'blik', 'cash'] },
  { name: 'Uber Eats', pay: ['card', 'blik', 'apple'] },
  { name: 'Bolt Food', pay: ['card', 'cash'], note: 'food.bolt.note' },
];

// Gdańska Karta Turysty, November 2026: [full, reduced] per validity in hours.
export const CARD_HOURS = [24, 48, 72];
export const CARD_PACKAGES = [
  { id: 'odkrywca', name: 'Odkrywca', prices: { 24: [75, 60], 48: [85, 70], 72: [95, 80] } },
  { id: 'premium', name: 'Odkrywca Premium', prices: { 24: [90, 70], 48: [110, 85], 72: [130, 100] } },
];
export const CARD_SMAKI_PRICE = 216;

// Free museum days: weekday (1 = Monday) → lines of [state, museum key, text key].
export const FREE_DAYS = {
  1: [['free', 'museum.gdanska', 'card.mon.gdanska'], ['closed', 'museum.ww2', 'card.mon.ww2']],
  2: [['free', 'museum.ww2', 'card.tue.ww2'], ['closed', 'museum.gdanska', 'card.tue.gdanska']],
};

const DICTIONARY = { en, be };
// English is the full set; the Belarusian set must match it key for key.
for (const key of Object.keys(be)) if (!(key in en)) throw new Error(`be has a key English lacks: ${key}`);
for (const key of Object.keys(en)) if (!(key in be)) throw new Error(`be lacks the key: ${key}`);

// Whether `key` names a text of the guide (a fact may be a literal instead).
export const hasText = (key) => key in en;

// The language the guide is shown in: the interface language when it has its
// own entry, English otherwise.
export const guideLanguage = (locale) => (locale in DICTIONARY ? locale : 'en');

// Returns t(key, parameters): the text in the guide language, English when
// that language lacks the key. An unknown key is an error, not an empty string.
export function translator(locale) {
  const own = DICTIONARY[guideLanguage(locale)];
  return (key, parameters = {}) => {
    const text = own[key] ?? en[key];
    if (text === undefined) throw new Error(`no guide text: ${key}`);
    return text.replace(/\{(\w+)\}/g, (_, name) => parameters[name]);
  };
}

// A price in złoty in the guide language: «4,80 zł» / “4.80 zł”. `cents`
// shows grosze even for a whole sum, so one list keeps one shape. The decimal
// sign comes from the dictionary: a browser may not know every language.
export function price(locale, amount, cents = !Number.isInteger(amount)) {
  const sum = cents ? amount.toFixed(2).replace('.', translator(locale)('u.decimal')) : String(amount);
  return `${sum} zł`;
}
