// #256 concise food-and-payment proposal. All other About City sections use the canon.
import * as original from './about-content.mjs';
export * from './about-content.mjs';

const map = (place) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place);

export const LINKS = {
  ...original.LINKS,
  mapMcd: map("McDonald's Gdańsk Główny, Podwale Grodzkie 2, Gdańsk"),
  mapKfc: map('KFC Gdańsk PKP, Podwale Grodzkie 2c, Gdańsk'),
  mapLate: map('jedzenie po 21 Gdańsk'),
  mapPromes: map('Kantor Promes Forum Gdańsk, Targ Sienny 7, Gdańsk'),
  mapManhattan: map('Kantor Manhattan, Grunwaldzka 92, Gdańsk'),
  mapExchange: map('Kantor Exchange, Kaletnicza 10/13, Gdańsk'),
  pyszneGdansk: 'https://www.pyszne.pl/jedzenie-na-dowoz/gdansk',
  woltGdansk: 'https://wolt.com/pl/pol/gdansk',
  glovoGdansk: 'https://glovoapp.com/pl/pl/trojmiasto',
  uberGdansk: 'https://www.ubereats.com/pl/city/gdansk-pomorskie',
  boltGdansk: 'https://food.bolt.eu/pl-pl/449-gdansk/',
  visaDcc: 'https://www.visa.com/en-us/personal/travel/dynamic-currency-conversion',
  nbpRates: 'https://nbp.pl/statystyka-i-sprawozdawczosc/kursy/tabela-a/',
  kantorCompare: 'https://marketportal.pl/kantory/kursy-walut/gdansk/eur',
};

// Match the current native M14 wheel: four main sections; the fifth
// tourist-card section moved out of the wheel before this PR.
export const SECTIONS = original.SECTIONS
  .filter((section) => section.id !== 'card')
  .map((section) => section.id === 'food' ? { ...section, links: [] } : section);

const COPY = {
  be: {
    'tab.food': 'Ежа і аплата',
    'food.verified': 'Звесткі правераны 25.11.2026',
    'food.pay.title': 'Як плаціць',
    'food.pay.meta': 'PLN · картка · BLIK',
    'food.pay.pln': 'Злоты (PLN)',
    'food.pay.card': 'Картка ці тэлефон',
    'food.pay.dcc': 'Выбар валюты на тэрмінале',
    'food.pay.dcc.detail': 'Калі тэрмінал прапануе канвертацыю ў іншую валюту, звычайна выгадней выбраць PLN. Правер умовы свайго банка.',
    'food.pay.dcc.source': 'Парада Visa',
    'food.cash.title': 'Абмен і банкаматы',
    'food.cash.meta': 'Курсы · зняцце грошай',
    'food.cash.tip': 'EUR → PLN? Параўнай «kupno» і канчатковую суму ў злотых.',
    'food.cash.compare': 'Курсы EUR у Гданьску',
    'food.cash.nbp': 'Курс NBP',
    'food.cash.offices.label': '3 пункты абмену на карце',
    'food.cash.atm.label': 'Зняцце ў банкамаце',
    'food.office.centre': 'Цэнтр · Exchange',
    'food.cash.atm': 'Глядзі камісію да зняцця. Калі банкамат прапануе канвертацыю, выбірай PLN.',
    'food.late.title': 'Пасля 21:00',
    'food.late.meta': 'Дзе яшчэ можна паесці',
    'food.late.station': 'Галоўны вакзал',
    'food.late.mcd.hours': 'да 00:00',
    'food.late.kfc.hours': 'звычайна да 01:00',
    'food.late.more': 'Іншыя месцы',
    'food.late.kitchen.label': 'Час працы кухні',
    'food.late.kitchen.hint': 'Кухня можа закрывацца раней за залу. Гадзіны сетак змяняюцца, асабліва ў святы.',
    'food.delivery.title': 'Дастаўка ежы',
    'food.delivery.meta': '5 сэрвісаў',
  },
  en: {
    'tab.food': 'Food and payment',
    'food.verified': 'Checked on 25 Nov 2026',
    'food.pay.title': 'How to pay',
    'food.pay.meta': 'PLN · cards · BLIK',
    'food.pay.pln': 'Złoty (PLN)',
    'food.pay.card': 'Card or phone',
    'food.pay.dcc': 'Currency choice at checkout',
    'food.pay.dcc.detail': 'When offered dynamic conversion, paying in PLN is usually better. Check your bank’s charges.',
    'food.pay.dcc.source': 'Visa advice',
    'food.cash.title': 'Cash exchange & ATMs',
    'food.cash.meta': 'Rates · withdrawals',
    'food.cash.tip': 'EUR → PLN? Compare the “kupno” rate and final amount in złoty.',
    'food.cash.compare': 'EUR rates in Gdańsk',
    'food.cash.nbp': 'NBP reference rate',
    'food.cash.offices.label': '3 exchange offices on the map',
    'food.cash.atm.label': 'ATM withdrawals',
    'food.office.centre': 'Centre · Exchange',
    'food.cash.atm': 'Check fees before withdrawing. If offered a conversion, choose PLN.',
    'food.late.title': 'After 9 PM',
    'food.late.meta': 'Where to eat late',
    'food.late.station': 'Main station',
    'food.late.mcd.hours': 'until midnight',
    'food.late.kfc.hours': 'usually until 1 AM',
    'food.late.more': 'More places',
    'food.late.kitchen.label': 'Kitchen hours',
    'food.late.kitchen.hint': 'Kitchens can close before the venue. Opening hours vary, especially on holidays.',
    'food.delivery.title': 'Food delivery',
    'food.delivery.meta': '5 services',
  },
};

export const translator = (locale) => {
  const base = original.translator(locale);
  const local = COPY[locale] ?? COPY.en;
  return (key, params = {}) => {
    const message = local[key];
    return message === undefined
      ? base(key, params)
      : message.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
  };
};
