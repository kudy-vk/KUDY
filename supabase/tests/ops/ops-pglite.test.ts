// T-K1 (issue #411) — behavioral proof of the relay signal schema on real
// Postgres (PGlite, the rls.test.ts idiom): the committed migration
// 20261122000000_ops_error_events.sql is applied verbatim and must hold —
// the table's four-column shape, deny-by-default RLS for the mobile client
// roles (zero access even when a grant is re-added), the service role
// writing the tag through, and the telegram_ops_reader contract (SELECT ok
// on exactly the four named tables; INSERT/UPDATE/DELETE denied; nothing
// readable outside them). Reverting the RLS, revoke, grant or policy lines
// of the migration fails these guards and behaviors (implementation-rules 1).
import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';

import { recordOpsError, type OpsErrorClient } from '../../functions/_shared/ops-error-core.ts';
import { publishFixtureTargets, registerFeedbackDevice } from '../feedback/test-support.ts';
import { freshOpsDatabase, opsMigrationSql } from './test-support.ts';

// The four tables the relay reader may SELECT (issue AC3, verbatim).
const READER_TABLES = ['feedback_current', 'webhook_events', 'ops_error_events', 'feedback_target_registry'];

// Everything else the reader must never read: device/events tables, the
// feedback ledger and counters, the grant bookkeeping (closed-grant
// semantics — not granted means denied).
const OFF_LIMITS_TABLES = [
  'devices',
  'entitlement_cache',
  'event_log',
  'device_registration_rate',
  'event_send_rate',
  'grant_products',
  'grant_request_rate',
  'feedback_mutations',
  'feedback_send_rate',
  'feedback_ip_rate',
];

function migrationStatements(): string[] {
  return opsMigrationSql()
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '');
}

// --- migration shape guards (fail on revert) ---

test('guard: the ops table shape is exactly the four relay-signal columns', () => {
  const create = migrationStatements().find((statement) => statement.startsWith('create table ops_error_events'));
  assert.ok(create, 'ops_error_events must be created by the migration');
  assert.match(
    create!.replace(/\s+/g, ' '),
    /ops_error_events \( endpoint text not null, error_code text not null, note text not null, created_at timestamptz not null default now\(\) \)/,
    'endpoint/error_code/note/created_at — the spec columns, no identity or payload columns',
  );
});

test('guard: ops_error_events is RLS-enabled, revoked from clients, granted to service_role', () => {
  const statements = migrationStatements();
  assert.ok(statements.includes('alter table ops_error_events enable row level security'), 'RLS must be enabled');
  assert.ok(statements.includes('revoke all on ops_error_events from anon, authenticated'), 'clients must be revoked');
  assert.ok(
    statements.includes('grant select, insert, update, delete on ops_error_events to service_role'),
    'the service role writes the tags',
  );
});

test('guard: the reader grants are select-only and cover exactly the four named tables', () => {
  const statements = migrationStatements();
  const readerGrants = statements.filter((statement) => statement.startsWith('grant ') && statement.includes(' to telegram_ops_reader'));
  assert.deepEqual(
    readerGrants.filter((statement) => statement.startsWith('grant select on ')).map((statement) => statement.replace('grant select on ', '').replace(' to telegram_ops_reader', '')).sort(),
    [...READER_TABLES].sort(),
    'the reader SELECT grant list is exactly the issue AC3 tables',
  );
  const writes = readerGrants.filter((statement) => /grant (insert|update|delete|all)/.test(statement));
  assert.deepEqual(writes, [], 'the reader never receives a write grant (deny-by-default)');
  assert.ok(
    statements.includes('grant usage on schema public to telegram_ops_reader'),
    'the reader needs schema usage to reach the tables',
  );
});

test('guard: each named table carries a permissive select policy scoped to telegram_ops_reader', () => {
  const statements = migrationStatements();
  for (const table of READER_TABLES) {
    assert.ok(
      statements.includes(`create policy ${table}_reader_select on ${table} for select to telegram_ops_reader using (true)`),
      `${table}: the reader SELECT works only through a policy scoped to its role (RLS stays deny-by-default for anon/authenticated)`,
    );
  }
});

test('guard: nothing is granted to anon or authenticated anywhere in the migration', () => {
  const granting = migrationStatements().filter((statement) => /grant\b/i.test(statement) && /\b(anon|authenticated)\b/i.test(statement));
  assert.deepEqual(granting, [], 'no table may be granted to anon/authenticated (deny-by-default)');
});

// --- AC1: the mobile client roles have zero access ---

