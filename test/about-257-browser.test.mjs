// Issue #257 — the «Пра горад» proposal (docs/design/production/about-257.html)
// in a real browser, driven the way a visitor does. It mounts the actual
// screen and checks what the source-string checks (check-257-preview.mjs)
// cannot see: every section renders, the wheel draws the approved medallions,
// the airport direction cards switch the way, keep the focus and take the
// chosen medallion's colours, the airport steps open one by one, the tourist
// card belongs to the way from the airport, the resident card opens its
// official site, and the official links stay folded.
import test from 'node:test';
import assert from 'node:assert/strict';

import { browserOrSkip, serve } from './browser-page.mjs';

test('the «Пра горад» #257 screen answers the visitor', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });
  const page = await browser.newPage({ viewport: { width: 1000, height: 2200 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/production/about-257.html`);
  await page.waitForSelector('.phone .wheel');
  const phone = page.locator('.phone[data-theme="light"]');
  const status = page.locator('.board .event');
  const choose = async (section) => {
    await page.selectOption('#section', section);
    await phone.locator('.page .g-head').waitFor();
  };

  await t.test('every section renders, with no error on the board or in the page', async () => {
    const sections = await page.locator('#section option').evaluateAll((options) => options.map((option) => option.value));
    assert.deepEqual(sections, ['airport', 'transport', 'city', 'food']);
    for (const section of sections) {
      await choose(section);
      assert.ok((await phone.locator('.page > *').count()) > 2, `${section}: the section has content`);
      assert.doesNotMatch(await status.textContent(), /Не ўдалося паказаць экран/, `${section}: the board shows no failure`);
    }
    assert.deepEqual(errors, []);
  });

  await t.test('the variant map can pick Sopot without a price-decimal message', async () => {
    await choose('city');
    const list = phone.locator('[data-key="fold:atlas-list"]');
    if (await list.getAttribute('aria-expanded') === 'false') await list.click();
    await phone.locator('[data-key="zone-row:sopot"]').click();
    assert.match(await phone.locator('.atlas-card').textContent(), /\d+,\d км па прамой/);
    assert.deepEqual(errors, []);
  });

  await t.test('the wheel draws the approved medallions: disc, rim and line sign, no pictures', async () => {
    await choose('airport');
    const medals = phone.locator('.wheel .slot .medal');
    assert.equal(await medals.count(), 4);
    for (let index = 0; index < 4; index += 1) {
      const medal = medals.nth(index);
      assert.equal(await medal.locator('.disc').count(), 1);
      assert.ok((await medal.locator('.glyph *').count()) > 0);
      assert.equal(await medal.locator('image').count(), 0);
    }
  });

  await t.test('the direction cards switch the way, keep the focus and the chosen medallion colours', async () => {
    await choose('airport');
    const from = phone.locator('[data-key="direction:from"]');
    const to = phone.locator('[data-key="direction:to"]');
    assert.equal(await from.getAttribute('aria-label'), 'З аэрапорта');
    assert.equal(await to.getAttribute('aria-label'), 'У аэрапорт');
    assert.equal(await from.locator('svg.route-art').count(), 1);
    assert.equal(await from.getAttribute('aria-checked'), 'true');
    assert.equal(await phone.locator('.tourist-card').count(), 1, 'the tourist card closes the way from the airport');
    const firstStep = () => phone.locator('.airport-step-fold > .fold-head .fold-name').first().textContent();
    const fromStep = await firstStep();

    await to.click();
    assert.equal(await phone.locator('[data-key="direction:to"]').getAttribute('aria-checked'), 'true');
    assert.equal(await phone.locator('[data-key="direction:from"]').getAttribute('aria-checked'), 'false');
    assert.notEqual(await firstStep(), fromStep, 'the steps follow the chosen way');
    assert.equal(await phone.locator('.tourist-card').count(), 0, 'no tourist card on the way to the airport');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'direction:to', 'the focus stays on the pressed card');

    const colours = await phone.locator('[data-key="direction:to"]').evaluate((node) => {
      const style = getComputedStyle(node);
      const probe = (value) => {
        const swatch = document.createElement('i');
        swatch.style.color = value;
        node.append(swatch);
        const colour = getComputedStyle(swatch).color;
        swatch.remove();
        return colour;
      };
      return { background: style.backgroundColor, border: style.borderTopColor, paper: probe('var(--medal-paper)'), accent: probe('var(--accent)') };
    });
    assert.equal(colours.background, colours.paper, 'the chosen card is on the medallion paper');
    assert.equal(colours.border, colours.accent, 'the chosen card has the accent ring');
  });

  await t.test('the airport steps start closed and open one by one', async () => {
    await choose('airport');
    const heads = phone.locator('.airport-step-fold > .fold-head');
    assert.equal(await heads.count(), 3);
    for (let index = 0; index < 3; index += 1) assert.equal(await heads.nth(index).getAttribute('aria-expanded'), 'false');
    await heads.nth(0).click();
    assert.equal(await heads.nth(0).getAttribute('aria-expanded'), 'true');
    assert.equal(await heads.nth(1).getAttribute('aria-expanded'), 'false');
  });

  await t.test('the official links stay folded until asked for', async () => {
    await choose('airport');
    const head = phone.locator('.source-fold > .fold-head');
    assert.equal(await head.getAttribute('aria-expanded'), 'false');
    await head.click();
    assert.equal(await head.getAttribute('aria-expanded'), 'true');
    assert.ok((await phone.locator('.source-fold .srow').count()) > 0);
  });

  await t.test('the resident card in transport opens its official site', async () => {
    await choose('transport');
    const link = phone.locator('[data-key="official:jestemZGdanska"]');
    assert.equal(await link.count(), 1);
    assert.equal(await phone.locator('.resident-card svg.icon').count() > 0, true, 'the house sign is drawn');
    await link.click();
    assert.match(await status.textContent(), /jestemzgdanska\.pl/);
  });

  assert.deepEqual(errors, []);
});
