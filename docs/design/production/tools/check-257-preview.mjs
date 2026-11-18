import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCatalog } from '../../catalog-data.mjs';
import { LINKS, SECTIONS, TOURIST_CARD_LOGO, translator } from '../about-257-content.mjs';
import { be } from '../about-257-words-be.mjs';
import { en } from '../about-257-words-en.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const preview = read('../about-257.html');
const screen = read('../about-257.mjs');
const css = read('../kit.css');
const main = read('../../catalog.md');
const items = parseCatalog(main).flatMap((section) => section.items);
const candidate = items.find((item) => item.title === 'Пра горад — варыянт #257');

assert.equal(candidate?.kind, 'proposal');
assert.equal(candidate?.views[0]?.href, 'production/about-257.html');
assert.deepEqual(candidate?.views.map((view) => view.href), ['production/about-257.html']);
assert(main.includes('Адзіны пункт уваходу'));
assert(!main.includes('catalog-257.html'));
assert(preview.includes('src="about-257.mjs"'));
assert(preview.includes('href="kit.css"'));
assert(preview.includes('.brand-lockup'));
// The #257 screen looks like the rest of the app (decision M9 and
// visual-language §5): the wheel medallions and the direction switch carry
// exactly the main mockup's rules, with no local art, gradients or overrides.
const baseline = read('../about.html');
// Every whole CSS rule (selector and body) whose selector starts with one of the prefixes.
const rules = (html, prefixes) => [...html.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^[ \t]*([^{}\n][^{}]*)\{[^}]*\}/gm)]
  .filter((match) => prefixes.some((prefix) => match[1].trim().startsWith(prefix)))
  .map((match) => match[0].trim());
const SHARED = ['.wheel', '.slot', '.medal', '[data-theme="dark"] .medal', '.seg'];
assert(rules(baseline, SHARED).length >= 15, 'The baseline wheel and switch rules are found');
assert.deepEqual(rules(preview, SHARED), rules(baseline, SHARED), 'Wheel, medallion and switch rules differ from about.html');
assert(!/wheel-color-art|color-art-slot|airport-direction|about-257-route-art\.css|gradient\(\s*1[0-9]{2}deg/i.test(preview),
  'No local art styling in the #257 screen');
assert(!/icons-257|airport-badge|flight-icons|medallions/.test(screen), 'The wheel draws the canonical medallions only');
assert(screen.includes("import { wheel } from './about-wheel.mjs'"));
assert(screen.includes("const directions = seg('direction', t('air.dir'),"));
assert(screen.includes("[['from', t('air.dir.from')], ['to', t('air.dir.to')]], way, (value) => { ui.direction = value; c.redraw(); });"));
assert(!screen.includes('replaceChildren(airport'));
// The direction choices keep the owner's composition (plane → old town and
// back), drawn in KUDY's manner: the town is the proposal's Gdańsk redrawn as
// an engraving like the home-screen panorama,
// the plane is the kit's plane, both in the engraved line; the chosen card
// speaks the chosen medallion's language (M9). The word stays the name.
const ROUTE_SIGNS = ['plane'];
assert(screen.includes('const OLD_TOWN = ['));
assert(screen.includes("svg('path', { class: `route-${kind}`, d })"));
assert(screen.includes("...iconShapes('plane')"));
assert(screen.includes("directions.classList.add('route-pick');"));
assert(screen.includes("button.setAttribute('aria-label', t(`air.dir.${key}`));"));
assert(!/<image|\.png|\.svg'/.test(screen.slice(screen.indexOf('function routeArt'), screen.indexOf('function transport'))),
  'The route art is drawn from shared paths, not pictures');
const routeCSS = rules(preview, ['.route-']).join('\n');
for (const token of ['var(--engrave)', 'var(--medal-paper)', 'var(--medal-ink)', 'var(--medal-glow)', 'var(--accent)']) {
  assert(routeCSS.includes(token), `The route cards use ${token}`);
}
assert(!/#[0-9a-f]{3,6}\b/i.test(routeCSS), 'The route cards use tokens only');
assert(!preview.includes('.museum-fold'));
// Every sign the screen asks for exists: in the shared kit or registered by
// the screen itself (a missing one stops the whole section from rendering).
const kitIcons = read('../kit-icons.mjs');
const contentSource = read('../about-257-content.mjs');
const signs = new Set([
  ...[...screen.matchAll(/icon\('([a-z-]+)'/g)].map((match) => match[1]),
  ...[...contentSource.matchAll(/icon: '([a-z-]+)'/g)].map((match) => match[1]),
  ...ROUTE_SIGNS,
]);
const registered = screen.slice(screen.indexOf('registerIcons({'), screen.indexOf('});', screen.indexOf('registerIcons({')));
for (const sign of signs) {
  const known = new RegExp(`(^|[\\s{,])'?${sign}'?:`, 'm');
  assert(known.test(kitIcons) || known.test(registered), `Unknown icon in the #257 screen: ${sign}`);
}

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
