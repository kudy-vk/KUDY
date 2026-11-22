// T-K1 (issue #411) — the best-effort ops-error tag: the pinned statement
// shape, the literal-only parameter binding and the swallow-everything
// contract of recordOpsError (a storage fault on the tag path answers false
// and never reaches the caller's catch boundary as a throw). The wiring
// guard scans the five catch paths' source: each calls recordOpsError with
// its own endpoint literal — removing the call or interpolating anything
// non-literal fails the guard (implementation-rules 1/14). The behavioral
// proof against real Postgres (the tag lands, the reader/rights contracts)
// lives in supabase/tests/ops/ on the committed migration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

import { OPS_ERROR_INSERT_SQL, recordOpsError, type OpsErrorClient } from './ops-error-core.ts';

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

test('guard: the tag insert targets the migration table with three placeholders', () => {
  assert.equal(
    OPS_ERROR_INSERT_SQL,
    'insert into ops_error_events (endpoint, error_code, note) values ($1, $2, $3)',
    'the statement names the migration table and binds the three fixed literals',
  );
  assert.doesNotMatch(OPS_ERROR_INSERT_SQL, /created_at/, 'created_at is the migration default, never bound');
});

test('recordOpsError binds the fixed literals in the endpoint, error_code, note order and answers true', async () => {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const client: OpsErrorClient = {
    unsafe(sql: string, params?: unknown[]) {
      calls.push({ sql, params: params ?? [] });
      return Promise.resolve([]);
    },
  };
  const landed = await recordOpsError(() => client, {
    endpoint: 'device',
    errorCode: 'unexpected_failure',
    note: 'device_registration',
  });
  assert.equal(landed, true, 'a landing insert answers true');
  assert.deepEqual(
    calls,
    [{ sql: OPS_ERROR_INSERT_SQL, params: ['device', 'unexpected_failure', 'device_registration'] }],
    'exactly one insert with the fixed literals as $1..$3',
  );
});

test('recordOpsError is best-effort: a failing insert, a non-Error throw or a throwing factory all answer false', async () => {
  const throwing: OpsErrorClient = {
    unsafe() {
      return Promise.reject(new Error('connection refused'));
    },
  };
  assert.equal(await recordOpsError(() => throwing, { endpoint: 'events', errorCode: 'unexpected_failure', note: 'events_intake' }), false);
  assert.equal(await recordOpsError(() => ({ unsafe: () => { throw 'boom'; } }), { endpoint: 'events', errorCode: 'unexpected_failure', note: 'events_intake' }), false);
  assert.equal(
    await recordOpsError(
      () => {
        throw new Error('DATABASE_URL is required (fail-closed env gate)');
      },
      { endpoint: 'events', errorCode: 'configuration_missing', note: 'events_intake' },
    ),
    false,
    'a missing DATABASE_URL inside the factory fails the same swallowed way',
  );
});

test('recordOpsError is bounded: a hanging insert answers false fast and the late loser is swallowed', async () => {
  const started = Date.now();
  const hanging = new Promise<never>(() => {});
  const landed = await recordOpsError(
    () => ({ unsafe: () => hanging }),
    { endpoint: 'grant', errorCode: 'internal_fault', note: 'grant' },
    10,
  );
  const elapsed = Date.now() - started;
  assert.equal(landed, false, 'a tag attempt past the bound is dropped, best-effort');
  assert.ok(elapsed < 1000, `the bound keeps the catch path fast (took ${elapsed} ms)`);
  // the loser of the race rejects late; an unhandled rejection here would
  // surface as a node warning and would crash a Deno isolate — this await
  // lets that rejection land inside the swallowed .catch channel
  await new Promise((resolve) => setTimeout(resolve, 50));
});

// --- wiring guard: the five catch paths record the tag ---

// Each file's catch path must call recordOpsError exactly this many times,
// always through the lazily-opened client and fixed literals — the shape
// regex rejects any call that interpolates error state into the tag.
const WIRING_CALLS: Array<{ file: string; endpoint: string; calls: number }> = [
  { file: '../device/index.ts', endpoint: 'device', calls: 2 },
  { file: '../events/index.ts', endpoint: 'events', calls: 2 },
  { file: '../feedback/index.ts', endpoint: 'feedback', calls: 2 },
  { file: '../rc-webhook/index.ts', endpoint: 'rc-webhook', calls: 1 },
  { file: './grant-wire.ts', endpoint: 'grant', calls: 1 },
];

test('guard: every edge function catch path records its ops tag with fixed literals only', () => {
  for (const wiring of WIRING_CALLS) {
    const source = readFileSync(path.resolve(sharedDir, wiring.file), 'utf8');
    const shape = new RegExp(
      `recordOpsError\\(\\(\\) => database\\(\\), \\{ endpoint: '${wiring.endpoint}', errorCode: '[a-z_-]+', note: '[a-z_-]+' \\}\\)`,
      'g',
    );
    const matches = source.match(shape) ?? [];
    assert.equal(
      matches.length,
      wiring.calls,
      `${wiring.file} must record the '${wiring.endpoint}' tag from its catch path(s) with fixed literals only`,
    );
  }
});
