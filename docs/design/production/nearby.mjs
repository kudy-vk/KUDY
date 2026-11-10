// «Побач» (app/map.tsx): a schematic map with the offers around and, under it,
// a sheet with Moment teasers and offer cards. States follow
// docs/design/screens-and-transitions.md «Побач (Map, вольная прагулка)» and
// the location notes of app/map.tsx. Nothing here starts audio by itself: a
// teaser sounds only after its own Play.
import { el, icon, mountBoard, svg, topbar, walkButton } from './kit.mjs';

const S = {
  title: 'native.nearby.title', back: 'native.chrome.back', walk: 'native.chrome.walk',
  near: 'native.nearby.proximityHeader', review: 'native.nearby.reviewHeader',
  denied: 'native.nearby.noteDenied', held: 'native.nearby.noteHeldByWalk',
  empty: 'native.nearby.empty', cache: 'native.chrome.validCache',
  guide: 'native.nearby.guideLabel', place: 'native.nearby.placeLabel',
  text: 'native.nearby.textLabel', audio: 'native.nearby.audioLabel',
  unit: 'native.nearby.durationUnit', duration: 'native.chrome.durationLabel',
  teaser: 'native.place.teaserLabel', play: 'native.place.playLabel', stop: 'native.place.stopLabel',
  live: 'native.place.nowPlaying', preview: 'native.place.guideLink',
  free: 'native.chrome.access.free', paid: 'native.chrome.access.paid', mixed: 'native.chrome.access.mixed',
};

// A new string: the app has no record for it yet. A proposal that needs a
// native-speaker review before it enters the contract.
const POSITION = {
  be: 'Ваша пазіцыя', en: 'Your position', uk: 'Ваша позиція', de: 'Ihr Standort', es: 'Tu posición',
  fr: 'Votre position', cs: 'Vaše poloha', sv: 'Din position',
};

const TYPE_ICON = { guide: 'route', place: 'map-pin' };

// Real titles and annotations come from the published discovery sources.
const CONTENT = new URL('../../../content/discovery/', import.meta.url);
async function json(file) {
  const response = await fetch(new URL(file, CONTENT));
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.json();
}
const content = Promise.all([json('discovery.json'), json('route.json')]);

// Mockup fixtures, not content. Recorded audio languages are a fact of the
// published index, not of the source files.
const AUDIO = {
  'offer-guide-gdansk-first-walk': ['be', 'en'],
  'offer-place-gdansk-highgate': ['be'],
  'offer-place-gdansk-franciscan': [],
};
// Where an offer stands on the schematic, in percent of the map box; laid out
// by eye after content/discovery/places.json. A guide stands at its start place.
const SPOT = {
  'offer-guide-gdansk-first-walk': [68, 70],
  'offer-place-gdansk-highgate': [20, 74],
  'offer-place-gdansk-franciscan': [42, 21],
};
const HERE = [34, 51.5];
// Synthetic Moment teasers: the content has none yet. The wording restates the
// published annotations and adds no fact of its own.
const MOMENTS = [
  { id: 'moment-highgate', offer: 'offer-place-gdansk-highgate', text: 'Ад гэтай брамы галоўная вуліца вядзе да Доўгага рынку. Кароткая гісторыя перад першымі крокамі.' },
  { id: 'moment-townhall', place: 'Ратуша', text: 'Ратуша з вытанчаным шпілем — першая кропка гіда. Кароткая гісторыя пра ўладу вольнага горада.' },
];
// Streets of the schematic: [path in a 100×100 box, width in px].
const STREETS = [
  ['M0 76L20 74L68 70L100 67', 14], ['M0 55L45 50L100 46', 8], ['M0 33L38 29L100 24', 8], ['M0 12L42 10L100 4', 6],
  ['M0 93L60 90L100 86', 8], ['M20 100L20 74L16 40L18 0', 8], ['M42 100L44 50L42 12L41 0', 8],
  ['M68 100L68 70L65 24L64 0', 10], ['M88 100L86 46L84 0', 6], ['M56 71L54 49', 5],
];

const pick = (map, locale) => map?.[locale] ?? map?.be ?? '';
const langOf = (map, locale) => (map?.[locale] ? locale : 'be');
const codes = (list) => (list.length ? list.join(', ') : '—');
const sr = (text) => el('span', { className: 'sr', textContent: text });

