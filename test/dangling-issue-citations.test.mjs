// #236 — dangling issue citations out of the tracked sources. Kit components,
// the design canon, the architecture map, results docs, the design-QA spec and
// the G25 contact sheets cited issues 430 and 339, which do not exist in
// kudy-vk/KUDY (404; the original cards live in the superseded vokhandcrafts/KUDY
// repo — both closed — and the decisions they recorded stay reachable in-repo
// through the canon §5 text (2026-10-03) and the components-zone note of
// 19_class_and_module_map.md (2026-09-27)). Every citation was replaced with an
// anchor to those records — the option the issue itself names.
// #241 (2026-11-12) — the same defect class on the remaining dead numbers
// (284, 292, 313, 338, 344, 348, 349, 350, 352, 353, 402, 403, 404, 432; all
// 404 in kudy-vk/KUDY on 2026-11-12, the original cards closed in
// vokhandcrafts/KUDY): a second pass anchored every citation to the canonical
// in-repo record of its decision — the design canon (§3 fonts, §5 buttons and
// dialogs, §9 street readability), screens-and-transitions.md,
// docs/agent-tasks/app/G06.10.md, results G25.04 (the icon layer),
// 15_guide_decisions.md (R07), 16_delivery_backlog.md (G08.05) and the
// development_setup.md device-run update (2026-09-27). The repo walk
// below is what makes npm test fail when a dead citation is re-added
// (implementation-rules 1). If one of these numbers ever becomes a real issue,
// remove it from the list with a dated revalidation note in the PR that adds
// the citation back.
// #264 (2026-11-13) — the third pass of the same defect class on the
// localization/status-bar/dark-theme numbers (280, 305, 347, 351, 428, 436,
// 523, 524, 543, 544, 545, 546, 547, 548, 550, 558, 559, 566, 598, 611, 623,
// 669, 670, 711, 810; all 404 in kudy-vk/KUDY on 2026-11-13, the original
// cards in vokhandcrafts/KUDY): every citation was re-anchored —
// 16_delivery_backlog.md (G06.05, G14.04.d),
// 2026-10-03-single-source-translations.md (G21.10–G21.14, G21.16, G21.19,
// G21.25–G21.27), G21.42-chinese-language.md (G21.42–G21.50),
// docs/design/dark-theme.md (the status bar and the dark theme),
// android-play-readiness/README.md (APR-05), 2026-10-04-bounded-work.md
// (G22.06), review-must-flag.md (598) and the dated records whose dead
// references were de-hashed in place. Carriers are the generator notes plus
// hand-written comments and docs; generated catalogues follow the generator.
// The guard file itself stays scannable: it never spells the dead tokens
// literally — fixtures build them by concatenation, and the regex is assembled
// from the number list — otherwise a working scan would fail on this very file.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Issue numbers confirmed dangling (404 in kudy-vk/KUDY, re-verified 2026-11-12
// for the full list; the original cards live in the superseded vokhandcrafts/KUDY
// repo, all closed). The token is the hash sign glued to a dead number with a
// word boundary on the right: "3399ff" or "4300" must not match, a citation
// "(issue " + hash + number + ")" must.
const DEAD_NUMBERS = [280, 284, 292, 305, 313, 338, 339, 344, 347, 348, 349, 350, 351, 352, 353, 402, 403, 404, 428, 430, 432, 436, 523, 524, 543, 544, 545, 546, 547, 548, 550, 558, 559, 566, 598, 611, 623, 669, 670, 711, 810];
const TOKEN = (n) => `#${n}`;
const DEAD = new RegExp('#(' + DEAD_NUMBERS.join('|') + ')(?![0-9A-Za-z])', 'g');

// Scanned formats. The file list comes from git with NO shell in between:
// an execSync string command would let /bin/sh expand "*.md" to the three root
// files, narrowing the pathspecs and blinding the guard to docs/** and test/**
// (the guard-shell-glob-blind defect this file was rewritten against).
const SCANNED = ['*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', '*.cjs', '*.md', '*.html', '*.css'];

function findDead(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const match of line.matchAll(DEAD)) {
      hits.push({ line: i + 1, match: match[0] });
    }
  });
  return hits;
}

test('tracked sources carry no citations of the confirmed-dangling issue numbers', () => {
  const files = execFileSync('git', ['ls-files', '-z', '--', ...SCANNED], { cwd: REPO })
    .toString()
    .split('\0')
    .filter(Boolean);
  const violations = [];
  for (const rel of files) {
    const text = fs.readFileSync(path.join(REPO, rel), 'utf8');
    for (const hit of findDead(text)) {
      violations.push(`${rel}:${hit.line}: "${hit.match}"`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    'citations of non-existent issue numbers (430/339, the 284–432 series and the localization/status-bar/dark-theme series from 280 to 810) — anchor the decision to its canonical record instead (design canon / screens-and-transitions.md / 16_delivery_backlog.md / 2026-10-03-single-source-translations.md / G21.42-chinese-language.md / docs/design/dark-theme.md / docs/agent-tasks/results / development_setup.md)',
  );
});

test('the finder flags a citation and names the line', () => {
  assert.deepEqual(findDead('// Lives in components/, not app/ (issue ' + TOKEN(339) + ').'), [
    { line: 1, match: TOKEN(339) },
  ]);
  assert.deepEqual(findDead('рашэнне ўладара 2026-10-03, issue ' + TOKEN(430) + '), тэскі'), [
    { line: 1, match: TOKEN(430) },
  ]);
  // The 264 series rides the same matcher: a localization citation and a
  // dark-theme citation both fail.
  assert.deepEqual(findDead('catalogue joined (issue ' + TOKEN(544) + '), the dark theme (' + TOKEN(436) + ')'), [
    { line: 1, match: TOKEN(544) },
    { line: 1, match: TOKEN(436) },
  ]);
});

test('a real issue number, a hex color and a longer number stay untouched', () => {
  assert.deepEqual(findDead('#236 — dangling issue citations; PR #235 closes it.'), []);
  assert.deepEqual(findDead('ghost-пара `#6b7280`, hex `#3399ff` і `#4300`'), []);
});

// #275 (2026-11-13) — the header restates the scan classes; a number added to
// DEAD_NUMBERS without a header mention is the stale-restatement defect the
// #264 header commit shipped (the three numbers commit 6340bc5 added were
// missing from it). This walk is the reverted-line check for the header itself
// (implementation-rules 1). The finder regex never matches this file because
// the dead tokens stay out of every line below; the same discipline applies to
// this comment — it names no dead number literally.
test('the header comment enumerates every dead number the guard scans for', () => {
  const header = fs
    .readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('//'))
    .join('\n');
  const missing = DEAD_NUMBERS.filter((n) => !new RegExp(`(?<![0-9])${n}(?![0-9])`).test(header));
  assert.deepEqual(
    missing,
    [],
    'dead numbers missing from the guard file header — when extending DEAD_NUMBERS, list every new number and its re-anchored card range in the header comment (the stale-restatement defect #275 fixed)',
  );
});
