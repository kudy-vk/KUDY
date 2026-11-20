// DQ-03 (issue #913) — the fast npm-test check (criterion 4, spec §8.1):
// every guide-card story of the V1 matrix must have a baseline under
// docs/design-qa/baselines/. The story list comes from the real single
// source (parseStoryNames reads components/guide-card.stories.tsx and is
// fail-closed), so a new story turns this red until its baseline lands;
// removing the baselines directory turns the whole suite red. The Explore
// screen surfaces are captured and compared by visual:check as well, but
// the enforced V1 baseline matrix of this check is the stories matrix —
// approving the baselines themselves is DQ-04.
//
// Issue #320 adds the `about-city-list` surface (the owner-accepted state
// of #312) and enforces its two slots here the same way: dropping the
// surface from the matrix or either baseline PNG from the directory turns
// this test red. The baseline is temporary by the owner's condition
// (2026-11-17): the owner's control test will replace it (baselines
// README).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { DEFAULT_BASELINES_DIR, allSlots, loadMatrix } from './visual-check.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// The slot ids of one matrix group whose baseline PNG is missing from the
// baselines directory — the shared fail-closed list both tests report.
function missingBaselineIds(slots) {
  return slots
    .filter((slot) => !fs.existsSync(path.join(DEFAULT_BASELINES_DIR, `${slot.slot}.png`)))
    .map((slot) => slot.slot);
}

test('every guide-card story of the V1 matrix has a baseline (DQ-03 criterion 4)', () => {
  const matrix = loadMatrix();
  const storySlots = allSlots(matrix).filter((slot) => slot.story);
  assert.ok(storySlots.length > 0, 'the matrix must contain story slots — parseStoryNames is fail-closed');
  const missingStories = missingBaselineIds(storySlots);
  assert.deepEqual(missingStories, [], `missing baselines: ${missingStories.join(', ')}`);
});

test('the about-city-list surface of the V1 matrix has baselines (issue #320)', () => {
  const matrix = loadMatrix();
  const aboutSlots = allSlots(matrix).filter((slot) => slot.surface === 'about-city-list');
  assert.equal(
    aboutSlots.length,
    matrix.scales.length,
    'the matrix must contain the about-city-list surface — dropping it turns this test red (issue #320)',
  );
  const missingAbout = missingBaselineIds(aboutSlots);
  assert.deepEqual(missingAbout, [], `missing baselines: ${missingAbout.join(', ')}`);
});
