import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserOrSkip, serve } from './browser-page.mjs';
import { BASTION_CLIP_PATH } from '../docs/design/brand/outputs/menu-map-city-only/atlas-art.mjs';

const manifest = JSON.parse(readFileSync(new URL('../docs/design/brand/outputs/menu-map-city-only/manifest.json', import.meta.url)));
const routes = { nearby: '/map', guides: '/city/gdansk/guides', discovery: '/discovery', 'reserve-1': '/city/gdansk/about', kudy: '/my' };

test('the catalog opens the accepted menu and preserves its archive', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });
  const page = await browser.newPage({ viewport: { width: 1300, height: 1410 }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/catalog.html`);
  await page.locator('#list .name').getByText('Галоўнае меню', { exact: true }).click();
  const board = page.frameLocator('#stage iframe');
  const phone = board.locator('.phone[data-theme="light"]');
  const stage = phone.locator('.menu-canvas svg');
  const caption = (id) => stage.locator(`[data-piece="${id}"] .r-text`);
  await caption('nearby').waitFor();
  assert.match(await page.locator('#stage iframe').getAttribute('src'), /production\/menu\.html$/);
  const capture = async (name) => {
    if (process.env.KUDY_MENU_QA_DIR) {
      await board.locator('.phones').screenshot({ path: join(process.env.KUDY_MENU_QA_DIR, name + '.png') });
    }
  };

  await t.test('five localized ribbons fit the narrow screen at both text scales', async () => {
    await board.locator('#device').selectOption({ index: 0 });
    const locales = await board.locator('#locale option').evaluateAll(options => options.map(option => option.value));
    assert.equal(locales.length, 14);
    for (const locale of locales) {
      await board.locator('#locale').selectOption(locale);
      for (const scale of ['1', '1.5']) {
        await board.locator('#scale').selectOption(scale);
        await board.locator(`.phone[lang="${locale}"][data-theme="light"][style*="--fs: ${scale};"] .r-text`).first().waitFor();
        const labels = await stage.locator('.ribbon-badge').evaluateAll(badges => badges.map(badge => {
          const text = badge.querySelector('.r-text'), body = badge.querySelector('.r-body');
          const content = badge.getBoundingClientRect(), frame = badge.closest('svg').getBoundingClientRect();
          return { name: text.textContent, text: text.getComputedTextLength(), body: body.getBBox().width,
            inCanvas: content.left >= frame.left - 1 && content.right <= frame.right + 1 };
        }));
        assert.equal(labels.length, 5, locale);
        for (const label of labels) {
          assert.ok(label.name && label.body > label.text && label.inCanvas, `${locale} ×${scale} ${JSON.stringify(label)}`);
        }
      }
    }
    await board.locator('#locale').selectOption('be');
    await board.locator('#scale').selectOption('1');
    await board.locator('#device').selectOption('390x844');
    await board.locator('.phone[lang="be"][style*="--w: 390px;"][style*="--fs: 1;"] .r-text').first().waitFor();
    await capture('canonical-scattered');
  });

  await t.test('taps and keyboard assembly keep every destination active and reveal the clipped city', async () => {
    for (const [id, route] of Object.entries(routes)) {
      await caption(id).click();
      assert.ok((await board.locator('.event').textContent()).endsWith(route), id);
    }
    const clip = stage.locator('clipPath path');
    assert.equal(await clip.getAttribute('d'), BASTION_CLIP_PATH);
    assert.equal(await stage.locator('.bg-layers [clip-path] image').count(), 2);
    assert.equal(await stage.locator('.rim-paper').count(), 5);
    const assemble = (canvas) => canvas.evaluate((svg, pieces) => {
      const actors = new Map(pieces.map(piece => [piece.id, { ...piece, node: svg.querySelector(`[data-piece="${piece.id}"]`) }]));
      const [,,w,h] = svg.getAttribute('viewBox').split(' ').map(Number);
      const step = 8 * w / svg.clientWidth;
      const moveTo = (actor, x, y) => {
        const matrix = new DOMMatrix(actor.node.style.transform);
        const send = (key) => actor.node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        for (const [delta, forward, back] of [[x - matrix.e, 'ArrowRight', 'ArrowLeft'], [y - matrix.f, 'ArrowDown', 'ArrowUp']]) {
          for (let i = 0; i < Math.round(Math.abs(delta) / step); i += 1) send(delta > 0 ? forward : back);
        }
      };
      const ox = (w - 1351) / 2, oy = (h - 1164) / 2;
      const first = actors.get('nearby');
      moveTo(first, ox + first.x, oy + first.y);
      for (const id of ['guides', 'discovery', 'reserve-1', 'kudy']) {
        const actor = actors.get(id);
        const firstAt = new DOMMatrix(first.node.style.transform);
        moveTo(actor, firstAt.e - first.x + actor.x, firstAt.f - first.y + actor.y);
        actor.node.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
      }
    }, manifest.pieces);
    const dark = board.locator('.phone[data-theme="dark"] .menu-canvas svg');
    await Promise.all([assemble(stage), assemble(dark)]);
    await phone.locator('svg.complete').waitFor();
    await stage.locator('.spark').first().waitFor({ state: 'attached' });
    await stage.locator('.seam-glow').evaluate(async (node) => {
      for (let frame = 0; frame < 90 && Number(node.style.opacity) < 0.7; frame += 1) await new Promise(requestAnimationFrame);
    });
    assert.ok(Number(await stage.locator('.seam-glow').evaluate(node => node.style.opacity)) >= 0.7);
    for (const wave of ['.energy-ring', '.energy-ring-outer']) {
      assert.ok(Number(await stage.locator(wave).evaluate(node => node.style.opacity)) > 0);
    }
    await board.locator('.phone[data-theme="dark"] .panorama-lit').waitFor();
    await phone.locator('.panorama-lit').waitFor();
    const artwork = await stage.locator('.tone:not(.ui-art)').evaluateAll(images => images.map(image => getComputedStyle(image).opacity));
    assert.deepEqual(artwork, ['1', '1', '1', '1', '1']);
    assert.match(await stage.getAttribute('class'), /\brevealed\b/);
    assert.equal(await stage.locator('.seam-glow').evaluate(node => node.style.opacity), '0.28');
    await caption('kudy').click();
    assert.ok((await board.locator('.event').textContent()).endsWith('/my'));
    await capture('canonical-revealed');
  });

  await t.test('all preserved variants still render through the catalog', async () => {
    await page.getByRole('button', { name: 'архіў варыянтаў' }).click();
    assert.match(await page.locator('#stage iframe').getAttribute('src'), /production\/menu-polish\.html$/);
    assert.equal(await board.locator('#style').inputValue(), 'ribbon');
    assert.equal(await board.locator('#bg').inputValue(), 'cosmos');
    await caption('nearby').waitFor();
    await capture('reference-scattered');
    for (const [mode, selector] of [['marginalia', '.marginalia-layer'], ['diorama', '.diorama-badge'], ['dock', '.dock-token'], ['crest', '.crest-badge']]) {
      await board.locator('#style').selectOption(mode);
      await phone.locator(selector).first().waitFor();
    }
    await board.locator('#bg').selectOption('extended');
    await phone.locator('.bg-layers[data-bg="extended"]').waitFor();
    await board.locator('#style').selectOption('ribbon');
    await board.locator('#bg').selectOption('cosmos');
    await board.locator('#mapState').selectOption('assembled');
    await phone.locator('.panorama-lit').waitFor();
    await capture('reference-revealed');
  });

  assert.deepEqual(errors, []);
});
