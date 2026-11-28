import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { fragmentOf, parseCatalog, parseFragment, statusKind, viewIndexOf } from '../docs/design/catalog-data.mjs';

// The catalogue and the gallery parser live in docs/design; links in the catalogue resolve from there.
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'design');

const FIXTURE = `# Title

## 1. Docs

| Дакумент | Статус |
|---|---|
| [Canon](canon.md) | Прынята |

## 2. Экраны

| Экран | У дадатку | Апошні макет | Статус макета | Адкрыта |
|---|---|---|---|---|
| Гіды | [app/city/[id]/guides.tsx](../../app/city/%5Bid%5D/guides.tsx) | [Каталог](a/prototype.html), [аркуш](a/sheet.png) | Прапанова | Фільтры ([#1](https://github.com/o/r/issues/1)) |
| Месца | — | Няма макета | — | — |
| Злы | — | [x](javascript:alert(1)) [y](//evil.example/a.html) [z](http://evil.example/a.html) | Часткова: частка | — |
`;

test('a table without anything to look at is not a gallery section', () => {
  const sections = parseCatalog(FIXTURE);
  assert.deepEqual(sections.map((section) => section.title), ['Экраны']);
});

test('a row yields its title, status, viewable mockups and issue links', () => {
  const [guides] = parseCatalog(FIXTURE)[0].items;
  assert.equal(guides.title, 'Гіды');
  assert.equal(guides.status, 'Прапанова');
  assert.equal(guides.kind, 'proposal');
  assert.deepEqual(guides.views, [
    { label: 'Каталог', href: 'a/prototype.html' },
    { label: 'аркуш', href: 'a/sheet.png' },
  ]);
  assert.deepEqual(guides.links, [{ label: '#1', href: 'https://github.com/o/r/issues/1' }]);
  assert.deepEqual(guides.notes.map((note) => note.name), ['У дадатку', 'Апошні макет', 'Адкрыта']);
});

test('a row without a mockup stays in the list with no views', () => {
  const place = parseCatalog(FIXTURE)[0].items[1];
  assert.equal(place.title, 'Месца');
  assert.deepEqual(place.views, []);
  assert.equal(place.kind, 'other');
});

test('script, protocol-relative and plain-http targets never become a view or a link', () => {
  const evil = parseCatalog(FIXTURE)[0].items[2];
  assert.deepEqual(evil.views, []);
  assert.deepEqual(evil.links, []);
  assert.equal(evil.kind, 'partial');
});

test('status kinds follow the leading word', () => {
  assert.equal(statusKind('Прынята 2026-10-28'), 'accepted');
  assert.equal(statusKind('Часткова: K1–K3'), 'partial');
  assert.equal(statusKind('Прапанова (B04.1)'), 'proposal');
  assert.equal(statusKind('Гісторыя: адхілена'), 'other');
  assert.equal(statusKind(''), 'other');
});

test('the real catalogue: every section the gallery shows has mockups that exist on disk', () => {
  const sections = parseCatalog(fs.readFileSync(path.join(here, 'catalog.md'), 'utf8'));
  assert.deepEqual(
    sections.map((section) => section.title),
    ['Экраны', 'Агульныя дэталі', 'Папкі з матэрыяламі'],
  );
  for (const section of sections) {
    for (const item of section.items) {
      assert.notEqual(item.title, '', `empty title in «${section.title}»`);
      for (const view of item.views) {
        const file = path.join(here, decodeURIComponent(view.href.split('#')[0]));
        assert.ok(fs.existsSync(file), `«${item.title}»: ${view.href} does not exist`);
      }
    }
  }
});

test('single canonical HTML catalog: every production HTML mockup and test is registered', () => {
  const html = fs.readFileSync(path.join(here, 'catalog.html'), 'utf8');
  assert.match(html, /fetch\('catalog\.md'\)/);
  assert.doesNotMatch(html, /catalog-\d+\.md/);
  const alternativeCatalogs = fs.readdirSync(here)
    .filter((name) => /^catalog-(?!data\.)[^/]+\.(?:html|md)$/.test(name));
  assert.deepEqual(alternativeCatalogs, [], 'Parallel design catalogs are forbidden');
  const sections = parseCatalog(fs.readFileSync(path.join(here, 'catalog.md'), 'utf8'));
  const views = new Set(sections.flatMap((section) => section.items.flatMap((item) => item.views.map((view) => view.href))));
  const production = path.join(here, 'production');
  const screens = fs.readdirSync(production).filter((name) => name.endsWith('.html'));
  for (const name of screens) {
    assert(views.has(`production/${name}`), `Unregistered HTML mockup/test: production/${name}`);
  }
  assert(views.has('production/about.html'), 'The approved About City baseline must remain in the catalog');
});

const catalogItem = (title) => parseCatalog(fs.readFileSync(path.join(here, 'catalog.md'), 'utf8'))
  .flatMap((section) => section.items.map((item) => ({ section, item })))
  .find(({ item }) => item.title === title);

test('the fragment round-trips the chosen tab of a multi-tab HTML item and of an image item', () => {
  for (const title of ['Гіды', 'app-entry-2026-10-19, варыянты, апісанне']) {
    const pair = catalogItem(title);
    assert.ok(pair, `${title} is registered with mockups`);
    assert.ok(pair.item.views.length >= 2, `${title} has several tabs`);
    for (const view of pair.item.views) {
      const key = `${pair.section.title}/${pair.item.title}`;
      assert.deepEqual(parseFragment(fragmentOf(key, view.href)), { item: key, view: view.href });
      assert.equal(viewIndexOf(pair.item, view.href), pair.item.views.indexOf(view));
    }
  }
});

test('an old item-only fragment and a stale view key keep the item at its first view', () => {
  const pair = catalogItem('Гіды');
  const key = `${pair.section.title}/${pair.item.title}`;
  assert.deepEqual(parseFragment(encodeURIComponent(key)), { item: key, view: null });
  const stale = parseFragment(fragmentOf(key, 'production/gone.html'));
  assert.deepEqual(stale, { item: key, view: 'production/gone.html' });
  assert.equal(viewIndexOf(pair.item, stale.view), 0, 'a stale tab opens the first view');
});

test('an undecodable fragment reports a reset instead of throwing', () => {
  assert.equal(parseFragment('%'), null);
  assert.equal(parseFragment('v2/%/production%2Fguides.html'), null);
  assert.equal(parseFragment(`${encodeURIComponent('Экраны/Гіды')}%`), null);
  assert.equal(parseFragment('v2/%D0%AD%D0%BA%D1%80%D0%B0%D0%BD%D1%8B%2F%D0%93%D1%96%D0%B4%D1%8B/%'), null);
});

test('reordering tabs does not move a created link: the view is matched by its href', () => {
  const pair = catalogItem('Гіды');
  const [first, second] = pair.item.views;
  const reordered = { views: [second, first] };
  assert.equal(viewIndexOf(reordered, second.href), 0, 'the link still names the same view');
  assert.equal(viewIndexOf(reordered, first.href), 1);
  assert.equal(fragmentOf('k', second.href), `v2/${encodeURIComponent('k')}/${encodeURIComponent(second.href)}`);
});
