// npm-security remediation guard (#337, implementation-rules 1: config counts
// as code). The advisory remediation lives in the manifests and both
// lockfiles; reverting the overrides, downgrading any remediated package back
// into its advisory range, or silently re-resolving a vulnerable version must
// turn this suite red — nothing else in CI runs npm audit, so a silent revert
// would otherwise restore the vulnerable tree.
//
// Floors are the advisory-fixed versions (locked: GHSA ranges verified against
// the audit DB in #337):
//   root: decode-uri-component (GHSA-qr28-fpjm-wq7f high <= 0.5.0; also
//         GHSA-vcc3-ghjq-m6fr moderate <= 0.4.2) -> 0.5.1
//         postcss (GHSA-fxqj-rqcc-2cmp incomplete fix <= 8.5.22) -> 8.5.23
//         zod (GHSA-mrhx-c7xc-m3w5 < 4.6.6) -> 4.6.6
//         shell-quote (GHSA-pqg4-j6r4-53mv critical >= 1.8.4 < 1.11.0) -> 1.11.0
//         undici (>= 4.0.0 < 6.29.1; >= 8.0.0 < 8.12.2) -> 8.12.2
//         node-forge (<= 1.4.2) -> 1.4.3
//         fast-uri (< 3.1.9) -> 3.1.9
//         ip-address (GHSA-rxp7-6hxx-x8q5 <= 10.7.3) -> 10.7.4
//         source-map-js (GHSA-68fv-2mgg-jv7q < 1.2.2) -> 1.2.2
//   web:  maplibre-gl (GHSA-jrc7-96c5-q579 critical <= 6.4.0) -> 6.19.0
//         next (<= 15.5.27) -> 15.5.28
//         sharp (GHSA-wq5f-xc86-pv6w < 0.35.5) -> 0.35.5
//         source-map-js (< 1.2.2) -> 1.2.2
//         postcss (<= 8.5.22) -> 8.5.23
// Floors intentionally sit at what this remediation validated (pin-what-you-
// validated): a conscious future upgrade raises the version and stays green.
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
  const [vMajor, vMinor, vPatch] = String(version).split('.').map(Number);
  const [fMajor, fMinor, fPatch] = floor.split('.').map(Number);
  if (vMajor !== fMajor) return vMajor > fMajor;
  if (vMinor !== fMinor) return vMinor > fMinor;
  return vPatch >= fPatch;
}

function expectFloor(lock, pkg, floor, reason) {
  const actual = lock.packages?.[`node_modules/${pkg}`]?.version;
  assert.ok(actual && atLeast(actual, floor),
    `${pkg} lockfile version ${actual ?? '(missing)'} is below the advisory floor ${floor} — ${reason}`);
}

test('root overrides pin the advisory-fixed versions', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.overrides?.['decode-uri-component'], '0.5.1',
    'decode-uri-component must stay overridden to the only fixed release (0.5.1; GHSA-qr28-fpjm-wq7f affects <= 0.5.0, GHSA-vcc3-ghjq-m6fr affects <= 0.4.2)');
  assert.equal(pkg.overrides?.['postcss'], '^8.5.23',
    'postcss must stay overridden above the vulnerable <= 8.5.22 range');
  const zod = pkg.dependencies?.zod ?? pkg.devDependencies?.zod;
  assert.equal(zod, '4.6.7',
    'zod must stay on the advisory-fixed patch (GHSA-mrhx-c7xc-m3w5 affects < 4.6.6)');
});

test('root lockfile resolves every remediated package above its advisory floor', () => {
  const lock = readJson('package-lock.json');
  expectFloor(lock, 'decode-uri-component', '0.5.1',
    'GHSA-qr28-fpjm-wq7f (high) affects <= 0.5.0 — a revert re-resolves 0.2.2');
  expectFloor(lock, 'postcss', '8.5.23', 'the <= 8.5.22 range carries four advisories (2 high, 2 moderate)');
  expectFloor(lock, 'zod', '4.6.6', 'GHSA-mrhx-c7xc-m3w5 (high) affects < 4.6.6');
  expectFloor(lock, 'shell-quote', '1.11.0', 'GHSA-pqg4-j6r4-53mv (critical) affects >= 1.8.4 < 1.11.0');
  expectFloor(lock, 'undici', '8.12.2', 'undici carries 12 advisories across < 6.29.1 and >= 8.0.0 < 8.12.2');
  expectFloor(lock, 'node-forge', '1.4.3', 'node-forge carries 17 advisories affecting <= 1.4.2');
  expectFloor(lock, 'fast-uri', '3.1.9', 'fast-uri carries 4 advisories affecting < 3.1.9');
  expectFloor(lock, 'ip-address', '10.7.4', 'GHSA-rxp7-6hxx-x8q5 (moderate) affects <= 10.7.3');
  expectFloor(lock, 'source-map-js', '1.2.2', 'GHSA-68fv-2mgg-jv7q (high) affects < 1.2.2');
});

test('web keeps maplibre-gl and the semver fixes above their advisory floors', () => {
  const pkg = readJson('web', 'package.json');
  assert.match(pkg.dependencies?.['maplibre-gl'] ?? '', /^\^6\./,
    'web must keep maplibre-gl on 6.x — 5.x is inside the critical XSS range (GHSA-jrc7-96c5-q579 affects <= 6.4.0)');
  const lock = readJson('web', 'package-lock.json');
  expectFloor(lock, 'maplibre-gl', '6.19.0', 'GHSA-jrc7-96c5-q579 (critical XSS) affects <= 6.4.0');
  expectFloor(lock, 'next', '15.5.28', 'next carries 4 advisories affecting <= 15.5.27');
  expectFloor(lock, 'sharp', '0.35.5', 'GHSA-wq5f-xc86-pv6w (high) affects < 0.35.5');
  expectFloor(lock, 'source-map-js', '1.2.2', 'GHSA-68fv-2mgg-jv7q (high) affects < 1.2.2');
  expectFloor(lock, 'postcss', '8.5.23', 'the <= 8.5.22 range carries four advisories');
});
