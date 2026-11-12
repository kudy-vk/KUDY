// Shared pieces of the production mockups: the review board, the phone frame,
// common components, the icon set and access to the app's interface strings.
// A screen module calls mountBoard() and fills the phone body it is given.
import { ICONS } from './kit-icons.mjs';

const SVG = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

// Insets follow the ADS-01 layout study: status 24/47 dp, system navigation
// 48 dp (three buttons) or 34 dp (gesture bar).
export const DEVICES = {
  '320x640': { w: 320, h: 640, status: 24, nav: 48, navKind: 'buttons' },
  '360x800': { w: 360, h: 800, status: 24, nav: 48, navKind: 'buttons' },
  '390x844': { w: 390, h: 844, status: 47, nav: 34, navKind: 'gesture' },
  '430x932': { w: 430, h: 932, status: 47, nav: 34, navKind: 'gesture' },
};

// The eight interface languages of R11 (docs/15_guide_decisions.md).
export const LOCALES = {
  be: 'Беларуская',
  en: 'English',
  uk: 'Українська',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  cs: 'Čeština',
  sv: 'Svenska',
};

// ---------- icons ----------

// A screen may add Lucide shapes it alone needs without touching the shared file.
const icons = { ...ICONS };
export function registerIcons(extra) { Object.assign(icons, extra); }

// The 24×24 shapes of one icon, for placing inside another <svg>.
export function iconShapes(name) {
  if (!icons[name]) throw new Error(`unknown icon: ${name}`);
  return icons[name].map(([tag, attrs]) => svg(tag, attrs));
}

