import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseCatalog, statusKind } from '../docs/design/catalog-data.mjs';

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
