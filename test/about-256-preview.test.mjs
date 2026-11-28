// #256 compact visual prototype regression: no duplicated restaurant catalogue.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { foodProposal } from '../docs/design/production/about-256-food.mjs';
import { SECTIONS, LINKS, translator } from '../docs/design/production/about-256-content.mjs';
import { releaseSpeed, stopAfterPush } from '../docs/design/production/about-wheel.mjs';

class TestNode {
  constructor(tag) {
    this.tag = tag; this.children = []; this.attributes = {}; this.dataset = {};
    const classes = new Set();
    this.classList = {
      toggle: (key, enabled) => enabled ? classes.add(key) : classes.delete(key),
      contains: (key) => classes.has(key),
    };
    this.handlers = {};
  }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, cb) { this.handlers[type] = cb; }
  click() { this.handlers.click?.(); }
}
globalThis.document = {
  createElement: (tag) => new TestNode(tag),
  createElementNS: (_namespace, tag) => new TestNode(tag),
};
const walk = (n) => [n, ...(n.children ?? []).filter((c) => c instanceof TestNode).flatMap(walk)];
const render = (locale = 'be', say = () => {}) =>
  foodProposal({ t: translator(locale), say, ui: { folds: new Map() }, state: { link: 'ok' } })[0];
const meta = (root) => root.children.map((fold) => fold.children[0].children[1].children[0].textContent);

for (const locale of ['be', 'en']) {
  test('#256: ' + locale + ' renders 4 relevant folded actions, no copied city list', () => {
    const root = render(locale);
    assert.deepEqual(meta(root), locale === 'be'
      ? ['Як плаціць', 'Абмен і банкаматы', 'Пасля 21:00', 'Дастаўка ежы']
      : ['How to pay', 'Cash exchange & ATMs', 'After 9 PM', 'Food delivery']);
    assert.ok(root.children.every((fold) => fold.children[0].getAttribute('aria-expanded') === 'false'));
    root.children[0].children[0].click();
    assert.equal(root.children[0].children[0].getAttribute('aria-expanded'), 'true');
    root.children[1].children[0].click();
    assert.equal(root.children[0].children[0].getAttribute('aria-expanded'), 'false');
    assert.equal(root.children[1].children[0].getAttribute('aria-expanded'), 'true');
    assert.ok(!walk(root).some(n => n.dataset.key === 'official:visitGdanskFood'));
  });
}

test('#256: the current M14 wheel still contains 4 major sections', () => {
  assert.equal(SECTIONS.length, 4);
  assert.equal(SECTIONS.filter((x) => x.id === 'food').length, 1);
  const html = readFileSync(new URL('../docs/design/production/about.html', import.meta.url), 'utf8');
  assert.match(html, /\.medal\s*\{[^}]*width: 80px; height: 80px;/);
  // #256 does not change M14 wheel visual styling or its inertia.
  assert.match(html, /\.medal \.pick\s*\{[^}]*var\(--near\)/);
  assert.equal(stopAfterPush({position: 132, speed: 0, slot: 100, count: 5}), 100);
  assert.equal(releaseSpeed([[0, 130], [50, 100]], 50), 0.6);
});

