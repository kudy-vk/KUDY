import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCatalog } from '../../catalog-data.mjs';
import { LINKS, SECTIONS, TOURIST_CARD_LOGO, translator } from '../about-257-content.mjs';
import { be } from '../about-257-words-be.mjs';
import { en } from '../about-257-words-en.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const preview = read('../about-257.html');
const screen = read('../about-257.mjs');
const css = read('../kit.css');
const main = read('../../catalog.md');
const items = parseCatalog(main).flatMap((section) => section.items);
const candidate = items.find((item) => item.title === 'Пра горад — варыянт #257');

assert.equal(candidate?.kind, 'proposal');
assert.equal(candidate?.views[0]?.href, 'production/about-257.html');
assert(candidate?.views.some((view) => view.href === 'production/about-257-directions.html'));
assert(candidate?.views.some((view) => view.href === 'production/about-257-icons.html'));
assert(main.includes('Адзіны пункт уваходу'));
assert(!main.includes('catalog-257.html'));
assert(preview.includes('src="about-257.mjs"'));
assert(preview.includes('href="kit.css"'));
assert(preview.includes('.brand-lockup'));
const artCSS = read('../about-257-route-art.css');
assert(preview.includes('href="about-257-route-art.css"'));
assert(!preview.includes('.seg.airport-direction button[aria-checked="true"] {'),
  'The active gradient has one canonical definition');
assert(artCSS.includes('.seg.airport-direction button,'));
assert(artCSS.includes('.seg.airport-direction button[aria-checked="true"],'));
assert(artCSS.includes('background-image: linear-gradient('));
assert(artCSS.includes('--airport-bronze-middle:'));
assert(artCSS.includes('--airport-bronze-border:'));
assert(!preview.includes('.airport-direction button { display: grid; place-items: center; min-height: 56px; }'));
assert(preview.includes('gap: 8px;\n    padding: 0; border: 0; background: transparent;'));
assert(screen.includes("import { airportCityRouteIcon } from './about-257-flight-icons.mjs'"));
// Both baseline and experimental icons live in the actual #257 screen
// registered in the single main-derived catalog; the shared wheel is untouched.
const carousel = screen.slice(screen.indexOf('    const wheelNode = wheel({'), screen.indexOf('    body.append(wheelNode, page);'));
assert(screen.includes("{ id: 'medallions', label: 'Іконкі кола'"));
assert(screen.includes("['blue', 'Каляровыя #257 (прапанова)']"));
assert(screen.includes("['canon', 'Базавыя з main']"));
assert(carousel.includes("if (state.medallions === 'blue')"));
assert(carousel.includes("const artBySection = { airport: 'airport', transport: 'transport', city: 'gdansk', food: 'food' }"));
assert(carousel.includes("wheelNode.querySelectorAll('.slot').forEach("));
assert(carousel.includes("slot.querySelector('.medal .glyph')"));
assert(carousel.includes("href: `./icons-257/${art}.svg`"));
assert(carousel.includes("slot.classList.add('color-art-slot')"));
assert(carousel.includes("slot.classList.remove('color-art-slot')"));
assert(carousel.includes('illustration.replaceWith(glyph)'));
assert(preview.includes('.slot.color-art-slot .medal .disc,'));
assert(preview.includes('.slot.color-art-slot .medal .inner { fill: none; stroke: none; }'));
assert(preview.includes('.medal .wheel-color-art'));
assert(preview.includes('saturate(calc(.30 + .70 * var(--near)))'));
assert(preview.includes('.medal .pick { stroke: var(--accent)'));
assert(preview.includes('.medal .glow { stroke: var(--medal-glow)'));
assert(!read('../about-wheel.mjs').includes('icons-257'));
assert(!screen.includes('airport-badge-blue.svg'));
assert(screen.includes("const directions = seg('direction', t('air.dir')"));
assert(screen.includes('button.replaceChildren(airportCityRouteIcon(direction))'));
assert(artCSS.includes('.seg.airport-direction .airport-route-icon'));
assert(artCSS.includes('.route-city-image'));
assert(artCSS.includes('.route-plane-image'));
assert(screen.includes("button.setAttribute('aria-label', t(`air.dir.${direction}`))"));
assert(screen.includes('button.tabIndex = direction === way ? 0 : -1'));
assert(screen.includes('c.focusDirection(value)'));
assert(screen.includes('focusDirection: (value) => page.querySelector('));
assert(screen.includes("event.key === 'ArrowLeft'"));
assert(screen.includes("event.key === 'ArrowRight'"));
assert(!preview.includes('.museum-fold'));

assert.deepEqual(SECTIONS.map((section) => section.id), ['airport', 'transport', 'city', 'food']);
assert.deepEqual(Object.keys(SECTIONS.reduce((r, section) => ({ ...r, [section.id]: true }), {})),
  ['airport', 'transport', 'city', 'food']);
