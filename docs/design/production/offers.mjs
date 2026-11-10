// Shared by the screens that show offers from the discovery index — nearby,
// discovery, place and collection: reading the published content, the offer
// card and the small text helpers. One owner, so the card looks and behaves
// the same on every screen.
import { el, icon, topbar, walkButton } from './kit.mjs';

export const TYPE_ICON = { guide: 'route', place: 'map-pin', collection: 'layers' };

// Real titles, annotations and themes come from the published discovery sources.
const CONTENT = new URL('../../../content/discovery/', import.meta.url);
async function json(file) {
  const response = await fetch(new URL(file, CONTENT));
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.json();
}
let loaded = null;
// Resolves to [discovery index, route]; fetched once per page.
export function discoveryContent() {
  loaded ??= Promise.all([json('discovery.json'), json('route.json')]);
  return loaded;
}

export const pick = (map, locale) => map?.[locale] ?? map?.be ?? '';
export const langOf = (map, locale) => (map?.[locale] ? locale : 'be');
export const codes = (list) => (list.length ? list.join(', ') : '—');
export const sr = (text) => el('span', { className: 'sr', textContent: text });

// The published index carries `access`; the source files do not, so the mockup
// applies the rule of 21 §3.2: a guide takes its route's access, a place is
// free, a collection is mixed when any member is paid. `audio` maps an offer id
// to its recorded audio languages (a mockup fixture, not content).
export function readOffers(index, route, audio = {}) {
  const guidePaid = (ref) => ref.kind === 'guide' && ref.route_id === route.route_id && route.access !== 'free';
  return index.offers.map((offer) => {
    const kind = offer.ref.kind;
    const members = kind === 'collection' ? index.collections.find((entry) => entry.collection_id === offer.ref.collection_id).members : [];
    return {
      id: offer.offer_id,
      kind,
      ref: offer.ref,
      text: offer.localized,
      duration: offer.estimated_duration ?? null,
      textLocales: Object.keys(offer.localized.title),
      audioLocales: audio[offer.offer_id] ?? [],
      access: kind === 'guide' ? route.access : members.some(guidePaid) ? 'mixed' : 'free',
    };
  });
}

// A paragraph of content text, marked with the language it is written in.
export function prose(className, map, locale) {
  const node = el('p', { className, textContent: pick(map, locale) });
  node.lang = langOf(map, locale);
  return node;
}

// A remark line: a sign, an optional visible label and the content text.
export function remark(iconName, label, map, locale, kind = '') {
  const text = el('span', { textContent: pick(map, locale) });
  text.lang = langOf(map, locale);
  return el('p', { className: `remark${kind}` }, icon(iconName, 16), el('span', {}, label && el('strong', { textContent: `${label}: ` }), text));
}

// The offer card: a 64×64 photo place, the title with the type sign and the
// duration, a three-line annotation, optional notes (why it is in the list),
// languages and the access tag. `t` answers the screen's own string keys:
// guide, place, collection, duration, unit, text, audio, free, paid, mixed.
export function offerCard(offer, { t, locale, onOpen, notes = [] }) {
  const title = el('span', { className: `offer-title${offer.kind === 'guide' ? ' t-display' : ''}` }, sr(`${t(offer.kind)}: `), pick(offer.text.title, locale));
  title.lang = langOf(offer.text.title, locale);
  const summary = el('span', { className: 'offer-summary', textContent: pick(offer.text.summary, locale) });
  summary.lang = langOf(offer.text.summary, locale);
  const facts = el('span', { className: 'facts' },
    el('span', { className: 'fact' }, icon(TYPE_ICON[offer.kind], 16)),
    offer.duration && el('span', { className: 'fact' }, icon('clock', 16), sr(`${t('duration')}: `), `${offer.duration.min_minutes}–${offer.duration.max_minutes} ${t('unit')}`));
  // A collection has no audio of its own, so it shows no audio languages.
  const langs = el('span', { className: 'facts' },
    el('span', { className: 'fact' }, icon('book-open', 16), sr(`${t('text')}: `), codes(offer.textLocales)),
    offer.kind !== 'collection' && el('span', { className: 'fact' }, icon('headphones', 16), sr(`${t('audio')}: `), codes(offer.audioLocales)));
  const photo = el('span', { className: 'photo' }, icon('image', 20));
  photo.setAttribute('aria-hidden', 'true');
  const card = el('button', { className: 'card offer', type: 'button' },
    el('span', { className: 'offer-head' }, photo, el('span', { className: 'offer-heading' }, title, facts)),
    summary,
    ...notes,
    el('span', { className: 'offer-meta' }, langs, el('span', { className: `tag ${offer.access}`, textContent: t(offer.access) })));
  card.addEventListener('click', () => onOpen(offer));
  return card;
}

// The frame of an inner screen: the top bar with Back and, while a walk runs,
// the return-to-walk button; then the scrolling page, opened with the cache
// banner when the screen shows cached content. Returns the page to fill.
export function openPage(body, { title, backLabel, backText, walkLabel, cacheText, say }) {
  body.append(topbar({
    title,
    backLabel,
    onBack: () => say(backText),
    right: walkLabel ? [walkButton(walkLabel, () => say(`Вяртанне да бягучай прагулкі («${walkLabel}») у ранейшым становішчы панэлі.`))] : [],
  }));
  const page = el('div', { className: 'page scroll' });
  if (cacheText) {
    const banner = el('p', { className: 'notice row' }, icon('wifi-off', 18), el('span', { textContent: cacheText }));
    banner.setAttribute('role', 'status');
    page.append(banner);
  }
  return page;
}
