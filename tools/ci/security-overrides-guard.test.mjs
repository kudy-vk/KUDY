// npm-security remediation guard (#337, implementation-rules 1: config counts
// as code). The advisory remediation lives in the manifests and both
// lockfiles; reverting the overrides, downgrading any remediated package back
// into its advisory range — at ANY nesting level of either lockfile — must
// turn this suite red. Nothing else in CI runs npm audit, so a silent revert
// would otherwise restore the vulnerable tree.
// A lockfile whose packages map is missing, empty or not a plain object fails
// closed too (#341, #343): zero entries would pass vacuously, and a non-object
// value (e.g. "junk") would pass over string index keys — both contradict
// this header.
//
// Vulnerable ranges are the audit-DB ranges verified in #337 for the MAJORS
// the remediated tree uses (a version is guarded against the ranges below; a
// floor-style check cannot express multi-range advisories and would
// false-fail the legitimate nested @expo/cli copy of undici 6.29.1). Majors
// outside the remediated tree (e.g. undici 7.x, fast-uri 4.x, next 16.x,
// shell-quote below 1.8.4) are not covered here — they belong to the audit
// reruns tracked by https://github.com/kudy-vk/KUDY/issues/339:
//   root: decode-uri-component (GHSA-qr28-fpjm-wq7f high >= 0.5.0? — no:
//         high <= 0.5.0, fixed 0.5.1; also GHSA-vcc3-ghjq-m6fr moderate
//         <= 0.4.2) -> vulnerable [0.0.0, 0.5.1)
//         postcss (four advisories affecting <= 8.5.22) -> [0.0.0, 8.5.23)
//         zod (GHSA-mrhx-c7xc-m3w5 < 4.6.6) -> [0.0.0, 4.6.6)
//         shell-quote (GHSA-pqg4-j6r4-53mv critical >= 1.8.4 < 1.11.0) ->
//             [1.8.4, 1.11.0)
//         undici (12 advisories: >= 4.0.0 < 6.29.1 and >= 8.0.0 < 8.12.2)
//         node-forge (17 advisories affecting <= 1.4.2) -> [0.0.0, 1.4.3)
//         fast-uri (4 advisories < 3.1.9) -> [0.0.0, 3.1.9)
//         ip-address (GHSA-rxp7-6hxx-x8q5 <= 10.7.3) -> [0.0.0, 10.7.4)
//         source-map-js (GHSA-68fv-2mgg-jv7q < 1.2.2) -> [0.1.0, 1.2.2)
//   web:  maplibre-gl (GHSA-jrc7-96c5-q579 critical <= 6.4.0) -> [0.0.0, 6.5.0)
//         next (4 advisories <= 15.5.27) -> [0.0.0, 15.5.28)
//         sharp (GHSA-wq5f-xc86-pv6w < 0.35.5) -> [0.0.0, 0.35.5)
//         source-map-js -> [0.1.0, 1.2.2)
//         postcss -> [0.0.0, 8.5.23)
// NOTE on decode-uri-component 0.5.1: it is ESM-only, while query-string 7.1.3
// (expo-router's dependency) requires it directly and calls the CJS export.
// On CJS require hosts only `stringify` keeps working (the only
// path expo-router reaches today); `parse`/`parseUrl`/`pick`/`exclude` would
// throw `TypeError: decodeComponent is not a function` — a documented latent
// constraint of the override, re-checked by the audit reruns tracked by
// https://github.com/kudy-vk/KUDY/issues/339.
// Floors sit at what this remediation validated (pin-what-you-validated): a
// conscious future upgrade raises versions and stays green.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));

// [minInclusive, maxExclusive) semver-interval; major-aware for the common
// case where the advisory spans whole majors. Prerelease/build suffixes are
// stripped and their numeric prefix is compared fail-closed: a prerelease
// whose prefix sits inside the advisory range counts as vulnerable, and a
// malformed version has no numeric prefix to clear the range.
function cmp(a, b) {
  const [aMaj, aMin, aPat] = String(a)
    .replace(/[-+].*$/, '')
    .split('.')
    .map((token) => (Number.isNaN(Number(token)) ? -1 : Number(token)));
  const [bMaj, bMin, bPat] = b.split('.').map(Number);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}
const inVulnerableRange = (version, [min, max]) =>
  cmp(version, min) >= 0 && cmp(version, max) < 0;

