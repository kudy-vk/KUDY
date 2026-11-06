import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const jestConfig = readFileSync(join(root, 'jest.config.js'), 'utf8');

test('guard: the app/ component suite is wired into npm test (implementation-rules 7)', () => {
  assert.match(
    pkg.scripts.test,
    /&& jest --config jest\.config\.js$/,
    'npm test must run jest (jest-expo, app/**/*.test.tsx) after the node --test suites'
  );
  assert.match(jestConfig, /preset:\s*["']jest-expo["']/, 'jest config must use the jest-expo preset');
  assert.match(
    jestConfig,
    /app\/\*\*\/\*\.test\.tsx/,
    'jest config must match app/**/*.test.tsx'
  );
  assert.match(
    jestConfig,
    /components\/\*\*\/\*\.test\.tsx/,
    'jest config must match components/**/*.test.tsx (issue #339: the guide-card suite lives there — reverting the glob would silently drop it from npm test)'
  );
});

test('guard: map-menu behavioral suites remain in the root runners', () => {
  const folder = 'docs/design/brand/outputs/menu-map-city-only';
  for (const suite of ['magnet.test.mjs', 'amber-light.test.mjs', 'native/model.test.mjs']) {
    assert.ok(pkg.scripts.test.includes(`${folder}/${suite}`), `npm test must run ${suite}`);
  }
  assert.ok(
    jestConfig.includes(`${folder}/native/**/*.test.tsx`),
    'Jest must discover the map-menu responder and accessibility suite',
  );
});

// #132: jest's 5000 ms default per-test timeout fails the heavy render suites
// under full-run CPU contention on the dev host (hint-card, discovery, place
// timed out in the first ci:local run; the same tests take 8.6 s idle). The
// node --test half of npm test pins 60000 ms for the same reason; dropping
// this pin must turn this guard red (implementation-rules 1).
test('guard: jest runs on the 60 s per-test timeout contract, not the 5 s default', () => {
  assert.match(
    jestConfig,
    /testTimeout:\s*60000/,
    'jest config must pin testTimeout: 60000 — the 5 s default fails heavy render suites under full-run CPU contention'
  );
});

// G06.10.f (issue #406): the reanimated base must stay jest-mocked through
// the official mock plus the controllable useReducedMotion stub — dropping
// the mapping loads the real base and its worklet runtime, which jest
// cannot run (implementation-rules 1: the wiring itself is guarded).
test('guard: the reanimated base is mocked with the reduce-motion seam (G06.10.f)', () => {
  assert.match(
    jestConfig,
    /"\^react-native-reanimated\$"/,
    'jest config must map react-native-reanimated to the official-mock stand-in'
  );
  assert.match(
    jestConfig,
    /"\^react-native-reanimated\/mock\$"/,
    'the mock subpath must map to its own delegator — expo-router\'s testing-library factory returns require("react-native-reanimated/mock") and would hand the app suites the stub-less official mock'
  );
  const standIn = readFileSync(join(root, 'test', 'reanimated-stand-in.js'), 'utf8');
  assert.match(
    standIn,
    /react-native-reanimated/,
    'the stand-in must build on the official mock, not reimplement the base'
  );
  assert.match(
    standIn,
    /useReducedMotion/,
    'the official mock omits useReducedMotion — the motion tests need the controllable stub'
  );
});
