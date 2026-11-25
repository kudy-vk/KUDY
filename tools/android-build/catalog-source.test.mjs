import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCatalogSource } from '../../controllers/catalogSource.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the phone sandbox uses validated embedded catalog bytes without a remote origin', () => {
  assert.deepEqual(resolveCatalogSource({ sandbox: '1' }), {
    origin: 'demo://embedded',
    embedded: true,
  });
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
  const { loadDemoText } = await import('../../controllers/demoCatalog.ts');
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
