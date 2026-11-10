// «Гіды» of a city (route app/city/[id]/guides.tsx): the list of published
// guides, each exactly once, in the catalogue order. Layout follows the
// owner-reviewed proposal brand/outputs/GUIDES-catalog: back arrow, the route
// sign, the city name and the filter icon in the top bar; a card with a 64×64
// photo place, a short annotation, text and audio languages and the access
// tag; the ad zone under the list.
import { adZone, el, icon, iconButton, mountBoard, panorama, plainLabel, topbar, walkButton } from './kit.mjs';

const IDS = {
  back: 'native.chrome.backToCity',
  guides: 'native.chrome.guidesLink',
  walk: 'native.chrome.walk',
  cache: 'native.chrome.validCache',
  empty: 'native.chrome.textLocaleEmpty',
  text: 'native.nearby.textLabel',
  audio: 'native.nearby.audioLabel',
  free: 'native.chrome.access.free',
  paid: 'native.chrome.access.paid',
  mixed: 'native.chrome.access.mixed',
};

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
// CITY repeats the proposal of the main menu screen (menu.mjs).
const CITY = {
  be: 'Гданьск', en: 'Gdańsk', uk: 'Гданськ', de: 'Danzig', es: 'Gdansk',
  fr: 'Gdańsk', cs: 'Gdaňsk', sv: 'Gdańsk',
};
const FILTERS = {
  be: 'Фільтры', en: 'Filters', uk: 'Фільтри', de: 'Filter', es: 'Filtros',
  fr: 'Filtres', cs: 'Filtry', sv: 'Filter',
};
const ALL_GUIDES = {
  be: 'Усе гіды', en: 'All guides', uk: 'Усі гіди', de: 'Alle Guides', es: 'Todas las guías',
  fr: 'Tous les guides', cs: 'Všichni průvodci', sv: 'Alla guider',
};
const FILTERS_NOTE = {
  be: 'Катэгорыі яшчэ вызначаюцца. Пакуль паказваюцца ўсе гіды.',
  en: 'Categories are still being defined. All guides are shown for now.',
  uk: 'Категорії ще визначаються. Поки що показано всі гіди.',
  de: 'Die Kategorien werden noch festgelegt. Vorerst werden alle Guides angezeigt.',
  es: 'Las categorías aún se están definiendo. Por ahora se muestran todas las guías.',
  fr: 'Les catégories sont encore en cours de définition. Pour l’instant, tous les guides sont affichés.',
  cs: 'Kategorie se teprve připravují. Zatím se zobrazují všichni průvodci.',
  sv: 'Kategorierna håller på att tas fram. Tills vidare visas alla guider.',
};
// What a screen reader hears where the card shows a dash: no audio published.
const NO_AUDIO = {
  be: 'няма', en: 'none', uk: 'немає', de: 'keins', es: 'no hay', fr: 'aucun', cs: 'není', sv: 'saknas',
};

// The real guide: its title and description are read from the catalogue, not
// restated; its access type follows content/discovery/route.json. Languages are test values.
const response = await fetch(new URL('../../../content/discovery/discovery.json', import.meta.url));
if (!response.ok) throw new Error(`discovery.json: ${response.status}`);
const offer = (await response.json()).offers.find((entry) => entry.ref.kind === 'guide');
const REAL = {
  id: offer.ref.route_id,
  title: offer.localized.title,
  summary: offer.localized.summary,
  access: 'paid',
  text: ['be', 'en'],
  audio: ['be'],
};
// Synthetic cards for the long list; every one says it is a test card.
const TEST = [
  { id: 'test-long-title', title: 'Тэставы маршрут з доўгай назвай пра вежы, брамы, масты і гісторыі старога Гданьска', summary: 'Сінтэтычнае апісанне для праверкі вузкага экрана і буйнога тэксту.', access: 'free', text: ['be', 'en'], audio: [] },
  { id: 'test-paid', title: 'Тэставы платны маршрут: брамы і масты', summary: 'Сінтэтычнае апісанне для праверкі платнага стану: дзве кропкі адкрытыя, дзве пад замком.', access: 'paid', text: ['be', 'en'], audio: ['be', 'en'] },
  { id: 'test-no-summary', title: 'Тэставы маршрут без апісання', summary: '', access: 'mixed', text: ['be'], audio: ['be'] },
  { id: 'test-three-languages', title: 'Тэставы маршрут на трох мовах', summary: 'Сінтэтычная картка: тэкст на трох мовах, аўдыё на дзвюх.', access: 'free', text: ['be', 'en', 'uk'], audio: ['be', 'en'] },
  { id: 'test-short', title: 'Тэставы кароткі маршрут', summary: 'Сінтэтычная картка для праверкі пракруткі доўгага спіса.', access: 'paid', text: ['be'], audio: [] },
];

// Content keeps its own language: the interface language picks a translation
// only where the catalogue has one.
const pick = (value, locale) => (typeof value === 'string' ? value : value[locale] ?? value.be);

