// Acceptance checks for issue #479 (T01): critical mockup locales must keep
// Settings and Walk usable, interpolate their draft strings, mark fallbacks,
// fit the narrow large-text frame.
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOrSkip, serve } from './browser-page.mjs';

const LOCALES = ['nb', 'pl', 'da', 'nl', 'pt'];
const MOCKUPS = '/docs/design/production/';

async function startPage(browser, server, file, viewport = { width: 1000, height: 2200 }) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  page.setDefaultTimeout(1500);
  await page.goto(`http://127.0.0.1:${server.address().port}${MOCKUPS}${file}`);
  return page;
}

async function chooseLocale(page, locale) {
  await page.selectOption('#locale', locale);
  await page.waitForFunction((code) => {
    const failed = document.querySelector('.board .event')?.textContent?.includes('Не ўдалося паказаць экран');
    const frames = [...document.querySelectorAll('.phone')];
    return failed || (frames.length === 2 && frames.every((frame) => frame.lang === code));
  }, locale, { timeout: 1500 });
  assert.doesNotMatch(await page.locator('.board .event').textContent(), /Не ўдалося паказаць экран/, `${locale}: contract rows load and the screen renders`);
}

test('issue #479: the five switch locales open Settings, Guides and a photo card in both themes', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  for (const locale of LOCALES) {
    await t.test(`${locale}: Settings and Guides render in both themes`, async (subtest) => {
      const page = await startPage(browser, server, 'settings.html');
      subtest.after(() => page.close());
      await chooseLocale(page, locale);
      for (const theme of ['light', 'dark']) {
        const phone = page.locator(`.phone[data-theme="${theme}"]`);
        assert.ok((await phone.locator('.topbar .title').textContent()).trim(), `${theme}: Settings title is present`);
      }

      await page.selectOption('#view', 'guides');
      for (const theme of ['light', 'dark']) {
        const phone = page.locator(`.phone[data-theme="${theme}"]`);
        assert.ok((await phone.locator('.topbar .title').textContent()).trim(), `${theme}: Guides title is present`);
      }
    });

    await t.test(`${locale}: Walk opens the photo card in both themes`, async (subtest) => {
      const page = await startPage(browser, server, 'run.html');
      subtest.after(() => page.close());
      await chooseLocale(page, locale);
      await page.selectOption('#panel', 'half');
      for (const theme of ['light', 'dark']) {
        const phone = page.locator(`.phone[data-theme="${theme}"]`);
        const photos = phone.locator('.run-photos .run-photo');
        await photos.first().waitFor({ timeout: 1500 });
        assert.ok(await photos.count() > 0, `${theme}: the open card contains photos`);
      }
    });
  }
});

test('issue #479: fallback draft placeholders are filled and be/en rows remain available', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  for (const locale of ['nb', 'be', 'en']) {
    await t.test(`${locale}: hidden-group count and photo number placeholders render`, async (subtest) => {
      const settings = await startPage(browser, server, 'settings.html');
      subtest.after(() => settings.close());
      await chooseLocale(settings, locale);
      await settings.selectOption('#view', 'guides');
      await settings.locator('.phone[data-theme="light"] [data-key="tag-belarus"]').click();
      const hiddenCount = settings.locator('.phone[data-theme="light"] .hide-status');
      await hiddenCount.waitFor({ timeout: 1500 });
      assert.match(await hiddenCount.textContent(), /1/, `${locale}: one hidden group is counted`);
      assert.doesNotMatch(await hiddenCount.textContent(), /undefined|\$\{n\}/, `${locale}: count placeholder is filled`);
      const walk = await startPage(browser, server, 'run.html');
      subtest.after(() => walk.close());
      await chooseLocale(walk, locale);
      await walk.selectOption('#panel', 'half');
      await walk.locator('.phone[data-theme="light"] .run-photo').first().click();
      const photo = walk.locator('.phone[data-theme="light"] .run-large[role="img"]');
      await photo.waitFor({ timeout: 1500 });
      assert.match(await photo.getAttribute('aria-label'), /(?:Photo|Фота)\s+1\s+(?:of|з)\s+3/i, `${locale}: number and total placeholders are filled`);
      assert.doesNotMatch(await photo.getAttribute('aria-label'), /undefined|\{(?:n|total)\}/, `${locale}: photo label is complete`);
    });
  }
});

test('issue #479: fallback status is visible only while a local draft row uses a fallback', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  for (const file of ['settings.html', 'run.html']) {
    const page = await startPage(browser, server, file);
    t.after(() => page.close());
    await chooseLocale(page, 'nb');
    assert.match(await page.locator('.board').innerText(), /Draft text:\s*English/i, `${file}: board identifies the English fallback`);

    for (const locale of ['be', 'en']) {
      await chooseLocale(page, locale);
      assert.doesNotMatch(await page.locator('.board').innerText(), /Draft text:\s*English/i, `${file}: marker clears for ${locale}`);
    }
  }
});

test('issue #479: primary controls remain available at 320×640 and ×1.5 text', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  for (const file of ['settings.html', 'run.html']) {
    await t.test(file, async (subtest) => {
      const page = await startPage(browser, server, file);
      subtest.after(() => page.close());
      await chooseLocale(page, 'nb');
      await page.selectOption('#device', '320x640');
      await page.selectOption('#scale', '1.5');
      const primary = file === 'settings.html'
        ? page.locator('.phone[data-theme="light"] .topbar .title')
        : page.locator('.phone[data-theme="light"] .run-card .run-title');
      await primary.waitFor({ timeout: 1500 });
      assert.ok(await primary.isVisible(), `${file}: primary screen control is visible`);
      const bounds = await primary.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const phone = node.closest('.phone').getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, phone };
      });
      assert.ok(bounds.left >= bounds.phone.left && bounds.right <= bounds.phone.right, `${file}: control fits the phone width`);
      assert.ok(bounds.top >= bounds.phone.top && bounds.bottom <= bounds.phone.bottom, `${file}: control fits the phone height`);
    });
  }
});
