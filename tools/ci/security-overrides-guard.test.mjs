// npm-security remediation guard (#337, implementation-rules 1: config counts
// as code). The advisory remediation pins live in the manifests and are
// resolved into both lockfiles; reverting the overrides, downgrading zod or
// moving web's maplibre-gl back under the vulnerable range must turn this
// suite red — nothing else in CI runs npm audit, so a silent revert would
// otherwise restore the vulnerable tree.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));

// Minimal semver comparison for the pinned floors; no dependency on the
// semver package (the guard must not depend on the tree it guards).
function atLeast(version, floor) {
  const [vMajor, vMinor, vPatch] = version.split('.').map(Number);
  const [fMajor, fMinor, fPatch] = floor.split('.').map(Number);
  if (vMajor !== fMajor) return vMajor > fMajor;
  if (vMinor !== fMinor) return vMinor > fMinor;
  return vPatch >= fPatch;
}

test('root overrides pin the advisory-fixed versions', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.overrides?.['decode-uri-component'], '0.5.1',
    'decode-uri-component must stay overridden to the only fixed release (0.5.1; GHSA-vcc3-ghjq-m6fr affects <= 0.5.0)');
  assert.equal(pkg.overrides?.['postcss'], '^8.5.23',
    'postcss must stay overridden above the vulnerable <= 8.5.22 range');
  const zod = pkg.dependencies?.zod ?? pkg.devDependencies?.zod;
  assert.equal(zod, '4.6.7',
    'zod must stay on the advisory-fixed patch (GHSA-mrhx-c7xc-m3w5 affects < 4.6.6)');
});

test('root lockfile resolves the overridden packages to the fixed versions', () => {
  const lock = readJson('package-lock.json');
  const duc = lock.packages?.['node_modules/decode-uri-component']?.version;
  assert.equal(duc, '0.5.1',
    'root lockfile must resolve decode-uri-component to 0.5.1 — a revert re-resolves 0.2.2 (vulnerable to GHSA-vcc3-ghjq-m6fr)');
  const postcss = lock.packages?.['node_modules/postcss']?.version;
  assert.ok(atLeast(postcss ?? '0.0.0', '8.5.23'),
    `root lockfile must resolve postcss above the vulnerable <= 8.5.22 range, got ${postcss}`);
  const zod = lock.packages?.['node_modules/zod']?.version;
  assert.ok(atLeast(zod ?? '0.0.0', '4.6.6'),
    `root lockfile must resolve zod above the vulnerable < 4.6.6 range, got ${zod}`);
});

test('web keeps maplibre-gl above the critical XSS advisory range', () => {
  const pkg = readJson('web', 'package.json');
  assert.match(pkg.dependencies?.['maplibre-gl'] ?? '', /^\^6\./,
    'web must keep maplibre-gl on 6.x — 5.x is inside the critical XSS range (GHSA-jrc7-96c5-q579 affects <= 6.4.0)');
  const lock = readJson('web', 'package-lock.json');
  const maplibre = lock.packages?.['node_modules/maplibre-gl']?.version;
  assert.ok(atLeast(maplibre ?? '0.0.0', '6.19.0'),
    `web lockfile must resolve maplibre-gl to >= 6.19.0, got ${maplibre}`);
});
