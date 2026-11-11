// #236 — dangling issue citations out of the tracked sources. Kit components,
// the design canon, the architecture map, results docs, the design-QA spec and
// the G25 contact sheets cited issues #430 and #339, which do not exist in
// kudy-vk/KUDY (GitHub API 404 on both; the migration map covers only old
// #644–#1009 → #3–#109, so no renumbering target exists either). The decisions
// they pointed at stay reachable through the canon §5 text (2026-10-03) and the
// components-zone note of 19_class_and_module_map.md, so every citation was
// replaced with an anchor to those records. The repo walk below is what makes
// npm test fail when a dead citation is re-added (implementation-rules 1).
// If one of these numbers ever becomes a real issue, remove it from the list
// with a dated revalidation note in the PR that adds the citation back.
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Issue numbers confirmed dangling (404 in kudy-vk/KUDY, absent from the
// migration map). Word-boundary on both sides: `#3399ff` or `#4300` must not
// match, `#339)` and `(issue #430` must.
const DEAD = /#(430|339)(?![0-9A-Za-z])/g;
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
  const files = execSync('git ls-files -z -- ' + SCANNED.join(' '), { cwd: REPO })
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
    'citations of non-existent issues #430/#339 — anchor the decision to its canonical record instead (design canon §5 / 19_class_and_module_map.md)',
  );
});

test('the finder flags a citation and names the line', () => {
  assert.deepEqual(findDead('// Lives in components/, not app/ (issue #339).'), [
    { line: 1, match: '#339' },
  ]);
  assert.deepEqual(findDead('рашэнне ўладара 2026-10-03, issue #430), тэскі'), [
    { line: 1, match: '#430' },
  ]);
});

test('a real issue number, a hex color and a longer number stay untouched', () => {
  assert.deepEqual(findDead('#236 — dangling issue citations; PR #235 closes it.'), []);
  assert.deepEqual(findDead('ghost-пара `#6b7280`, hex `#3399ff` и `#4300`'), []);
});
