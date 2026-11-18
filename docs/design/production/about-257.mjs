// «Пра горад» (app/city/[id]/about.tsx): the practical guide to Gdańsk behind
// the menu piece. Under the top bar turns the wheel of sections
// (about-wheel.mjs); below it the screen shows the section that stands in the
// middle of the wheel. Sections present practical steps and navigation; offers,
// prices and admission conditions belong on official providers' pages.
// Words and facts: about-content.mjs. The guide needs no network; only the
// official links at the end of a section do.
import { el, icon, iconButton, mountBoard, panorama, registerIcons, topbar, walkButton } from './kit.mjs';
import {
  APPS, DELIVERY, LINKS, PAY_METHODS, RIDES, SECTIONS, TOURIST_CARD_LOGO,
  guideLanguage, hasText, translator,
} from './about-257-content.mjs';
import { atlas, initialAtlas } from './about-map.mjs';
import { facts, fold, folds, heading, lineBadge, remark, rows, seg, tile } from './about-parts.mjs';
import { wheel } from './about-wheel.mjs';

// Lucide shapes this screen alone needs (lucide-react-native, ISC) — the
// same signs the app draws: compass for the Kompas app tile
// (components/about-city-content.ts), house for the resident card.
registerIcons({
  compass: [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z' }]],
  house: [['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }], ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }]],
});

const CHROME = { title: 'native.chrome.aboutCity', back: 'native.chrome.back', walk: 'native.chrome.walk' };

const text = (className, value) => el('p', { className, textContent: value });
const card = (className, ...children) => el('div', { className: `card ${className}` }, ...children);

// Each section returns its nodes. `c` carries words, the visitor's section
// choices and a way to repaint the open section in place.

function airport(c) {
  const { t, ui } = c;
  const way = ui.direction;
  const rides = folds(ui.folds, RIDES.map((ride) => ({
    id: `ride-${ride.id}`,
    lead: lineBadge(ride.kind, ride.line, t(`sr.${ride.kind}`)),
    title: t(`ride.${ride.id}.${way}`),
    meta: facts(ride[way].facts.map(([sign, key, values]) => [sign, t(key, values)])),
    body: [rows(ride[way].rows.map(([label, value]) => [t(label), hasText(value) ? t(value) : value]))],
  })));
  const ticket = (sign, title, where) => card('ticket',
    el('h5', {}, icon(sign, 18), title),
    text('', where));
  // The numbered path uses the same accessible, animated fold as other
  // parts of the guide. No step is open on first view. Keep each direction
  // in its own fold-memory namespace so switching directions works cleanly.
  const collapsibleSteps = (items) => el('ol', { className: 'steps airport-fold-steps' },
    ...items.map(({ title, body }, index) => {
      const stepFold = fold({
        id: 'airport-' + way + '-step-' + (index + 1),
        memory: ui.folds,
        title,
        body,
      });
      stepFold.classList.add('airport-step-fold');
      return el('li', { className: 'step' }, stepFold);
    }));
  // The direction switch is the shared seg() of the main mockup and the app
  // (components/about-city-parts.tsx): words, the accent fill on the chosen
  // one — the canon's pressed state (visual-language §5).
  const directions = seg('direction', t('air.dir'),
    [['from', t('air.dir.from')], ['to', t('air.dir.to')]], way, (value) => { ui.direction = value; c.redraw(); });
  return [
    directions,
    collapsibleSteps([
      {
        title: t(`air.${way}.s1.title`),
        body: [
          text('', t(`air.${way}.s1.text`)),
          way === 'from' && el('div', { className: 'stack' },
            facts([['map-pin', t('air.from.s1.stop01')]]), facts([['map-pin', t('air.from.s1.stop02')]])),
        ],
      },
      { title: t('air.s2.title'), body: [rides] },
      {
        title: t('air.s3.title'),
        body: [
          ticket('bus', t('air.ticket.bus.title'), t('air.ticket.bus.where')),
          ticket('train-front', t('air.ticket.train.title'), t('air.ticket.train.where')),
        ],
      },
    ]),
  ];
}

function transport(c) {
  const { t, ui } = c;
  // The ticket apps: the owner's verdict (issue #254, 2026-11-16) keeps the
  // fares, the ticket catalogue and the activation rules out of the guide —
  // they live in the apps and on the official pages. The section only names
  // what to ride and opens the three apps by their icons.
  const appTile = (app) => {
    const title = t(`tr.buy.${app.id}.title`);
    const node = tile(app.icon, title, t(`tr.buy.${app.id}.text`));
    node.setAttribute('role', 'link');
    node.setAttribute('tabindex', '0');
    node.addEventListener('click', () => say(`Адкрываецца аплікацыя «${title}» у браўзеры: ${app.url}. Без сеткі браўзер пакажа сваю памылку; даведнік застаецца адкрытым.`));
    return node;
  };
  return [
    heading(t('tr.modes')),
    folds(ui.folds, [
      { id: 'mode-ztm', lead: icon('tram-front', 22), title: t('tr.ztm.title'), meta: t('tr.ztm.meta'), body: [text('', t('tr.ztm.text'))], open: true },
      { id: 'mode-skm', lead: icon('train-front', 22), title: t('tr.skm.title'), meta: t('tr.skm.meta'), body: [text('', t('tr.skm.text')), remark('warn', t('tr.skm.warn'))] },
      { id: 'mode-rail', lead: icon('route', 22), title: t('tr.rail.title'), meta: t('tr.rail.meta'), body: [text('', t('tr.rail.text'))] },
    ]),
    heading(t('tr.residents')),
    residentCard(c),
    heading(t('tr.buy')),
    el('div', { className: 'tiles' }, ...APPS.map(appTile)),
  ];
}

// The illustrated map of the Tricity with the owner's zones, the railway and
// the airport (about-map.mjs): light in both themes, like every map of the
// app (decision DT-4).
const city = (c) => atlas({ t: c.t, ui: c.ui, lang: c.lang, openSection: c.openSection, openMaps: c.openMaps });

function food(c) {
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

function residentCard(c) {
  const { t } = c;
  // No resident-card logo is copied: the common house icon is decorative.
  // Only the external-link control is interactive, consistent with Karta Turysty.
  const link = iconButton('external-link', t('resident.openOfficial', { name: t('resident.title') }),
    () => c.openOfficial('jestemZGdanska'), 20);
  link.classList.add('source-icon');
  link.setAttribute('role', 'link');
  link.dataset.key = 'official:jestemZGdanska';
  return card('card-brief resident-card',
    el('div', { className: 'card-brief-head' },
      el('div', { className: 'brand-lockup' },
        el('span', { className: 'brand-symbol resident-symbol', 'aria-hidden': 'true' }, icon('house', 24)),
        el('h4', { textContent: t('resident.title') })),
      link),
    text('t-secondary', t('resident.lead')));
}

function touristCard(c) {
  const { t, ui } = c;
  const link = iconButton('external-link', t('card.openOfficial', { name: t('card.title') }),
    () => c.openOfficial('kartaTurysty'), 20);
  link.classList.add('source-icon');
  link.setAttribute('role', 'link');
  link.dataset.key = 'official:kartaTurysty';

  // The official logo belongs to the organiser; the text fallback works offline.
  const logo = el('img', {
    className: 'tourist-brand-logo',
    src: TOURIST_CARD_LOGO,
    alt: t('card.brandAlt'),
    loading: 'lazy',
    referrerPolicy: 'no-referrer',
  });
  const fallback = el('span', { className: 'tourist-brand-fallback', textContent: 'KT', hidden: true });
  logo.addEventListener('error', () => { logo.hidden = true; fallback.hidden = false; });

  // Reuse the canonical accessible accordion. The official-site action is
  // a separate sibling button, not a button nested inside the fold trigger.
  const description = fold({
    id: 'tourist-card',
    memory: ui.folds,
    lead: el('span', { className: 'brand-symbol' }, logo, fallback),
    title: t('card.title'),
    body: [text('t-secondary', t('card.lead'))],
  });
  description.classList.add('tourist-card-fold');
  return card('card-brief tourist-card', description, link);
}

const BUILD = { airport, transport, city, food };
const boardNames = translator('be');

const board = await mountBoard({
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
    const ui = { direction: 'from', atlas: initialAtlas(), pay: 'any', folds: new Map() };
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
      t, ui, lang,
      openOfficial: (key) => say('Адкрываецца афіцыйная старонка ў браўзеры: ' + LINKS[key] + '. Без сеткі даведнік застаецца адкрытым.'),
      redraw: () => paint(false),
      // Turns the wheel to another section, as a press on its item would.
      openSection: (id) => wheelNode.querySelectorAll('.slot')[SECTIONS.findIndex((section) => section.id === id)].click(),
      // The app hands the address to the system: Google Maps or the browser opens it.
      openMaps: (url) => say(`Адкрываецца Google Maps (праграма або браўзер): ${url}. Без сеткі Google Maps пакажа сваю памылку; даведнік застаецца адкрытым.`),
    };

    function sources() {
      if (current.links.length === 0) return [];
      const rows = el('div', { className: 'source-rows' }, ...current.links.map((key) => {
        const label = t(`links.${key}`);
        const row = el('button', { className: 'srow', type: 'button' },
          el('span', { className: 'grow', textContent: label }), icon('external-link', 18));
        row.setAttribute('role', 'link');
        row.addEventListener('click', () =>
          say(`Адкрываецца афіцыйная старонка «${label}» у браўзеры: ${LINKS[key]}. Без сеткі браўзер пакажа сваю памылку; даведнік застаецца адкрытым.`));
        return row;
      }));
      const section = fold({
        id: 'official-sources-' + current.id,
        memory: ui.folds,
        title: t('sources.title'),
        body: [rows],
      });
      section.classList.add('source-fold');
      return [
        section,
        ...(state.link === 'failed' ? [remark('error', t('link.failed', { url: LINKS[current.links[0]] }))] : []),
      ];
    }
    // Paints the open section. A change of section resets the scroll and slides
    // the content in from the side the wheel turned to. A repaint in place
    // (after a choice inside the section) keeps the scroll, what was opened
    // (ui.folds) and the focus: the pressed control is found again by its key.
    function paint(fresh, direction = 0) {
      const top = fresh ? 0 : page.scrollTop;
      const focused = !fresh && page.contains(document.activeElement) ? document.activeElement.dataset.key : null;
      page.setAttribute('aria-label', t(`tab.${current.id}`));
      page.replaceChildren(
        el('h3', { className: 'g-head', textContent: t(`head.${current.id}`) }),
        ...BUILD[current.id](context),
        ...sources(),
        ...(current.id === 'airport' && ui.direction === 'from' ? [touristCard(context)] : []),
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
      onSelect(index, direction) {
        current = SECTIONS[index];
        // The board's own switch follows the wheel without a redraw.
        state.section = current.id;
        document.getElementById('section').value = current.id;
        paint(true, direction);
        board.say(`Кола спынілася на «${boardNames(`tab.${current.id}`)}»: пад ім адкрыты гэты раздзел.`);
      },
    });
    body.append(wheelNode, page);
    paint(true);
  },
});
