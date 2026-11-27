// Acceptance checks for issue #479: mockup locales, draft fallbacks and frame availability.
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOrSkip, serve } from './browser-page.mjs';

const LOCALES = ['nb', 'pl', 'da', 'nl', 'pt'];
const MOCKUPS = '/docs/design/production/';

async function openPage(browser, server, file) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(1500);
  await page.goto(`http://127.0.0.1:${server.address().port}${MOCKUPS}${file}`);
  return page;
}

async function selectLocale(page, locale) {
  await page.selectOption('#locale', locale);
  await page.waitForFunction((code) => {
    const failed = document.querySelector('.board .event')?.textContent?.includes('Не ўдалося паказаць экран');
    const frames = [...document.querySelectorAll('.phone')];
    return failed || (frames.length === 2 && frames.every((frame) => frame.lang === code));
  }, locale, { timeout: 1500 });
  assert.doesNotMatch(await page.locator('.board .event').textContent(), /Не ўдалося паказаць экран/, `${locale}: the screen renders`);
}

test('issue #479: critical mockup locales, fallback strings and narrow frames', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  await t.test('the five switch locales open Settings, Guides and photo cards in both themes', async (locales) => {
    for (const locale of LOCALES) {
      await locales.test(locale, async (subtest) => {
        const page = await openPage(browser, server, 'settings.html');
        subtest.after(() => page.close());
        await selectLocale(page, locale);
        for (const theme of ['light', 'dark']) {
          const title = page.locator(`.phone[data-theme="${theme}"] .topbar .title`);
          assert.ok((await title.textContent()).trim(), `${locale} ${theme}: Settings is open`);
        }
        const settingsTitles = await page.locator('.phone .topbar .title').allTextContents();
        await page.selectOption('#view', 'guides');
        await page.waitForFunction((previous) => [...document.querySelectorAll('.phone .topbar .title')]
          .every((title, index) => title.textContent.trim() && title.textContent.trim() !== previous[index]), settingsTitles);
        for (const theme of ['light', 'dark']) {
          const title = page.locator(`.phone[data-theme="${theme}"] .topbar .title`);
          assert.ok((await title.textContent()).trim(), `${locale} ${theme}: Guides is open`);
        }
        await page.goto(`http://127.0.0.1:${server.address().port}${MOCKUPS}run.html`);
        await selectLocale(page, locale);
        await page.selectOption('#panel', 'half');
        for (const theme of ['light', 'dark']) {
          const photos = page.locator(`.phone[data-theme="${theme}"] .run-photos .run-photo`);
          await photos.first().waitFor();
          assert.ok(await photos.count() > 0, `${locale} ${theme}: the open card has photos`);
        }
      });
    }
  });

  await t.test('fallback count and photo labels are filled; the board identifies and clears fallback status', async (locales) => {
    for (const locale of ['nb', 'be', 'en']) {
      await locales.test(locale, async (subtest) => {
        const page = await openPage(browser, server, 'settings.html');
        subtest.after(() => page.close());
        await selectLocale(page, locale);
        const boardText = () => page.locator('.board').innerText();
        if (locale === 'nb') {
          await page.waitForFunction(() => /Draft text:\s*English/i.test(document.querySelector('.board')?.innerText ?? ''));
          assert.match(await boardText(), /Draft text:\s*English/i);
        }
        else assert.doesNotMatch(await boardText(), /Draft text:\s*English/i, `${locale}: no fallback is needed`);
        await page.selectOption('#view', 'guides');
        await page.locator('.phone[data-theme="light"] [data-key="tag-belarus"]').click();
        const count = page.locator('.phone[data-theme="light"] .hide-status');
        await page.waitForFunction(() => /1/.test(document.querySelector('.phone[data-theme="light"] .hide-status')?.textContent ?? ''));
        assert.match(await count.textContent(), /1/, `${locale}: the hidden group count is substituted`);
        assert.doesNotMatch(await count.textContent(), /undefined|\$\{n\}/);
        if (locale === 'be') assert.match(await count.textContent(), /Схавана груп: 1/);
        if (locale === 'en') assert.match(await count.textContent(), /Hidden groups: 1/);

        await page.goto(`http://127.0.0.1:${server.address().port}${MOCKUPS}run.html`);
        await selectLocale(page, locale);
        if (locale === 'nb') {
          await page.waitForFunction(() => /Draft text:\s*English/i.test(document.querySelector('.board')?.innerText ?? ''));
          assert.match(await boardText(), /Draft text:\s*English/i);
        }
        else assert.doesNotMatch(await boardText(), /Draft text:\s*English/i);
        await page.selectOption('#panel', 'half');
        await page.locator('.phone[data-theme="light"] .run-photo').first().click();
        const photo = page.locator('.phone[data-theme="light"] .run-large[role="img"]');
        await page.waitForFunction(() => /(?:Photo|Фота)\s+1\s+(?:of|з)\s+3/i.test(document.querySelector('.phone[data-theme="light"] .run-large[role="img"]')?.getAttribute('aria-label') ?? ''));
        const label = await photo.getAttribute('aria-label');
        assert.match(label, /(?:Photo|Фота)\s+1\s+(?:of|з)\s+3/i, `${locale}: photo index and total are substituted`);
        assert.doesNotMatch(label, /undefined|\{(?:n|total)\}/);
      });
    }
  });

  await t.test('primary controls fit the 320×640 frame at ×1.5 text scale', async (frames) => {
    for (const file of ['settings.html', 'run.html']) {
      await frames.test(file, async (subtest) => {
        const page = await openPage(browser, server, file);
        subtest.after(() => page.close());
        await selectLocale(page, 'nb');
        await page.selectOption('#device', '320x640');
        await page.selectOption('#scale', '1.5');
        await page.waitForFunction(() => {
          const phone = document.querySelector('.phone[data-theme="light"]');
          return phone?.style.getPropertyValue('--w') === '320px' && phone.style.getPropertyValue('--fs') === '1.5';
        });
        const primary = file === 'settings.html'
          ? page.locator('.phone[data-theme="light"] .topbar .title')
          : page.locator('.phone[data-theme="light"] .run-card .run-title');
        assert.ok(await primary.isVisible());
        const { item, phone } = await primary.evaluate((node) => ({
          item: node.getBoundingClientRect(), phone: node.closest('.phone').getBoundingClientRect(),
        }));
        assert.ok(item.left >= phone.left && item.right <= phone.right, `${file}: control fits the width`);
        assert.ok(item.top >= phone.top && item.bottom <= phone.bottom, `${file}: control fits the height`);
      });
    }
  });
});
