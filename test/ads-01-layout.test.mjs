// ADS-01 (#988): pin the banner layout proposal to the official GMA size
// rules, the real menu-map geometry and the recomputed numbers of the
// specimen board. Research PoC only - no production layout is asserted here.
// The specimen uses neutral placeholder colors on purpose (the banner visual
// design is a separate owner decision), so the canon-color preflight from
// MAP-05 is not applicable; structural pins below keep the artifact honest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BANNER_FAMILIES,
  CANVAS_H,
  CANVAS_W,
  DEVICES,
  GAP,
  bannerEnvelope,
  layout,
  mapHeight,
  pieceRects,
  touchOverlap,
} from '../docs/design/brand/outputs/ADS-01/layout-math.mjs';
import { nativeLayout } from '../docs/design/brand/outputs/menu-map-city-only/native-layout.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const specimen = read('docs/design/brand/outputs/ADS-01/specimen.html');
const round = (n) => Math.round(n * 100) / 100;
const variantA = { variant: 'packed', family: 'anchored', bannerHeight: 50, footerHeight: 96 };
const variantB = { variant: 'bottom-anchored', family: 'anchoredLarge', bannerHeight: 90, footerHeight: 96 };

test('every menu-map piece fits the 1600x1800 canvas the map block maps to', () => {
  for (const p of pieceRects(nativeLayout)) {
    assert.ok(p.x >= 0 && p.y >= 0, p.id + ' inside the canvas');
    assert.ok(p.x + p.w <= CANVAS_W && p.y + p.h <= CANVAS_H, p.id + ' bottom edge stays inside the map block');
  }
});

test('banner envelopes copy the official GMA size rules per device', () => {
  for (const device of DEVICES) {
    assert.deepEqual(bannerEnvelope('anchored', device), {
      floor: 50,
      cap: Math.floor(device.height * 0.15),
    });
    assert.deepEqual(bannerEnvelope('anchoredLarge', device), {
      floor: 50,
      cap: Math.min(Math.floor(device.height * 0.2), 150),
    });
    assert.equal(BANNER_FAMILIES.inline.floor, 32);
  }
});

test('variant A (packed, legacy anchored 50dp) fits every representative device', () => {
  for (const device of DEVICES) {
    const r = layout(device, variantA);
    assert.equal(round(r.bannerRect.top), round(device.top + mapHeight(device.width) + GAP));
    assert.equal(r.overlapsMap, false);
    assert.equal(r.overflow, false);
    assert.equal(r.bannerAboveFold, true);
  }
});

test('variant B (bottom-anchored, large anchored capped 90dp) fits without overlap', () => {
  for (const device of DEVICES) {
    const r = layout(device, variantB);
    assert.equal(r.overlapsMap, false, device.id + ' keeps the 8dp gap');
    assert.equal(r.overflow, false, device.id + ' fits above the footer');
    assert.equal(r.bannerAboveFold, true);
    assert.equal(round(r.bannerRect.top + r.bannerRect.height + variantB.footerHeight + device.bottom), device.height);
  }
});

test('worst-case uncapped large banner over the 128dp footer overlaps the smallest phone', () => {
  for (const device of DEVICES) {
    const cap = bannerEnvelope('anchoredLarge', device).cap;
    const r = layout(device, { variant: 'bottom-anchored', family: 'anchoredLarge', bannerHeight: cap, footerHeight: 128 });
    if (device.id === '320x640-3btn') {
      assert.equal(r.overlapsMap, true, 'the risk the PoC documents');
      assert.equal(round(r.mapBannerGap), -48);
    } else {
      assert.equal(r.overlapsMap, false, device.id + ' survives the worst case');
    }
  }
});

test('the banner never touches a piece or its 48dp label in the two proposal variants', () => {
  for (const device of DEVICES) {
    const scale = device.width / CANVAS_W;
    for (const cfg of [variantA, variantB]) {
      const r = layout(device, cfg);
      const bannerRect = { x: 0, width: device.width, top: r.bannerRect.top, height: r.bannerRect.height, bottom: r.bannerRect.bottom };
      const hits = touchOverlap(bannerRect, pieceRects(nativeLayout), scale, device.top);
      assert.deepEqual(hits, [], device.id + ' ' + cfg.variant + ' banner is tap-clear of the map');
    }
  }
});

test('touchOverlap checks both axes: full-canvas intersects, a right-side strip does not', () => {
  const full = touchOverlap(
    { x: 0, width: CANVAS_W, top: 0, height: CANVAS_H, bottom: CANVAS_H },
    pieceRects(nativeLayout),
    1,
    0,
  );
  assert.ok(full.length >= 5, 'the checker names every covered piece');
  const rightStrip = touchOverlap(
    { x: CANVAS_W - 100, width: 100, top: 0, height: CANVAS_H, bottom: CANVAS_H },
    pieceRects(nativeLayout),
    1,
    0,
  );
  assert.deepEqual(rightStrip, [], 'a strip right of every piece must not intersect');
});

test('specimen rows stay in sync with the recomputed layout math', () => {
  const rows = [...specimen.matchAll(/<tr data-device="([^"]+)" data-variant="([^"]+)" data-family="([^"]+)" data-banner="([^"]+)" data-footer="([^"]+)" data-map-h="([^"]+)" data-banner-top="([^"]+)" data-free="([^"]+)"/g)].map(
    ([, device, variant, family, banner, footer, mapH, bannerTop, free]) => ({
      device,
      variant,
      family,
      banner: Number(banner),
      footer: Number(footer),
      mapH: Number(mapH),
      bannerTop: Number(bannerTop),
      free: Number(free),
    }),
  );
  assert.equal(rows.length, DEVICES.length * 2 * 2, 'the light and the dark board repeat the same rows');
  const light = rows.slice(0, DEVICES.length * 2);
  const dark = rows.slice(DEVICES.length * 2);
  assert.deepEqual(
    dark.map((r) => [r.device, r.variant, r.bannerTop, r.free]),
    light.map((r) => [r.device, r.variant, r.bannerTop, r.free]),
    'theme only changes colors, not the numbers',
  );
  const configs = { A: variantA, B: variantB };
  for (const row of light) {
    const device = DEVICES.find((d) => d.id === row.device);
    const cfg = configs[row.variant];
    assert.ok(device && cfg, 'known device and variant: ' + row.device + ' ' + row.variant);
    const r = layout(device, cfg);
    assert.equal(row.family, cfg.family);
    assert.equal(row.banner, cfg.bannerHeight);
    assert.equal(row.footer, cfg.footerHeight);
    assert.equal(row.mapH, round(r.mapH), row.device + ' map height');
    assert.equal(row.bannerTop, round(r.bannerRect.top), row.device + ' banner top');
    assert.equal(row.free, round(r.freeSpace), row.device + ' free space');
  }
});

test('the specimen stays an isolated proposal without ad SDK calls or invented routes', () => {
  assert.ok(specimen.includes('прапанова, не production UI'));
  assert.ok(!specimen.includes('googlesyndication'), 'no ad SDK scripts');
  assert.ok(!specimen.match(/<script[^>]*src=/), 'self-contained: no external scripts');
  assert.ok(!specimen.includes('/city/'), 'no production routes in the proposal');
  assert.ok(!specimen.includes('ca-app-pub-3940256099942544/'), 'no ad unit IDs in the layout board');
});
