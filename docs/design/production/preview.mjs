// Guide preview / RouteDetail (route app/route/[id].tsx): the published facts
// of one guide and the one main button whose meaning follows the package,
// Download → Start. The states mirror derivePreviewButton in
// controllers/catalog/previewController.ts and frames C, D, M, N, O of G25.07.
import { button, el, icon, LOCALES, mountBoard, registerIcons, topbar, walkButton } from './kit.mjs';

// Lucide «hard-drive» (lucide-react-native, ISC): the package size fact.
registerIcons({
  'hard-drive': [
    ['path', { d: 'M10 16h.01' }],
    ['path', { d: 'M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' }],
    ['path', { d: 'M21.946 12.013H2.054' }],
    ['path', { d: 'M6 16h.01' }],
  ],
});

const IDS = {
  back: 'native.chrome.back',
  walk: 'native.chrome.walk',
  free: 'native.chrome.access.free',
  paid: 'native.chrome.access.paid',
  mixed: 'native.chrome.access.mixed',
  duration: 'native.chrome.durationRange',
  stops: 'native.chrome.stopsCount',
  size: 'native.chrome.sizeMb',
  freeStops: 'native.chrome.freeStopsCount',
  stopsLabel: 'native.chrome.stopsLabel',
  locked: 'native.chrome.locked',
  text: 'native.nearby.textLabel',
  audio: 'native.nearby.audioLabel',
  textUnavailable: 'native.chrome.previewTextUnavailable',
  languages: 'native.chrome.languagesLine',
  loading: 'native.chrome.loading',
  download: 'native.preview.label.download',
  start: 'native.preview.label.start',
  failed: 'native.preview.downloadFailed',
  storageDetail: 'native.preview.storageFullDetail',
  storageExit: 'native.preview.storageExit',
  purchase: 'native.preview.reason.preview#purchase-required',
  verify: 'native.preview.reason.preview#verify-unavailable',
  offerTitle: 'native.offer.offerTitle',
  offerBody: 'native.offer.offerBody',
  buy: 'native.offer.buy',
  dismiss: 'native.offer.dismiss',
};

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
// Shown under «Праверка недаступная.»: what the visitor can do about it.
const VERIFY_NEEDS_NETWORK = {
  be: 'Каб праверыць пакет, патрэбная сетка.',
  en: 'A network connection is needed to check the package.',
  uk: 'Щоб перевірити пакет, потрібна мережа.',
  de: 'Für die Prüfung des Pakets ist eine Netzverbindung nötig.',
  es: 'Para comprobar el paquete se necesita conexión.',
  fr: 'Une connexion est nécessaire pour vérifier le paquet.',
  cs: 'K ověření balíku je potřeba připojení.',
  sv: 'Det behövs en nätanslutning för att kontrollera paketet.',
};
// What a screen reader hears where the screen shows a dash: no audio published.
const NO_AUDIO = {
  be: 'няма', en: 'none', uk: 'немає', de: 'keins', es: 'no hay', fr: 'aucun', cs: 'není', sv: 'saknas',
};

