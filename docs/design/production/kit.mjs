// Shared pieces of the production mockups: device presets, the phone frame,
// the icon set and access to the app's own interface strings.

const SVG = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
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

// Lucide 1.49.0 (ISC) — the icon package the app draws through CanonIcon.
// Shapes are copied from node_modules/lucide-react-native/dist/esm/icons.
const ICONS = {
  'map-pin': [
    ['path', { d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' }],
    ['circle', { cx: 12, cy: 10, r: 3 }],
  ],
  route: [
    ['circle', { cx: 6, cy: 19, r: 3 }],
    ['path', { d: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' }],
    ['circle', { cx: 18, cy: 5, r: 3 }],
  ],
  lightbulb: [
    ['path', { d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5' }],
    ['path', { d: 'M9 18h6' }],
    ['path', { d: 'M10 22h4' }],
  ],
  clock: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['path', { d: 'M12 6v6l4 2' }],
  ],
  footprints: [
    ['path', { d: 'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z' }],
    ['path', { d: 'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z' }],
    ['path', { d: 'M16 17h4' }],
    ['path', { d: 'M4 13h4' }],
  ],
};

// The 24×24 shapes of one icon, for placing inside another <svg>.
export function iconShapes(name) {
  return ICONS[name].map(([tag, attrs]) => svg(tag, attrs));
}

export function icon(name, size = 20) {
  return svg('svg', { class: 'icon', viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' }, ...iconShapes(name));
}

// An empty phone: status bar on top, the screen content, system navigation below.
export function phone(deviceKey, theme) {
  const device = DEVICES[deviceKey];
  const frame = el('div', { className: 'phone' });
  frame.dataset.theme = theme;
  for (const [name, value] of Object.entries({ w: device.w, h: device.h, status: device.status, nav: device.nav })) {
    frame.style.setProperty(`--${name}`, `${value}px`);
  }
  const status = el('div', { className: 'status' }, el('span', { textContent: '9:41' }), el('i'));
  status.setAttribute('aria-hidden', 'true');
  const sysnav = el('div', { className: `sysnav ${device.navKind}` });
  sysnav.setAttribute('aria-hidden', 'true');
  if (device.navKind === 'buttons') sysnav.append(el('i'), el('i'), el('i'));
  return { frame, status, sysnav, device };
}

// Interface strings the app already has, read from its own contract so a
// mockup never restates them. `ids` are record ids of contracts/ui-messages.
const CONTRACT = '../../../contracts/ui-messages/';
const recordCache = new Map();

async function records(locale) {
  if (!recordCache.has(locale)) {
    const file = locale === 'be' ? 'source.json' : `translations/${locale}.json`;
    recordCache.set(locale, fetch(CONTRACT + file).then((response) => {
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