function guideCard(guide, { state, strings, say, theme }) {
  const title = pick(guide.title, state.locale), summary = pick(guide.summary, state.locale);
  const access = strings[IDS[guide.access]];
  const langsId = `${theme}-${guide.id}-langs`;
  const languages = (iconName, label, codes) => el('span', { className: 'g-lang' },
    icon(iconName, 16),
    el('span', { className: 'sr', textContent: `${label}: ${codes.length ? '' : NO_AUDIO[state.locale]}` }),
    codes.length ? codes.join(', ') : Object.assign(el('span', { textContent: '—' }), { ariaHidden: 'true' }));
  const card = el('button', { className: 'card g-card', type: 'button' },
    el('span', { className: 'g-head' },
      state.photo === 'yes' ? el('span', { className: 'g-photo' }, icon('image', 20)) : null,
      el('span', { className: 'g-name t-display', textContent: title })),
    summary ? el('span', { className: 'g-summary', textContent: summary }) : null,
    el('span', { className: 'g-meta' },
      el('span', { className: 'g-langs t-secondary', id: langsId },
        languages('book-open', strings[IDS.text], guide.text),
        languages('headphones', strings[IDS.audio], guide.audio)),
      el('span', { className: `tag ${guide.access}`, textContent: access })));
  // As in the app: the name carries the guide and its access; languages follow as a description.
  card.setAttribute('aria-label', `${title}, ${access}`);
  card.setAttribute('aria-describedby', langsId);
  card.addEventListener('click', () => say(`Адкрываецца прэв'ю гіда «${title}» → /route/${guide.id}?from=rubric. Націск нічога не купляе і не пачынае прагулку.`));
  return el('li', {}, card);
}

await mountBoard({
  controls: [
    { id: 'list', label: 'Спіс', options: [['one', 'Адзін маршрут'], ['long', 'Доўгі спіс'], ['cache', 'З кэша'], ['nolang', 'Няма гідаў на мове']] },
    { id: 'photo', label: 'Фота', options: [['yes', 'Месца для фота'], ['no', 'Без фота']] },
    { id: 'ad', label: 'Банер', options: [['loaded', 'Загрузіўся'], ['none', 'Не загрузіўся']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: Object.values(IDS),
  build({ body, state, strings, say, theme }) {
    const locale = state.locale, city = CITY[locale];
    const context = { state, strings, say, theme };

    // Filters: no categories yet, so the panel names the one state there is.
    const all = el('button', { className: 'chip', type: 'button', textContent: ALL_GUIDES[locale] });
    all.setAttribute('aria-pressed', 'true');
    all.addEventListener('click', () => say('Фільтр «Усе гіды» ўжо выбраны: іншых катэгорый пакуль няма.'));
    const panel = el('div', { className: 'g-filters', id: `${theme}-filters`, hidden: true },
      all, el('p', { className: 't-secondary', textContent: FILTERS_NOTE[locale] }));
    const filter = iconButton('sliders-horizontal', FILTERS[locale], () => {
      panel.hidden = !panel.hidden;
      filter.setAttribute('aria-expanded', String(!panel.hidden));
      fit();
      say(panel.hidden ? 'Фільтры схаваныя.' : 'Адкрыліся фільтры: месца пад будучыя катэгорыі каталога.');
    });
    filter.setAttribute('aria-expanded', 'false');
    filter.setAttribute('aria-controls', panel.id);

    const bar = topbar({
      title: city,
      backLabel: strings[IDS.back],
      onBack: () => say('Назад: вяртанне ў горад, на галоўны экран.'),
      right: [filter, ...(state.walk === 'yes' ? [walkButton(strings[IDS.walk], () => say(`Вяртанне да бягучай прагулкі («${strings[IDS.walk]}»); гучанне не спыняецца.`))] : [])],
    });
    const heading = bar.querySelector('.title');
    heading.classList.add('g-title');
    heading.replaceChildren(icon('route', 18), el('span', { textContent: city }));
    heading.setAttribute('aria-label', `${plainLabel(strings[IDS.guides])} · ${city}`);

    const guides = { one: [REAL], long: [REAL, ...TEST], cache: [REAL], nolang: [] }[state.list];
    const scroller = el('div', { className: 'scroll g-scroll' });
    if (state.list === 'cache') {
      const cache = el('p', { className: 'notice g-cache' }, icon('wifi-off', 18), strings[IDS.cache]);
      cache.setAttribute('role', 'status');
      scroller.append(cache);
    }
    if (state.list === 'nolang') scroller.append(el('p', { className: 'g-empty', textContent: strings[IDS.empty] }));
    const list = el('ul', { className: 'g-list' }, ...guides.map((guide) => guideCard(guide, context)));
    if (guides.length) scroller.append(list);

    // Without a network no ad arrives, so the cached list also takes the ad's room.
    const ad = adZone(state.ad === 'loaded' && state.list !== 'cache');
    ad.classList.add('g-ad');
    body.append(bar, panel, scroller, ad);

    // A short list leaves free room; the panorama fills it only when it fits whole.
    const rest = el('div', { className: 'g-rest' }, panorama());
    function fit() {
      rest.remove();
      const used = [...scroller.children].reduce((sum, child) => sum + child.offsetHeight + 16, 0);
      if (scroller.clientHeight - used >= 150) scroller.append(rest);
    }
    fit();
  },
});
