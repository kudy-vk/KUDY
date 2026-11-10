// «Чым заняцца» (app/discovery.tsx): the selector and the Discovery result.
// Exact results stand alone; with zero exact the screen says so and shows the
// alternatives under their own heading, each with its difference (NAV4, D04).
// Every card names why it is in the list and carries its access mark (D06).
// States follow docs/design/screens-and-transitions.md «Discovery result».
import { el, icon, mountBoard, registerIcons } from './kit.mjs';
import { discoveryContent, offerCard, openPage, pick, readOffers } from './offers.mjs';

// Lucide shapes this screen alone needs (lucide-react-native, ISC).
registerIcons({
  tag: [['path', { d: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z' }], ['circle', { cx: '7.5', cy: '7.5', r: '.5', fill: 'currentColor' }]],
  'calendar-days': [['path', { d: 'M8 2v3' }], ['path', { d: 'M16 2v3' }], ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }], ['path', { d: 'M3 9h18' }], ['path', { d: 'M8 13h.01' }], ['path', { d: 'M12 13h.01' }], ['path', { d: 'M16 13h.01' }], ['path', { d: 'M8 17h.01' }], ['path', { d: 'M12 17h.01' }], ['path', { d: 'M16 17h.01' }]],
});

const S = {
  title: 'native.chrome.discoveryTitle', back: 'native.chrome.backToCity', walk: 'native.chrome.walk',
  cache: 'native.chrome.validCache', none: 'native.chrome.discoveryEmpty', others: 'native.chrome.discoveryAlternatives',
  unlimited: 'native.chrome.timeUnlimited', cap: 'native.chrome.timeCap', duration: 'native.chrome.durationLabel',
  guide: 'native.nearby.guideLabel', place: 'native.nearby.placeLabel',
  text: 'native.nearby.textLabel', audio: 'native.nearby.audioLabel', unit: 'native.nearby.durationUnit',
  free: 'native.chrome.access.free', paid: 'native.chrome.access.paid', mixed: 'native.chrome.access.mixed',
};
const REASON = 'native.chrome.reasonText.';
const DIFFERENCE = 'native.chrome.differenceText.';
const SEASON = 'native.chrome.seasonName.';
const STRING_IDS = [
  ...Object.values(S),
  ...['editorial', 'theme_match', 'within_time', 'season_recommended'].map((id) => REASON + id),
  ...['duration_unknown', 'over_time', 'season_not_recommended', 'season_unassessed', 'theme_mismatch'].map((id) => DIFFERENCE + id),
  ...['spring', 'summer', 'autumn', 'winter'].map((id) => SEASON + id),
];

// New strings: the app has no records for them yet. Proposals that need a
// native-speaker review before they enter the contract.
const COLLECTION = {
  be: 'Падборка', en: 'Collection', uk: 'Добірка', de: 'Sammlung', es: 'Selección',
  fr: 'Sélection', cs: 'Výběr', sv: 'Urval',
};
const THEME = {
  be: 'Тэма', en: 'Theme', uk: 'Тема', de: 'Thema', es: 'Tema', fr: 'Thème', cs: 'Téma', sv: 'Tema',
};
const SEASON_GROUP = {
  be: 'Сезон', en: 'Season', uk: 'Сезон', de: 'Jahreszeit', es: 'Temporada', fr: 'Saison', cs: 'Roční období', sv: 'Årstid',
};

const TIME_LIMITS = [60, 120, 240]; // the first-release buttons of 20 §2

// Real titles, annotations and themes come from the published discovery sources.
const content = discoveryContent();

// Mockup fixtures, not content. Recorded audio languages are a fact of the
// published index, not of the source files.
const AUDIO = { 'offer-guide-gdansk-first-walk': ['be', 'en'], 'offer-place-gdansk-highgate': ['be'] };
const GUIDE = 'offer-guide-gdansk-first-walk';
const HIGHGATE = 'offer-place-gdansk-highgate';
const FRANCISCAN = 'offer-place-gdansk-franciscan';
const HALFDAY = 'offer-collection-gdansk-halfday';
// What the visitor chose and what the selection answered, per board state:
// [offer, reasons, differences]. The real selection runs in the controller;
// the mockup shows prepared answers over the real offers.
const VIEWS = {
  selector: {
    time: null, themes: [], season: null,
    exact: [[GUIDE, ['editorial']], [HIGHGATE, ['editorial']], [FRANCISCAN, ['editorial']], [HALFDAY, ['editorial']]],
    alternatives: [],
  },
  exact: {
    time: 60, themes: ['theme-hanseatic-trade'], season: null,
    exact: [[GUIDE, ['theme_match', 'within_time']], [HIGHGATE, ['theme_match', 'within_time']]],
    alternatives: [[HALFDAY, ['theme_match'], ['over_time']], [FRANCISCAN, ['within_time'], ['theme_mismatch']]],
  },
  zero: {
    time: null, themes: ['theme-brick-gothic'], season: 'autumn',
    exact: [],
    alternatives: [[GUIDE, ['theme_match'], ['season_unassessed']], [FRANCISCAN, ['season_recommended'], ['theme_mismatch']]],
  },
};
VIEWS.offline = VIEWS.selector;


function note(kind, iconName, words) {
  return el('span', { className: `offer-note ${kind}` }, icon(iconName, 16), el('span', { textContent: words.join(' · ') }));
}

function chipGroup(iconName, label, chips) {
  const row = el('div', { className: 'chips' }, ...chips);
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', label);
  return el('div', { className: 'group' }, icon(iconName, 20), row);
}

await mountBoard({
  controls: [
    { id: 'view', label: 'Стан', options: [
      ['selector', 'Выбар не зроблены'], ['exact', 'Дакладныя вынікі'], ['zero', 'Няма дакладных, ёсць іншыя'],
      ['offline', 'Без сеткі, з кэша'],
    ] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: STRING_IDS,
  async build({ body, state, strings, say }) {
    const [index, route] = await content;
    const locale = state.locale;
    const words = { ...Object.fromEntries(Object.entries(S).map(([key, id]) => [key, strings[id]])), collection: COLLECTION[locale] };
    const t = (key) => words[key];
    const view = VIEWS[state.view];
    const offers = new Map(readOffers(index, route, AUDIO).map((offer) => [offer.id, offer]));
    const titleOf = (offer) => pick(offer.text.title, locale);
    const open = (offer) => say({
      guide: `Адкрываецца прэв'ю гіда «${titleOf(offer)}». Націск не купляе, не пачынае прагулку і не раскрывае платны змест.`,
      place: `Адкрываецца картка месца «${titleOf(offer)}». Назад вяртае ў спіс падбору.`,
      collection: `Адкрываецца падборка «${titleOf(offer)}». Яна не пачынае прагулку і нічога не купляе.`,
    }[offer.kind]);
    const card = ([id, reasons = [], differences = []]) => offerCard(offers.get(id), {
      t, locale, onOpen: open,
      // Why the card is in the list, and how an alternative differs from the request.
      notes: [
        reasons.length > 0 && note('reason', 'check', reasons.map((reason) => strings[REASON + reason])),
        differences.length > 0 && note('difference', 'circle-alert', differences.map((difference) => strings[DIFFERENCE + difference])),
      ].filter(Boolean),
    });

    const page = openPage(body, {
      title: t('title'),
      backLabel: t('back'),
      backText: 'Назад: вяртанне на экран горада. Прагулка і гук не мяняюцца.',
      walkLabel: state.walk === 'yes' ? t('walk') : null,
      cacheText: state.view === 'offline' ? t('cache') : null,
      say,
    });

    // The selector. Chips show the choice of the current board state.
    const chip = (label, pressed) => {
      const node = el('button', { className: 'chip', type: 'button', textContent: label });
      node.setAttribute('aria-pressed', String(pressed));
      node.addEventListener('click', () => say(`Выбар «${label}»: у дадатку спіс адразу перабудоўваецца. У макеце набор выбару задае перамыкач «Стан».`));
      return node;
    };
    const seasons = [...new Set(index.offers.flatMap((offer) => offer.season_recommendations.map((entry) => entry.season)))];
    page.append(el('div', { className: 'selector' },
      chipGroup('clock', t('duration'), [
        chip(t('unlimited'), view.time === null),
        ...TIME_LIMITS.map((minutes) => chip(t('cap').replace('${minutes}', minutes), view.time === minutes)),
      ]),
      chipGroup('tag', THEME[locale], index.themes.map((theme) => chip(pick(theme.labels, locale), view.themes.includes(theme.id)))),
      // A season chip exists only for a season some offer is recommended for.
      seasons.length > 0 && chipGroup('calendar-days', SEASON_GROUP[locale], seasons.map((season) => chip(strings[SEASON + season], view.season === season)))));

    for (const match of view.exact) page.append(card(match));
    if (view.exact.length === 0) {
      const empty = el('p', { className: 'notice row' }, icon('info', 18), el('span', { textContent: t('none') }));
      empty.setAttribute('role', 'status');
      page.append(empty);
    }
    if (view.alternatives.length > 0) {
      const showAlternatives = () => page.append(el('h3', { className: 'section', textContent: t('others') }), ...view.alternatives.map(card));
      if (view.exact.length === 0) {
        showAlternatives();
      } else {
        // With exact results the alternatives wait behind one disclosure.
        const more = el('button', { className: 'textlink', type: 'button' }, t('others'), icon('chevron-down', 16));
        more.setAttribute('aria-expanded', 'false');
        more.addEventListener('click', () => {
          more.remove();
          showAlternatives();
          say(`Паказаны «${t('others')}»: кожная картка называе, чым яна адрозніваецца ад запыту.`);
        });
        page.append(more);
      }
    }
    body.append(page);
  },
});