async function json(path) {
  const response = await fetch(new URL(`../../../${path}`, import.meta.url));
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

// The real guide: title, description, themes and time come from the catalogue,
// stop names from the author's scenario, the access type from
// content/discovery/route.json. Package size and languages are test values.
const discovery = await json('content/discovery/discovery.json');
const scenario = await json('authoring/gdansk/scenarios/gdansk-first-walk.json');
const offer = discovery.offers.find((entry) => entry.ref.kind === 'guide');
const GUIDES = {
  real: {
    id: offer.ref.route_id,
    title: offer.localized.title,
    summary: offer.localized.summary,
    themes: offer.themes.map((id) => discovery.themes.find((theme) => theme.id === id).labels),
    access: 'paid',
    minutes: [offer.estimated_duration.min_minutes, offer.estimated_duration.max_minutes],
    sizeMb: 24,
    text: ['be', 'en'],
    audio: ['be'],
    stops: scenario.stops.map((stop) => ({ name: stop.title })),
  },
  // A synthetic paid guide: a locked stop shows its name, place, short
  // announcement and the lock only (NAV5).
  paid: {
    id: 'test-paid',
    title: 'Тэставы платны маршрут: брамы і масты',
    summary: 'Сінтэтычнае апісанне для праверкі платнага стану: дзве кропкі адкрытыя, дзве пад замком.',
    themes: [],
    access: 'paid',
    minutes: [60, 75],
    sizeMb: 38,
    text: ['be', 'en'],
    audio: ['be', 'en'],
    freeStops: 2,
    stops: [
      { name: 'Тэставая кропка: брама', place: 'Тэставае месца 1', announce: 'Кароткі анонс адкрытай тэставай кропкі.' },
      { name: 'Тэставая кропка: мост', place: 'Тэставае месца 2', announce: 'Кароткі анонс адкрытай тэставай кропкі.' },
      { name: 'Тэставая кропка: вежа', place: 'Тэставае месца 3', announce: 'Кароткі анонс замкнёнай тэставай кропкі.', locked: true },
      { name: 'Тэставая кропка: кран', place: 'Тэставае месца 4', announce: 'Кароткі анонс замкнёнай тэставай кропкі.', locked: true },
    ],
  },
};

// What the main button means in each state (see derivePreviewButton).
const STATES = {
  free: { guide: 'real', action: 'download', enabled: true },
  downloading: { guide: 'real', action: 'download', enabled: false, busy: true },
  failed: { guide: 'real', action: 'download', enabled: true, error: 'network' },
  storage: { guide: 'real', action: 'download', enabled: true, error: 'storage' },
  ready: { guide: 'real', action: 'start', enabled: true },
  paid: { guide: 'paid', action: 'start', enabled: false, reason: 'purchase', offer: true },
  verify: { guide: 'paid', action: 'start', enabled: false, reason: 'verify', hint: VERIFY_NEEDS_NETWORK },
  lang: { guide: 'real', unavailable: true },
};

const pick = (value, locale) => (typeof value === 'string' ? value : value[locale] ?? value.be);
const fill = (template, params = {}) => template.replace(/\$\{(\w+)\}/g, (_, name) => params[name]);
const names = (codes) => codes.map((code) => LOCALES[code] ?? code).join(', ');

let board = null;
let timer = 0;

// Moves the board to another state the way the screen itself would change.
async function go(next, message) {
  document.getElementById('state').value = next;
  board.state.state = next;
  await board.draw();
  board.say(message);
}

function startDownload() {
  go('downloading', 'Ідзе загрузка пакета: кнопка недаступная, пакуль загрузка не скончыцца.').then(() => {
    timer = setTimeout(() => go('ready', 'Пакет загружаны і правераны: тая ж кнопка цяпер значыць «Пачаць».'), 2200);
  });
}

board = await mountBoard({
  controls: [
    {
      id: 'state',
      label: 'Стан',
      options: [
        ['free', 'Не загружаны'], ['downloading', 'Ідзе загрузка'], ['failed', 'Збой загрузкі'],
        ['storage', 'Не хапае месца'], ['ready', 'Гатовы да пачатку'], ['paid', 'Платная прапанова'],
        ['verify', 'Офлайн: праверка пакета не прайшла'], ['lang', 'Няма на мове інтэрфейсу'],
      ],
    },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: Object.values(IDS),
  build({ body, state, strings, say, theme }) {
    clearTimeout(timer);
    const view = STATES[state.state], guide = GUIDES[view.guide], locale = state.locale;
    const t = (key, params) => fill(strings[IDS[key]], params);
    const title = pick(guide.title, locale);

    const bar = topbar({
      title: '',
      backLabel: t('back'),
      onBack: () => say('Назад: вяртанне на паверхню, з якой адкрылі прэв\'ю (рубрыка «Гіды»). Сесія, гук і прагрэс не мяняюцца.'),
      right: state.walk === 'yes' ? [walkButton(t('walk'), () => say(`Вяртанне да бягучай прагулкі («${t('walk')}»); гучанне не спыняецца.`))] : [],
    });
    // The guide's own title is the heading of this screen; the bar keeps a spacer.
    bar.querySelector('.title').replaceWith(el('div', { className: 'title' }));
    const scroll = el('div', { className: 'scroll pv-scroll' });
    body.append(bar, scroll);

    // The guide has no text in the interface language: the named state, no silent substitute.
    if (view.unavailable) {
      const notice = el('div', { className: 'notice pv-notice' },
        el('p', { textContent: t('textUnavailable') }),
        el('p', { className: 't-small', textContent: t('languages', { textLocales: names(guide.text) }) }));
      notice.setAttribute('role', 'status');
      scroll.append(notice);
      return;
    }

    let error = null;
    if (view.error) {
      error = el('div', { className: 'notice error pv-notice' },
        el('p', { className: 't-strong' }, icon('circle-alert', 18), t('failed')),
        view.error === 'storage' ? el('p', { className: 't-small', textContent: t('storageDetail', { mb: 12 }) }) : null,
        // The main button right below repeats the download, so the notice adds only the storage exit.
        view.error === 'storage' ? button(t('storageExit'), { onPress: () => say('Адкрываецца KUDY (/my), дзе можна вызваліць месца на прыладзе.') }) : null);
      error.setAttribute('role', 'status');
    }

    const themes = guide.themes.map((labels) => pick(labels, locale)).join(', ');
    const fact = (iconName, text) => el('li', {}, icon(iconName, 18), el('span', { textContent: text }));
    const facts = el('ul', { className: 'pv-facts' },
      fact('clock', t('duration', { minMinutes: guide.minutes[0], maxMinutes: guide.minutes[1] })),
      fact('map-pin', t('stops', { count: guide.stops.length })),
      fact('hard-drive', t('size', { mb: guide.sizeMb })),
      guide.freeStops ? fact('check', t('freeStops', { count: guide.freeStops })) : null);

    const textLine = el('p', { className: 'pv-lang' }, icon('book-open', 18),
      el('span', {}, el('span', { className: 'sr', textContent: `${t('text')}: ` }), names(guide.text)));
    // One chip per published audio language; the choice travels to the walk with Start.
    let audio = guide.audio[0] ?? null;
    const chips = guide.audio.map((code) => {
      const chip = el('button', { className: 'chip', type: 'button', textContent: LOCALES[code] ?? code });
      chip.setAttribute('aria-pressed', String(code === audio));
      chip.addEventListener('click', () => {
        audio = code;
        chips.forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
        say(`Выбрана аўдыё: ${LOCALES[code] ?? code}. Выбар перадаецца ў прагулку разам з «${t('start')}».`);
      });
      return chip;
    });
    const audioLine = el('div', { className: 'pv-lang' }, icon('headphones', 18), ...chips);
    audioLine.setAttribute('role', 'group');
    audioLine.setAttribute('aria-label', t('audio'));
    if (!chips.length) {
      audioLine.append(el('span', { className: 'sr', textContent: NO_AUDIO[locale] }), Object.assign(el('span', { textContent: '—' }), { ariaHidden: 'true' }));
    }

    let offerCard = null;
    if (view.offer) {
      const dismiss = el('button', { className: 'pv-quiet', type: 'button', textContent: t('dismiss') });
      dismiss.addEventListener('click', () => { offerCard.remove(); say('Прапанова схаваная. Нічога не куплена; кнопка «Пачаць» па-ранейшаму недаступная з прычынай.'); });
      offerCard = el('section', { className: 'card pv-offer' },
        el('h3', { className: 't-strong', textContent: t('offerTitle') }),
        el('p', { textContent: t('offerBody') }),
        button(t('buy'), { kind: 'primary', block: true, onPress: () => say('Пачынаецца пакупка ў краме. Гэта асобнае дзеянне: яна не загружае пакет і не пачынае прагулку.') }),
        dismiss);
    }

    const stops = el('ul', { className: 'card pv-stops' }, ...guide.stops.map((stop) => el('li', {},
      icon('map-pin', 18),
      el('div', {},
        el('p', { className: 't-strong', textContent: stop.name }),
        stop.place ? el('p', { className: 't-small', textContent: stop.place }) : null,
        stop.announce ? el('p', { className: 'pv-announce', textContent: stop.announce }) : null,
        stop.locked ? el('span', { className: 'tag' }, icon('lock', 12), t('locked')) : null))));

    scroll.append(...[
      error,
      el('h2', { className: 'pv-title t-display', textContent: title }),
      el('p', { className: 'pv-tags' },
        el('span', { className: `tag ${guide.access}`, textContent: t(guide.access) }),
        themes ? el('span', { className: 't-secondary', textContent: themes }) : null),
      el('p', { className: 'pv-summary', textContent: pick(guide.summary, locale) }),
      facts, textLine, audioLine, offerCard,
      el('h3', { className: 'pv-h', textContent: t('stopsLabel') }),
      stops,
    ].filter(Boolean));

    const press = () => {
      if (view.action === 'download') { startDownload(); return; }
      say(state.walk === 'yes'
        ? `Ідзе іншая прагулка, таму адкрываецца адзіны дыялог: «Завяршыць бягучую і пачаць „${title}“?». «Скасаваць» вяртае ў прэв'ю без змены сесіі.`
        : `Пачынаецца прагулка «${title}» → /run/${guide.id}${audio ? `?audio=${audio}` : ''}.`);
    };
    const main = button(t(view.action), {
      kind: 'primary', block: true, disabled: !view.enabled, onPress: press,
      iconName: view.action === 'download' ? 'download' : 'play',
    });
    const why = `${theme}-why`;
    const foot = el('div', { className: 'pv-foot' }, main);
    if (view.busy) {
      const status = el('div', { id: why }, el('p', { textContent: t('loading') }), el('div', { className: 'progress pv-progress' }, el('i')));
      status.setAttribute('role', 'status');
      foot.append(status);
    }
    if (view.reason) {
      foot.append(el('div', { id: why },
        el('p', { textContent: t(view.reason) }),
        view.hint ? el('p', { className: 't-small', textContent: view.hint[locale] }) : null));
    }
    if (!view.enabled) main.setAttribute('aria-describedby', why);
    body.append(foot);
  },
});
