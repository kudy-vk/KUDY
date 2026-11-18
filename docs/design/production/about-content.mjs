// «Пра горад»: the guide's facts and the access to its words for the mockup.
//
// Words live in a dictionary keyed by id, one file per language
// (about-words-en.mjs, about-words-be.mjs). English is the full set: a
// language without its own file shows the English text (decision L1 in
// docs/design/brand/decisions.md), so today only Belarusian differs. Stable
// route details come from #200 material. Vendor prices and changing offers
// are left to official sites instead of being copied into this guide.
// These are proposals: they enter contracts/ui-messages after the verdict.
import { be } from './about-words-be.mjs';
import { en } from './about-words-en.mjs';

// Addresses of the official pages: ABOUT_CITY_LINK_URLS in
// components/about-city-content.ts. The apps the transport section opens
// (jakdojade, FALA, KomPas) carry their own URLs in APPS below; the price
// lists and current commercial terms live on official pages, not in KUDY
// (owner decisions in #254 and #257, 2026-11-16/17).
export const LINKS = {
  airportBuses: 'https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus',
  airportTrains: 'https://www.airport.gdansk.pl/en/before-travel/getting-to-the-airport/train',
  ztmSchedule: 'https://ztm.gda.pl/rozklady',
  skmSearch: 'https://www.skm.pkp.pl/dla-pasazera/wyszukaj-polaczenie',
  kartaTurysty: 'https://kartaturysty.visitgdansk.com/pl/pakiety',
  muzeumGdanska: 'https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/',
  muzeum1939: 'https://www.muzeum1939.pl/wizyta/wizyta-miiws/bilety-i-cennik',
  pysznePayment: 'https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl',
  blikHow: 'https://www.blik.com/en/how-to-use-blik',
};

// The ticket apps the transport section opens, in the owner's order
// (issue #254, 2026-11-16): jakdojade first, then FALA, then KomPas.
export const APPS = [
  { id: 'jakdojade', url: 'https://jakdojade.pl/gdansk/trasa/', icon: 'smartphone' },
  { id: 'fala', url: 'https://systemfala.pl', icon: 'ticket' },
  { id: 'kompas', url: 'https://skm.pkp.pl', icon: 'compass' },
];

// The carousel, in its order. «Аэрапорт» comes first: it is what a visitor who
// just landed needs.
export const SECTIONS = [
  { id: 'airport', icon: 'plane', links: ['airportBuses', 'airportTrains', 'ztmSchedule'] },
  { id: 'transport', icon: 'tram-front', links: ['ztmSchedule', 'skmSearch'] },
  { id: 'city', icon: 'map', links: [] },
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

// Prices and vendor tariffs are deliberately not stored in this mockup.
// For tickets and passes, consult the official links in LINKS.

// How to get to the places the map's zones mark (about-map.mjs): [sign, text key].
export const PLACE_WAYS = {
  glowne: [['footprints', 'get.glowne']],
  oliwa: [['tram-front', 'get.oliwa.tram'], ['train-front', 'get.oliwa.skm']],
  wrzeszcz: [['train-front', 'get.wrzeszcz']],
  brzezno: [['tram-front', 'get.brzezno']],
  westerplatte: [['bus', 'get.westerplatte']],
};
// Zones on city beaches whose summer services run more often.
export const SUMMER_BEACHES = ['brzezno'];

// Delivery services and the payment methods their official pages confirm.
export const PAY_METHODS = ['card', 'blik', 'cash', 'apple', 'google', 'paypal'];
export const DELIVERY = [
  { name: 'Pyszne.pl', pay: ['card', 'blik', 'cash', 'apple', 'google', 'paypal'] },
  { name: 'Glovo', pay: ['card', 'blik', 'cash'] },
  { name: 'Wolt', pay: ['card', 'blik', 'cash'] },
  { name: 'Uber Eats', pay: ['card', 'blik', 'apple'] },
  { name: 'Bolt Food', pay: ['card', 'cash'], note: 'food.bolt.note' },
];

// The official card and museum links are the source of live offers and rules.

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

