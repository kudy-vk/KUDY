// «Пра горад»: the building blocks of a guide section. They turn facts into
// things to scan and press instead of paragraphs: a fold, a switch, numbered
// steps, a line badge, fact signs, price rows, detail rows, a remark.
// Styles live in about.html.
import { el, icon } from './kit.mjs';

export const sr = (text) => el('span', { className: 'sr', textContent: text });

let seq = 0;

// A fold: a head that is always visible and a body that opens under it.
// `lead` stands before the title (a sign or a line badge), `meta` under it.
// Returns the node with `setOpen(value)`.
export function fold({ lead, title, meta, body, open = false, onOpen }) {
  const id = `fold-${(seq += 1)}`;
  const head = el('button', { className: 'fold-head', type: 'button' },
    lead,
    el('span', { className: 'fold-title' },
      el('span', { className: 'fold-name', textContent: title }),
      typeof meta === 'string' ? el('span', { className: 'fold-meta', textContent: meta }) : meta),
    icon('chevron-down', 20));
  head.setAttribute('aria-controls', id);
  const inner = el('div', { className: 'fold-inner' }, el('div', { className: 'fold-pad' }, ...body));
  const region = el('div', { className: 'fold-body', id }, inner);
  const node = el('div', { className: 'fold' }, head, region);
  node.setOpen = (value) => {
    node.classList.toggle('open', value);
    head.setAttribute('aria-expanded', String(value));
    // A closed body is out of the tab order and hidden from the screen reader.
    inner.inert = !value;
  };
  head.addEventListener('click', () => {
    const next = !node.classList.contains('open');
    node.setOpen(next);
    if (next) onOpen?.(node);
  });
  node.setOpen(open);
  return node;
}

// Folds of one group: opening one closes the others, so the list never grows
// into a wall of text.
export function folds(items) {
  const nodes = items.map((item) => fold({
    ...item,
    onOpen: (opened) => { for (const node of nodes) if (node !== opened) node.setOpen(false); },
  }));
  return el('div', { className: 'folds' }, ...nodes);
}

// A switch between a few values, drawn like the theme switch of the settings.
export function seg(label, options, value, onChange) {
  const node = el('div', { className: 'seg' });
  node.setAttribute('role', 'radiogroup');
  node.setAttribute('aria-label', label);
  const buttons = options.map(([key, text]) => {
    const button = el('button', { type: 'button', textContent: text });
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(key === value));
    button.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-checked', String(other === button));
      onChange(key);
    });
    return button;
  });
  node.append(...buttons);
  return node;
}

// Numbered steps joined by a line. Each item: { title, body: [nodes] }.
export function steps(items) {
  return el('ol', { className: 'steps' }, ...items.map(({ title, body }) => el('li', { className: 'step' },
    el('div', { className: 'step-body' }, el('h4', { className: 'step-title', textContent: title }), ...body))));
}

// The number of a line as a plate: a bus, a night bus or a train.
export function lineBadge(kind, line, kindName) {
  return el('span', { className: `line ${kind}` }, sr(`${kindName} `), line);
}

// Short facts with a sign each: [[icon name, text], …].
export function facts(list) {
  return el('span', { className: 'gfacts' }, ...list.map(([name, text]) => el('span', { className: 'gfact' }, icon(name, 16), text)));
}

// Label-and-value rows: [[label, value], …].
export function rows(list) {
  return el('dl', { className: 'rows' }, ...list.map(([label, value]) => el('div', {},
    el('dt', { textContent: label }), el('dd', { textContent: value }))));
}

// Price rows: [[name, price, reduced price or null], …].
export function prices(list) {
  return el('dl', { className: 'prices' }, ...list.map(([name, full, reduced]) => el('div', {},
    el('dt', { textContent: name }),
    el('dd', {}, full, reduced && el('small', { textContent: reduced })))));
}

// A remark: `warn` for what may spoil a trip, `tip` for a useful extra,
// `error` for a failure. It is the kit's notice or card with a sign.
const REMARK = {
  warn: ['triangle-alert', 'notice row'],
  tip: ['lightbulb', 'card row'],
  error: ['circle-alert', 'notice error row'],
};
export function remark(tone, text) {
  const [sign, className] = REMARK[tone];
  const node = el('p', { className }, icon(sign, 18), el('span', { textContent: text }));
  if (tone === 'error') node.setAttribute('role', 'status');
  return node;
}

// A small heading inside a section.
export const heading = (text) => el('h3', { className: 'g-sub', textContent: text });

// A tile with a sign, a name and one line of text.
export function tile(name, title, text) {
  return el('div', { className: 'card tile' }, icon(name, 20), el('strong', { textContent: title }), el('span', { textContent: text }));
}
