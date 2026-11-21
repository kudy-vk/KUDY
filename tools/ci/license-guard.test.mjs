// Licensing contract guard (implementation-rules 1: config counts as code).
// The canon is LICENSE — PolyForm Strict 1.0.0. Reverting LICENSE to a laxer
// PolyForm text, dropping the copying prohibition from README, or pointing a
// package.json away from the license file must turn this suite red.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('LICENSE is PolyForm Strict 1.0.0 with the licensor notice', () => {
  const license = read('LICENSE');
  assert.equal(license.split(/\r?\n/)[0], '# PolyForm Strict License 1.0.0');
  assert.match(license, /<https:\/\/polyformproject\.org\/licenses\/strict\/1\.0\.0>/, 'canonical URL');
  assert.match(
    license,
    /^Required Notice: Copyright \(c\) 2026 vokhandcrafts \(https:\/\/github\.com\/vokhandcrafts\)$/m,
    'licensor notice survives'
  );
  // The Strict grant excludes distribution and changes; a laxer text (for
  // example PolyForm Noncommercial) grants both — those sections must not
  // come back without a conscious license change.
  assert.doesNotMatch(license, /^## Distribution License$/m, 'Strict grants no distribution rights');
  assert.doesNotMatch(license, /^## Changes and New Works License$/m, 'Strict grants no change rights');
});

test('README leads with the copying prohibition and names the license', () => {
  const readme = read('README.md');
  assert.match(readme, /Капіяваць і распаўсюджваць код нельга/);
  assert.match(readme, /PolyForm Strict License 1\.0\.0/);
});

test('package.json license fields point readers at LICENSE', () => {
  for (const file of ['package.json', path.join('web', 'package.json')]) {
    const parsed = JSON.parse(read(file));
    assert.equal(parsed.license, 'SEE LICENSE IN LICENSE', file);
  }
});

test('lockfile mirrors carry the same license token as package.json', () => {
  for (const lock of ['package-lock.json', path.join('web', 'package-lock.json')]) {
    const parsed = JSON.parse(read(lock));
    assert.equal(parsed.packages?.['']?.license, 'SEE LICENSE IN LICENSE', lock);
  }
});