test('#256: 5 delivery shortcuts are clickable brands in a 3-column grid', () => {
  const events = [];
  const root = render('be', msg => events.push(msg));
  const delivery = walk(root.children[3]);
  const grid = delivery.find((n) => n.className === 'food-brand-grid');
  assert.ok(grid);
  assert.deepEqual(grid.children.map((x) => x.getAttribute('aria-label')),
    ['Pyszne.pl', 'Wolt', 'Glovo', 'Uber Eats', 'Bolt Food']);
  for (const tile of grid.children) {
    assert.equal(tile.className, 'food-brand');
    assert.equal(tile.getAttribute('role'), 'link');
    tile.click();
  }
  assert.equal(events.length, 5);
  // The Uber Eats image is itself a wordmark, no duplicate caption below it.
  const uber = grid.children.find((tile) => tile.getAttribute('aria-label') === 'Uber Eats');
  assert.ok(uber);
  assert.equal(walk(uber).filter((part) => part.className === 'food-brand-name').length, 0);
  const foodUrl = new URL(LINKS.boltGdansk);
  assert.equal(foodUrl.host, 'food.bolt.eu');
  assert.equal(foodUrl.pathname, '/pl-pl/449-gdansk/');
  for (const key of ['pyszneGdansk', 'woltGdansk','glovoGdansk','uberGdansk','boltGdansk'])
    assert.ok(events.some(e => e.includes(LINKS[key])));
  const html = readFileSync(new URL('../docs/design/production/about.html', import.meta.url), 'utf8');
  assert.match(html, /\.food-brand-grid\s*\{[^}]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(html, /\.food-brand:focus-visible/);
  assert.ok(!delivery.some(n => n.className === 'food-hint-trigger'), 'no obvious delivery disclaimer');
});

// The native app and production mockup store delivery destinations separately.
// Fail in the default npm test when one copy changes without the other.
test('#256: native and HTML delivery destinations stay identical', () => {
  const native = readFileSync(new URL('../components/about-city-content.ts', import.meta.url), 'utf8');
  const routes = [
    ['pyszne', 'pyszneGdansk'], ['wolt', 'woltGdansk'],
    ['glovo', 'glovoGdansk'], ['uber', 'uberGdansk'], ['bolt', 'boltGdansk'],
  ];
  for (const [key, htmlKey] of routes) {
    const pattern = new RegExp('\\b' + key + ': "([^"]+)"');
    const found = native.match(pattern);
    assert.ok(found, 'native delivery URL missing for ' + key);
    assert.equal(found[1], LINKS[htmlKey], 'delivery URL drift for ' + key);
  }
});

test('#256: bundled real logo vectors are local, with text fallback for other brands', () => {
  for (const name of ['glovo','ubereats','mcdonalds','kfc']) {
    const file = new URL('../docs/design/production/food-logos/' + name + '.svg', import.meta.url);
    assert.ok(existsSync(file), 'bundled ' + name);
    const svg = readFileSync(file, 'utf8');
    assert.match(svg, /<svg/);
    assert.match(svg, /<path/);
  }
  const html = readFileSync(new URL('../docs/design/production/about.html', import.meta.url), 'utf8');
  assert.match(html, /\.food-wordmark-wolt/);
  assert.match(html, /\.food-wordmark-bolt/);
});

test('#256: late eating links go directly to Maps and show no addresses', () => {
  const seen = [];
  const root = render('be', msg => seen.push(msg));
  const grid = walk(root.children[2]).find(n=> n.className === 'food-brand-grid');
  const titles = grid.children.map(n=>n.getAttribute('aria-label'));
  assert.ok(titles[0].includes('McDonald’s, Галоўны вакзал, да 00:00'));
  assert.ok(titles[1].includes('KFC, Галоўны вакзал, звычайна да 01:00'));
  assert.equal(titles[2], 'Іншыя месцы');
  const notes = grid.children.slice(0, 2).map((button) =>
    walk(button).find((node) => node.className === 'food-brand-note')?.textContent);
  assert.deepEqual(notes, [
    'Галоўны вакзал\nда 00:00',
    'Галоўны вакзал\nзвычайна да 01:00',
  ]);
  for(const button of grid.children)button.click();
  for (const key of ['mapMcd','mapKfc','mapLate']) {
    assert.match(LINKS[key], /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    assert.ok(seen.some(s=>s.includes(LINKS[key])));
  }
  assert.ok(!walk(root.children[2]).some(n=>typeof n.textContent==='string' && /Podwale|Grodzkie/.test(n.textContent)));
});

test('#256: currency exchange is a short action, map links hidden behind a hint', () => {
  const seen = [];
  const root=render('be',msg=>seen.push(msg));
  const nodes=walk(root.children[1]);
  const tip=nodes.find(n=>n.className === 'food-key-tip');
  assert.match(tip.textContent,/kupno|«kupno»/);
  assert.ok(tip.textContent.length < 85);
  assert.equal(nodes.filter(n=>n.className === 'food-mini-link').length,2);
  assert.ok(nodes.some(n=>n.dataset.key==='official:nbpRates'));
  assert.ok(nodes.some(n=>n.dataset.key==='official:kantorCompare'));
  const hint=nodes.find(n=>n.className==='food-hint-trigger' &&
    n.children[1].textContent.includes('3 пункты'));
  assert.ok(hint);
  const panel=nodes.find(n=>n.id===hint.getAttribute('aria-controls'));
  assert.ok(panel?.hidden);
  hint.click();
  assert.equal(panel.hidden,false);
  const buttons=walk(panel).filter(n=>n.className==='food-brand');
  assert.equal(buttons.length,3);
  for (const tile of buttons) tile.click();
  assert.equal(seen.length,3);
  for (const key of ['mapPromes','mapManhattan','mapExchange'])
    assert.ok(seen.some(s=>s.includes(LINKS[key])),key);
  assert.ok(!nodes.some(n => typeof n.textContent==='string' && /Kaletnicza|Grunwaldzka|Targ Sienny/.test(n.textContent)));
});

test('#256: no generic warning that cards do not work in Gdańsk', () => {
  const root=render('be');
  const nodes=walk(root.children[0]);
  assert.ok(nodes.some(n=>n.textContent==='Картка ці тэлефон'));
  assert.ok(nodes.some(n=>n.textContent==='Злоты (PLN)'));
  assert.ok(!nodes.some(n=>typeof n.textContent==='string' &&
    /карткі не прымаюць|невялікі запас наяўных/i.test(n.textContent)));
  assert.equal(nodes.filter(n=>n.className==='food-hint-trigger').length,1,
    'only useful conversion details remain; no BLIK explanation');
  assert.ok(!nodes.some((n) => typeof n.textContent === 'string' &&
    /Кодам BLIK можна плаціць|Use a BLIK code/.test(n.textContent)));
});

test('#256: light and dark preview hints keep unique ARIA references', () => {
  const left=render('be'),right=render('be');
  const nodes=[...walk(left),...walk(right)];
  const hints=nodes.filter(n=>n.className==='food-hint-trigger');
  const ids=hints.map(n=>n.getAttribute('aria-controls'));
  assert.equal(new Set(ids).size,ids.length);
  for(const h of hints) {
    const target=nodes.find(n=>n.id===h.getAttribute('aria-controls'));
    assert.ok(target && target.hidden);
    h.click();
    assert.equal(target.hidden,false);
  }
});



test('#256: owner-review evidence exists and does not claim shipping approval', () => {
  const sources = readFileSync(new URL('../docs/content/about-city-sources.md', import.meta.url), 'utf8');
  const results = readFileSync(new URL('../docs/agent-tasks/results/256.md', import.meta.url), 'utf8');
  const board = readFileSync(new URL('../docs/design/production/about.html', import.meta.url), 'utf8');
  assert.match(sources, /### Праверка #256/);
  assert.match(sources, /KFC Gdańsk PKP/);
  assert.match(sources, /2026-11-25/);
  assert.match(results, /## 2\. Табліца рашэнняў/);
  assert.match(results, /## 3\. Адказы на пытанні задачы/);
  assert.match(results, /уладальнік даручыў стварыць PR|давай ПР/);
  assert.ok(board.includes('Усе чатыры згортванні раздзела «Ежа і аплата»'));
  assert.ok(!board.includes('Усе пяць падраздзелаў спачатку'));
});

test('#256: brand-asset inventory names what both components actually render', () => {
  const nativeSource = readFileSync(new URL('../components/about-city-food.tsx', import.meta.url), 'utf8');
  const vectorEntries = readFileSync(new URL('../components/about-city-food-brands.ts', import.meta.url), 'utf8');
  const sources = readFileSync(new URL('../docs/content/about-city-sources.md', import.meta.url), 'utf8');
  const inventory = sources.match(/\*\*Актывы і брэнды\.\*\*[^\n]*/)?.[0];
  assert.ok(inventory, 'the asset inventory paragraph exists');

  // Native truth: tile(title, logo) call sites; logo keys of FOOD_BRAND_PATHS render SVG.
  const paths = new Set([...vectorEntries.matchAll(/^ {2}(\w+):\s*\{/gm)].map((m) => m[1]));
  const nativeTitle = new Map();
  for (const call of nativeSource.match(/tile\("([^"]+)", "([^"]+)", "([^"]+)"/g) ?? []) {
    const [, , title, logo] = call.match(/tile\("([^"]+)", "([^"]+)", "([^"]+)"/);
    if (logo !== 'map') nativeTitle.set(logo, title);
  }

  // Rendered HTML truth: img badges are bundled SVGs, food-wordmark spans are text marks.
  const htmlSvg = new Map();
  const htmlText = new Map();
  for (const node of walk(render('be'))) {
    if (node.className !== 'food-brand-art') continue;
    const badge = node.children[0];
    if (badge.tag === 'img' && typeof badge.src === 'string') htmlSvg.set(badge.src.replace('food-logos/', '').replace('.svg', ''), true);
    const wordmark = String(badge.className ?? '').split(' ').find((c) => c.startsWith('food-wordmark-'));
    if (wordmark) htmlText.set(wordmark.slice('food-wordmark-'.length), true);
  }

  assert.deepEqual([...htmlSvg.keys()].sort(), [...nativeTitle.keys()].filter((l) => paths.has(l)).sort(),
    'HTML and native bundle the same SVG brands');
  assert.deepEqual([...htmlText.keys()].sort(), [...nativeTitle.keys()].filter((l) => !paths.has(l)).sort(),
    'HTML and native mark the same brands as text');
  for (const mark of htmlSvg.keys()) {
    assert.ok(existsSync(new URL('../docs/design/production/food-logos/' + mark + '.svg', import.meta.url)),
      mark + ' ships a bundled SVG file');
  }
  // Attribution split: the clause before ';' names the vector brands, the one
  // after names the text marks. Moving a title across the split while keeping
  // all names present must fail, not only dropping a name entirely.
  const [vectorClause, textClause] = inventory.split(';');
  assert.ok(vectorClause && textClause, 'inventory separates vector and text attribution with ;');
  for (const [logo, title] of nativeTitle) {
    const clause = paths.has(logo) ? vectorClause : textClause;
    assert.ok(clause.includes(title),
      'inventory attributes the ' + (paths.has(logo) ? 'vector' : 'text') + ' mark ' + logo + ' (' + title + ') in its own clause');
  }
  assert.ok(!inventory.includes('Just Eat'), 'inventory does not claim a Just Eat SVG for Pyszne.pl');
});

test('#256: named station and office Maps searches include verified address disambiguation', () => {
  const cases = [
    ['mapMcd', 'Podwale Grodzkie 2'],
    ['mapKfc', 'Podwale Grodzkie 2c'],
    ['mapPromes', 'Targ Sienny 7'],
    ['mapManhattan', 'Grunwaldzka 92'],
    ['mapExchange', 'Kaletnicza 10/13'],
  ];
  for (const [key, address] of cases) {
    const url = new URL(LINKS[key]);
    assert.equal(url.host, 'www.google.com');
    assert.equal(url.pathname, '/maps/search/');
    assert.ok(url.searchParams.get('query').includes(address),
      key + ' navigates to a specific place, not a random branch');
  }
});

test('#256: no visible scroll chrome, canonical theming remains', () => {
  const html=readFileSync(new URL('../docs/design/production/about.html',import.meta.url),'utf8');
  const kit=readFileSync(new URL('../docs/design/production/kit.css',import.meta.url),'utf8');
  assert.match(html,/\.page\.scroll\s*\{[^}]*scrollbar-width:\s*none/);
  assert.match(kit,/\.scroll\s*\{[^}]*overflow:\s*auto/);
  assert.match(html, /\.food-brand\s*\{[^}]*var\(--card\)/);
  assert.equal(translator('be')('tab.food'),translator('be')('head.food'));
});

test('#256: station scope and optional BLIK explanation are localized correctly', () => {
  for (const [locale, station] of [['be', 'Галоўны вакзал'], ['en', 'Main station']]) {
    const root = render(locale);
    const grid = walk(root.children[2]).find(n => n.className === 'food-brand-grid');
    for (const brand of grid.children.slice(0, 2)) {
      const note = walk(brand).find(n => n.className === 'food-brand-note');
      assert.ok(note?.textContent.startsWith(station + '\n'),
        'the station is visible on each chain card, not only in a general hint');
      assert.ok(brand.getAttribute('aria-label').includes(station),
        'screen readers hear station-specific scope');
    }
    const payment = walk(root.children[0]);
    assert.ok(payment.some(n => n.textContent === 'BLIK'), 'BLIK remains a short fact');
    assert.equal(payment.filter(n => n.className === 'food-hint-trigger').length, 1);
    const source = readFileSync(new URL('../docs/design/production/about-256-content.mjs', import.meta.url), 'utf8');
    assert.ok(!source.includes('food.pay.blik.hint'),
      'the unused BLIK explanation was removed from both localizations');
  }
  const html = readFileSync(new URL('../docs/design/production/about.html', import.meta.url), 'utf8');
  assert.match(html, /\.food-brand-note\s*\{[^}]*white-space:\s*pre-line/);
});

test('#256: all food.v2 canonical words are anchored to their generated native keys', () => {
  const data = JSON.parse(readFileSync(new URL('../contracts/ui-messages/source.json', import.meta.url), 'utf8'));
  const records = data.records.filter((record) => record.id.startsWith('native.aboutCity.food.v2.'));
  assert.equal(records.length, 26);
  for (const record of records) {
    const key = record.id.slice('native.aboutCity.'.length);
    assert.deepEqual(record.migratedFrom, ['components/about-city-strings.generated.ts#' + key]);
  }
});
