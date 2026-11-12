// «Пра горад» (app/city/[id]/about.tsx): the practical guide to Gdańsk behind
// the menu piece. Under the top bar turns the wheel of sections
// (about-wheel.mjs); below it the screen shows the section that stands in the
// middle of the wheel. A section is built from facts, not paragraphs: steps,
// rides with their numbers, price rows, folds, switches (about-parts.mjs).
// Words and facts: about-content.mjs. The guide needs no network; only the
// official links at the end of a section do.
import { el, icon, mountBoard, panorama, topbar, walkButton } from './kit.mjs';
import {
  CARD_HOURS, CARD_PACKAGES, CARD_SMAKI_PRICE, DELIVERY, FREE_DAYS, LINKS, PAY_METHODS, PLACES, PRICES, RIDES, SECTIONS,
  guideLanguage, hasText, price, translator,
} from './about-content.mjs';
import { facts, fold, folds, heading, lineBadge, prices, remark, rows, seg, sr, steps, tile } from './about-parts.mjs';
import { wheel } from './about-wheel.mjs';

const CHROME = { title: 'native.chrome.aboutCity', back: 'native.chrome.back', walk: 'native.chrome.walk' };

const text = (className, value) => el('p', { className, textContent: value });
const card = (className, ...children) => el('div', { className: `card ${className}` }, ...children);

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
  const { t, ui } = c;
  const way = ui.direction;
  const rides = folds(RIDES.map((ride) => ({
    lead: lineBadge(ride.kind, ride.line, t(`sr.${ride.kind}`)),
    title: t(`ride.${ride.id}.${way}`),
    meta: facts(ride[way].facts.map(([sign, key, values]) => [sign, t(key, values)])),
    body: [rows(ride[way].rows.map(([label, value]) => [t(label), hasText(value) ? t(value) : value]))],
  })));
  const ticket = (sign, title, where, list) => card('ticket',
    el('h5', {}, icon(sign, 18), title),
    list && priceRows(c, list),
    list && text('t-secondary', t('tk.night')),
    text('', where));
  return [
    seg(t('air.dir'), [['from', t('air.dir.from')], ['to', t('air.dir.to')]], way, (value) => { ui.direction = value; c.redraw(); }),
    steps([
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
          ticket('bus', t('air.ticket.bus.title'), t('air.ticket.bus.where'), PRICES.ztm),
          ticket('train-front', t('air.ticket.train.title'), t('air.ticket.train.where'), null),
        ],
      },
    ]),
    remark('warn', t('air.notice')),
  ];
}

function transport(c) {
  const { t, ui } = c;
  const zones = ['ztm', 'metro', 'rail'];
  return [
    heading(t('tr.modes')),
    folds([
      { lead: icon('tram-front', 22), title: t('tr.ztm.title'), meta: t('tr.ztm.meta'), body: [text('', t('tr.ztm.text'))], open: true },
      { lead: icon('train-front', 22), title: t('tr.skm.title'), meta: t('tr.skm.meta'), body: [text('', t('tr.skm.text')), remark('warn', t('tr.skm.warn'))] },
      { lead: icon('route', 22), title: t('tr.rail.title'), meta: t('tr.rail.meta'), body: [text('', t('tr.rail.text'))] },
    ]),
    heading(t('tr.prices')),
    seg(t('tr.zone'), zones.map((zone) => [zone, t(`tr.zone.${zone}`)]), ui.zone, (value) => { ui.zone = value; c.redraw(); }),
    card('ticket', text('t-secondary', t(`tr.zone.${ui.zone}.note`)), priceRows(c, PRICES[ui.zone]),
      ui.zone !== 'rail' && text('t-secondary', t('tk.night'))),
    heading(t('tr.activate')),
    folds([
      { lead: icon('scan-qr-code', 22), title: t('tr.act.paper.title'), body: [text('', t('tr.act.paper.text'))] },
      { lead: icon('smartphone', 22), title: t('tr.act.mobile.title'), body: [text('', t('tr.act.mobile.text'))] },
      { lead: icon('clock', 22), title: t('tr.act.valid.title'), body: [text('', t('tr.act.valid.text'))] },
    ]),
    heading(t('tr.buy')),
    el('div', { className: 'tiles' },
      tile('smartphone', t('tr.buy.fala.title'), t('tr.buy.fala.text')),
      tile('ticket', t('tr.buy.apps.title'), t('tr.buy.apps.text')),
      tile('credit-card', t('tr.buy.board.title'), t('tr.buy.board.text')),
      tile('store', t('tr.buy.desk.title'), t('tr.buy.desk.text'))),
    remark('tip', t('tr.tip.card')),
    remark('tip', t('tr.tip.kompas')),
  ];
}

