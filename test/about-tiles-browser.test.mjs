// Issue #333 — the transport app tiles of «Пра горад» are native buttons, so
// a keyboard visitor can focus a tile and activate it with Enter or Space,
// and a pointer press keeps the same action. Both production variants of the
// screen (about.html and about-257.html) mount the shared transport() of
// about-screen.mjs, so both paths go through the same check.
import test from 'node:test';
import assert from 'node:assert/strict';

import { browserOrSkip, serve } from './browser-page.mjs';

test('the transport tiles of «Пра горад» answer the keyboard as well as the pointer', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });

  for (const file of ['about.html', 'about-257.html']) {
    await t.test(`${file}: a tile activates from the keyboard and by pointer`, async () => {
      const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
      t.after(() => page.close());
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/production/${file}`);
      await page.waitForSelector('.phone .wheel');
      const phone = page.locator('.phone[data-theme="light"]');
      const status = page.locator('.board .event');

      await page.selectOption('#section', 'transport');
      await phone.locator('.page .g-head').waitFor();

      const tiles = phone.locator('.tile');
      assert.equal(await tiles.count(), 3);
      for (const [index, domain] of [[0, 'jakdojade.pl'], [1, 'systemfala.pl'], [2, 'skm.pkp.pl']]) {
        assert.equal(await tiles.nth(index).evaluate((node) => node.tagName), 'BUTTON', `${domain}: the tile is a native button`);
        assert.equal(await tiles.nth(index).getAttribute('role'), 'link', `${domain}: the tile is announced as a link`);
      }

      // Enter and Space activate the focused tile like a pointer press would.
      await tiles.nth(0).focus();
      await page.keyboard.press('Enter');
      assert.match(await status.textContent(), /jakdojade\.pl/);
      await tiles.nth(1).focus();
      await page.keyboard.press(' ');
      assert.match(await status.textContent(), /systemfala\.pl/);
      await tiles.nth(2).click();
      assert.match(await status.textContent(), /skm\.pkp\.pl/);
      assert.deepEqual(errors, []);
    });
  }
});