// Every entry of either lockfile whose key is the top-level
// `node_modules/<pkg>` or a nested `.../node_modules/<pkg>` must sit outside
// the vulnerable ranges. Nested copies re-resolve on dependency bumps, so
// they get the same check as the root copy.
function assertPackageSafe(lock, lockName, pkg, ranges) {
  const matcher = new RegExp(`(^|/)node_modules/${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const packages = lock.packages ?? {};
  assert.ok(
    packages && typeof packages === 'object' && !Array.isArray(packages) && Object.keys(packages).length > 0,
    `${lockName}: the packages map is missing or empty — or not a plain object; a lockfile without resolved packages must fail closed, not stay green (#341, #343)`,
  );
  for (const [key, entry] of Object.entries(packages)) {
    if (!matcher.test(key)) continue;
    const version = entry?.version;
    assert.ok(version, `${lockName}: ${key} has no version`);
    assert.match(
      version,
      /^\d+\.\d+\.\d+(?:[-+].*)?$/,
      `${lockName}: ${key} resolves "${version}" — not a semver version; a corrupt lockfile must fail closed, not pass silently`,
    );
    const hit = ranges.find((range) => inVulnerableRange(version, range));
    if (hit) {
      assert.fail(
        `${lockName}: ${key} resolves ${version}, inside the vulnerable range [${hit[0]}, ${hit[1]}) — a revert or bad re-resolution must fail here (no CI step runs npm audit)`,
      );
    }
  }
}

const ROOT_RANGES = {
  'decode-uri-component': [['0.0.0', '0.5.1']],
  postcss: [['0.0.0', '8.5.23']],
  zod: [['0.0.0', '4.6.6']],
  'shell-quote': [['1.8.4', '1.11.0']],
  undici: [['4.0.0', '6.29.1'], ['8.0.0', '8.12.2']],
  'node-forge': [['0.0.0', '1.4.3']],
  'fast-uri': [['0.0.0', '3.1.9']],
  'ip-address': [['0.0.0', '10.7.4']],
  'source-map-js': [['0.1.0', '1.2.2']],
};

const WEB_RANGES = {
  'maplibre-gl': [['0.0.0', '6.5.0']],
  next: [['0.0.0', '15.5.28']],
  sharp: [['0.0.0', '0.35.5']],
  'source-map-js': [['0.1.0', '1.2.2']],
  postcss: [['0.0.0', '8.5.23']],
};

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

test('root lockfile has no vulnerable version of any remediated package, at any nesting level', () => {
  const lock = readJson('package-lock.json');
  for (const [pkg, ranges] of Object.entries(ROOT_RANGES)) {
    assertPackageSafe(lock, 'root lockfile', pkg, ranges);
  }
});

test('web lockfile has no vulnerable version of any remediated package, at any nesting level', () => {
  const lock = readJson('web', 'package-lock.json');
  for (const [pkg, ranges] of Object.entries(WEB_RANGES)) {
    assertPackageSafe(lock, 'web lockfile', pkg, ranges);
  }
});

test('negative: a root lockfile copy with the packages map dropped fails closed (#341)', () => {
  const lock = readJson('package-lock.json');
  const stripped = { ...lock };
  delete stripped.packages;
  assert.throws(
    () => assertPackageSafe(stripped, 'root lockfile copy (packages dropped)', 'zod', ROOT_RANGES.zod),
    (err) => err instanceof assert.AssertionError && /missing or empty/.test(err.message),
    'a lockfile without the packages map must fail closed, not iterate zero entries and stay green',
  );
});

test('negative: a web lockfile copy with an empty packages map fails closed (#341)', () => {
  const lock = readJson('web', 'package-lock.json');
  const emptied = { ...lock, packages: {} };
  assert.throws(
    () => assertPackageSafe(emptied, 'web lockfile copy (empty packages)', 'postcss', WEB_RANGES.postcss),
    (err) => err instanceof assert.AssertionError && /missing or empty/.test(err.message),
    'a lockfile with an empty packages map must fail closed, not iterate zero entries and stay green',
  );
});

test('negative: a root lockfile copy with a non-object packages value fails closed (#343)', () => {
  const lock = readJson('package-lock.json');
  const corrupted = { ...lock, packages: 'junk' };
  assert.throws(
    () => assertPackageSafe(corrupted, 'root lockfile copy (packages: "junk")', 'zod', ROOT_RANGES.zod),
    (err) => err instanceof assert.AssertionError && /missing or empty/.test(err.message),
    'a lockfile whose packages holds a non-object value must fail closed, not pass vacuously over string index keys',
  );
});
