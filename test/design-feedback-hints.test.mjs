import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  EXISTING_REASON_CODES, PROPOSED_REASON_CODES, POSITIVE_LABELS, REASON_SUGGESTIONS,
  suggestedReasons, keepCompatibleReasons, positiveLabel,
} from '../docs/design/production/feedback-reasons.mjs';

test('4 and 5 stars offer more positive hints, separately for guides and places', () => {
  for (const kind of ['guide', 'place']) {
    assert.ok(suggestedReasons(kind, 4).length >= 6, kind);
    assert.ok(suggestedReasons(kind, 5).length >= 8, kind);
    for (const score of [1, 2, 3]) {
      assert.ok(suggestedReasons(kind, score).length >= 3);
      assert.ok(suggestedReasons(kind, score).every((code) => EXISTING_REASON_CODES.includes(code)));
    }
    for (const score of [4, 5]) {
      const options = suggestedReasons(kind, score);
      assert.equal(new Set(options).size, options.length, `${kind} ${score}: no duplicated semantics`);
      assert.ok(options.every((code) => !suggestedReasons(kind, 2).includes(code)), `${kind} ${score}: no negative hints`);
      assert.ok(options.every((code) => [...EXISTING_REASON_CODES, ...PROPOSED_REASON_CODES].includes(code)));
    }
  }
});

test('new codes are explicitly proposals, not existing API reasons', () => {
  assert.equal(new Set(PROPOSED_REASON_CODES).size, PROPOSED_REASON_CODES.length);
  assert.ok(PROPOSED_REASON_CODES.every((code) => !EXISTING_REASON_CODES.includes(code)));
  assert.ok(suggestedReasons('guide', 5).some((code) => PROPOSED_REASON_CODES.includes(code)));
  assert.ok(suggestedReasons('place', 5).some((code) => PROPOSED_REASON_CODES.includes(code)));
  assert.ok(Object.keys(REASON_SUGGESTIONS.guide).length === 5);
});

test('suggestions fail closed for missing or invalid scores', () => {
  for (const score of [null, 0, 6, 3.5, NaN, undefined, '4']) {
    assert.deepEqual(suggestedReasons('guide', score), []);
  }
  assert.deepEqual(suggestedReasons('unknown', 5), []);
});

test('changing score drops incompatible selections without deleting matching ones', () => {
  assert.deepEqual(keepCompatibleReasons('guide', 4, ['too_long', 'audio_problem']), []);
  assert.deepEqual(keepCompatibleReasons('guide', 2, ['interesting_stories', 'good_mood']), []);
  assert.deepEqual(keepCompatibleReasons('guide', 3, ['too_long']), ['too_long']);
  assert.deepEqual(keepCompatibleReasons('guide', 5, ['interesting_stories', 'good_mood']), ['interesting_stories', 'good_mood']);
  assert.deepEqual(keepCompatibleReasons('guide', 4, ['fresh_city_view', 'clear_delivery']), ['clear_delivery']);
  assert.deepEqual(keepCompatibleReasons('place', 5, ['hard_to_reach', 'worth_visiting']), ['worth_visiting']);
});

test('all 8 supported locales have every proposed positive label', () => {
  const needed = new Set();
  for (const kind of ['guide', 'place']) for (const score of [4, 5]) {
    for (const code of suggestedReasons(kind, score)) needed.add(code);
  }
  for (const locale of ['en', 'be', 'uk', 'de', 'es', 'fr', 'cs', 'sv']) {
    for (const code of needed) {
      assert.ok(typeof POSITIVE_LABELS[locale]?.[code] === 'string' && POSITIVE_LABELS[locale][code].trim(), `${locale}:${code}`);
    }
  }
  assert.equal(positiveLabel('interesting_stories', 'unknown'), POSITIVE_LABELS.en.interesting_stories);
});

test('mockup wires neutral stars, friendly copy and labelled Send; no app change', () => {
  const source = readFileSync(new URL('../docs/design/production/feedback.mjs', import.meta.url), 'utf8');
  assert.match(source, /suggestedReasons\(kind, form\.score\)/);
  assert.match(source, /keepCompatibleReasons\(kind, value, form\.reasons\)/);
  assert.match(source, /positiveLabel\(code, state\.locale\)/);
  assert.match(source, /availableReasons\.slice\(0, 4\)/);
  assert.match(source, /showAllHints = true/);
  assert.match(source, /mustExpand/);
  assert.match(source, /w\('moreIdeas'\)/);
  assert.match(source, /button\(w\('sendReview'\)/);
  assert.match(source, /w\('reviewPlaceholder'\)/);
  assert.match(source, /w\('intro'\)/);
  assert.match(source, /be: 'Як прайшло\?'/);
  assert.doesNotMatch(source, /introGuide|introPlace/);
  assert.doesNotMatch(source, /fab\('send'/);
});
