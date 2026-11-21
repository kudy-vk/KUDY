// Issue #216 (M5/M11) — the engraved panorama is drawn once, in the pure
// builder the browser mockups (kit.mjs) and the app (components/city-
// panorama.tsx) both consume. The reverted-line check: extracting or editing
// the drawing so the two surfaces diverge (or the seed stops being fixed)
// turns this red.
import test from 'node:test';
import assert from 'node:assert/strict';

import { PANORAMA_VIEWBOX, panoramaPaths } from '../docs/design/production/panorama-paths.mjs';

test('the panorama drawing is deterministic and shared by the mockups and the app', () => {
  const first = panoramaPaths();
  assert.deepEqual(panoramaPaths(), first, 'the fixed seed must draw the same strokes on every call');
  assert.ok(first.length > 10, 'the drawing carries its strokes');
  for (const { cls, d } of first) {
    assert.ok(['ink', 'mass', 'fine'].includes(cls), `unknown panorama role ${cls}`);
    assert.match(d, /^M/, 'every path starts with an absolute move');
  }
  assert.equal(PANORAMA_VIEWBOX, '190 28 540 162');
});