// The orientation schematic: light in both themes, like every map of the app
// (decision DT-4). Each place is a button; the chosen one is described below.
function city(c) {
  const { t, ui } = c;
  const box = el('div', { className: 'schematic' },
    el('i', { className: 'coast' }), el('i', { className: 'river' }),
    el('span', { className: 'water sea', textContent: t('city.sea') }),
    el('span', { className: 'water motlawa', lang: 'pl', textContent: 'Motława' }));
  box.dataset.theme = 'light';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', t('city.pick'));
  for (const place of PLACES) {
    const button = el('button', { className: `spot ${place.side}${place.main ? ' main' : ''}`, type: 'button' },
      el('i', { className: 'dot' }), el('span', { className: 'name', lang: 'pl', textContent: place.name }));
    button.style.setProperty('--x', `${place.x}%`);
    button.style.setProperty('--y', `${place.y}%`);
    button.setAttribute('aria-pressed', String(place.id === ui.place));
    button.addEventListener('click', () => { ui.place = place.id; c.redraw(); });
    box.append(button);
  }
  const chosen = PLACES.find((place) => place.id === ui.place);
  const beach = chosen.kind === 'beach' || chosen.kind === 'island';
  const about = card('place',
    el('div', { className: 'place-head' },
      el('h4', { lang: 'pl', textContent: chosen.title ?? chosen.name }),
      el('span', { className: 'tag', textContent: t(`kind.${chosen.kind}`) })),
    text('', t(`place.${chosen.id}`)),
    chosen.get.length > 0 && el('div', { className: 'stack' }, sr(`${t('city.get')}: `),
      ...chosen.get.map(([sign, key]) => facts([[sign, t(key)]]))),
    chosen.warn && remark('warn', t(chosen.warn)),
    beach && text('t-secondary', t('city.summer')));
  about.setAttribute('role', 'status');
  return [
    el('div', { className: 'orientation' }, box, text('t-secondary', t('city.caption'))),
    about,
  ];
}

function food(c) {
  const { t, ui } = c;
  const chip = (key) => {
    const node = el('button', { className: 'chip', type: 'button', textContent: t(`pay.${key}`) });
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
    folds([
      { lead: icon('credit-card', 22), title: t('food.cards.title'), meta: t('food.cards.meta'), body: [text('', t('food.cards.text'))] },
      {
        lead: icon('smartphone', 22), title: t('food.blik.title'), meta: t('food.blik.meta'),
        body: [
          text('', t('food.blik.need')),
          rows([[t('food.blik.online.title'), t('food.blik.online.text')], [t('food.blik.till.title'), t('food.blik.till.text')]]),
          text('t-secondary', t('food.blik.more')),
        ],
      },
    ]),
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
    seg(t('card.duration'), CARD_HOURS.map((hours) => [hours, t('card.hours', { n: hours })]), ui.hours, (value) => { ui.hours = value; c.redraw(); }),
    ...CARD_PACKAGES.map(pack),
    card('pack', el('div', { className: 'pack-head' }, text('', t('card.smaki')), el('span', { className: 'pack-price', textContent: c.money(CARD_SMAKI_PRICE) }))),
    fold({ lead: icon('tram-front', 22), title: t('card.transport.title'), meta: t('card.transport.meta'), body: [text('', t('card.transport.text')), priceRows(c, PRICES.cardTransport)] }),
    heading(t('card.free')),
    week,
    day,
    remark('warn', t('card.notice')),
  ];
}

const BUILD = { airport, transport, city, food, card: touristCard };
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
    const ui = { direction: 'from', zone: 'ztm', place: 'glowne', pay: 'any', hours: 24, day: 1 };
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
    const context = { t, ui, money: (amount, cents) => price(state.locale, amount, cents), redraw: () => paint(false) };

    function sources() {
      const list = el('div', { className: 'card group' }, ...current.links.map((key) => {
        const label = t(`links.${key}`);
        const row = el('button', { className: 'srow', type: 'button' }, el('span', { className: 'grow', textContent: label }), icon('external-link', 18));
        row.setAttribute('role', 'link');
        row.addEventListener('click', () => say(`Адкрываецца афіцыйная старонка «${label}» у браўзеры: ${LINKS[key]}. Без сеткі браўзер пакажа сваю памылку; даведнік застаецца адкрытым.`));
        return row;
      }));
      return [
        heading(t('sources.title')),
        text('t-secondary', t('sources.note')),
        list,
        // The device could not open the page: its address stays on the screen.
        ...(state.link === 'failed' ? [remark('error', t('link.failed', { url: LINKS[current.links[0]] }))] : []),
      ];
    }
    // Paints the open section. A change of section resets the scroll and slides
    // the content in from the side the wheel turned to.
    function paint(fresh, direction = 0) {
      const top = fresh ? 0 : page.scrollTop;
      page.setAttribute('aria-label', t(`tab.${current.id}`));
      page.replaceChildren(
        el('h3', { className: 'g-head', textContent: t(`head.${current.id}`) }),
        el('p', { className: 'g-checked' }, icon('check', 14), t('verified')),
        ...BUILD[current.id](context),
        ...sources(),
        // The engraved view of Gdańsk from the home screen closes every section.
        el('div', { className: 'g-end' }, panorama()));
      page.scrollTop = top;
      if (!fresh) return;
      page.classList.remove('from-left', 'from-right');
      void page.offsetWidth; // restarts the slide
      if (direction) page.classList.add(direction > 0 ? 'from-right' : 'from-left');
    }

    body.append(wheel({
      items: SECTIONS.map((section) => ({ id: section.id, icon: section.icon, label: t(`tab.${section.id}`) })),
      index: SECTIONS.indexOf(current),
      // Every item has the same width. It grows a little with the text size
      // (up to the app's limit of 1.25), and three items always fit the screen.
      slot: Math.min(Math.round(100 * (0.75 + 0.25 * Math.min(state.scale, 1.25))), Math.floor(device.w / 3)),
      label: t('wheel.label'),
      controls: page.id,
      onSelect(index, direction) {
        current = SECTIONS[index];
        // The board's own switch follows the wheel without a redraw.
        state.section = current.id;
        document.getElementById('section').value = current.id;
        paint(true, direction);
        board.say(`Кола спынілася на «${boardNames(`tab.${current.id}`)}»: пад ім адкрыты гэты раздзел.`);
      },
    }), page);
    paint(true);
  },
});
