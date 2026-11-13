import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { REASON_SUGGESTIONS, suggestedReasons, keepCompatibleReasons } from '../docs/design/production/feedback-reasons.mjs';

test('feedback hints use only the closed guide/place reason codes', () => {
  assert.deepEqual(REASON_SUGGESTIONS.guide.positive, ['interesting_stories', 'clear_delivery']);
  assert.deepEqual(REASON_SUGGESTIONS.guide.needsWork, ['too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch']);
  assert.deepEqual(REASON_SUGGESTIONS.place.positive, ['worth_visiting']);
  assert.deepEqual(REASON_SUGGESTIONS.place.needsWork, ['description_mismatch', 'hard_to_reach', 'access_problem']);
  for (const kind of ['guide', 'place']) {
    const sets = REASON_SUGGESTIONS[kind];
    assert.equal(new Set([...sets.positive, ...sets.needsWork]).size, sets.positive.length + sets.needsWork.length);
    for (const score of [1, 2, 3]) assert.deepEqual(suggestedReasons(kind, score), sets.needsWork);
    for (const score of [4, 5]) assert.deepEqual(suggestedReasons(kind, score), sets.positive);
  }
});

test('no suggestions until a star is picked; malformed scores fail closed', () => {
  for (const value of [null, 0, 6, 3.5, NaN, '4', undefined]) {
    assert.deepEqual(suggestedReasons('guide', value), []);
  }
  assert.deepEqual(suggestedReasons('unknown', 5), []);
});

test('changing sentiment clears incompatible hints; same bucket preserves compatible ones', () => {
  assert.deepEqual(keepCompatibleReasons('guide', 4, ['too_long', 'audio_problem']), []);
  assert.deepEqual(keepCompatibleReasons('guide', 2, ['interesting_stories']), []);
  assert.deepEqual(keepCompatibleReasons('guide', 3, ['too_long', 'description_mismatch']), ['too_long', 'description_mismatch']);
  assert.deepEqual(keepCompatibleReasons('place', 5, ['hard_to_reach', 'worth_visiting']), ['worth_visiting']);
});

test('the mockup uses the filtering and explicit submit action, not the paper-plane FAB', () => {
  const source = readFileSync(new URL('../docs/design/production/feedback.mjs', import.meta.url), 'utf8');
  assert.match(source, /suggestedReasons\(kind, form\.score\)/);
  assert.match(source, /keepCompatibleReasons\(kind, value, form\.reasons\)/);
  assert.match(source, /button\(NEW\.sendReview\[state\.locale\]/);
  assert.doesNotMatch(source, /fab\('send'/);
});
