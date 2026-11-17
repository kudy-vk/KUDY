import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const expoFor = (env) => {
  const stdout = execFileSync(
    process.execPath,
    ['-e', 'process.stdout.write(JSON.stringify(require("./app.config.js").expo))'],
    { cwd: repoRoot, env: { ...process.env, ...env }, encoding: 'utf8' },
  );
  return JSON.parse(stdout);
};

test('sandbox variant is a separate install that never collides with the store app', () => {
  const sandbox = expoFor({ EXPO_PUBLIC_SANDBOX: '1' });
  assert.equal(sandbox.name, 'KUDY Sandbox');
  assert.equal(sandbox.slug, 'kudy', 'slug stays the linked EAS project slug — only name and package differ');
  assert.equal(sandbox.android.package, 'by.kudy.app.sandbox');
  assert.equal(sandbox.ios.bundleIdentifier, 'by.kudy.app.sandbox');
});

test('without the sandbox flag the config stays the store app', () => {
  const store = expoFor({});
  assert.equal(store.name, 'KUDY');
  assert.equal(store.android.package, 'by.kudy.app');
  assert.equal(store.ios.bundleIdentifier, 'by.kudy.app');
});

test('demo mode wins over the sandbox flag — one evaluation, one package', () => {
  const demo = expoFor({ EXPO_PUBLIC_DEMO_MODE: '1', EXPO_PUBLIC_SANDBOX: '1' });
  assert.equal(demo.name, 'KUDY Demo');
  assert.equal(demo.android.package, 'by.kudy.app.demo');
});

test('sandbox keeps the brand icon set, unlike the demo mockup', () => {
  const { expo } = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8'));
  const sandbox = expoFor({ EXPO_PUBLIC_SANDBOX: '1' });
  assert.equal(sandbox.icon, expo.icon, 'sandbox reuses the brand icon');
  assert.deepEqual(sandbox.android.adaptiveIcon, expo.android.adaptiveIcon, 'sandbox keeps the adaptive icon layers');
});

test('sandbox and store variants carry the pinned EAS project id; demo (local mockup) does not', () => {
  const id = 'b13fc99c-bf6d-45bc-9017-e689f4f9511d';
  assert.equal(expoFor({}).extra.eas.projectId, id);
  assert.equal(expoFor({ EXPO_PUBLIC_SANDBOX: '1' }).extra.eas.projectId, id);
  assert.equal(expoFor({ EXPO_PUBLIC_SANDBOX: '1' }).slug, 'kudy', 'sandbox keeps the linked EAS project slug');
  assert.equal(expoFor({ EXPO_PUBLIC_DEMO_MODE: '1' }).extra?.eas, undefined, 'demo never talks to EAS');
});
