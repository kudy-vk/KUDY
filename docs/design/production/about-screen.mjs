// «Пра горад» (app/city/[id]/about.tsx): the parts every variant of the
// screen shares — the top bar, the wheel of sections (about-wheel.mjs), the
// open section under it, the map, transport and food sections, and the rides
// of the airport section. The approved mockup (about.mjs) and a proposal
// (about-257.mjs) each pass only what differs: their words and facts, their
// own sections, what follows the heading, the block of official pages and
// what closes a section. The guide needs no network; only the official links
// at the end of a section do.
import { el, icon, mountBoard, panorama, registerIcons, topbar, walkButton } from './kit.mjs';
import { APPS, DELIVERY, PAY_METHODS } from './about-content.mjs';
import { atlas, initialAtlas } from './about-map.mjs';
import { facts, folds, heading, lineBadge, remark, rows, seg, tile } from './about-parts.mjs';
import { wheel } from './about-wheel.mjs';

// The Lucide shape the transport section needs beyond the kit
// (lucide-react-native, ISC): compass for the Kompas app tile, the sign the
// app draws there (components/about-city-content.ts).
registerIcons({
  compass: [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z' }]],
});

const CHROME = { title: 'native.chrome.aboutCity', back: 'native.chrome.back', walk: 'native.chrome.walk' };

export const text = (className, value) => el('p', { className, textContent: value });
export const card = (className, ...children) => el('div', { className: `card ${className}` }, ...children);

// The switch between the two ways: from the airport and to it.
export const directionSwitch = (c) => seg('direction', c.t('air.dir'),
  [['from', c.t('air.dir.from')], ['to', c.t('air.dir.to')]], c.ui.direction, (value) => { c.ui.direction = value; c.redraw(); });

// The three steps of the chosen way as [{ title, body }]: leave the terminal,
// pick a ride (one fold per line), take a ticket (`tickets`, the variant's own).
export function airportSteps(c, rides, hasText, tickets) {
  const { t, ui } = c;
  const way = ui.direction;
  return [
    {
      title: t(`air.${way}.s1.title`),
      body: [
        text('', t(`air.${way}.s1.text`)),
        way === 'from' && el('div', { className: 'stack' },
          facts([['map-pin', t('air.from.s1.stop01')]]), facts([['map-pin', t('air.from.s1.stop02')]])),
      ],
    },
    { title: t('air.s2.title'), body: [rideFolds(c, rides, hasText)] },
    { title: t('air.s3.title'), body: tickets },
  ];
}

// The rows of a section's official pages; a press opens the page in the browser.
export const sourceRows = ({ t, say }, keys, links) => keys.map((key) => {
  const label = t(`links.${key}`);
  const row = el('button', { className: 'srow', type: 'button' }, el('span', { className: 'grow', textContent: label }), icon('external-link', 18));
  row.setAttribute('role', 'link');
  row.addEventListener('click', () => say(`Адкрываецца афіцыйная старонка «${label}» у браўзеры: ${links[key]}. Без сеткі браўзер пакажа сваю памылку; даведнік застаецца адкрытым.`));
  return row;
});

// The rides from and to the airport, one fold per line, for the chosen way.
function rideFolds(c, rides, hasText) {
  const { t, ui } = c;
  const way = ui.direction;
  return folds(ui.folds, rides.map((ride) => ({
    id: `ride-${ride.id}`,
    lead: lineBadge(ride.kind, ride.line, t(`sr.${ride.kind}`)),
    title: t(`ride.${ride.id}.${way}`),
    meta: facts(ride[way].facts.map(([sign, key, values]) => [sign, t(key, values)])),
    body: [rows(ride[way].rows.map(([label, value]) => [t(label), hasText(value) ? t(value) : value]))],
  })));
}

// `before` goes between the ways to ride and the ticket apps (a proposal may
// add its own block there).
export function transport(c, before = []) {
  const { t, ui } = c;
  // The ticket apps: the owner's verdict (issue #254, 2026-11-16) keeps the
  // fares, the ticket catalogue and the activation rules out of the guide —
  // they live in the apps and on the official pages. The section only names
  // what to ride and opens the three apps by their icons.
  const appTile = (app) => {
    const title = t(`tr.buy.${app.id}.title`);
    const node = tile(app.icon, title, t(`tr.buy.${app.id}.text`));
    node.setAttribute('role', 'link');
    node.addEventListener('click', () => c.say(`Адкрываецца аплікацыя «${title}» у браўзеры: ${app.url}. Без сеткі браўзер пакажа сваю памылку; даведнік застаецца адкрытым.`));
    return node;
  };
  return [
    heading(t('tr.modes')),
    folds(ui.folds, [
      { id: 'mode-ztm', lead: icon('tram-front', 22), title: t('tr.ztm.title'), meta: t('tr.ztm.meta'), body: [text('', t('tr.ztm.text'))], open: true },
      { id: 'mode-skm', lead: icon('train-front', 22), title: t('tr.skm.title'), meta: t('tr.skm.meta'), body: [text('', t('tr.skm.text')), remark('warn', t('tr.skm.warn'))] },
      { id: 'mode-rail', lead: icon('route', 22), title: t('tr.rail.title'), meta: t('tr.rail.meta'), body: [text('', t('tr.rail.text'))] },
    ]),
    ...before,
    heading(t('tr.buy')),
    el('div', { className: 'tiles' }, ...APPS.map(appTile)),
  ];
}

// The illustrated map of the Tricity with the owner's zones, the railway and
// the airport (about-map.mjs): light in both themes, like every map of the
// app (decision DT-4).
export const city = (c) => atlas({ t: c.t, ui: c.ui, lang: c.lang, openSection: c.openSection, openMaps: c.openMaps });

export function food(c) {
  const { t, ui } = c;
  const chip = (key) => {
    const node = el('button', { className: 'chip', type: 'button', textContent: t(`pay.${key}`) });
    node.dataset.key = `pay:${key}`;
    node.setAttribute('aria-pressed', String(ui.pay === key));
    node.addEventListener('click', () => { ui.pay = key; c.redraw(); });
    return node;
  };
  const filter = el('div', { className: 'chips' }, ...['any', ...PAY_METHODS].map(chip));
  filter.setAttribute('role', 'group');
  filter.setAttribute('aria-label', t('food.pay'));
  const takes = (service) => ui.pay === 'any' || service.pay.includes(ui.pay);
  // Services that take the chosen way to pay come first.
  const services = [...DELIVERY].sort((a, b) => Number(takes(b)) - Number(takes(a))).map((service) => card(`service${takes(service) ? '' : ' off'}`,
    el('strong', { textContent: service.name }),
    takes(service)
      ? el('span', { className: 'tags' }, ...service.pay.map((key) => el('span', { className: `tag${key === ui.pay ? ' free' : ''}`, textContent: t(`pay.${key}`) })))
      : el('span', { className: 't-secondary', textContent: `${t(`pay.${ui.pay}`)}: ${t('food.unconfirmed')}` }),
    service.note && takes(service) && el('span', { className: 't-secondary', textContent: t(service.note) })));
  return [
    heading(t('food.delivery')),
    text('', t('food.delivery.lead')),
    filter,
    el('div', { className: 'folds' }, ...services),
    text('t-secondary', t('food.note')),
    heading(t('food.city')),
    folds(ui.folds, [
      { id: 'pay-cards', lead: icon('credit-card', 22), title: t('food.cards.title'), meta: t('food.cards.meta'), body: [text('', t('food.cards.text'))] },
      {
        id: 'pay-blik', lead: icon('smartphone', 22), title: t('food.blik.title'), meta: t('food.blik.meta'),
        body: [
          text('', t('food.blik.need')),
          rows([[t('food.blik.online.title'), t('food.blik.online.text')], [t('food.blik.till.title'), t('food.blik.till.text')]]),
          text('t-secondary', t('food.blik.more')),
        ],
      },
    ]),
  ];
}

// Mounts the screen on the board.
// - words: { SECTIONS, LINKS, guideLanguage, translator } of the variant;
// - build: { [section id]: (c) => nodes };
// - ui: the variant's own starting choices inside the sections;
// - context(state): the variant's own fields of `c` (a price formatter…);
// - head(c), sources(c), tail(c): nodes after the heading, the official
//   pages, nodes before the closing panorama. `c.section` is the open one.
export function mountAbout({ words, build, ui: ownUi = {}, context: ownContext = () => ({}), head = () => [], sources, tail = () => [] }) {
  const { SECTIONS, guideLanguage, translator } = words;
  const boardNames = translator('be');
  const board = mountBoard({
    controls: [
      { id: 'section', label: 'Раздзел', options: SECTIONS.map((section) => [section.id, boardNames(`tab.${section.id}`)]) },
      { id: 'link', label: 'Спасылка', options: [['ok', 'Адкрылася'], ['failed', 'Не адкрылася']] },
      { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
    ],
    stringIds: Object.values(CHROME),
    async build({ body, state, strings, say, device, theme }) {
      const lang = guideLanguage(state.locale);
      const t = translator(state.locale);
      // What the visitor chose and opened inside the sections; it outlives a repaint.
      const ui = { direction: 'from', atlas: initialAtlas(), pay: 'any', ...ownUi, folds: new Map() };
      let current = SECTIONS.find((section) => section.id === state.section);

      body.append(topbar({
        title: strings[CHROME.title],
        backLabel: strings[CHROME.back],
        onBack: () => say('Назад: вяртанне ў галоўнае меню. Прагулка і гук не мяняюцца.'),
        right: state.walk === 'yes'
          ? [walkButton(strings[CHROME.walk], () => say(`Вяртанне да бягучай прагулкі («${strings[CHROME.walk]}») у ранейшым становішчы панэлі.`))]
          : [],
      }));

      const page = el('div', { className: 'page scroll', id: `about-panel-${theme}` });
      page.setAttribute('role', 'tabpanel');
      page.lang = lang;
      const context = {
        t, ui, lang, state, say,
        ...ownContext(state),
        redraw: () => paint(false),
        // Turns the wheel to another section, as a press on its item would.
        openSection: (id) => wheelNode.querySelectorAll('.slot')[SECTIONS.findIndex((section) => section.id === id)].click(),
        // The app hands the address to the system: Google Maps or the browser opens it.
        openMaps: (url) => say(`Адкрываецца Google Maps (праграма або браўзер): ${url}. Без сеткі Google Maps пакажа сваю памылку; даведнік застаецца адкрытым.`),
      };

      // Paints the open section. A change of section resets the scroll and slides
      // the content in from the side the wheel turned to. A repaint in place
      // (after a choice inside the section) keeps the scroll, what was opened
      // (ui.folds) and the focus: the pressed control is found again by its key.
      function paint(fresh, direction = 0) {
        const top = fresh ? 0 : page.scrollTop;
        const focused = !fresh && page.contains(document.activeElement) ? document.activeElement.dataset.key : null;
        context.section = current;
        page.setAttribute('aria-label', t(`tab.${current.id}`));
        page.replaceChildren(
          el('h3', { className: 'g-head', textContent: t(`head.${current.id}`) }),
          ...head(context),
          ...build[current.id](context),
          ...sources(context),
          ...tail(context),
          // The engraved view of Gdańsk from the home screen closes every section.
          el('div', { className: 'g-end' }, panorama()));
        page.scrollTop = top;
        if (focused) page.querySelector(`[data-key="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
        if (!fresh) return;
        page.classList.remove('from-left', 'from-right');
        void page.offsetWidth; // restarts the slide
        if (direction) page.classList.add(direction > 0 ? 'from-right' : 'from-left');
      }

      const wheelNode = wheel({
        items: SECTIONS.map((section) => ({ id: section.id, icon: section.icon, label: t(`tab.${section.id}`) })),
        index: SECTIONS.indexOf(current),
        // Every item has the same width. It grows a little with the text size
        // (up to the app's limit of 1.25), and three items always fit the screen.
        slot: Math.min(Math.round(100 * (0.75 + 0.25 * Math.min(state.scale, 1.25))), Math.floor(device.w / 3)),
        label: t('wheel.label'),
        lang,
        controls: page.id,
        async onSelect(index, direction) {
          current = SECTIONS[index];
          // The board's own switch follows the wheel without a redraw.
          state.section = current.id;
          document.getElementById('section').value = current.id;
          paint(true, direction);
          (await board).say(`Кола спынілася на «${boardNames(`tab.${current.id}`)}»: пад ім адкрыты гэты раздзел.`);
        },
      });
      body.append(wheelNode, page);
      paint(true);
    },
  });
  return board;
}
