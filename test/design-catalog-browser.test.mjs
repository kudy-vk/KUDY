// Issue #481 (T03) — the design catalog link restores the chosen view. A real
// Chromium drives the canonical gallery (docs/design/catalog.html), which reads
// its registry from catalog.md: picking a second tab rewrites the fragment,
// reload and a fresh browser context open the same view, old, stale and corrupt
// fragments fall back safely, and reordering a row's links does not move an
// already-created link.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { browserOrSkip, serve } from './browser-page.mjs';
import { fragmentOf, parseCatalog } from '../docs/design/catalog-data.mjs';

const here = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'design');
const pairs = parseCatalog(fs.readFileSync(path.join(here, 'catalog.md'), 'utf8'))
  .flatMap((section) => section.items.map((item) => ({ section, item })));
const guides = pairs.find(({ item }) => item.title === 'Гіды');
const firstViewable = pairs.find(({ item }) => item.views.length > 0);
const GUIDES_SECOND = guides.item.views[1].href;
const IMAGE_PAIR = pairs.find(({ item }) => item.title.startsWith('app-entry-2026-10-19'));
const IMAGE_SECOND = IMAGE_PAIR.item.views[1].href;

test('the canonical catalog link restores the chosen view', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/docs/design/catalog.html`;
  const errors = [];
  const newPage = async () => {
    const page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    return page;
  };

  await t.test('a second tab of an HTML item survives reload and a fresh context', async () => {
    const page = await newPage();
    await page.goto(base);
    await page.locator('#list .item', { hasText: /^Гіды/ }).click();
    await page.waitForSelector('#stage iframe');
    await page.locator('#meta .tab', { hasText: 'Паліроўка' }).click();
    assert.equal(await page.locator('#stage iframe').getAttribute('src'), GUIDES_SECOND);
    assert.match(page.url(), /#v2\//, 'the fragment is versioned');
    assert.match(page.url(), new RegExp(encodeURIComponent(GUIDES_SECOND)), 'the fragment carries the registered key');
    const link = page.url();
    await page.reload();
    await page.waitForSelector('#stage iframe');
    assert.equal(await page.locator('#stage iframe').getAttribute('src'), GUIDES_SECOND);
    const fresh = await newPage();
    await fresh.goto(link);
    await fresh.waitForSelector('#stage iframe');
    assert.equal(await fresh.locator('#stage iframe').getAttribute('src'), GUIDES_SECOND);
    await fresh.close();
    await page.close();
  });

  await t.test('a second tab of an image item survives reload and a fresh context', async () => {
    const page = await newPage();
    await page.goto(base);
    await page.locator('#list .item', { hasText: /^app-entry-2026-10-19/ }).click();
    await page.waitForSelector('#stage img');
    await page.locator('#meta .tab', { hasText: 'варыянты' }).click();
    assert.equal(await page.locator('#stage img').getAttribute('src'), IMAGE_SECOND);
    const link = page.url();
    await page.reload();
    await page.waitForSelector('#stage img');
    assert.equal(await page.locator('#stage img').getAttribute('src'), IMAGE_SECOND);
    const fresh = await newPage();
    await fresh.goto(link);
    await fresh.waitForSelector('#stage img');
    assert.equal(await fresh.locator('#stage img').getAttribute('src'), IMAGE_SECOND);
    await fresh.close();
    await page.close();
  });

  await t.test('an old item-only fragment and a stale view key open the first view', async () => {
    const key = `${guides.section.title}/Гіды`;
    for (const fragment of [encodeURIComponent(key), fragmentOf(key, 'production/gone.html')]) {
      const page = await newPage();
      await page.goto(`${base}#${fragment}`);
      await page.waitForSelector('#stage iframe');
      assert.equal(await page.locator('#stage iframe').getAttribute('src'), guides.item.views[0].href, fragment);
      await page.close();
    }
  });

  await t.test('a corrupt or unknown-item fragment opens the default first viewable item', async () => {
    for (const fragment of ['%', fragmentOf('screen-that-does-not-exist', GUIDES_SECOND), 'v2/%/x']) {
      const page = await newPage();
      await page.goto(`${base}#${fragment}`);
      await page.waitForSelector('#stage iframe, #stage img');
      const current = await page.locator('#list .item[aria-current="true"] .name').textContent();
      assert.equal(current, firstViewable.item.title, fragment);
      const source = await page.locator('#stage iframe, #stage img').first().getAttribute('src');
      assert.equal(source, firstViewable.item.views[0].href, fragment);
      await page.close();
    }
  });

  await t.test('reordering a row does not move an already-created link', async () => {
    const real = fs.readFileSync(path.join(here, 'catalog.md'), 'utf8');
    const swapped = real.replace(
      '[Фінальны макет](production/guides.html), [Паліроўка](production/guides-polish.html), [Каталог гідаў](brand/outputs/GUIDES-catalog/prototype.html)',
      '[Фінальны макет](production/guides.html), [Каталог гідаў](brand/outputs/GUIDES-catalog/prototype.html), [Паліроўка](production/guides-polish.html)',
    );
    assert.notEqual(swapped, real, 'the guides row of catalog.md was found');
    const page = await newPage();
    await page.goto(base);
    await page.locator('#list .item', { hasText: /^Гіды/ }).click();
    await page.locator('#meta .tab', { hasText: 'Паліроўка' }).click();
    await page.waitForSelector('#stage iframe');
    await page.route('**/catalog.md', (route) => route.fulfill({ body: swapped, contentType: 'text/markdown' }));
    await page.reload();
    await page.waitForSelector('#stage iframe');
    assert.equal(await page.locator('#stage iframe').getAttribute('src'), GUIDES_SECOND, 'the link target stayed');
    assert.equal(await page.locator('#meta .tab[aria-pressed="true"]').textContent(), 'Паліроўка', 'the label travels with its view');
    await page.close();
  });

  assert.deepEqual(errors, [], 'no page errors while driving the catalog');
});
