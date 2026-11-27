import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOrSkip, serve } from './browser-page.mjs';

async function openMockupPage(t) {
  const chromium = await browserOrSkip(t);
  if (!chromium) return null;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(() => server.close());
  t.after(() => browser.close());

  const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(1500);
  t.after(() => page.close());
  return { page, port: server.address().port };
}

test('Walk menu marks fallback button text in English without overriding a local draft', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/run.html`);

  for (const [locale, expectedLanguage, menuLabel, guideLabel] of [
    ['nb', 'en', 'Walk menu', 'Change guide'],
    ['be', null, 'Меню прагулкі', 'Змяніць гіда'],
  ]) {
    await page.selectOption('#locale', locale);
    await page.waitForFunction((code) => [...document.querySelectorAll('.phone')]
      .length === 2 && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === code), locale);
    await page.locator('.phone[data-theme="light"] .run-dock [data-k="menu"]').evaluate((button) => button.click());
    await page.waitForFunction((label) => {
      const panel = document.querySelector('.phone[data-theme="light"] .run-menu');
      return document.getElementById(panel?.getAttribute('aria-labelledby'))?.textContent.trim() === label;
    }, menuLabel);
    const menuTitle = page.locator(`#${await page.locator('.phone[data-theme="light"] .run-menu').getAttribute('aria-labelledby')}`);
    assert.equal(await menuTitle.getAttribute('lang'), expectedLanguage, `${locale}: dialog name language metadata`);
    const changeGuide = page.locator('.phone[data-theme="light"] .run-menu .btn').nth(2);
    await changeGuide.waitFor();
    assert.equal((await changeGuide.textContent()).trim(), guideLabel, `${locale}: target button text`);
    assert.equal(await changeGuide.getAttribute('lang'), expectedLanguage, `${locale}: Change guide language metadata`);
    await page.locator('.phone[data-theme="light"] .run-menu-head .iconbtn').evaluate((button) => button.click());
  }
});

test('fallback accessible names do not change the language inherited by localized group content', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/run.html`);
  await page.selectOption('#locale', 'nb');
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'nb'));
  await page.locator('.phone[data-theme="light"] .run-dock [data-k="menu"]').evaluate((button) => button.click());

  const panel = page.locator('.phone[data-theme="light"] .run-menu');
  await panel.waitFor();
  const menuLabelId = await panel.getAttribute('aria-labelledby');
  assert.ok(menuLabelId, 'Walk menu references its visible heading as its accessible name');
  const menuLabel = page.locator(`#${menuLabelId}`);
  assert.equal((await menuLabel.textContent()).trim(), 'Walk menu');
  assert.equal(await menuLabel.getAttribute('lang'), 'en');
  assert.notEqual(await panel.getAttribute('lang'), 'en', 'English label does not retag the dialog');
  for (const action of await panel.locator('.btn').all().then((buttons) => buttons.slice(0, 2))) {
    assert.notEqual(await action.getAttribute('lang'), 'en', 'Norwegian contract action keeps the selected language');
  }

  await page.goto(`http://127.0.0.1:${port}/docs/design/production/settings.html`);
  await page.selectOption('#locale', 'nb');
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'nb'));
  await page.selectOption('#view', 'guides');
  const group = page.locator('.phone[data-theme="light"] .chips[role="group"]');
  await group.waitFor();
  const groupLabelId = await group.getAttribute('aria-labelledby');
  assert.ok(groupLabelId, 'Guides group references its visible heading as its accessible name');
  const groupLabel = page.locator(`#${groupLabelId}`);
  assert.equal(await groupLabel.getAttribute('lang'), 'en');
  assert.notEqual(await group.getAttribute('lang'), 'en', 'English group name does not retag Belarusian content');
  for (const chip of await group.locator('.chip').all()) {
    assert.equal(await chip.getAttribute('lang'), 'be', 'Belarusian tag declares its content language');
    assert.equal(await chip.evaluate((node) => node.closest('[lang]')?.lang), 'be', 'Belarusian tag has effective Belarusian language metadata');
    assert.notEqual(await chip.getAttribute('lang'), 'en', 'content tags keep their inherited locale');
  }
});

test('Settings theme radiogroup uses its visible heading language', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/settings.html`);

  for (const [locale, expectedHeading, expectedLanguage] of [
    ['nb', 'Appearance', 'en'],
    ['be', 'Выгляд', null],
  ]) {
    await t.test(locale, async () => {
      await page.selectOption('#locale', locale);
      await page.waitForFunction((code) => [...document.querySelectorAll('.phone')]
        .length === 2 && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === code), locale);

      const phone = page.locator('.phone[data-theme="light"]');
      const heading = phone.locator('.pad > .sec').filter({ hasText: expectedHeading }).first();
      await heading.waitFor();
      assert.equal((await heading.textContent()).trim(), expectedHeading, `${locale}: visible theme heading`);

      const group = phone.locator('[role="radiogroup"]');
      await group.waitFor();
      assert.equal(await heading.getAttribute('lang'), expectedLanguage,
        `${locale}: visible heading language metadata`);
      assert.notEqual(await group.getAttribute('lang'), 'en',
        `${locale}: the English fallback heading does not retag the radiogroup`);

      const headingId = await heading.getAttribute('id');
      assert.ok(headingId, `${locale}: visible theme heading has an id for the accessible name`);
      assert.equal(await group.getAttribute('aria-labelledby'), headingId,
        `${locale}: radiogroup accessible name comes from the visible heading`);
    });
  }
});

test('an obsolete draw cannot restore a fallback status after a locale switch', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/settings.html`);
  await page.locator('.board').evaluate((board) => board.replaceChildren());

  let releaseRequest;
  let requested;
  const nbRequested = new Promise((resolve) => { requested = resolve; });
  const nbResponse = new Promise((resolve) => { releaseRequest = resolve; });
  await page.route('**/translations/nb.json', async (route) => {
    requested();
    await nbResponse;
    await route.continue();
  });

  await page.evaluate(async () => {
    const { mountBoard } = await import('/docs/design/production/kit.mjs');
    window.testFallbackMarkers = [];
    await mountBoard({
      build({ markFallback }) {
        window.testFallbackMarkers.push(markFallback);
      },
    });
  });
  await page.selectOption('#locale', 'nb');
  await nbRequested;

  await page.evaluate(() => window.testFallbackMarkers[0]('en'));
  const fallback = page.locator('.board > .fallback-status');
  assert.equal(await fallback.isHidden(), true,
    'fallback callbacks from the previous draw are ignored');
  assert.equal(await fallback.textContent(), '');

  releaseRequest();
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'nb'));
});
