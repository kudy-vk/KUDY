import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCatalog } from '../../catalog-data.mjs';
import { ICONS } from '../kit-icons.mjs';

// Small in-process DOM double to exercise the actual HTML preview module, not
// a string-only test. No browser globals or external dependencies required.
class Node {
  constructor(tag) {
    this.tagName = tag.toLowerCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.classes = new Set();
    this.classList = { add: (...names) => names.forEach((name) => this.classes.add(name)) };
  }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  get firstElementChild() { return this.children.find((child) => child instanceof Node); }
  get lastElementChild() { return [...this.children].reverse().find((child) => child instanceof Node); }
  all() { return [this, ...this.children.flatMap((c) => c instanceof Node ? c.all() : [])]; }
  querySelectorAll(selector) {
    if (selector === '[role="radio"]') return this.all().filter((node) => node.getAttribute('role') === 'radio');
    if (selector === '[aria-checked="true"]') return this.all().filter((node) => node.getAttribute('aria-checked') === 'true');
    throw new Error('Unsupported test selector: ' + selector);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) {
    if (selector === 'button[data-direction]' && this.tagName === 'button' && this.dataset.direction) return this;
    return null;
  }
}
const host = new Node('div');
const lightButton = new Node('button');
lightButton.dataset.setTheme = 'light';
const darkButton = new Node('button');
darkButton.dataset.setTheme = 'dark';
globalThis.document = {
  createElement: (name) => new Node(name),
  createElementNS: (_, name) => new Node(name),
  querySelector: (selector) => selector === '#directions' ? host : null,
  querySelectorAll: (selector) => selector === '[data-set-theme]' ? [lightButton, darkButton] : selector === '.sample-phone' ? host.all().filter((node) => node.className === 'sample-phone') : [],
};

const { DIRECTION_VARIANTS } = await import('../about-257-directions.mjs');
assert.equal(DIRECTION_VARIANTS.length, 5, 'Exactly five proposals');
assert.equal(new Set(DIRECTION_VARIANTS.map((x) => x.id)).size, 5, 'Unique ids');
assert.equal(host.children.length, 5, 'Five comparison cards rendered');
for (const [i, option] of host.children.entries()) {
  const controls = option.all().filter((n) => n.getAttribute('role') === 'radiogroup');
  assert.equal(controls.length, 1, 'one direction control for variant ' + i);
  const group = controls[0];
  const radios = group.querySelectorAll('[role="radio"]');
  assert.equal(radios.length, 2);
  assert.deepEqual(radios.map((radio) => radio.getAttribute('aria-label')), ['З аэрапорта', 'У аэрапорт']);
  assert.equal(radios[0].getAttribute('aria-checked'), 'true');
  assert.equal(radios[1].getAttribute('aria-checked'), 'false');
  assert(radios.every((node) => typeof node.dataset.direction === 'string'));
  group.listeners.click({target: radios[1]});
  assert.equal(radios[0].getAttribute('aria-checked'), 'false');
  assert.equal(radios[1].getAttribute('aria-checked'), 'true');
  group.listeners.keydown({key: 'ArrowLeft', preventDefault() {}});
  assert.equal(radios[0].getAttribute('aria-checked'), 'true');
  assert.equal(radios[1].getAttribute('aria-checked'), 'false');
}
darkButton.listeners.click();
const phones = host.all().filter((x) => x.className === 'sample-phone');
assert.equal(phones.length, 5);
assert(phones.every((p) => p.dataset.theme === 'dark'));
assert.equal(darkButton.getAttribute('aria-pressed'), 'true');
lightButton.listeners.click();
assert(phones.every((p) => p.dataset.theme === 'light'));

const html = readFileSync(new URL('../about-257-directions.html', import.meta.url), 'utf8');
assert(html.includes('href="kit.css"'));
assert(html.includes('src="./about-257-directions.mjs"'));
assert(html.includes('prefers-reduced-motion: reduce'));
assert(!html.includes('.direction-control.v3 button[aria-checked="true"] {'),
  'Selected state lives only in the shared route stylesheet');
assert(html.includes('href="about-257-route-art.css"'));
assert(!html.includes('.v3 button { flex: 1; min-width: 0; min-height: 56px; border: 0;'));
for (const icon of ['plane', 'map-pin', 'arrow-left']) assert(ICONS[icon], 'Missing canonical icon ' + icon);

