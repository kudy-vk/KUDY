// «Пра горад» (app/city/[id]/about.tsx): the practical guide to Gdańsk behind
// the menu piece. Under the top bar turns the wheel of sections
// (about-wheel.mjs); below it the screen shows the section that stands in the
// middle of the wheel. A section is built from facts, not paragraphs: steps,
// rides with their numbers, price rows, folds, switches (about-parts.mjs).
// Words and facts: about-content.mjs. The parts every variant shares (the
// wheel, the open section, transport, food, the map): about-screen.mjs.
import { el, icon } from './kit.mjs';
import * as words from './about-content.mjs';
import { CARD_HOURS, CARD_PACKAGES, CARD_SMAKI_PRICE, FREE_DAYS, LINKS, PRICES, RIDES, hasText, price } from './about-content.mjs';
import { fold, heading, prices, remark, seg, sr, steps } from './about-parts.mjs';
import { airportSteps, card, city, directionSwitch, food, mountAbout, sourceRows, text, transport } from './about-screen.mjs';

// Each section returns its nodes. `c` carries: t (words), money (a price in
// the guide language), ui (what the visitor chose inside the sections),
// redraw (repaint the open section in place).
const priceRows = (c, list) => {
  // One list, one shape: if any price has grosze, every price shows them.
  const cents = list.some(([, full, reduced]) => !Number.isInteger(full) || (reduced !== null && !Number.isInteger(reduced)));
  return prices(list.map(([name, full, reduced]) => [
    hasText(name) ? c.t(name) : name, c.money(full, cents), reduced === null ? null : c.t('u.reduced', { price: c.money(reduced, cents) }),
  ]));
};

function airport(c) {
  const { t } = c;
  const ticket = (sign, title, where, list) => card('ticket',
    el('h5', {}, icon(sign, 18), title),
    list && priceRows(c, list),
    list && text('t-secondary', t('tk.night')),
    text('', where));
  return [
    directionSwitch(c),
    steps(airportSteps(c, RIDES, hasText, [
      ticket('bus', t('air.ticket.bus.title'), t('air.ticket.bus.where'), PRICES.ztm),
      ticket('train-front', t('air.ticket.train.title'), t('air.ticket.train.where'), null),
    ])),
    remark('warn', t('air.notice')),
  ];
}

function touristCard(c) {
  const { t, ui } = c;
  const pack = (item) => {
    const [full, reduced] = item.prices[ui.hours];
    return card('pack',
      el('div', { className: 'pack-head' }, el('h4', { textContent: item.name }),
        el('span', { className: 'pack-price' }, c.money(full), el('small', { textContent: t('u.reduced', { price: c.money(reduced) }) }))),
      el('span', { className: 'tag free', textContent: t(`card.${item.id}.entries`) }),
      text('t-secondary', t(`card.${item.id}.list`)));
  };
  const week = el('div', { className: 'week' }, ...[1, 2, 3, 4, 5, 6, 7].map((day) => {
    const free = (FREE_DAYS[day] ?? []).some(([state]) => state === 'free');
    const node = el('button', { type: 'button' }, el('span', { textContent: t(`day.${day}`) }),
      free ? el('i', {}, sr(t('card.free.badge'))) : null);
    node.dataset.key = `day:${day}`;
    node.setAttribute('aria-pressed', String(day === ui.day));
    node.addEventListener('click', () => { ui.day = day; c.redraw(); });
    return node;
  }));
  week.setAttribute('role', 'group');
  week.setAttribute('aria-label', t('card.day'));
  const lines = FREE_DAYS[ui.day];
  const day = card('day', ...(lines
    ? lines.map(([state, museum, key]) => el('div', { className: 'day-line' },
      el('div', { className: 'day-head' }, el('strong', { textContent: t(museum) }),
        el('span', { className: `tag${state === 'free' ? ' free' : ''}`, textContent: t(`card.${state}.badge`) })),
      text('', t(key))))
    : [text('t-secondary', t('card.other'))]));
  day.setAttribute('role', 'status');
  return [
    heading(t('card.title')),
    text('', t('card.lead')),
    seg('hours', t('card.duration'), CARD_HOURS.map((hours) => [hours, t('card.hours', { n: hours })]), ui.hours, (value) => { ui.hours = value; c.redraw(); }),
    ...CARD_PACKAGES.map(pack),
    card('pack', el('div', { className: 'pack-head' }, text('', t('card.smaki')), el('span', { className: 'pack-price', textContent: c.money(CARD_SMAKI_PRICE) }))),
    fold({ id: 'card-transport', memory: ui.folds, lead: icon('tram-front', 22), title: t('card.transport.title'), meta: t('card.transport.meta'), body: [text('', t('card.transport.text')), priceRows(c, PRICES.cardTransport)] }),
    heading(t('card.free')),
    week,
    day,
    remark('warn', t('card.notice')),
  ];
}

mountAbout({
  words,
  build: { airport, transport: (c) => transport(c), city, food, card: touristCard },
  ui: { hours: 24, day: 1 },
  context: (state) => ({ money: (amount, cents) => price(state.locale, amount, cents) }),
  head: ({ t }) => [el('p', { className: 'g-checked' }, icon('check', 14), t('verified'))],
  sources: (c) => {
    const { t, section, state } = c;
    // A section without official pages (the map) has no block for them.
    if (section.links.length === 0) return [];
    const list = el('div', { className: 'card group' }, ...sourceRows(c, section.links, LINKS));
    return [
      heading(t('sources.title')),
      text('t-secondary', t('sources.note')),
      list,
      // The device could not open the page: its address stays on the screen.
      ...(state.link === 'failed' ? [remark('error', t('link.failed', { url: LINKS[section.links[0]] }))] : []),
    ];
  },
});