export function icon(name, size = 20) {
  return svg('svg', { class: 'icon', viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' }, ...iconShapes(name));
}

// ---------- interface strings from the app contract ----------

// Strings the app already has are read from contracts/ui-messages, so a mockup
// never restates them. `ids` are record ids, e.g. 'native.chrome.back'.
const CONTRACT = new URL('../../../contracts/ui-messages/', import.meta.url);
const recordCache = new Map();

async function records(locale) {
  if (!recordCache.has(locale)) {
    const file = locale === 'be' ? 'source.json' : `translations/${locale}.json`;
    recordCache.set(locale, fetch(new URL(file, CONTRACT)).then((response) => {
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      return response.json();
    }));
  }
  return (await recordCache.get(locale)).records;
}

export async function appStrings(locale, ids) {
  const list = await records(locale);
  const out = {};
  for (const id of ids) {
    const record = list.find((entry) => entry.id === id);
    if (!record) throw new Error(`${locale}: no interface string ${id}`);
    out[id] = record.value ?? record.source;
  }
  return out;
}

// Link labels in the contract end with an arrow («Гіды →»); drop it for names.
export const plainLabel = (text) => text.replace(/\s*→$/, '');

// ---------- phone frame and review board ----------

function phone(deviceKey, theme) {
  const device = DEVICES[deviceKey];
  const frame = el('div', { className: 'phone' });
  frame.dataset.theme = theme;
  for (const [name, value] of Object.entries({ w: device.w, h: device.h, status: device.status, nav: device.nav })) {
    frame.style.setProperty(`--${name}`, `${value}px`);
  }
  const status = el('div', { className: 'status' }, el('span', { textContent: '9:41' }), el('i'));
  status.setAttribute('aria-hidden', 'true');
  const body = el('div', { className: 'body' });
  const sysnav = el('div', { className: `sysnav ${device.navKind}` });
  sysnav.setAttribute('aria-hidden', 'true');
  if (device.navKind === 'buttons') sysnav.append(el('i'), el('i'), el('i'));
  frame.append(status, body, sysnav);
  return { frame, body, device };
}

// Builds the board inside <main class="board">: the standard switches (screen
// size, language, text size) plus the screen's own, an event line, and the
// same screen in the light and the dark theme side by side.
//
//   controls: [{ id, label, options: [[value, label], …] }] — first option is the default
//   stringIds: contract ids the screen needs (see appStrings)
//   build({ theme, frame, body, device, state, strings, say }) — fills `body`;
//     runs after the phone is in the page, so sizes can be measured;
//     may return a cleanup function, called before the next redraw.
export async function mountBoard({ controls = [], stringIds = [], build }) {
  const root = document.querySelector('.board');
  const state = { device: '390x844', locale: 'be', scale: 1 };
  const standard = [
    { id: 'device', label: 'Экран', options: Object.keys(DEVICES).map((key) => [key, key.replace('x', ' × ')]) },
    { id: 'locale', label: 'Мова', options: Object.entries(LOCALES) },
    { id: 'scale', label: 'Тэкст', options: [['1', 'Звычайны'], ['1.5', 'Буйны ×1,5']] },
  ];
  const bar = el('div', { className: 'controls' });
  const event = el('p', { className: 'event' });
  event.setAttribute('role', 'status');
  const phones = el('div', { className: 'phones' });
  const say = (text) => { event.textContent = text; };
  let cleanups = [];
  let latest = 0;

  // A newer redraw supersedes one still in progress, so the board never shows stale phones.
  async function draw() {
    const run = (latest += 1);
    try {
      const strings = await appStrings(state.locale, stringIds);
      if (run !== latest) return;
      for (const cleanup of cleanups) cleanup();
      cleanups = [];
      phones.replaceChildren();
      say('');
      for (const theme of ['light', 'dark']) {
        const made = phone(state.device, theme);
        made.frame.lang = state.locale;
        made.frame.style.setProperty('--fs', state.scale);
        phones.append(el('figure', {}, el('figcaption', { textContent: theme === 'dark' ? 'Цёмная тэма' : 'Светлая тэма' }), made.frame));
        const cleanup = await build({ ...made, theme, state, strings, say });
        if (run !== latest) {
          if (typeof cleanup === 'function') cleanup();
          return;
        }
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      }
    } catch (error) {
      if (run !== latest) return;
      say(`Не ўдалося паказаць экран: ${error.message}. Старонка працуе праз лакальны сервер, запушчаны з кораня рэпазіторыя.`);
    }
  }

  for (const control of [...standard, ...controls]) {
    const select = el('select', { id: control.id }, ...control.options.map(([value, label]) => el('option', { value, textContent: label })));
    if (!(control.id in state)) state[control.id] = control.options[0][0];
    select.value = String(state[control.id]);
    select.addEventListener('change', () => {
      state[control.id] = control.id === 'scale' ? Number(select.value) : select.value;
      draw();
    });
    bar.append(el('label', {}, control.label, select));
  }
  const again = el('button', { type: 'button', textContent: 'Адкрыць экран нанова' });
  again.addEventListener('click', draw);
  bar.append(again);
  root.append(bar, event, phones);
  await document.fonts.load('16px "Golos Text"');
  await document.fonts.load('32px Alegreya');
  await draw();
  return { state, say, draw };
}

// ---------- common components ----------

export function iconButton(name, label, onPress, size = 22) {
  const button = el('button', { className: 'iconbtn', type: 'button' }, icon(name, size));
  button.setAttribute('aria-label', label);
  if (onPress) button.addEventListener('click', onPress);
  return button;
}

// The round button that returns to the walk in progress; shown only while one runs.
export function walkButton(label, onPress) {
  const button = el('button', { className: 'walkbtn', type: 'button' }, el('span', {}, icon('footprints', 20)));
  button.setAttribute('aria-label', label);
  if (onPress) button.addEventListener('click', onPress);
  return button;
}

// Top bar of an inner screen: back arrow, title, optional controls on the right.
export function topbar({ title, backLabel, onBack, right = [] }) {
  const bar = el('div', { className: 'topbar' });
  if (backLabel) bar.append(iconButton('arrow-left', backLabel, onBack));
  bar.append(el('h2', { className: 'title', textContent: title }), ...right);
  return bar;
}

export function button(label, { kind = 'plain', iconName, disabled = false, block = false, onPress } = {}) {
  const node = el('button', { className: `btn${kind === 'primary' ? ' primary' : ''}${block ? ' block' : ''}`, type: 'button' }, iconName ? icon(iconName, 20) : null, label);
  if (disabled) node.setAttribute('aria-disabled', 'true');
  if (onPress) node.addEventListener('click', () => { if (!disabled) onPress(); });
  return node;
}

// The one round action of a screen. Icon only; `label` is its accessible name.
export function fab(iconName, label, { disabled = false, onPress } = {}) {
  const node = el('button', { className: 'fab', type: 'button' }, icon(iconName, 26));
  node.setAttribute('aria-label', label);
  if (disabled) node.setAttribute('aria-disabled', 'true');
  if (onPress) node.addEventListener('click', () => { if (!disabled) onPress(); });
  return node;
}

// The sign of a route point state, the same wherever a state is shown: on the
// map, in a card, in a list. An open point has no sign, only the plain dot.
export const STATE_ICON = { played: 'check', playing: 'volume-2', pending: 'hourglass', locked: 'lock', available: null };

export function marker(state, { small = false } = {}) {
  const node = el('span', { className: `marker ${state}${small ? ' small' : ''}` });
  if (STATE_ICON[state]) node.append(icon(STATE_ICON[state], small ? 13 : 17));
  return node;
}

// The reserved ad place. `loaded: false` removes the zone, as the app does when no ad arrives.
export function adZone(loaded = true) {
  const zone = el('div', { className: 'ad-zone' }, el('div', { className: 'ad-slot' }, el('span', { textContent: 'Рэклама' })));
  zone.hidden = !loaded;
  return zone;
}

// ---------- medallion of the map pieces ----------

// The filter that makes a medallion's rim waver like a pen stroke: a slow,
// shallow displacement. Put it into the <svg> that draws the medallion and
// refer to it as `filter: url(#<id>)`; `id` must be unique in the page. The
// medallion's colours are the --medal-* values of kit.css.
export function penStroke(id) {
  return svg('filter', { id, x: '-20%', y: '-20%', width: '140%', height: '140%' },
    svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.07, numOctaves: 2, seed: 7, result: 'noise' }),
    svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: 2.4, xChannelSelector: 'R', yChannelSelector: 'G' }));
}

