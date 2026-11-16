// Shared pieces of the production mockups: the review board, the phone frame,
// common components, the icon set and access to the app's interface strings.
// A screen module calls mountBoard() and fills the phone body it is given.
import { ICONS } from './kit-icons.mjs';
import { PANORAMA_VIEWBOX, panoramaPaths } from './panorama-paths.mjs';

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

// The drawing itself lives in panorama-paths.mjs — the pure builder the app
// consumes too (components/city-panorama.tsx, issue #216); this file only
// paints it into the browser DOM.
export function panorama() {
  // Decoration only: it carries no information a screen reader needs.
  const root = svg('svg', { class: 'panorama', viewBox: PANORAMA_VIEWBOX, 'aria-hidden': 'true' });
  for (const { cls, d } of panoramaPaths()) root.append(svg('path', { class: cls, d }));
  return root;
}