const main = readFileSync(new URL('../../catalog.md', import.meta.url), 'utf8');
const entries = parseCatalog(main).flatMap((section) => section.items);
const candidate = entries.find((x) => x.title === 'Пра горад — варыянт #257');
assert.equal(candidate?.kind, 'proposal');
assert(candidate?.views.some((view) => view.href === 'production/about-257-directions.html'));
assert(candidate?.views.some((view) => view.href === 'production/about-257.html'));
const chosen = host.children[2];
assert(chosen.classes.has('owner-chosen'), 'Option #3: city / plane route is selected');
assert(!host.children[1].classes.has('owner-chosen'), 'Previous #2 is no longer selected');
const glyphs = chosen.all().filter((node) => node.attributes.class?.includes('airport-route-icon'));
assert.equal(glyphs.length, 2, 'Both choices render the same KUDY-style route glyph');
for (const glyph of glyphs) {
  assert.equal(glyph.attributes.viewBox, '0 0 136 50');
  assert.equal(glyph.children.length, 3, 'miniature / hand-drawn arrow / miniature');
  assert.equal(glyph.children[1].attributes.class, 'route-journey-arrow');
}
const [from, to] = glyphs;
assert.equal(from.children[0].attributes.class, 'route-vignette route-airplane');
assert.equal(from.children[2].attributes.class, 'route-vignette route-city');
assert.equal(to.children[0].attributes.class, 'route-vignette route-city');
assert.equal(to.children[2].attributes.class, 'route-vignette route-airplane');
const city = to.children[0];
assert.equal(city.children.length, 1, 'One illustrated city image, no circle');
assert.equal(city.children[0].tagName, 'image');
assert.equal(city.children[0].attributes.href, './city-art-257.svg');
assert.equal(city.children[0].attributes.width, '53');
assert.equal(city.children[0].attributes.height, '53');
const plane = to.children[2];
assert.equal(plane.children.length, 1, 'One SVG aircraft image, no circle');
assert.equal(plane.children[0].tagName, 'image');
assert.equal(plane.children[0].attributes.href, './airport-airplane-thin-outline-257.svg');
assert.equal(plane.children[0].attributes.width, '34');
assert.equal(plane.children[0].attributes.height, '42');
assert(!glyphs.some(glyph => glyph.all().some(node => node.tagName === 'circle')),
  'Buttons contain no circular icon backgrounds');

const vectorCity = readFileSync(new URL('../city-art-257.svg', import.meta.url), 'utf8');
assert(vectorCity.includes('viewBox="0 0 96 96"'));
assert((vectorCity.match(/<path /g) ?? []).length >= 40);
assert(!vectorCity.includes('<image'), 'The Gdańsk SVG must contain only true vector artwork');
assert(vectorCity.includes('fill-opacity='));
const outlinedPlane = readFileSync(new URL('../airport-airplane-thin-outline-257.svg', import.meta.url), 'utf8');
assert(outlinedPlane.includes('viewBox="88 42 336 380"'));
assert(outlinedPlane.includes('M 257.9,56.8'), 'Long 747-inspired nose retained');
assert(outlinedPlane.includes('stroke-width="4.8"'));
assert(outlinedPlane.includes('stroke="#107db8"'));
assert(outlinedPlane.includes('linearGradient'));
assert(!outlinedPlane.includes('<circle') && !outlinedPlane.includes('<image'));

const illustrationCSS = readFileSync(new URL('../about-257-route-art.css', import.meta.url), 'utf8');
assert(illustrationCSS.includes('.route-city-image'));
assert(illustrationCSS.includes('.route-plane-image'));
assert(illustrationCSS.includes('linear-gradient('));
assert(illustrationCSS.includes('--airport-bronze-light:'));
assert(illustrationCSS.includes('background-image: linear-gradient('));
assert(illustrationCSS.includes('.direction-control.v3 button[aria-checked="true"]'));
assert(illustrationCSS.includes('[data-theme="dark"]'));
assert(illustrationCSS.includes('background: var(--card)'));
assert(illustrationCSS.includes('border-radius: 12px'));
assert(illustrationCSS.includes('min-height: 64px'));
assert(illustrationCSS.includes('stroke-width: 1.9'));
assert(!illustrationCSS.includes('::after'), 'No ambiguous progress-bar stripe');
assert(!illustrationCSS.includes('inset 0 1px'), 'No heavy inset shadow');
assert(html.includes('href="about-257-route-art.css"'));
const realScreen = readFileSync(new URL('../about-257.mjs', import.meta.url), 'utf8');
assert(realScreen.includes("import { airportCityRouteIcon } from './about-257-flight-icons.mjs'"));
assert(realScreen.includes('airportCityRouteIcon(direction)'));
assert(realScreen.includes("directions.classList.add('airport-direction')"));
assert(realScreen.includes('button.tabIndex = direction === way ? 0 : -1'));
assert(realScreen.includes("button.setAttribute('aria-label', t(`air.dir.${direction}`))"));
assert(realScreen.includes("event.key === 'ArrowLeft'"));
assert(realScreen.includes("event.key === 'ArrowRight'"));
console.log('PASS: generated Gdańsk art + long-nose plane, bronze gradient, five route variants, ARIA, keyboard, themes, single canonical catalog');