assert(!SECTIONS.some((section) => section.id === 'card'));
assert(!screen.includes("card: touristCard"));
assert(!screen.includes("...(way === 'from' ? [touristCard(c)] : []),"));
const pageRender = screen.slice(screen.indexOf('page.replaceChildren('), screen.indexOf('page.scrollTop = top;'));
assert(pageRender.includes("current.id === 'airport' && ui.direction === 'from'"));
assert(pageRender.indexOf('...sources(),') < pageRender.indexOf('touristCard(context)'));
assert(pageRender.indexOf('touristCard(context)') < pageRender.indexOf('panorama()'));
assert(screen.includes("id: 'tourist-card'"));
assert(screen.includes('memory: ui.folds'));
assert(screen.includes("description.classList.add('tourist-card-fold')"));
assert(screen.includes("body: [text('t-secondary', t('card.lead'))]"));
assert(screen.includes("return card('card-brief tourist-card', description, link)"));
assert(preview.includes('.tourist-card-fold .fold-head > .icon:last-child { display: none; }'));
assert(preview.includes('.tourist-card > .source-icon'));
assert(screen.includes("options: SECTIONS.map("));
assert(screen.includes("iconButton('external-link'"));
assert(screen.includes("card-brief"));
assert(!screen.includes('MUSEUMS.map(museum)'));
assert(!screen.includes('card-museums'));
assert(!screen.includes("current.id === 'card'"));
assert(!screen.includes('CARD_HOURS'));
assert(!screen.includes('CARD_PACKAGES'));
assert(!screen.includes('FREE_DAYS'));
assert(css.includes('width: 48px;\n  height: 48px;'));
assert.equal(LINKS.jestemZGdanska, 'https://jestemzgdanska.pl/');
assert(screen.includes("heading(t('tr.residents'))"));
assert(screen.includes("residentCard(c),"));
assert(screen.includes("function residentCard(c) {"));
assert(screen.includes("c.openOfficial('jestemZGdanska')"));
assert(screen.includes("'brand-symbol resident-symbol'"));
assert(preview.includes('.resident-symbol'));
assert(!screen.includes("free rides for residents"));
assert(LINKS.kartaTurysty.includes('kartaturysty.visitgdansk.com'));
assert(TOURIST_CARD_LOGO.startsWith('https://kartaturysty.visitgdansk.com/'));

for (const [lang, words] of [['be', be], ['en', en]]) {
  const t = translator(lang);
  assert.equal(words['tab.card'], undefined);
  assert.equal(words['head.card'], undefined);
  assert(!Object.keys(words).some((key) => key.startsWith('museum.')));
  for (const key of ['card.title', 'card.lead', 'card.brandAlt', 'card.openOfficial']) {
    assert(typeof words[key] === 'string' && words[key].length > 0, lang + '/' + key);
    assert(t(key).length > 0);
  }
  for (const key of ['tr.residents', 'resident.title', 'resident.lead', 'resident.openOfficial']) {
    assert(typeof words[key] === 'string' && words[key].length > 0, lang + '/' + key);
    assert(t(key).length > 0);
  }
  assert(!/бясплатн|free rides|free travel/i.test(words['resident.lead']));
  assert(/transpor|транспарт|праезд/i.test(words['card.lead']));
}
const museumReserve = read('../../../agent-tasks/results/257-museum-catalogue.md');
assert((museumReserve.match(/\*\*teaser BE:\*\*/g) ?? []).length === 9);
assert((museumReserve.match(/\*\*detail EN:\*\*/g) ?? []).length === 9);
const airport = screen.slice(screen.indexOf('function airport(c) {'), screen.indexOf('function transport(c) {'));
assert(airport.includes("const collapsibleSteps = (items) => el('ol', { className: 'steps airport-fold-steps' }"));
assert(airport.includes("id: 'airport-' + way + '-step-' + (index + 1)"));
assert(airport.includes("memory: ui.folds"));
assert(airport.includes("stepFold.classList.add('airport-step-fold')"));
assert(airport.includes("collapsibleSteps(["));
assert(!airport.includes("remark('warn', t('air.notice'))"));
assert(!airport.includes("steps(["));
const sharedFold = read('../about-parts.mjs');
assert(sharedFold.includes('body, open = false'));
assert(sharedFold.includes("head.setAttribute('aria-expanded', String(value))"));
assert(sharedFold.includes('memory.has(id) ? memory.get(id) : open'));
assert(preview.includes('.fold-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms ease; }'));
assert(preview.includes('.fold.open .fold-body { grid-template-rows: 1fr; }'));
assert(preview.includes('@media (prefers-reduced-motion: reduce)'));
const sourcesFn = screen.slice(screen.indexOf('    function sources() {'), screen.indexOf('    // Paints the open section.'));
assert(sourcesFn.includes("id: 'official-sources-' + current.id"));
assert(sourcesFn.includes("memory: ui.folds"));
assert(sourcesFn.includes("title: t('sources.title')"));
assert(sourcesFn.includes('t(`links.${key}`)'));
assert(sourcesFn.includes('${LINKS[key]}'));
assert(sourcesFn.includes("section.classList.add('source-fold')"));
assert(!sourcesFn.includes("heading(t('sources.title'))"));
assert(!sourcesFn.includes("t('sources.note')"));
assert(preview.includes('.source-fold .fold-head { min-height: 48px; }'));
assert(!screen.includes("t('verified')"));
for (const words of [be, en]) {
  assert.equal(words['air.notice'], undefined);
  assert.equal(words['sources.note'], undefined);
  assert.equal(words.verified, undefined);
  assert.equal(typeof words['sources.title'], 'string');
}
console.log('PASS #257: three closed airport steps, collapsed official links, no dated notices; airport card at bottom, accessible accordion, icon-only external link, resident app, EN/BE, 4 sections, single canonical catalog extended');
