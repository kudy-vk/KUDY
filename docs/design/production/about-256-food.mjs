// #256 compact user-driven proposal: four actions and no duplicate city listings.
import { el, icon } from './kit.mjs';
import { LINKS } from './about-256-content.mjs';
import { folds, remark } from './about-parts.mjs';
import { text } from './about-screen.mjs';

let hintSequence = 0;

// The preview kit reports the destination in the event panel instead of navigating.
// Product implementation must hand URL to the browser or installed Maps application.
export function foodProposal(c) {
  const { t, ui, say } = c;

  const action = (key, title, child, className = 'food-action') => {
    const button = el('button', { type: 'button', className }, child);
    button.setAttribute('role', 'link');
    button.setAttribute('aria-label', title);
    button.dataset.key = 'official:' + key;
    button.addEventListener('click', () =>
      say('Адкрываецца «' + title + '»: ' + LINKS[key]));
    return button;
  };

  const brand = (key, title, mark, note = '') => {
    const badge = mark.startsWith('brand:')
      ? el('span', { className: 'food-wordmark food-wordmark-' + mark.slice(6), textContent: title })
      : mark.startsWith('icon:')
        ? icon(mark.slice(5), 27)
        : el('img', { src: 'food-logos/' + mark + '.svg', alt: '', loading: 'lazy' });
    const accessibleTitle = note ? title + ', ' + note.replace(/\n/g, ', ') : title;
    return action(key, accessibleTitle, el('span', { className: 'food-brand-stack' },
      el('span', { className: 'food-brand-art' }, badge),
      mark.startsWith('brand:') ? null : el('span', { className: 'food-brand-name', textContent: title }),
      note ? el('span', { className: 'food-brand-note', textContent: note }) : null),
    'food-brand');
  };

  const brands = (...items) => el('div', { className: 'food-brand-grid' }, ...items);

  const shortLink = (key, label) =>
    action(key, label, el('span', {},
      el('span', { textContent: label }), icon('external-link', 16)),
    'food-mini-link');

  const hint = (title, body, extra = null) => {
    const id = 'food-info-' + (++hintSequence);
    const panel = el('div', { className: 'food-hint-panel' },
      body ? text('t-secondary', body) : null, extra);
    panel.id = id;
    panel.hidden = true;
    const trigger = el('button', { type: 'button', className: 'food-hint-trigger' },
      icon('info', 16), el('span', { textContent: title }));
    trigger.setAttribute('aria-controls', id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      trigger.setAttribute('aria-expanded', String(!panel.hidden));
    });
    return el('div', { className: 'food-hint' }, trigger, panel);
  };

  const note = (sign, label) => el('span', { className: 'food-short-fact' },
    icon(sign, 18), el('span', { textContent: label }));

  const payment = el('div', { className: 'food-short-facts' },
    note('landmark', t('food.pay.pln')),
    note('credit-card', t('food.pay.card')),
    note('smartphone', 'BLIK'));

  const offices = brands(
    brand('mapPromes', 'Forum · Promes', 'icon:map-pin'),
    brand('mapManhattan', 'Wrzeszcz · Manhattan', 'icon:map-pin'),
    brand('mapExchange', t('food.office.centre'), 'icon:map-pin'));

  const cash = el('div', { className: 'food-cash-compact' },
    text('food-key-tip', t('food.cash.tip')),
    el('div', { className: 'food-link-pair' },
      shortLink('kantorCompare', t('food.cash.compare')),
      shortLink('nbpRates', t('food.cash.nbp'))),
    hint(t('food.cash.offices.label'), '', offices),
    hint(t('food.cash.atm.label'), t('food.cash.atm')));

  const evening = brands(
    brand('mapMcd', 'McDonald’s', 'mcdonalds', t('food.late.station') + '\n' + t('food.late.mcd.hours')),
    brand('mapKfc', 'KFC', 'kfc', t('food.late.station') + '\n' + t('food.late.kfc.hours')),
    brand('mapLate', t('food.late.more'), 'icon:map-pin'));
  const delivery = brands(
    brand('pyszneGdansk', 'Pyszne.pl', 'brand:pyszne'),
    brand('woltGdansk', 'Wolt', 'brand:wolt'),
    brand('glovoGdansk', 'Glovo', 'glovo'),
    brand('uberGdansk', 'Uber Eats', 'ubereats'),
    brand('boltGdansk', 'Bolt Food', 'brand:bolt'));

  return [
    folds(ui.folds, [
      {
        id: 'food-payment', lead: icon('credit-card', 22),
        title: t('food.pay.title'), meta: t('food.pay.meta'),
        body: [payment,
          hint(t('food.pay.dcc'), t('food.pay.dcc.detail'),
            shortLink('visaDcc', t('food.pay.dcc.source')))],
      },
      {
        id: 'food-cash', lead: icon('landmark', 22),
        title: t('food.cash.title'), meta: t('food.cash.meta'),
        body: [cash],
      },
      {
        id: 'food-late', lead: icon('moon', 22),
        title: t('food.late.title'), meta: t('food.late.meta'),
        body: [evening,
          hint(t('food.late.kitchen.label'), t('food.late.kitchen.hint'))],
      },
      {
        id: 'food-delivery', lead: icon('store', 22),
        title: t('food.delivery.title'), meta: t('food.delivery.meta'),
        body: [delivery],
      },
    ]),
    ...(c.state.link === 'failed'
      ? [remark('error', t('link.failed', { url: LINKS.kantorCompare }))]
      : []),
  ];
}
