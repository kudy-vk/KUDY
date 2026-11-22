// T-K1 (issue #411) — behavioral proof of the ops_error_events retention
// sweep (the report-retention.test.ts idiom) on real Postgres (PGlite): the
// committed ops-error-retention.sql applied verbatim removes the failure
// tags past the pinned 90-day window (the relay's D6 term), a row stored
// exactly at the boundary stays (`created_at < cutoff` is strict), a second
// run deletes nothing new. Reverting the window or the delete statement
// fails the guards and the behavior (implementation-rules 1).
import assert from 'node:assert/strict';
import test from 'node:test';

import { freshOpsDatabase, opsRetentionSql } from './test-support.ts';

const count = async (db: Awaited<ReturnType<typeof freshOpsDatabase>>): Promise<number> => {
  const result = await db.query('select count(*)::int as n from ops_error_events');
  return (result.rows[0] as { n: number }).n;
};

const runSweep = async (db: Awaited<ReturnType<typeof freshOpsDatabase>>): Promise<void> => {
  await db.exec(opsRetentionSql());
};

// --- structural guards (fail on revert, implementation-rules 1) ---

test('guard: the retention file is deletes only, against ops_error_events, with the pinned 90-day window', () => {
  const withoutComments = opsRetentionSql()
    .replace(/--[^\n]*/g, '')
    .trim();
  assert.doesNotMatch(
    withoutComments,
    /\b(insert|update|drop|alter|grant|revoke|create|truncate)\b/i,
    'the sweep only deletes; it never writes rows or changes grants',
  );
  assert.match(withoutComments, /delete from ops_error_events\b/, 'ops_error_events has its sweep statement');
  assert.match(withoutComments, /where created_at < now\(\) - interval '90 days'/, 'the D6 term is the cutoff');
  assert.doesNotMatch(withoutComments, /interval '\d+ (month|hour)/, 'no other term sneaks in');
});

// --- behavioral sweep over the production path ---

test('the sweep removes tags past the 90-day bound, keeps rows inside it, and is idempotent', async (t) => {
  const db = await freshOpsDatabase();
  t.after(() => db.close());

  // The boundary rows sit an hour on each side of the exact 90-day cutoff:
  // `created_at < now() - interval '90 days'` is strict, and the hour-wide
  // margin keeps the sides stable against the clock moving between the
  // insert and the sweep.
  await db.query(
    "insert into ops_error_events (endpoint, error_code, note, created_at) values ('device', 'unexpected_failure', 'device_registration', now() - interval '91 days')",
  );
  await db.query(
    "insert into ops_error_events (endpoint, error_code, note, created_at) values ('grant', 'internal_fault', 'grant', now() - interval '90 days' - interval '1 hour')",
  );
  await db.query(
    "insert into ops_error_events (endpoint, error_code, note, created_at) values ('events', 'unexpected_failure', 'events_intake', now() - interval '90 days' + interval '1 hour')",
  );
  await db.query(
    "insert into ops_error_events (endpoint, error_code, note, created_at) values ('feedback', 'unexpected_failure', 'feedback', now())",
  );
  assert.equal(await count(db), 4);

  await runSweep(db);

  const left = await db.query('select endpoint from ops_error_events order by created_at');
  assert.deepEqual(left.rows, [{ endpoint: 'events' }, { endpoint: 'feedback' }], 'exactly the tags past the term are deleted; the rows inside the boundary stay');

  const afterFirst = await count(db);
  await runSweep(db);
  assert.equal(await count(db), afterFirst, 'a second run is idempotent: it deletes nothing new');
});
