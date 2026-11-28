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

test('manual themes keep Settings and Guides headings unique and phone-local', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/settings.html`);

  for (const theme of ['light', 'dark']) {
    await t.test(theme, async () => {
      await page.selectOption('#view', 'settings');
      await page.locator('.phone').first().locator(`[data-key="theme-${theme}"]`).click();
      await page.waitForFunction((selectedTheme) => [...document.querySelectorAll('.phone')].length === 2
        && [...document.querySelectorAll('.phone')].every((phone) => phone.dataset.theme === selectedTheme), theme);

      const observed = [];
      for (const [view, selector] of [
        ['settings', '.phone [role="radiogroup"]'],
        ['guides', '.phone .chips[role="group"]'],
      ]) {
        if (view === 'guides') await page.selectOption('#view', 'guides');
        await page.waitForFunction((groupSelector) => document.querySelectorAll(groupSelector).length === 2, selector);

        const labels = await page.evaluate((groupSelector) => [...document.querySelectorAll('.phone')].map((phone) => {
          const group = phone.querySelector(groupSelector);
          const id = group?.getAttribute('aria-labelledby');
          const label = id ? document.getElementById(id) : null;
          const occurrences = id
            ? [...document.querySelectorAll('[id]')].filter((element) => element.id === id).length
            : 0;
          return {
            groupFound: Boolean(group),
            labelIsHeading: label?.tagName === 'H3',
            labelWithinPhone: Boolean(label && phone.contains(label)),
            labelOccurrences: occurrences,
          };
        }), selector);

        observed.push({ view, labels });
      }

      assert.deepEqual(observed, ['settings', 'guides'].map((view) => ({
        view,
        labels: [0, 1].map(() => ({
          groupFound: true,
          labelIsHeading: true,
          labelWithinPhone: true,
          labelOccurrences: 1,
        })),
      })), `${theme}: every Settings and Guides group has a unique heading inside its own phone`);
      await page.selectOption('#view', 'settings');
    });
  }
});

test('issue #509: a failed locale switch preserves old fallback status until a local-draft locale loads', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  await page.goto(`http://127.0.0.1:${port}/docs/design/production/settings.html`);
  await page.selectOption('#locale', 'nb');

  const fallback = page.locator('.board > .fallback-status');
  await page.waitForFunction(() => /Draft text:\s*English/i.test(document.querySelector('.board')?.innerText ?? ''));
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'nb'));

  let requestStarted;
  const contractRequested = new Promise((resolve) => { requestStarted = resolve; });
  await page.route('**/translations/pl.json', async (route) => {
    requestStarted();
    await route.fulfill({ status: 503, body: 'temporarily unavailable' });
  });
  await page.selectOption('#locale', 'pl');
  await contractRequested;
  await page.waitForFunction(() => /Не ўдалося паказаць экран: translations\/pl\.json: 503/i
    .test(document.querySelector('.board .event')?.textContent ?? ''));

  const retainedLocales = await page.locator('.phone').evaluateAll((phones) => phones.map((phone) => phone.lang));
  const fallbackVisibleAfterFailure = await fallback.isVisible();
  const fallbackTextAfterFailure = await fallback.textContent();
  assert.match(await page.locator('.board .event').textContent(), /translations\/pl\.json: 503/,
    'the visible contract-load error remains visible');

  await page.selectOption('#locale', 'be');
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'be'));
  assert.equal(await fallback.isVisible(), false,
    'a successful switch to a locale with local drafts clears fallback status');
  assert.equal(await fallback.textContent(), '');
  assert.equal(await page.locator('.board .event').textContent(), '');
  if (retainedLocales.length > 0 && retainedLocales.every((locale) => locale === 'nb')) {
    assert.equal(fallbackVisibleAfterFailure, true,
      'English fallback status remains visible while the previous locale frames remain');
    assert.match(fallbackTextAfterFailure, /Draft text:\s*English/i);
  }
});

test('issue #512: retained Walk frames keep their own draft locale after a failed redraw', async (t) => {
  const setup = await openMockupPage(t);
  if (!setup) return;
  const { page, port } = setup;
  const url = `http://127.0.0.1:${port}/docs/design/production/run.html`;
  page.setDefaultTimeout(5000);
  await page.goto(url);
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'be'));

  const failNorwegianContract = (route) => route.fulfill({ status: 503, body: 'temporarily unavailable' });
  await page.route('**/translations/nb.json', failNorwegianContract);
  await page.selectOption('#locale', 'nb');
  await page.waitForFunction(() => /Не ўдалося паказаць экран: translations\/nb\.json: 503/i
    .test(document.querySelector('.board .event')?.textContent ?? ''));
  assert.deepEqual(await page.locator('.phone').evaluateAll((phones) => phones.map((phone) => phone.lang)),
    ['be', 'be'], 'a failed redraw keeps both Belarusian Walk frames');

  await page.locator('.phone[data-theme="light"] .run-dock [data-k="menu"]')
    .evaluate((button) => button.click());
  const retainedMenu = page.locator('.phone[data-theme="light"] .run-menu');
  await retainedMenu.waitFor();
  const retainedMenuLabel = page.locator(`#${await retainedMenu.getAttribute('aria-labelledby')}`);
  assert.equal((await retainedMenuLabel.textContent()).trim(), 'Меню прагулкі',
    'the old frame resolves its menu draft from its captured Belarusian locale');
  assert.equal(await retainedMenuLabel.evaluate((label) => label.closest('.phone').lang), 'be',
    'the Belarusian menu label inherits the retained phone language');
  const fallback = page.locator('.board > .fallback-status');
  assert.equal(await fallback.isVisible(), false, 'the Belarusian local menu has no fallback status');
  assert.equal(await fallback.textContent(), '');

  await page.unroute('**/translations/nb.json', failNorwegianContract);
  await page.goto(url);
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'be'));
  await page.selectOption('#locale', 'nb');
  await page.waitForFunction(() => [...document.querySelectorAll('.phone')].length === 2
    && [...document.querySelectorAll('.phone')].every((phone) => phone.lang === 'nb'));
  assert.equal(await fallback.isVisible(), true, 'a successful Norwegian draw reports its English drafts');
  assert.match(await fallback.textContent(), /Draft text:\s*English/i);

  await page.locator('.phone[data-theme="light"] .run-dock [data-k="menu"]')
    .evaluate((button) => button.click());
  const norwegianMenu = page.locator('.phone[data-theme="light"] .run-menu');
  await norwegianMenu.waitFor();
  const norwegianMenuLabel = page.locator(`#${await norwegianMenu.getAttribute('aria-labelledby')}`);
  assert.equal((await norwegianMenuLabel.textContent()).trim(), 'Walk menu');
  assert.equal(await norwegianMenuLabel.getAttribute('lang'), 'en');
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
