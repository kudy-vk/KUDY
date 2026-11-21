// «Пра горад» #257 (app/city/[id]/about.tsx): the proposal over the approved
// screen. The wheel, transport, food and the map are the approved ones
// (about-screen.mjs); this file keeps only what the proposal changes: the
// airport section (direction cards, closed steps, the tourist card), the
// resident card in transport and the folded official links. Offers, prices
// and admission conditions belong on official providers' pages. Words and
// facts: about-257-content.mjs.
import { el, icon, iconButton, iconShapes, registerIcons, svg } from './kit.mjs';
import { OLD_TOWN } from './route-art-paths.mjs';
import { RIDES } from './about-content.mjs';
import * as words from './about-257-content.mjs';
import { LINKS, TOURIST_CARD_LOGO, hasText } from './about-257-content.mjs';
import { fold, heading, remark } from './about-parts.mjs';
import { airportSteps, card, city, directionSwitch, food, mountAbout, sourceRows, text, transport } from './about-screen.mjs';

// The Lucide shape this screen alone needs (lucide-react-native, ISC), the
// sign the app draws for a home: the resident card.
registerIcons({
  house: [['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }], ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }]],
});

// Each section returns its nodes. `c` carries words, the visitor's section
// choices and a way to repaint the open section in place.

function airport(c) {
  const { t, ui } = c;
  const way = ui.direction;
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
  // The direction switch is the approved one (about-screen.mjs) with its
  // radio roles and words.
  const directions = directionSwitch(c);
  // The owner's composition (#257): each direction shows its way, the plane →
  // the old town or back. Redrawn in KUDY's own illustration manner: the
  // town is the proposal's Gdańsk picture redrawn as an engraving, the plane
  // is the kit's plane in the same engraved line (routeArt below). The word
  // stays the button's name for the screen reader.
  directions.classList.add('route-pick');
  for (const key of ['from', 'to']) {
    const button = directions.querySelector(`[data-key="direction:${key}"]`);
    button.replaceChildren(routeArt(key));
    button.setAttribute('aria-label', t(`air.dir.${key}`));
    button.title = t(`air.dir.${key}`);
  }
  return [
    directions,
    collapsibleSteps(airportSteps(c, RIDES, hasText, [
      ticket('bus', t('air.ticket.bus.title'), t('air.ticket.bus.where')),
      ticket('train-front', t('air.ticket.train.title'), t('air.ticket.train.where')),
    ])),
  ];
}

// The town for the airport switch: the owner's Gdańsk picture of the #257
// proposal (the Main Town Hall with its clock and spire, St Mary's tower,
// the big roof with its turret, the row of gabled burgher houses, the slim
// spire, the bushes), redrawn in the engraved manner of the home-screen
// panorama: ground-filled shapes with an ink line, thin detail strokes.
// 100×100 grid, back to front.
function routeArt(direction) {
  const town = (x) => svg('svg', { x, y: 0, width: 54, height: 54, viewBox: '0 6 100 90' },
    ...OLD_TOWN.map(([kind, d]) => svg('path', { class: `route-${kind}`, d })));
  const plane = (x) => svg('svg', { x, y: 7, width: 36, height: 36, viewBox: '0 0 24 24' },
    ...iconShapes('plane').map((shape) => { shape.setAttribute('class', 'route-mass'); return shape; }));
  const arrow = (x) => svg('path', { class: 'route-line', d: `M${x} 25h16m-6-6 6 6-6 6` });
  return svg('svg', { class: 'route-art', viewBox: '0 0 156 50', 'aria-hidden': 'true' },
    ...(direction === 'from' ? [plane(14), arrow(58), town(88)] : [town(14), arrow(74), plane(104)]));
}

const openOfficial = (c, key) => c.say('Адкрываецца афіцыйная старонка ў браўзеры: ' + LINKS[key] + '. Без сеткі даведнік застаецца адкрытым.');

function residentCard(c) {
  const { t } = c;
  // No resident-card logo is copied: the common house icon is decorative.
  // Only the external-link control is interactive, consistent with Karta Turysty.
  const link = iconButton('external-link', t('resident.openOfficial', { name: t('resident.title') }),
    () => openOfficial(c, 'jestemZGdanska'), 20);
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
    () => openOfficial(c, 'kartaTurysty'), 20);
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

mountAbout({
  words,
  build: { airport, transport: (c) => transport(c, [heading(c.t('tr.residents')), residentCard(c)]), city, food },
  sources: (c) => {
    const { t, ui, section, state } = c;
    if (section.links.length === 0) return [];
    // The official links stay available but closed until asked for.
    const list = el('div', { className: 'source-rows' }, ...sourceRows(c, section.links, LINKS));
    const folded = fold({ id: 'official-sources-' + section.id, memory: ui.folds, title: t('sources.title'), body: [list] });
    folded.classList.add('source-fold');
    return [
      folded,
      ...(state.link === 'failed' ? [remark('error', t('link.failed', { url: LINKS[section.links[0]] }))] : []),
    ];
  },
  // The tourist card closes the way from the airport.
  tail: (c) => (c.section.id === 'airport' && c.ui.direction === 'from' ? [touristCard(c)] : []),
});
