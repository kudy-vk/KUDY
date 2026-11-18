// Issue #257 — the static half of the proposal's checks: its catalogue entry,
// its styles against the approved screen, its signs, facts and words. What
// the screen does when a visitor uses it is driven in a real browser by
// test/about-257-browser.test.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCatalog } from '../../catalog-data.mjs';
import { LINKS, SECTIONS, TOURIST_CARD_LOGO, translator } from '../about-257-content.mjs';
import { be } from '../about-257-words-be.mjs';
import { en } from '../about-257-words-en.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const preview = read('../about-257.html');
const baseline = read('../about.html');
const screen = read('../about-257.mjs');
const catalog = read('../../catalog.md');

// One entry in the single catalogue, one view: the screen itself.
const candidate = parseCatalog(catalog).flatMap((section) => section.items).find((item) => item.title === 'Пра горад — варыянт #257');
assert.equal(candidate?.kind, 'proposal');
assert.deepEqual(candidate?.views.map((view) => view.href), ['production/about-257.html']);
assert(!catalog.includes('catalog-257.html'));

// The proposal looks like the rest of the app (decision M9, visual-language
// §5): the wheel, the medallions and the shared switch carry exactly the
// approved screen's rules, with no art styling of its own.
// Every whole CSS rule (selector and body) whose selector starts with one of the prefixes.
const rules = (html, prefixes) => [...html.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^[ \t]*([^{}\n][^{}]*)\{[^}]*\}/gm)]
  .filter((match) => prefixes.some((prefix) => match[1].trim().startsWith(prefix)))
  .map((match) => match[0].trim());
const SHARED = ['.wheel', '.slot', '.medal', '[data-theme="dark"] .medal', '.seg'];
assert(rules(baseline, SHARED).length >= 15, 'The baseline wheel and switch rules are found');
assert.deepEqual(rules(preview, SHARED), rules(baseline, SHARED), 'Wheel, medallion and switch rules differ from about.html');
assert(!/wheel-color-art|color-art-slot|airport-direction|about-257-route-art\.css/i.test(preview), 'No art styling of its own');
// The direction cards (owner's composition, accepted 2026-11-18): the
// engraved line and the chosen medallion's colours, tokens only.
const routeCSS = rules(preview, ['.route-']).join('\n');
for (const token of ['var(--engrave)', 'var(--medal-paper)', 'var(--medal-ink)', 'var(--medal-glow)', 'var(--accent)']) {
  assert(routeCSS.includes(token), `The route cards use ${token}`);
}
assert(!/#[0-9a-f]{3,6}\b/i.test(routeCSS), 'The route cards use tokens only');
// The pictures are drawn from paths, never loaded.
assert(!/<image|\.png|\.svg['`]|href:/.test(screen), 'No pictures loaded by the screen');
// The proposal keeps only its differences: the shared screen comes from about-screen.mjs.
assert(screen.includes("from './about-screen.mjs'") && !screen.includes('mountBoard'), 'The screen is mounted by about-screen.mjs');

// Every sign the screen asks for exists: in the shared kit or registered by
// the screen itself (a missing one stops the whole section from rendering).
const kitIcons = read('../kit-icons.mjs');
const shared = read('../about-screen.mjs') + read('../about-content.mjs');
const registeredIn = (source) => source.slice(source.indexOf('registerIcons({'), source.indexOf('});', source.indexOf('registerIcons({')));
const registered = registeredIn(screen) + registeredIn(read('../about-screen.mjs'));
const signs = new Set([...(screen + shared).matchAll(/icon(?:Shapes)?\('([a-z-]+)'|icon: '([a-z-]+)'/g)].map((match) => match[1] ?? match[2]));
for (const sign of signs) {
  const known = new RegExp(`(^|[\\s{,])'?${sign}'?:`, 'm');
  assert(known.test(kitIcons) || known.test(registered), `Unknown icon in the #257 screen: ${sign}`);
}

// Facts: four sections without the card-and-museums one; the official pages.
assert.deepEqual(SECTIONS.map((section) => section.id), ['airport', 'transport', 'city', 'food']);
assert.equal(LINKS.jestemZGdanska, 'https://jestemzgdanska.pl/');
assert(LINKS.kartaTurysty.includes('kartaturysty.visitgdansk.com'));
assert(TOURIST_CARD_LOGO.startsWith('https://kartaturysty.visitgdansk.com/'));
assert.equal(LINKS.muzeumGdanska, undefined);

// Words: the card-and-museums section, the dated notices and the price words
// are gone; the tourist and resident cards speak both languages.
for (const [lang, words] of [['be', be], ['en', en]]) {
  const t = translator(lang);
  for (const key of ['tab.card', 'head.card', 'verified', 'sources.note', 'air.notice']) assert.equal(words[key], undefined, `${lang}/${key}`);
  assert(!Object.keys(words).some((key) => key.startsWith('museum.')));
  for (const key of ['card.title', 'card.lead', 'card.brandAlt', 'card.openOfficial', 'tr.residents', 'resident.title', 'resident.lead', 'resident.openOfficial', 'sources.title']) {
    assert(typeof words[key] === 'string' && t(key).length > 0, `${lang}/${key}`);
  }
  assert(!/бясплатн|free rides|free travel/i.test(words['resident.lead']));
  assert(/transpor|транспарт|праезд/i.test(words['card.lead']));
}
const museumReserve = read('../../../agent-tasks/results/257-museum-catalogue.md');
assert.equal((museumReserve.match(/\*\*teaser BE:\*\*/g) ?? []).length, 9);
assert.equal((museumReserve.match(/\*\*detail EN:\*\*/g) ?? []).length, 9);

console.log('PASS #257: one catalogue view, approved wheel and switch styles, token-only route cards, no loaded pictures, every sign known, 4 sections, EN/BE words');
