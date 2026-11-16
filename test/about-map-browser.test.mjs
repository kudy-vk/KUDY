// Issue #248 — the map of «Пра горад» in a real browser (docs/design/
// production/about.html, kit-map.mjs, about-map.mjs). The geometry tests
// (about-map.test.mjs) cannot see the DOM; these drive the page the way a
// visitor does: a press on the map, the + − and whole-map buttons, a drag,
// the mouse wheel, a double press, the keys, a two-finger pinch with real
// touch events, the layer switches, a width change, and, without a pointer,
// Tab and Enter or Space picking the airport and a station (#305). Each
// check fails when its handler is reverted. The page is served from the
// repository by a local server; nothing leaves the machine. Without a
// Chromium binary the test skips with the reason (the required CI job
// installs it).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { inside } from '../docs/design/production/kit-geo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
};

function serve() {
  const server = http.createServer((request, response) => {
    const file = path.join(root, decodeURIComponent(new URL(request.url, 'http://x').pathname));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function browserOrSkip(t) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    t.skip('playwright is not installed');
    return null;
  }
  if (!fs.existsSync(chromium.executablePath())) {
    t.skip(`chromium binary is not installed (${chromium.executablePath()}) — run: npx playwright install chromium`);
    return null;
  }
  return chromium;
}

test('the «Пра горад» map answers presses, gestures, keys, layers and a width change', async (t) => {
  const chromium = await browserOrSkip(t);
  if (!chromium) return;
  const server = await serve();
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });
  // Tall enough for the whole phone: presses go to real points on the map.
  const context = await browser.newContext({ viewport: { width: 1000, height: 2200 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/design/production/about.html`);
  await page.waitForSelector('.phone .wheel');
  await page.selectOption('#section', 'city');
  const phone = page.locator('.phone[data-theme="light"]');
  const box = phone.locator('.zoomview');
  await box.waitFor();
  await box.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.phone[data-theme="light"] .zoomview-world').style.transform !== '');

  // The picture's scale and shift, and a picture point on the screen.
  const camera = () => box.evaluate((node) => {
    const m = new DOMMatrix(node.querySelector('.zoomview-world').style.transform);
    return { scale: m.a, x: m.e, y: m.f, width: node.clientWidth };
  });
  const onScreen = (point) => box.evaluate((node, [px, py]) => {
    const m = new DOMMatrix(node.querySelector('.zoomview-world').style.transform);
    const r = node.getBoundingClientRect();
    return [r.left + node.clientLeft + m.e + px * m.a, r.top + node.clientTop + m.f + py * m.d];
  }, point);
  const card = async () => ({
    name: await phone.locator('.atlas-card h4').textContent().catch(() => null),
    tag: await phone.locator('.atlas-card .tag').textContent().catch(() => null),
  });
  // One press. Two presses close together within 320 ms are a double press
  // (zoom), so a press waits that long before the next action.
  const press = async (point) => {
    const [x, y] = await onScreen(point);
    await page.mouse.click(x, y);
    await page.waitForTimeout(400);
  };
  const geo = () => page.evaluate(async () => {
    const m = await import('./about-map-geo.mjs');
    const sopot = m.SHAPES.zones.find((zone) => zone.id === 'sopot');
    return { sopot: sopot.px, station: m.SHAPES.stations.find((s) => s.id === 'sopot').px, signs: m.SHAPES.stations.filter((s) => !s.planned).map((s) => s.px) };
  });

  await t.test('on the whole map a press beside a station sign, inside a zone, picks the zone', async () => {
    const { sopot, station, signs } = await geo();
    const { scale } = await camera();
    // A point of the Sopot zone 12–20 screen px from the nearest sign: off
    // the sign, but within the old 22 px reach that let the station win.
    let target = null;
    const xs = sopot.map(([x]) => x), ys = sopot.map(([, y]) => y);
    for (let x = Math.min(...xs); x <= Math.max(...xs) && !target; x += 0.5) {
      for (let y = Math.min(...ys); y <= Math.max(...ys) && !target; y += 0.5) {
        const nearest = Math.min(...signs.map(([sx, sy]) => Math.hypot(x - sx, y - sy))) * scale;
        if (nearest > 12 && nearest < 20 && inside([x, y], sopot)) target = [x, y];
      }
    }
    assert.ok(target, 'the Sopot zone has a point beside the station sign');
    await press(target);
    assert.deepEqual(await card(), { name: 'Sopot', tag: 'Месцы для наведвання' });
    await press(station);
    assert.equal((await card()).tag, 'Станцыя', 'a press on the sign itself picks the station');
  });

  await t.test('Escape clears the pick and the hint comes back', async () => {
    await box.focus();
    await page.keyboard.press('Escape');
    assert.equal(await phone.locator('.atlas-card h4').count(), 0);
  });

  await t.test('the + button zooms in, − and the whole-map button come back', async () => {
    const start = await camera();
    await phone.locator('.zoomview-tools button').nth(0).click();
    const zoomed = await camera();
    assert.ok(zoomed.scale > start.scale * 1.5, `+ zooms: ${start.scale} → ${zoomed.scale}`);
    await phone.locator('.zoomview-tools button').nth(1).click();
    assert.ok(Math.abs((await camera()).scale - start.scale) < 1e-3, '− comes back to the whole map');
    await phone.locator('.zoomview-tools button').nth(0).click();
    await phone.locator('.zoomview-tools button').nth(2).click();
    assert.ok(Math.abs((await camera()).scale - start.scale) < 1e-3, 'the whole-map button comes back');
    assert.equal(await phone.locator('.zoomview-tools button').nth(1).getAttribute('aria-disabled'), 'true', '− is unavailable at the whole map');
  });

  await t.test('a drag pans the zoomed map, the wheel and a double press zoom, keys move it', async () => {
    await phone.locator('.zoomview-tools button').nth(0).click();
    const r = await box.boundingBox();
    const [cx, cy] = [r.x + r.width / 2, r.y + r.height / 2];
    const before = await camera();
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 40, { steps: 6 });
    await page.mouse.up();
    const dragged = await camera();
    assert.ok(Math.abs(dragged.x - before.x - 60) < 1 && Math.abs(dragged.y - before.y - 40) < 1, 'the picture follows the drag');
    await phone.locator('.zoomview-tools button').nth(2).click();
    const whole = await camera();
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -300);
    assert.ok((await camera()).scale > whole.scale, 'the wheel zooms in');
    await phone.locator('.zoomview-tools button').nth(2).click();
    await page.mouse.dblclick(cx, cy);
    assert.ok((await camera()).scale > whole.scale * 1.9, 'a double press doubles the zoom');
    const keyed = await camera();
    await box.focus();
    await page.keyboard.press('ArrowLeft');
    assert.ok((await camera()).x > keyed.x, 'an arrow key pans');
    await page.keyboard.press('0');
    assert.ok(Math.abs((await camera()).scale - whole.scale) < 1e-3, '0 shows the whole map');
  });

  await t.test('two fingers spreading apart zoom in (real touch events)', async () => {
    const whole = await camera();
    const r = await box.boundingBox();
    const [cx, cy] = [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)];
    const cdp = await context.newCDPSession(page);
    const touch = (type, gap) => cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: gap === null ? [] : [{ x: cx - gap, y: cy, id: 1 }, { x: cx + gap, y: cy, id: 2 }],
    });
    await touch('touchStart', 20);
    for (const gap of [30, 40, 50, 60]) await touch('touchMove', gap);
    await touch('touchEnd', null);
    const pinched = await camera();
    assert.ok(pinched.scale > whole.scale * 2.5, `the pinch zooms with the fingers: ${whole.scale} → ${pinched.scale}`);
    await phone.locator('.zoomview-tools button').nth(2).click();
  });

  await t.test('a layer switch hides its zones and drops a pick on that layer', async () => {
    await phone.locator('.fold-head').first().click();
    await phone.locator('.srow', { hasText: 'Sopot' }).first().click();
    assert.equal((await card()).name, 'Sopot');
    await phone.locator('.lchip[data-key="layer:visit"]').click();
    assert.equal(await phone.locator('.lchip[data-key="layer:visit"]').getAttribute('aria-pressed'), 'false');
    assert.equal(await phone.locator('.zone.visit:not(.off)').count(), 0, 'every visit zone is hidden');
    assert.equal(await phone.locator('.atlas-card h4').count(), 0, 'the pick on the hidden layer is gone');
    await phone.locator('.lchip[data-key="layer:visit"]').click();
    assert.ok(await phone.locator('.zone.visit:not(.off)').count() > 0, 'the switch brings them back');
    await phone.locator('.zoomview-tools button').nth(2).click();
  });

  await t.test('without a pointer, Tab reaches the airport and a station and Enter or Space picks them', async () => {
    assert.notEqual(await phone.locator('.atlas-svg').getAttribute('aria-hidden'), 'true', 'the map svg is not hidden from the reader');
    await box.focus();
    // The signs on the map are named buttons (about-map.mjs drawing()): from
    // the map box, Tab lands on the first mark, the airport.
    await page.keyboard.press('Tab');
    assert.deepEqual(await page.evaluate(() => {
      const mark = document.activeElement;
      return { label: mark?.getAttribute('aria-label'), role: mark?.getAttribute('role') };
    }), { label: 'Port Lotniczy Gdańsk (GDN)', role: 'button' }, 'Tab reaches the airport sign');
    // The focused sign is visible to the eye (about.html styles): the canon's
    // 3px accent ring on the halo — fails when the CSS half of the fix is
    // reverted. The airport has no name of its own on the map (the picture
    // draws it), so the name-on-focus check rides the station below.
    assert.deepEqual(await page.evaluate(() => {
      const halo = document.activeElement.querySelector('.halo');
      return { width: getComputedStyle(halo).strokeWidth, ring: getComputedStyle(halo).stroke };
    }), { width: '3px', ring: 'rgb(29, 107, 79)' }, 'the focused sign shows the canon ring');
    await page.keyboard.press('Enter');
    assert.deepEqual(await card(), { name: 'Port Lotniczy Gdańsk', tag: 'GDN' }, 'Enter picks the airport like a press');
    await page.keyboard.press('Escape');
    assert.equal(await phone.locator('.atlas-card h4').count(), 0, 'Escape on the mark clears the pick');
    // The next mark is a station; Space picks it the same way. Its name is
    // an SVG text, shown on focus.
    await page.keyboard.press('Tab');
    assert.deepEqual(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Gdynia Główna', 'Tab reaches a station sign');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement.querySelector('text')).display), 'block', 'the focused station shows its name');
    await page.keyboard.press('Space');
    assert.deepEqual(await card(), { name: 'Gdynia Główna', tag: 'Станцыя' }, 'Space picks the station like a press');
  });

  await t.test('a width change repaints the picture to the new width', async () => {
    await phone.evaluate((node) => node.style.setProperty('--w', '300px'));
    await page.waitForFunction(() => {
      const node = document.querySelector('.phone[data-theme="light"] .zoomview');
      const m = new DOMMatrix(node.querySelector('.zoomview-world').style.transform);
      return Math.abs(m.a * 892 - node.clientWidth) < 1;
    }, null, { timeout: 2000 });
    const { scale, width } = await camera();
    assert.ok(width < 300, `the box narrowed to ${width} px`);
    assert.ok(Math.abs(scale * 892 - width) < 1, 'the picture fills the new width');
  });

  assert.deepEqual(errors, [], 'no errors in the page');
});
