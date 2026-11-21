// Guide preview / RouteDetail (route app/route/[id].tsx): the published facts
// of one guide, its route on a map, the choice of text and audio language, and
// the one main action whose meaning follows the package, Download → Start.
// The states mirror derivePreviewButton in controllers/catalog/previewController.ts
// and frames C, D, M, N, O of G25.07.
import { button, el, fab, icon, iconButton, LOCALES, marker, mountBoard, registerIcons, svg, topbar, walkButton } from './kit.mjs';

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
  guide: 'native.nearby.guideLabel',
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
const NEW = {
  // Shown beside «Праверка недаступная.»: what the visitor can do about it.
  verifyHint: {
    be: 'Каб праверыць пакет, патрэбная сетка.', en: 'A network connection is needed to check the package.',
    uk: 'Щоб перевірити пакет, потрібна мережа.', de: 'Für die Prüfung des Pakets ist eine Netzverbindung nötig.',
    es: 'Para comprobar el paquete se necesita conexión.', fr: 'Une connexion est nécessaire pour vérifier le paquet.',
    cs: 'K ověření balíku je potřeba připojení.', sv: 'Det behövs en nätanslutning för att kontrollera paketet.',
  },
  // Accessible names of the icon-only controls.
  showAll: { be: 'Паказаць усё', en: 'Show all', uk: 'Показати все', de: 'Alle anzeigen', es: 'Mostrar todo', fr: 'Tout afficher', cs: 'Zobrazit vše', sv: 'Visa alla' },
  collapse: { be: 'Згарнуць', en: 'Collapse', uk: 'Згорнути', de: 'Einklappen', es: 'Contraer', fr: 'Réduire', cs: 'Sbalit', sv: 'Dölj' },
  mapOpen: { be: 'Павялічыць карту', en: 'Enlarge the map', uk: 'Збільшити карту', de: 'Karte vergrößern', es: 'Ampliar el mapa', fr: 'Agrandir la carte', cs: 'Zvětšit mapu', sv: 'Förstora kartan' },
  mapClose: { be: 'Зачыніць карту', en: 'Close the map', uk: 'Закрити карту', de: 'Karte schließen', es: 'Cerrar el mapa', fr: 'Fermer la carte', cs: 'Zavřít mapu', sv: 'Stäng kartan' },
  routeMap: { be: 'Карта маршруту', en: 'Route map', uk: 'Карта маршруту', de: 'Routenkarte', es: 'Mapa de la ruta', fr: 'Carte du parcours', cs: 'Mapa trasy', sv: 'Ruttkarta' },
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
    audio: ['be', 'en'],
    stops: scenario.stops.map((stop) => ({ name: stop.title })),
  },
  // A synthetic paid guide: a locked stop shows its name and the lock only (NAV5).
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
      { name: 'Тэставая кропка: брама' }, { name: 'Тэставая кропка: мост' },
      { name: 'Тэставая кропка: вежа', locked: true }, { name: 'Тэставая кропка: кран', locked: true },
    ],
  },
};
const SHOWN_STOPS = 3;
const SHOWN_TAGS = 3;

// What the main action means in each state (see derivePreviewButton).
const STATES = {
  free: { guide: 'real', action: 'download', enabled: true },
  downloading: { guide: 'real', action: 'download', enabled: false, busy: true },
  failed: { guide: 'real', action: 'download', enabled: true, error: 'network' },
  storage: { guide: 'real', action: 'download', enabled: true, error: 'storage' },
  ready: { guide: 'real', action: 'start', enabled: true },
  paid: { guide: 'paid', action: 'start', enabled: false, reason: 'purchase', offer: true },
  verify: { guide: 'paid', action: 'start', enabled: false, reason: 'verify', hint: true },
  lang: { guide: 'real', unavailable: true },
};

const pick = (value, locale) => (typeof value === 'string' ? value : value[locale] ?? value.be);
const fill = (template, params = {}) => template.replace(/\$\{(\w+)\}/g, (_, name) => params[name]);
const names = (codes) => codes.map((code) => LOCALES[code] ?? code).join(', ');

