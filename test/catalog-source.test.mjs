import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCatalogSource } from '../controllers/catalogSource.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eas = JSON.parse(fs.readFileSync(path.join(repoRoot, 'eas.json'), 'utf8'));

function expoConfig(env) {
  const output = execFileSync(process.execPath, [
    '-e',
    'process.stdout.write(JSON.stringify(require("./app.config.js").expo))',
  ], {
    cwd: repoRoot,
    env: {
      ...process.env,
      EXPO_PUBLIC_DEMO_MODE: '',
      EXPO_PUBLIC_SANDBOX: '',
      EXPO_PUBLIC_DEV_CLIENT_BUILD: '',
      ...env,
    },
  });
  return JSON.parse(output.toString('utf8'));
}

test('EAS sandbox selects the embedded catalog and produces a separate APK identity', () => {
  const sandbox = eas.build.sandbox;
  assert.equal(sandbox.distribution, 'internal');
  assert.equal(sandbox.android.buildType, 'apk');
  assert.equal(sandbox.env.EXPO_PUBLIC_SANDBOX, '1');
  assert.deepEqual(resolveCatalogSource({ sandbox: sandbox.env.EXPO_PUBLIC_SANDBOX }), {
    origin: 'demo://embedded',
    embedded: true,
  });
  const config = expoConfig(sandbox.env);
  assert.equal(config.android.package, 'by.kudy.app.sandbox');
  assert.equal(config.ios.bundleIdentifier, 'by.kudy.app.sandbox');
  assert.equal(config.name, 'KUDY Sandbox');
});

test('EAS profile identities are selected in app.config.js, not unsupported build profile fields', () => {
  for (const profile of Object.values(eas.build)) {
    assert.equal(profile.android?.package, undefined);
    assert.equal(profile.ios?.bundleIdentifier, undefined);
  }
  const dev = expoConfig(eas.build.development.env);
  assert.equal(dev.android.package, 'by.kudy.app.dev');
  assert.equal(dev.ios.bundleIdentifier, 'by.kudy.app.dev');
  const production = expoConfig({});
  assert.equal(production.android.package, 'by.kudy.app');
  assert.equal(production.ios.bundleIdentifier, 'by.kudy.app');
});

test('an explicit sandbox catalog URL uses its real origin, not demo data', () => {
  assert.deepEqual(resolveCatalogSource({ sandbox: '1', origin: 'https://catalog.example.test' }), {
    origin: 'https://catalog.example.test',
    embedded: false,
  });
});

test('demo remains explicit and production without an origin remains unavailable', () => {
  assert.deepEqual(resolveCatalogSource({ demo: '1', origin: 'https://catalog.example.test' }), {
    origin: 'demo://embedded',
    embedded: true,
  });
  assert.deepEqual(resolveCatalogSource({ origin: 'https://catalog.example.test' }), {
    origin: 'https://catalog.example.test',
    embedded: false,
  });
  assert.equal(resolveCatalogSource({}), null);
});

test('the offline sandbox source includes a published route and discovery index', async () => {
  const { loadDemoText } = await import('../controllers/demoCatalog.ts');
  const catalog = JSON.parse(await loadDemoText('catalog.json'));
  assert.ok(catalog.routes.length > 0);
  assert.ok(catalog.discovery_index.path);
  const discovery = JSON.parse(await loadDemoText(catalog.discovery_index.path));
  assert.ok(discovery);
});

test('both app and device roots use the same selection before creating services', () => {
  const layout = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');
  const device = fs.readFileSync(path.join(repoRoot, 'controllers/deviceRoot.ts'), 'utf8');
  for (const source of [layout, device]) {
    assert.match(source, /resolveCatalogSource\(\{/);
    assert.match(source, /sandbox: process\.env\.EXPO_PUBLIC_SANDBOX/);
  }
  assert.match(device, /source\.embedded \? require\('\.\/demoCatalog\.ts'\)/);
  const explore = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/explore.tsx'), 'utf8');
  assert.match(explore, /embeddedCatalog \? \(/, 'offline sample content must display the demo notice');
});