test('anon and authenticated have zero access to ops_error_events, even with a grant re-added', async (t) => {
  const db = await freshOpsDatabase();
  t.after(() => db.close());

  await db.query('set role anon');
  await assert.rejects(db.query('select * from ops_error_events'), /permission denied/i, 'anon: no grants, no access');
  await assert.rejects(
    db.query("insert into ops_error_events (endpoint, error_code, note) values ('device', 'unexpected_failure', 'device_registration')"),
    /permission denied/i,
    'anon: no insert path',
  );
  await db.query('reset role');

  // The RLS layer: even re-adding a grant keeps rows invisible and unwritable.
  await db.query('grant select, insert, update, delete on ops_error_events to anon');
  await db.query('set role anon');
  const visible = await db.query('select count(*)::int as count from ops_error_events');
  assert.equal(visible.rows[0]?.count, 0, 'rows must be invisible under RLS with no anon policy');
  await assert.rejects(
    db.query("insert into ops_error_events (endpoint, error_code, note) values ('device', 'unexpected_failure', 'device_registration')"),
    /row-level security/i,
  );
  await db.query('reset role');
  await db.query('revoke all on ops_error_events from anon');

  await db.query('set role authenticated');
  await assert.rejects(db.query('select * from ops_error_events'), /permission denied/i, 'authenticated denied');
  await assert.rejects(
    db.query("update ops_error_events set note = 'x'"),
    /permission denied/i,
    'authenticated has no write path either',
  );
});

test('service_role writes the tag through; the wired recordOpsError path lands the row', async (t) => {
  const db = await freshOpsDatabase();
  t.after(() => db.close());

  // The production catch-path call shape, against the PGlite client (the
  // pgliteFeedbackClient unsafe-over-query idiom): the pinned statement with
  // fixed literals lands the row under the service role.
  await db.query('set role service_role');
  const client: OpsErrorClient = {
    unsafe: async (sql, params) => (await db.query(sql, (params ?? []) as unknown[])).rows,
  };
  const landed = await recordOpsError(() => client, { endpoint: 'device', errorCode: 'unexpected_failure', note: 'device_registration' });
  assert.equal(landed, true, 'the service role writes the tag through');
  await db.query('reset role');

  const rows = await db.query('select endpoint, error_code, note, created_at is not null as stamped from ops_error_events');
  assert.deepEqual(rows.rows, [{ endpoint: 'device', error_code: 'unexpected_failure', note: 'device_registration', stamped: true }]);
});

// --- AC3: the telegram_ops_reader rights ---

/** Seeds one visible row in each reader table: the production import+publish path for the registry, a rating device for feedback_current. */
async function seedReaderRows(db: Awaited<ReturnType<typeof freshOpsDatabase>>): Promise<void> {
  const device = await registerFeedbackDevice(db);
  await publishFixtureTargets(db, [{ kind: 'guide', route_id: 'guide-route-a1', version: '1', locale: 'be' }]);
  await db.query(
    'insert into feedback_current (device_id, target_kind, target_id, target_version, locale, revision, score, reason_codes) values ($1, \'guide\', \'guide-route-a1\', \'1\', \'be\', 1, 3, \'[]\'::jsonb)',
    [device.deviceId],
  );
  await db.query(
    "insert into webhook_events (event_id, type, payload) values ('8f0d0f1c-0000-4000-8000-000000000001', 'TEST', '{}'::jsonb)",
  );
  await db.query("insert into ops_error_events (endpoint, error_code, note) values ('grant', 'internal_fault', 'grant')");
}

test('telegram_ops_reader selects the four named tables and is denied every write', async (t) => {
  const db = await freshOpsDatabase();
  t.after(() => db.close());
  await seedReaderRows(db);

  await db.query('set role telegram_ops_reader');
  for (const table of READER_TABLES) {
    const visible = await db.query(`select count(*)::int as count from ${table}`);
    assert.ok((visible.rows[0]?.count as number) >= 1, `${table}: the reader SELECT works (AC3 SELECT ok)`);
  }

  await assert.rejects(
    db.query("insert into ops_error_events (endpoint, error_code, note) values ('events', 'unexpected_failure', 'events_intake')"),
    /permission denied/i,
    'INSERT denied',
  );
  await assert.rejects(
    db.query("update feedback_current set score = 5"),
    /permission denied/i,
    'UPDATE denied',
  );
  await assert.rejects(
    db.query('delete from webhook_events'),
    /permission denied/i,
    'DELETE denied',
  );
});

test('telegram_ops_reader reads nothing outside the four named tables', async (t) => {
  const db = await freshOpsDatabase();
  t.after(() => db.close());
  await seedReaderRows(db);

  await db.query('set role telegram_ops_reader');
  for (const table of OFF_LIMITS_TABLES) {
    await assert.rejects(db.query(`select * from ${table}`), /permission denied/i, `${table}: not granted to the reader`);
  }
});
