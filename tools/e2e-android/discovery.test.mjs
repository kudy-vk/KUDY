// Discovery's Android screen can have more offer cards than fit in one
// UIAutomator dump. Exercise real viewport-aware scrolling without an AVD.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { runDiscoverySuite, scrollTo } from './discovery.mjs';

const viewport = (id) => `<node resource-id="${id}" bounds="[44,345][1036,2230]"/>`;
const item = (id, bounds = '[44,900][1036,1360]', label = '') =>
  `<node resource-id="${id}" bounds="${bounds}" content-desc="${label}"/>`;

test('Discovery grants GPS scopes before cold start, ahead of Nearby and active walk', async () => {
  const calls = [];
  const stop = new Error('fixture cold start interrupted');
  const driver = {
    pkg: 'by.kudy.app',
    exec: async (args) => { calls.push(args); return { stdout: '' }; },
  };
  await assert.rejects(runDiscoverySuite({
    driver,
    url: 'kudy://fixture',
    runCase: async (_name, slug, _driver, testCase) => {
      assert.equal(slug, 'discovery-offers');
      await testCase();
    },
    coldStart: async () => { calls.push('cold-start'); throw stop; },
  }), (error) => error === stop);
  assert.deepEqual(calls, [
    ['shell', 'pm', 'grant', 'by.kudy.app', 'android.permission.ACCESS_COARSE_LOCATION'],
    ['shell', 'pm', 'grant', 'by.kudy.app', 'android.permission.ACCESS_FINE_LOCATION'],
    ['shell', 'pm', 'grant', 'by.kudy.app', 'android.permission.ACCESS_BACKGROUND_LOCATION'],
    'cold-start',
  ]);
});

test('Discovery reaches an offscreen paid card and badge, then scrolls back to its filters', async () => {
  let atBottom = false;
  const swipes = [];
  const driver = {
    dump: async () => ({ xml: viewport('scroll-discovery') + (atBottom
      ? item('offer-card-offer-guide-e2e-paid') + item('badge-access-paid', '[70,1360][300,1410]', 'Платна')
      : item('time-60', '[394,428][616,560]') +
        item('offer-card-offer-guide-e2e-paid', '[44,2230][1036,2230]')) }),
    exec: async (args) => {
      swipes.push(args);
      atBottom = args[4] === '1853';
    },
  };
  assert.equal((await scrollTo(driver, 'offer-card-offer-guide-e2e-paid', 'paid')).resourceId,
    'offer-card-offer-guide-e2e-paid');
  assert.equal((await scrollTo(driver, 'badge-access-paid', 'badge')).contentDesc, 'Платна');
  assert.equal(swipes.length, 1, 'the visible badge needs no second scroll');
  assert.equal((await scrollTo(driver, 'time-60', 'time', { direction: 'up' })).resourceId, 'time-60');
  assert.deepEqual(swipes, [
    ['shell', 'input', 'swipe', '540', '1853', '540', '722', '350'],
    ['shell', 'input', 'swipe', '540', '722', '540', '1853', '350'],
  ]);
});

test('Discovery finds the Nearby place card below the visible guide cards', async () => {
  let scrolled = false;
  const swipes = [];
  const driver = {
    dump: async () => ({
      xml: viewport('scroll-nearby') +
        item('nearby-card-offer-guide-e2e-free') +
        item('nearby-card-offer-place-e2e-1',
          scrolled ? '[44,1600][1036,2000]' : '[44,2610][1036,2230]'),
    }),
    exec: async (args) => { swipes.push(args); scrolled = true; },
  };
  const place = await scrollTo(driver, 'nearby-card-offer-place-e2e-1',
    'nearby-place', { scrollID: 'scroll-nearby' });
  assert.equal(place.resourceId, 'nearby-card-offer-place-e2e-1');
  assert.equal(swipes.length, 1, 'a visible place should be found after a single scroll');
});

test('Discovery can navigate the offscreen feedback Send/Delete and the delivery row at the top', async () => {
  let position = 'top';
  const swipes = [];
  const driver = {
    dump: async () => ({
      xml: viewport('scroll-feedback') +
        item('feedback-title', position === 'top' ? '[44,450][1036,570]' : '[44,-250][1036,-150]') +
        item('btn-feedback-send', position === 'bottom' ? '[44,1600][1036,1720]' : '[44,2381][1036,2230]') +
        item('btn-feedback-delete', position === 'bottom' ? '[44,1750][1036,1880]' : '[44,2540][1036,2230]'),
    }),
    exec: async (args) => {
      swipes.push(args);
      position = args[4] === '1853' ? 'bottom' : 'top';
    },
  };
  assert.equal((await scrollTo(driver, 'btn-feedback-send', 'send-first',
    { scrollID: 'scroll-feedback' })).resourceId, 'btn-feedback-send');
  assert.equal((await scrollTo(driver, 'feedback-title', 'delivery-up',
    { scrollID: 'scroll-feedback', direction: 'up' })).resourceId, 'feedback-title');
  assert.equal((await scrollTo(driver, 'btn-feedback-delete', 'delete-down',
    { scrollID: 'scroll-feedback' })).resourceId, 'btn-feedback-delete');
  assert.deepEqual(swipes.map((args) => args[4]), ['1853', '722', '1853']);
});

test('Discovery E2E scrolls to the Nearby card and Feedback actions before selecting them', () => {
  const script = readFileSync(new URL('./discovery.mjs', import.meta.url), 'utf8');
  assert.match(script, /scrollTo\(driver, 'nearby-card-offer-place-e2e-1',[^\n]*'scroll-nearby'/);
  assert.match(script, /scrollTo\(driver, 'btn-feedback-send', 'feedback-send-first',[^\n]*'scroll-feedback'/);
  assert.match(script, /scrollTo\(driver, 'btn-feedback-send', 'feedback-send-edited',[^\n]*'scroll-feedback'/);
  assert.match(script, /scrollTo\(driver, 'feedback-title', 'feedback-after-send',[^\n]*'up'/);
  assert.match(script, /scrollTo\(driver, 'feedback-title', 'feedback-after-edit',[^\n]*'up'/);
  assert.match(script, /scrollTo\(driver, 'btn-feedback-delete', 'feedback-delete',[^\n]*'scroll-feedback'/);
  assert.match(script, /scrollTo\(driver, 'feedback-title', `feedback-deletion-state-\$\{attempt\}`,[^\n]*'up'/);
  assert.match(script, /scrollTo\(driver, 'btn-feedback-delete', 'feedback-delete-retry',[^\n]*'scroll-feedback'/);
  assert.doesNotMatch(script, /driver\.waitFor\(\{ testID: 'nearby-card-offer-place-e2e-1'/);
});

test('Discovery scroll helper supports the separate guide preview viewport', async () => {
  let visible = false;
  const swipes = [];
  const driver = {
    dump: async () => ({ xml: viewport('scroll-preview') +
      (visible ? item('btn-download') : item('preview-theme')) }),
    exec: async (args) => {
      swipes.push(args);
      visible = true;
    },
  };
  assert.equal((await scrollTo(driver, 'btn-download', 'download',
    { scrollID: 'scroll-preview' })).resourceId, 'btn-download');
  assert.equal(swipes.length, 1);
});
