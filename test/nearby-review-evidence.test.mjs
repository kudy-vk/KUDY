import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('Nearby design-QA report points to the tracked GPS watchdog regression', () => {
  const report = readFileSync(new URL('../docs/design-qa/reports/2026-11-26-nearby-live-map.md', import.meta.url), 'utf8');
  assert.match(report, /`app\/nearby-location-watch\.test\.tsx`/);
  assert.doesNotMatch(report, /`components\/nearby-location-watch\.test\.tsx`/);
  assert.ok(existsSync(new URL('../app/nearby-location-watch.test.tsx', import.meta.url)));
});

test('Nearby polling explanation agrees with the status observer and mode handovers', () => {
  const controller = readFileSync(new URL('../controllers/nearby/nearbySurfaceController.ts', import.meta.url), 'utf8');
  assert.match(controller, /location\.onStatusChange\(read\)/);
  assert.match(controller, /Polling remains the/);
  assert.match(controller, /fallback for walk-mode handovers that do not change the status value/);
  assert.doesNotMatch(controller, /The service emits no status change event/);
});