// The published index carries `access`; the source files do not, so the mockup
// applies the rule of 21 §3.2: a guide takes its route's access, a place is free.
function readOffers(index, route) {
  return index.offers.filter((offer) => offer.ref.kind !== 'collection').map((offer) => ({
    id: offer.offer_id,
    kind: offer.ref.kind,
    text: offer.localized,
    duration: offer.estimated_duration ?? null,
    textLocales: Object.keys(offer.localized.title),
    audioLocales: AUDIO[offer.offer_id] ?? [],
    access: offer.ref.kind === 'guide' && offer.ref.route_id === route.route_id ? route.access : 'free',
  }));
}

function offerCard(offer, { t, locale, onOpen }) {
  const title = el('span', { className: `offer-title${offer.kind === 'guide' ? ' t-display' : ''}` }, sr(`${t(offer.kind)}: `), pick(offer.text.title, locale));
  title.lang = langOf(offer.text.title, locale);
  const summary = el('span', { className: 'offer-summary', textContent: pick(offer.text.summary, locale) });
  summary.lang = langOf(offer.text.summary, locale);
  const facts = el('span', { className: 'facts' },
    el('span', { className: 'fact' }, icon(TYPE_ICON[offer.kind], 16)),
    offer.duration && el('span', { className: 'fact' }, icon('clock', 16), sr(`${t('duration')}: `), `${offer.duration.min_minutes}–${offer.duration.max_minutes} ${t('unit')}`));
  const langs = el('span', { className: 'facts' },
    el('span', { className: 'fact' }, icon('book-open', 16), sr(`${t('text')}: `), codes(offer.textLocales)),
    el('span', { className: 'fact' }, icon('headphones', 16), sr(`${t('audio')}: `), codes(offer.audioLocales)));
  const photo = el('span', { className: 'photo' }, icon('image', 20));
  photo.setAttribute('aria-hidden', 'true');
  const card = el('button', { className: 'card offer', type: 'button' },
    el('span', { className: 'offer-head' }, photo, el('span', { className: 'offer-heading' }, title, facts)),
    summary,
    el('span', { className: 'offer-meta' }, langs, el('span', { className: `tag ${offer.access}`, textContent: t(offer.access) })));
  card.addEventListener('click', () => onOpen(offer));
  return card;
}

// One teaser. `player` is the single player of the screen: starting one teaser
// stops the other, and nothing starts without a press on Play.
function momentCard(moment, { t, title, say, player }) {
  const play = el('button', { className: 'btn primary playbtn', type: 'button' });
  const live = el('p', { className: 'moment-live', textContent: t('live') });
  live.setAttribute('role', 'status');
  const paint = () => {
    const on = player.current === moment.id;
    play.replaceChildren(icon(on ? 'square' : 'play', 20));
    play.setAttribute('aria-label', `${t(on ? 'stop' : 'play')}: ${title}`);
    live.hidden = !on;
  };
  player.cards.push(paint);
  play.addEventListener('click', () => {
    const on = player.current === moment.id;
    player.current = on ? null : moment.id;
    for (const repaint of player.cards) repaint();
    say(on
      ? `Тэйзер «${title}» спынены.`
      : `Тэйзер «${title}» грае на адзіным плэеры — толькі пасля яўнага націску. Стан прагулкі не мяняецца.`);
  });
  paint();
  const preview = el('button', { className: 'textlink', type: 'button' }, t('preview'), icon('chevron-right', 16));
  preview.addEventListener('click', () => say('Адкрываецца прэв\'ю гіда, не запуск прагулкі. Назад вяртае на «Побач».'));
  const text = el('p', { className: 'moment-text', textContent: moment.text });
  text.lang = 'be';
  return el('div', { className: 'card moment moment-card' }, play,
    el('div', { className: 'moment-body' },
      el('p', { className: 'moment-label', textContent: t('teaser') }),
      el('h3', { className: 'moment-title', textContent: title }),
      text, live, preview));
}

