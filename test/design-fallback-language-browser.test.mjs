import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOrSkip, serve } from './browser-page.mjs';

test('Walk menu marks fallback button text in English without overriding a local draft', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(1500);
  t.after(() => page.close());
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/production/run.html`);

  for (const [locale, expectedLanguage, menuLabel, guideLabel] of [
    ['nb', 'en', 'Walk menu', 'Change guide'],
    ['be', null, 'Меню прагулкі', 'Змяніць гіда'],
  ]) {
    await page.selectOption('#locale', locale);
    await page.waitForFunction((code) => [...document.querySelectorAll('.phone')]
      .length === 2 && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === code), locale);
    await page.waitForFunction((label) => document.querySelector('.phone[data-theme="light"] [data-k="menu"]')
      ?.getAttribute('aria-label') === label, menuLabel);
    await page.locator('.phone[data-theme="light"] .run-dock [data-k="menu"]').evaluate((button) => button.click());
    const changeGuide = page.locator('.phone[data-theme="light"] .run-menu .btn').nth(2);
    await changeGuide.waitFor();
    assert.equal((await changeGuide.textContent()).trim(), guideLabel, `${locale}: target button text`);
    assert.equal(await changeGuide.getAttribute('lang'), expectedLanguage, `${locale}: Change guide language metadata`);
    await page.locator('.phone[data-theme="light"] .run-menu-head .iconbtn').evaluate((button) => button.click());
  }
});
