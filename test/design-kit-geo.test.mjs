// Issue #248 — the shared geometry of the production mockups
// (docs/design/production/kit-geo.mjs): tying a drawn map that is not to
// scale to the ground, and free shapes of areas. These checks fail when the
// fit stops landing its matching points, a shape stops passing through its
// outline, or a hand-drawn edge changes between draws.
import test from 'node:test';
import assert from 'node:assert/strict';

import { bounds, centroid, edgeDistance, inside, metres, organic, pictureFit, smooth } from '../docs/design/production/kit-geo.mjs';

const PAIRS = [
  [[18.53, 54.52], [373, 152]],
  [[18.56, 54.44], [407, 415]],
  [[18.64, 54.36], [560, 665]],
  [[18.65, 54.35], [604, 702]],
  [[18.47, 54.38], [250, 620]],
];

test('the picture fit lands every matching point and bends smoothly between them', () => {
  const fit = pictureFit(PAIRS);
  for (const [at, px] of PAIRS) {
    const [x, y] = fit(at);
    assert.ok(Math.hypot(x - px[0], y - px[1]) < 1e-6, `${at} lands on ${px}`);
  }
  const [x, y] = fit([18.60, 54.40]);
  assert.ok(x > 373 && x < 604 && y > 152 && y < 702, 'a point between the pairs lands between them');
});

test('a smooth shape passes through its outline and is closed', () => {
  const outline = [[0, 0], [10, 0], [12, 8], [3, 10], [-2, 5]];
  const ring = smooth(outline, 6);
  assert.equal(ring.length, outline.length * 6);
  outline.forEach((point, i) => assert.deepEqual(ring[i * 6].map((v) => +v.toFixed(9)), point));
  assert.ok(inside([5, 5], ring) && !inside([30, 30], ring));
});

test('a hand-drawn edge is the same on every draw and stays near the shape', () => {
  const ring = smooth([[18.60, 54.40], [18.62, 54.40], [18.62, 54.41], [18.60, 54.41]]);
  assert.deepEqual(organic(ring, 'zone-a'), organic(ring, 'zone-a'));
  assert.notDeepEqual(organic(ring, 'zone-a'), organic(ring, 'zone-b'));
  const [x0, y0, x1, y1] = bounds(ring);
  for (const [lon, lat] of organic(ring, 'zone-a')) {
    assert.ok(lon > x0 - 0.003 && lon < x1 + 0.003 && lat > y0 - 0.002 && lat < y1 + 0.002);
  }
});

test('distances and centres', () => {
  const km = metres([18.6, 54.4], [18.6, 54.409]);
  assert.ok(Math.abs(km - 1000) < 5, `${km} m for 0.009° of latitude`);
  assert.deepEqual(centroid([[0, 0], [4, 0], [4, 2], [0, 2]]), { centre: [2, 1], area: 8 });
  assert.equal(edgeDistance([2, 5], [[0, 0], [4, 0], [4, 2], [0, 2]]), 3);
});
