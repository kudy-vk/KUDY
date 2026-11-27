import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOrSkip, serve } from './browser-page.mjs';

test('Guides screen does not render a false status when every group is shown', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
  t.after(() => page.close());

  await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/production/settings.html`);
  await page.selectOption('#locale', 'nb');
  await page.selectOption('#view', 'guides');

  const phone = page.locator('.phone[data-theme="light"]');
  await phone.locator('.hide-status').waitFor();
  assert.equal((await phone.locator('.hide-status').textContent()).trim(), 'Show everything');
  const strayText = await phone.locator('.pad').evaluate((pad) => [...pad.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .filter(Boolean));
  assert.deepEqual(strayText, [], 'empty reset-button condition is not rendered as text');

  await phone.locator('.chips[role="group"] .chip').first().click();
  await page.waitForFunction(() => document.querySelector('.phone[data-theme="light"] .hide-status')
    ?.textContent.trim() === 'Hidden groups: 1');
  assert.equal(await phone.locator('.pad .btn').count(), 1, 'reset appears when a group is hidden');
});