function cityMap({ label, pins, position }) {
  const ground = svg('svg', { class: 'ground', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svg('rect', { width: 100, height: 100, fill: '#eef3ee' }),
    ...STREETS.map(([d, width]) => svg('path', { d, 'stroke-width': width })));
  const map = el('div', { className: 'map' }, ground);
  map.dataset.theme = 'light';
  map.setAttribute('role', 'group');
  map.setAttribute('aria-label', label);
  if (position) {
    const me = el('span', { className: 'me' });
    me.setAttribute('role', 'img');
    me.setAttribute('aria-label', position);
    me.style.left = `${HERE[0]}%`;
    me.style.top = `${HERE[1]}%`;
    map.append(me);
  }
  for (const pin of pins) {
    const button = el('button', { className: 'pin', type: 'button' }, el('span', {}, icon(pin.icon, 18)),
      pin.locked ? el('i', { className: 'pin-lock' }, icon('lock', 10)) : null);
    button.setAttribute('aria-label', pin.label);
    button.style.left = `${pin.at[0]}%`;
    button.style.top = `${pin.at[1]}%`;
    button.addEventListener('click', pin.onPress);
    map.append(button);
  }
  return map;
}

function notice(iconName, text) {
  const node = el('p', { className: 'notice row' }, icon(iconName, 18), el('span', { textContent: text }));
  node.setAttribute('role', 'status');
  return node;
}

await mountBoard({
  controls: [
    { id: 'view', label: 'Стан', options: [
      ['moments', 'З тэйзерамі'], ['empty', 'Пусты спіс'], ['denied', 'GPS не дазволены'],
      ['offline', 'Без сеткі, з кэша'], ['walk', 'Ідзе прагулка'],
    ] },
  ],
  stringIds: Object.values(S),
  async build({ body, state, strings, say }) {
    const [index, route] = await content;
    const t = (key) => strings[S[key]];
    const locale = state.locale;
    const view = state.view;
    // With GPS denied, and while a walk holds the position, the places are browsed by hand.
    const located = view !== 'denied' && view !== 'walk';
    const offers = view === 'empty' ? [] : readOffers(index, route);
    const titleOf = (offer) => pick(offer.text.title, locale);
    const open = (offer) => say(offer.kind === 'guide'
      ? `Адкрываецца прэв'ю гіда «${titleOf(offer)}». Націск не купляе, не пачынае прагулку і не запускае гук.`
      : `Адкрываецца картка месца «${titleOf(offer)}». Гук не запускаецца.`);

    body.append(topbar({
      title: t('title'),
      backLabel: t('back'),
      onBack: () => say('Назад: вяртанне на экран, з якога адкрылі «Побач». Прагулка і гук не мяняюцца.'),
      right: view === 'walk' ? [walkButton(t('walk'), () => say(`Вяртанне да бягучай прагулкі («${t('walk')}») у ранейшым становішчы панэлі.`))] : [],
    }));

    // One map for everything that has a place in the city. Layers are switched
    // by icon chips on the map: where my guides start, and places. A new kind
    // of point (cafes, viewpoints) becomes one more chip here, not a new screen.
    const layers = { guide: true, place: true };
    const mapHost = el('div', { className: 'map-host' });
    const sheet = el('div', { className: 'sheet scroll' });
    const player = { current: null, cards: [] };
    const draw = () => {
      const shown = offers.filter((offer) => layers[offer.kind]);
      const map = cityMap({
        label: t('title'),
        position: located ? POSITION[locale] : null,
        pins: shown.map((offer) => ({
          icon: TYPE_ICON[offer.kind],
          // A guide pin stands where the route starts and says whether the guide is paid.
          locked: offer.kind === 'guide' && offer.access === 'paid',
          label: [`${t(offer.kind)}: ${titleOf(offer)}`, S[offer.access] ? t(offer.access) : ''].filter(Boolean).join(', '),
          at: SPOT[offer.id],
          onPress: () => open(offer),
        })),
      });
      const chips = el('div', { className: 'layers' }, ...Object.keys(layers).map((kind) => {
        const chip = el('button', { className: 'chip layer', type: 'button' }, icon(TYPE_ICON[kind], 18));
        chip.setAttribute('aria-label', t(kind));
        chip.setAttribute('aria-pressed', String(layers[kind]));
        chip.addEventListener('click', () => {
          layers[kind] = !layers[kind];
          draw();
          say(`Слой «${t(kind)}» ${layers[kind] ? 'паказаны' : 'схаваны'} на карце і ў спісе.`);
        });
        return chip;
      }));
      chips.setAttribute('role', 'group');
      map.append(chips);
      mapHost.replaceChildren(map);

      sheet.replaceChildren();
      if (view === 'offline') sheet.append(notice('wifi-off', t('cache')));
      if (view === 'denied') sheet.append(notice('locate-fixed', t('denied')));
      if (view === 'walk') sheet.append(notice('footprints', t('held')));
      sheet.append(el('h3', { className: 'sec', textContent: t(located ? 'near' : 'review') }));
      if (shown.length === 0) {
        sheet.append(notice('info', t('empty')));
        return;
      }
      player.cards.length = 0;
      // Teasers belong to places, so they follow the places layer.
      for (const moment of layers.place ? MOMENTS : []) {
        const offer = offers.find((entry) => entry.id === moment.offer);
        sheet.append(momentCard(moment, { t, title: offer ? titleOf(offer) : moment.place, say, player }));
      }
      for (const offer of shown) sheet.append(offerCard(offer, { t, locale, onOpen: open }));
    };
    draw();
    body.append(mapHost, sheet);
  },
});
