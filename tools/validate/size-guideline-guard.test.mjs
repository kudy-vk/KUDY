// G18.04 — guard for the size guideline in the review rules (issue #167).
// Checks docs/agent-rules/code-review.md keeps the "Size orientation — one phrase, not
// dogma" section with the ≤400-lines / ≤12-public-methods orientation and the one-phrase
// reviewer obligation. Fails if the section is removed, duplicated, or any of those
// anchors is lost. The guideline lives only in code-review.md — this guard pins that
// single home.
//
// #489 extends the same guard to the "PR size warning — derived design artifacts"
// section: the shared judge gate (pr-size.mjs, Low pr-size-over) stays mechanical and
// unsuppressed, while the repo documents which derived design artifacts may exceed the
// threshold as one design release. Same parser, second pinned section.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const RULES = path.join(REPO, 'docs', 'agent-rules', 'code-review.md');

const HEADING = '### Size orientation — one phrase, not dogma';
const ANCHORS = [
  '400',
  '12 public methods',
  'one phrase',
  'orientation, not a gate',
  'next real touch',
];

const PR_SIZE_HEADING = '### PR size warning — derived design artifacts';
const PR_SIZE_ANCHORS = [
  'pr-size-over',
  'docs/superpowers/specs/**',
  'docs/design/production/*.html',
  'docs/design/brand/outputs/**',
  'naming this section',
  'never suppressed',
  'only these listed classes',
];

// Reads the rules file, returns the section body (up to the next real heading;
// `#` lines inside ``` fences are body, not boundaries). Throws on a missing file, a
// missing or duplicated section, or a lost anchor.
function checkSection(heading, anchors, label, filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`review rules file is missing or unreadable: ${filePath}`);
  }
  const lines = text.split('\n');
  const hits = lines.reduce((n, line) => (line.trim() === heading ? n + 1 : n), 0);
  if (hits === 0) {
    throw new Error(`${label} section is missing from code-review.md: "${heading}"`);
  }
  if (hits > 1) {
    throw new Error(`${label} section appears ${hits} times in code-review.md`);
  }
  const at = lines.findIndex((line) => line.trim() === heading);
  const body = [];
  let inFence = false;
  for (let i = at + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) inFence = !inFence;
    if (!inFence && line.startsWith('#')) break;
    body.push(line);
  }
  const bodyText = body.join('\n');
  for (const anchor of anchors) {
    if (!bodyText.includes(anchor)) {
      throw new Error(`${label} lost its anchor "${anchor}" — the requirement or its wording was removed`);
    }
  }
  return bodyText;
}

function checkSizeGuideline(filePath = RULES) {
  return checkSection(HEADING, ANCHORS, 'size guideline', filePath);
}

function checkPrSizeException(filePath = RULES) {
  return checkSection(PR_SIZE_HEADING, PR_SIZE_ANCHORS, 'PR size exception', filePath);
}

// Writes a mutated copy of the rules file to a temp path and runs the guard on it.
// G21.06: the removal patterns are LF-anchored and this is a text-level
// mutation, so the source text is read through the LF idiom first — on a CRLF
// checkout the raw bytes would otherwise defeat the removal and mask the
// defect the mutation asserts (rule 3).
function checkMutated(mutate, check = checkSizeGuideline) {
  const text = mutate(fs.readFileSync(RULES, 'utf8').replace(/\r\n/g, '\n'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g1804-'));
  try {
    const copy = path.join(dir, 'code-review.md');
    fs.writeFileSync(copy, text);
    return check(copy);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the real review rules pass the size-guideline guard', () => {
  const body = checkSizeGuideline(RULES);
  assert.ok(body.trim().length > 0, 'guideline section body is non-empty');
});

test('the guard fails when the rules file is removed', () => {
  assert.throws(() => checkSizeGuideline(path.join(REPO, 'docs', 'agent-rules', 'code-review-missing.md')),
    /missing or unreadable/);
});

test('the guard fails when the guideline section is removed', () => {
  assert.throws(() => checkMutated((t) => t.replace(HEADING + '\n', '')),
    /size guideline section is missing/);
});

test('the guard fails when the guideline section is duplicated', () => {
  assert.throws(() => checkMutated((t) => t.replace('### Recurring corpus classes',
    `${HEADING}\n\n### Recurring corpus classes`)),
  /appears 2 times/);
});

test('the guard fails when any anchor of the guideline is lost', () => {
  for (const anchor of ANCHORS) {
    assert.throws(() => checkMutated((t) => t.split(anchor).join('')),
      /lost its anchor|section is missing/,
      `no rejection when "${anchor}" is stripped from the rules`);
  }
});

test('the guideline body is collected through a fenced code block', () => {
  // A fence with a `#` comment line mid-section must not truncate body extraction —
  // the anchors after it are still present, so the guard must pass (old extraction
  // stopped at the `#` line and reported false anchor loss).
  const withFence = (t) => t.replace('a contract asking to be extracted?',
    'a contract asking to be extracted?\n\n```\n# example shell comment\n```\n');
  const body = checkMutated(withFence);
  assert.ok(body.includes('# example shell comment'), 'fenced content stays inside the section body');
});

// #489 — the PR-size exception section is pinned with the same mechanism.
test('the real review rules pass the PR-size exception guard', () => {
  const body = checkPrSizeException(RULES);
  assert.ok(body.trim().length > 0, 'exception section body is non-empty');
});

test('the guard fails when the PR-size exception section is removed', () => {
  assert.throws(() => checkMutated((t) => t.replace(PR_SIZE_HEADING + '\n', ''), checkPrSizeException),
    /PR size exception section is missing/);
});

test('the guard fails when the PR-size exception section is duplicated', () => {
  assert.throws(() => checkMutated((t) => t.replace('### Recurring corpus classes',
    `${PR_SIZE_HEADING}\n\n### Recurring corpus classes`), checkPrSizeException),
  /appears 2 times/);
});

test('the guard fails when any anchor of the PR-size exception is lost', () => {
  for (const anchor of PR_SIZE_ANCHORS) {
    assert.throws(() => checkMutated((t) => t.split(anchor).join(''), checkPrSizeException),
      /lost its anchor|section is missing/,
      `no rejection when "${anchor}" is stripped from the rules`);
  }
});
