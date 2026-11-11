// #236 — dangling issue citations out of the tracked sources. Kit components,
// the design canon, the architecture map, results docs, the design-QA spec and
// the G25 contact sheets cited issues 430 and 339, which do not exist in
// kudy-vk/KUDY (404; the migration map covers only old 644–1009 → 3–109,
// so no renumbering target exists either). The decisions they pointed at stay
// reachable through the canon §5 text (2026-10-03) and the components-zone
// note of 19_class_and_module_map.md, so every citation was replaced with an
// anchor to those records. The repo walk below is what makes npm test fail
// when a dead citation is re-added (implementation-rules 1). If one of these
// numbers ever becomes a real issue, remove it from the list with a dated
// revalidation note in the PR that adds the citation back.
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

// Issue numbers confirmed dangling (404 in kudy-vk/KUDY, absent from the
// migration map). The token is the hash sign glued to a dead number with a
// word boundary on the right: "3399ff" or "4300" must not match, a citation
// "(issue " + hash + number + ")" must.
const DEAD_NUMBERS = [430, 339];
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
    'citations of non-existent issues 430/339 — anchor the decision to its canonical record instead (design canon §5 / 19_class_and_module_map.md)',
  );
});

test('the finder flags a citation and names the line', () => {
  assert.deepEqual(findDead('// Lives in components/, not app/ (issue ' + TOKEN(339) + ').'), [
    { line: 1, match: TOKEN(339) },
  ]);
  assert.deepEqual(findDead('рашэнне ўладара 2026-10-03, issue ' + TOKEN(430) + '), тэскі'), [
    { line: 1, match: TOKEN(430) },
  ]);
});

test('a real issue number, a hex color and a longer number stay untouched', () => {
  assert.deepEqual(findDead('#236 — dangling issue citations; PR #235 closes it.'), []);
  assert.deepEqual(findDead('ghost-пара `#6b7280`, hex `#3399ff` і `#4300`'), []);
});