// ---------- engraved panorama of Gdańsk ----------

// An original line drawing in the manner of old city prospects: sea and masts
// on the horizon, a row of gabled houses, the great church, the town hall
// spire, the harbour crane, bastions and a moat in front. It is drawn by this
// code, is not a copy of any print, and does not claim historical accuracy.
function seeded(seed) {
  // xorshift32: a fixed seed gives the same drawing on every load.
  let state = seed >>> 0 || 1;
  return () => {
    state = (state ^ (state << 13)) >>> 0;
    state = (state ^ (state >>> 17)) >>> 0;
    state = (state ^ (state << 5)) >>> 0;
    return state / 4294967296;
  };
}

export function panorama() {
  const r = seeded(1687);
  const n = (value) => Math.round(value * 10) / 10;
  // Decoration only: it carries no information a screen reader needs.
  const root = svg('svg', { class: 'panorama', viewBox: '190 28 540 162', 'aria-hidden': 'true' });
  const add = (cls, d) => root.append(svg('path', { class: cls, d }));

  // Sky: broken horizontal strokes, thinner towards the top, with gaps for clouds.
  let sky = '';
  for (let y = 12; y < 94; y += 5.5) {
    let x = r() * 40;
    while (x < 800) {
      const len = 26 + r() * 110;
      const cloud = Math.sin(x / 90 + y / 14) + Math.sin(x / 37 - y / 9) * 0.6;
      if (cloud < 0.5 && r() < 0.35 + y / 150) sky += `M${n(x)} ${n(y + r() - 0.5)}h${n(len)}`;
      x += len + 10 + r() * 46;
    }
  }
  add('fine', sky);

  // Horizon and the masts of ships at anchor.
  let far = 'M0 99H800';
  for (const x of [22, 47, 66, 96, 131, 158, 742, 768, 787]) {
    const h = 7 + r() * 7;
    far += `M${x} 99v${n(-h)}M${n(x - 3)} ${n(99 - h * 0.55)}h6M${n(x - 2)} ${n(99 - h * 0.85)}h4`;
  }
  add('fine', far);

  const house = (x, base, w, h, kind) => {
    const top = base - h, mid = x + w / 2;
    if (kind === 0) return `M${n(x)} ${base}V${n(top)}L${n(mid)} ${n(top - w * 0.75)}L${n(x + w)} ${n(top)}V${base}Z`;
    if (kind === 1) {
      const s = w / 6;
      return `M${n(x)} ${base}V${n(top)}h${n(s)}v${n(-s)}h${n(s)}v${n(-s)}h${n(s)}v${n(-s)}h${n(s)}v${n(s)}h${n(s)}v${n(s)}h${n(s)}v${n(s)}V${base}Z`;
    }
    if (kind === 2) return `M${n(x)} ${base}V${n(top)}Q${n(x + w * 0.1)} ${n(top - w * 0.45)} ${n(mid)} ${n(top - w * 0.85)}Q${n(x + w * 0.9)} ${n(top - w * 0.45)} ${n(x + w)} ${n(top)}V${base}Z`;
    return `M${n(x)} ${base}V${n(top)}L${n(x + w * 0.14)} ${n(top - 5)}H${n(x + w * 0.86)}L${n(x + w)} ${n(top)}V${base}Z`;
  };
  const row = (from, to, base, minH, maxH) => {
    let d = '', windows = '';
    for (let x = from; x < to;) {
      const w = 7 + r() * 8, h = minH + r() * (maxH - minH), kind = Math.floor(r() * 4);
      d += house(x, base, w, h, kind);
      if (r() < 0.7) windows += `M${n(x + w * 0.3)} ${n(base - h * 0.55)}v2M${n(x + w * 0.7)} ${n(base - h * 0.55)}v2`;
      x += w;
    }
    add('mass', d);
    add('fine', windows);
  };
  const needle = (x, y, w, h) => `M${n(x - w / 2)} ${n(y)}L${n(x)} ${n(y - h)}L${n(x + w / 2)} ${n(y)}Z`;
  const box = (x, y, w, h) => `M${n(x - w / 2)} ${n(y)}V${n(y - h)}H${n(x + w / 2)}V${n(y)}Z`;

  row(74, 736, 131, 15, 30);

  // Church with a bulbous baroque helmet.
  add('mass', box(214, 131, 18, 40) + `M205 91Q205 81 210 78Q208 68 214 56Q220 68 218 78Q223 81 223 91Z` + needle(214, 56, 2, 9) + needle(205, 91, 4, 9) + needle(223, 91, 4, 9));
  // Lesser towers.
  add('mass', box(150, 131, 12, 30) + needle(150, 101, 12, 20) + box(304, 131, 11, 34) + box(304, 97, 7, 7) + needle(304, 90, 7, 22));
  // Town hall: a slender tower rising in tiers to a long spire.
  add('mass', box(396, 131, 13, 50) + box(396, 81, 10, 9) + box(396, 72, 7, 8) + box(396, 64, 5, 6) + needle(396, 58, 5, 30));
  add('fine', 'M391 100v10M396 100v10M401 100v10M389 81h14M392 72h8');
  // The great brick church: a massive blunt tower and a long nave with turrets.
  add('mass', `M487 131V97L494 86H552L559 97V131Z` + box(470, 131, 30, 60) + `M455 71L461 63H479L485 71Z` + needle(456, 71, 3, 10) + needle(484, 71, 3, 10) + needle(470, 63, 3, 12));
  add('mass', needle(496, 86, 4, 17) + needle(516, 86, 4, 15) + needle(536, 86, 4, 15) + needle(554, 88, 4, 17));
  add('fine', 'M462 80v34M470 80v34M478 80v34M500 100v20M512 100v20M524 100v20M536 100v20M548 100v20');
  // A square tower with a saddle roof, and a small spire further on.
  add('mass', box(612, 131, 17, 44) + needle(612, 87, 17, 15) + box(706, 131, 9, 26) + needle(706, 105, 9, 18));

  row(88, 724, 139, 9, 19);

  // Harbour crane: two round towers and the timber housing hanging between them.
  add('mass', box(662, 141, 12, 25) + needle(662, 116, 14, 10) + box(690, 141, 12, 25) + needle(690, 116, 14, 10) + `M668 128V104L676 95L684 104V128Z`);
  add('fine', 'M671 104v22M676 98v28M681 104v22');

  // Bastions: the angular trace of the walls, with a ditch in front.
  let wall = 'M30 151', foot = '';
  const points = [];
  for (let x = 30; x < 770; x += 92) points.push([x + 22, 160], [x + 46, 148], [x + 70, 160], [x + 92, 151]);
  for (const [x, y] of points) wall += `L${n(x)} ${y}`;
  for (const [x, y] of [...points].reverse()) foot += `L${n(x)} ${y + 6}`;
  add('mass', `${wall}L770 157${foot}L30 157Z`);
  let hatch = '';
  for (let x = 34; x < 768; x += 4.5) hatch += `M${n(x)} ${n(153 + Math.abs(((x - 30) % 92) - 46) * 0.14)}v3`;
  add('fine', hatch);

  let water = '';
  for (let y = 167; y < 177; y += 3.6) for (let x = r() * 30; x < 800; x += 26 + r() * 40) water += `M${n(x)} ${n(y)}h${n(8 + r() * 14)}`;
  add('fine', water);

  // Foreground: a low bank and trees at the edges.
  add('ink', 'M0 183Q90 174 190 181T400 180T610 182T800 177');
  let trees = '';
  for (const [cx, cy, s] of [[16, 158, 13], [34, 166, 10], [6, 172, 9], [782, 162, 11], [796, 171, 9]]) {
    trees += `M${n(cx - s)} ${n(cy + s * 0.6)}Q${n(cx - s * 1.2)} ${n(cy - s * 0.4)} ${n(cx - s * 0.4)} ${n(cy - s * 0.8)}Q${n(cx)} ${n(cy - s * 1.5)} ${n(cx + s * 0.5)} ${n(cy - s * 0.8)}Q${n(cx + s * 1.3)} ${n(cy - s * 0.3)} ${n(cx + s)} ${n(cy + s * 0.6)}Z`;
  }
  add('mass', trees);
  let grass = '';
  for (let x = 6; x < 800; x += 9 + r() * 16) grass += `M${n(x)} ${n(186 - r() * 3)}l1.5 -3.5`;
  add('fine', grass);
  return root;
}