// The route as a light schematic: a few streets, the dashed route and a marker
// per stop. Positions are illustrative, not real coordinates.
function routeMap(stops, { small, onStop }) {
  const at = (index) => {
    const share = stops.length === 1 ? 0.5 : index / (stops.length - 1);
    return [10 + share * 80, 50 + Math.sin(index * 1.7 + 0.6) * 26];
  };
  const drawing = svg('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svg('path', { class: 'street', d: 'M-5 22L105 34M-5 74L105 62M22 -5L30 105M68 -5L60 105' }),
    svg('path', { class: 'route', d: stops.map((_, index) => `${index ? 'L' : 'M'}${at(index).join(' ')}`).join('') }));
  const box = el('div', { className: 'pv-map' }, drawing);
  stops.forEach((stop, index) => {
    const [x, y] = at(index);
    const dot = marker(stop.locked ? 'locked' : 'available', { small });
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    dot.title = stop.name;
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', stop.label);
    if (onStop) dot.addEventListener('click', () => onStop(stop));
    box.append(dot);
  });
  return box;
}

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
    { id: 'stops', label: 'Кропак', options: [['real', 'Як у гідзе'], ['10', '10']] },
    { id: 'tags', label: 'Тэм', options: [['real', 'Як у гідзе'], ['6', '6']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: Object.values(IDS),
  build({ frame, body, state, strings, say, theme }) {
    clearTimeout(timer);
    const view = STATES[state.state], guide = GUIDES[view.guide], locale = state.locale;
    const t = (key, params) => fill(strings[IDS[key]], params);
    const n = (key) => NEW[key][locale];
    const title = pick(guide.title, locale);

    body.append(topbar({
      title: t('guide'),
      backLabel: t('back'),
      onBack: () => say('Назад: вяртанне на паверхню, з якой адкрылі прэв\'ю (рубрыка «Гіды»). Сесія, гук і прагрэс не мяняюцца.'),
      right: state.walk === 'yes' ? [walkButton(t('walk'), () => say(`Вяртанне да бягучай прагулкі («${t('walk')}»); гучанне не спыняецца.`))] : [],
    }));
    const scroll = el('div', { className: 'scroll pv-scroll' });
    body.append(scroll);

    // The guide has no text in the interface language: the named state, no silent substitute.
    if (view.unavailable) {
      const notice = el('div', { className: 'notice pv-notice' },
        el('p', { textContent: t('textUnavailable') }),
        el('p', { className: 't-small', textContent: t('languages', { textLocales: names(guide.text) }) }));
      notice.setAttribute('role', 'status');
      scroll.append(notice);
      return;
    }

    // Test data for the long cases: ten stops, six themes.
    const stops = guide.stops.map((stop) => ({ ...stop }));
    if (state.stops === '10') for (let i = stops.length + 1; i <= 10; i += 1) stops.push({ name: `Тэставая кропка ${i}`, locked: Boolean(guide.freeStops) });
    for (const stop of stops) stop.label = stop.locked ? `${stop.name}, ${t('locked')}` : stop.name;
    const themes = guide.themes.map((labels) => pick(labels, locale));
    if (state.tags === '6') {
      for (const theme of discovery.themes) { const label = pick(theme.labels, locale); if (!themes.includes(label)) themes.push(label); }
      for (let i = themes.length + 1; i <= 6; i += 1) themes.push(`Тэставая тэма ${i}`);
    }

    let error = null;
    if (view.error) {
      error = el('div', { className: 'notice error pv-notice' },
        el('p', { className: 't-strong' }, icon('circle-alert', 18), t('failed')),
        view.error === 'storage' ? el('p', { className: 't-small', textContent: t('storageDetail', { mb: 12 }) }) : null,
        // The main action below repeats the download, so the notice adds only the storage exit.
        view.error === 'storage' ? button(t('storageExit'), { onPress: () => say('Адкрываецца KUDY (/my), дзе можна вызваліць месца на прыладзе.') }) : null);
      error.setAttribute('role', 'status');
    }

    // Access and themes on one wrapping row; past three themes the rest fold under «+N».
    const tagRow = el('div', { className: 'pv-row' });
    const drawTags = (all) => {
      const shown = all ? themes : themes.slice(0, SHOWN_TAGS);
      tagRow.replaceChildren(
        el('span', { className: `tag ${guide.access}`, textContent: t(guide.access) }),
        ...shown.map((label) => el('span', { className: 'tag', textContent: label })));
      if (themes.length <= SHOWN_TAGS) return;
      const more = el('button', { className: 'pv-more', type: 'button' }, all ? icon('chevron-up', 14) : `+${themes.length - SHOWN_TAGS}`);
      more.setAttribute('aria-label', all ? n('collapse') : n('showAll'));
      more.addEventListener('click', () => drawTags(!all));
      tagRow.append(more);
    };
    drawTags(false);

    // Route map, small in the description; the corner button opens it full size.
    const showStop = (stop) => say(`Кропка на карце: «${stop.label}». Націск на кропку ў прэв'ю нічога не запускае.`);
    const small = routeMap(stops, { small: true, onStop: showStop });
    small.setAttribute('role', 'group');
    small.setAttribute('aria-label', n('routeMap'));
    const zoom = iconButton('maximize-2', n('mapOpen'), () => {
      const full = el('div', { className: 'pv-full' });
      const close = () => full.remove();
      full.append(
        topbar({ title: n('routeMap'), right: [iconButton('x', n('mapClose'), close)] }),
        routeMap(stops, { small: stops.length > 8, onStop: showStop }));
      frame.querySelector('.body').append(full);
      full.querySelector('.iconbtn').focus();
    }, 20);
    zoom.classList.add('pv-zoom');
    small.append(zoom);

    const fact = (iconName, text) => el('li', {}, icon(iconName, 18), el('span', { textContent: text }));
    const facts = el('ul', { className: 'pv-facts' },
      fact('clock', t('duration', { minMinutes: guide.minutes[0], maxMinutes: guide.minutes[1] })),
      fact('map-pin', t('stops', { count: stops.length })),
      guide.freeStops ? fact('check', t('freeStops', { count: guide.freeStops })) : null);

    // The visitor picks the language to read and the language to listen in
    // before the walk; both choices travel to the walk with Start.
    const chosen = { text: guide.text.includes(locale) ? locale : guide.text[0], audio: guide.audio.includes(locale) ? locale : guide.audio[0] };
    const picker = (kind, iconName, codes) => {
      const row = el('div', { className: 'pv-row' }, icon(iconName, 18));
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', t(kind));
      const chips = codes.map((code) => {
        const chip = el('button', { className: 'chip', type: 'button', textContent: LOCALES[code] ?? code });
        chip.setAttribute('aria-pressed', String(code === chosen[kind]));
        chip.addEventListener('click', () => {
          chosen[kind] = code;
          chips.forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
          say(`${t(kind)}: ${LOCALES[code] ?? code}. Выбар перадаецца ў прагулку разам з «${t('start')}».`);
        });
        return chip;
      });
      row.append(...chips);
      return row;
    };

    let offerCard = null;
    if (view.offer) {
      const dismiss = el('button', { className: 'pv-quiet', type: 'button', textContent: t('dismiss') });
      dismiss.addEventListener('click', () => { offerCard.remove(); say('Прапанова схаваная. Нічога не куплена; пачатак па-ранейшаму недаступны з прычынай.'); });
      offerCard = el('section', { className: 'card pv-offer' },
        el('h3', { className: 't-strong', textContent: t('offerTitle') }),
        el('p', { textContent: t('offerBody') }),
        button(t('buy'), { kind: 'primary', block: true, onPress: () => say('Пачынаецца пакупка ў краме. Гэта асобнае дзеянне: яна не загружае пакет і не пачынае прагулку.') }),
        dismiss);
    }

    // Stops: the first three, the rest behind one control, so ten or twenty do not flood the screen.
    const list = el('div', { className: 'card pv-list' });
    const drawStops = (all) => {
      const shown = all ? stops : stops.slice(0, SHOWN_STOPS);
      list.replaceChildren(el('ul', { className: 'pv-stops' }, ...shown.map((stop) => {
        const mark = marker(stop.locked ? 'locked' : 'available', { small: true });
        mark.setAttribute('aria-hidden', 'true');
        return el('li', {}, mark, el('p', {}, stop.name, stop.locked ? el('span', { className: 'sr', textContent: `, ${t('locked')}` }) : null));
      })));
      if (stops.length <= SHOWN_STOPS) return;
      const toggle = el('button', { className: 'pv-all', type: 'button' }, icon(all ? 'chevron-up' : 'chevron-down', 20));
      toggle.setAttribute('aria-label', all ? n('collapse') : `${n('showAll')}: ${stops.length}`);
      toggle.setAttribute('aria-expanded', String(all));
      toggle.addEventListener('click', () => drawStops(!all));
      list.append(toggle);
    };
    drawStops(false);

    scroll.append(...[
      error,
      el('h2', { className: 'pv-title t-display', textContent: title }),
      tagRow,
      el('p', { className: 'pv-summary', textContent: pick(guide.summary, locale) }),
      small, facts,
      picker('text', 'book-open', guide.text),
      picker('audio', 'headphones', guide.audio),
      offerCard,
      el('h3', { className: 'sec', textContent: t('stops', { count: stops.length }) }),
      list,
    ].filter(Boolean));

    const press = () => {
      if (view.action === 'download') { startDownload(); return; }
      say(state.walk === 'yes'
        ? `Ідзе іншая прагулка, таму адкрываецца адзіны дыялог: «Завяршыць бягучую і пачаць „${title}“?». «Скасаваць» вяртае ў прэв'ю без змены сесіі.`
        : `Пачынаецца прагулка «${title}» → /run/${guide.id}?text=${chosen.text}&audio=${chosen.audio}.`);
    };
    // The main action is an icon: a download arrow, then the walk sign. What it
    // waits for, or why it is unavailable, stays as text beside it.
    const main = fab(view.action === 'download' ? 'download' : 'footprints', t(view.action), { disabled: !view.enabled, onPress: press });
    const why = el('div', { className: 'pv-why', id: `${theme}-why` });
    if (view.busy) {
      why.append(el('p', { textContent: t('loading') }), el('div', { className: 'progress pv-progress' }, el('i')));
      why.setAttribute('role', 'status');
    } else if (view.reason) {
      why.append(el('p', { textContent: t(view.reason) }), view.hint ? el('p', { className: 't-small', textContent: n('verifyHint') }) : null);
    } else if (view.action === 'download') {
      why.append(el('p', { className: 't-secondary', textContent: t('size', { mb: guide.sizeMb }) }));
    }
    if (!view.enabled) main.setAttribute('aria-describedby', why.id);
    body.append(el('div', { className: 'pv-foot' }, why, main));
  },
});
