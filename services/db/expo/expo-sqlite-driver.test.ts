// G20.20 — the driver mapping over a stand-in SQLiteDatabase: the SQL and
// params pass through verbatim, rows map null→undefined for get, bigint
// params fail named (implementation-rules 14: corrupt input answers with a
// diagnostic, not a silent precision loss).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createExpoSqliteDriver,
  isExpoNativeDatabaseRejection,
  openExpoDatabase,
} from './expo-sqlite-driver.ts';

// The exact JS-side shape of a dead native handle (issue #979): after an
// activity recreation expo-sqlite's shared binding is closed by the stale
// wrapper's release while `isClosed` stays false, so the next sync call
// rejects with the native NullPointerException.
const NATIVE_DEATH_MESSAGE =
  "Call to function 'NativeDatabase.prepareSync' has been rejected.\n→ Caused by: java.lang.NullPointerException: java.lang.NullPointerException";

function armNativeDeath(db: ReturnType<typeof fakeDb>): void {
  const boom = () => {
    const error = new Error(NATIVE_DEATH_MESSAGE) as Error & { code?: string };
    error.code = 'ERR_UNEXPECTED';
    throw error;
  };
  const target = db as unknown as Record<string, (...args: unknown[]) => unknown>;
  for (const key of ['execSync', 'runSync', 'getFirstSync', 'getAllSync'] as const) {
    const original = target[key].bind(db);
    target[key] = (...args: unknown[]) => {
      boom();
      return original(...args);
    };
  }
}

function fakeDb(logs: string[], rowsBySql: Record<string, Record<string, unknown>[]>) {
  let activeStatements = 0;
  const execute = (sql: string, params: unknown[]) => {
    logs.push(`${sql} [${params.map((p) => String(p)).join(',')}]`);
    return rowsBySql[sql] ?? [];
  };
  return {
    execSync(sql: string) {
      if (sql === 'BEGIN IMMEDIATE' && activeStatements !== 0) throw new Error('database is locked');
      logs.push(sql);
    },
    prepareSync(sql: string) {
      activeStatements += 1;
      return {
        executeSync(...params: unknown[]) {
          const rows = execute(sql, params);
          return {
            changes: rows.length,
            getFirstSync: () => rows[0] ?? null,
            getAllSync: () => rows,
          };
        },
        finalizeSync() { activeStatements -= 1; },
      };
    },
    runSync(sql: string, ...params: unknown[]) {
      const statement = this.prepareSync(sql);
      try { return statement.executeSync(...params); } finally { statement.finalizeSync(); }
    },
    getFirstSync(sql: string, ...params: unknown[]) {
      const statement = this.prepareSync(sql);
      try { return statement.executeSync(...params).getFirstSync(); } finally { statement.finalizeSync(); }
    },
    getAllSync(sql: string, ...params: unknown[]) {
      const statement = this.prepareSync(sql);
      try { return statement.executeSync(...params).getAllSync(); } finally { statement.finalizeSync(); }
    },
  };
}

test('execSql, get, all and run map onto the driver surface', () => {
  const logs: string[] = [];
  const db = fakeDb(logs, { 'SELECT v FROM t WHERE k = ?': [{ v: 1 }] });
  const driver = createExpoSqliteDriver(db as never);
  driver.execSql('CREATE TABLE t (k, v)');
  assert.deepEqual(logs, ['CREATE TABLE t (k, v)']);
  logs.length = 0;
  assert.deepEqual(driver.prepare('SELECT v FROM t WHERE k = ?').get('a'), { v: 1 });
  assert.deepEqual(logs, ['SELECT v FROM t WHERE k = ? [a]']);
  assert.equal(driver.prepare('SELECT v FROM t WHERE k = 2').get('a'), undefined);
  assert.deepEqual(driver.prepare('SELECT v FROM t WHERE k = ?').all('a'), [{ v: 1 }]);
  const changes = driver.prepare('INSERT INTO t VALUES (?, ?)').run(1, 'x');
  assert.deepEqual(changes, { changes: 0 });
});

test('a bigint param fails named, never silently', () => {
  const driver = createExpoSqliteDriver(fakeDb([], {}) as never);
  assert.throws(() => driver.prepare('INSERT INTO t VALUES (?)').run(1n), /bigint-param/);
});

test('read and write statements release their cursor before a transaction starts', () => {
  const driver = createExpoSqliteDriver(fakeDb([], { 'SELECT v FROM t': [{ v: 1 }] }) as never);
  assert.deepEqual(driver.prepare('SELECT v FROM t').get(), { v: 1 });
  driver.execSql('BEGIN IMMEDIATE');
  driver.prepare('INSERT INTO t VALUES (?)').run(1);
  driver.prepare('SELECT v FROM t').all();
  driver.execSql('COMMIT');
  driver.execSql('BEGIN IMMEDIATE');
});

test('the driver reopens once through the guard when the native handle dies outside a transaction', () => {
  const logs: string[] = [];
  const db = fakeDb(logs, { 'SELECT v FROM t WHERE k = ?': [{ v: 1 }] });
  const fresh = fakeDb([], { 'SELECT v FROM t WHERE k = ?': [{ v: 1 }] });
  let reopenCount = 0;
  const driver = createExpoSqliteDriver(db as never, () => {
    reopenCount += 1;
    return fresh as never;
  });
  assert.deepEqual(driver.prepare('SELECT v FROM t WHERE k = ?').get('a'), { v: 1 });
  armNativeDeath(db);
  // The stale handle's rejection is answered by one reopen + retry — the
  // walk UI keeps working after an activity recreation (issue #979).
  assert.deepEqual(driver.prepare('SELECT v FROM t WHERE k = ?').get('a'), { v: 1 });
  assert.equal(reopenCount, 1);
  // The driver keeps using the reopened connection from then on.
  assert.deepEqual(driver.prepare('SELECT v FROM t WHERE k = ?').all('a'), [{ v: 1 }]);
  assert.equal(reopenCount, 1);
  assert.deepEqual(driver.prepare('INSERT INTO t VALUES (?, ?)').run(1, 'x'), { changes: 0 });
  assert.equal(reopenCount, 1);
  armNativeDeath(fresh);
  assert.throws(() => driver.prepare('SELECT v FROM t WHERE k = ?').get('a'), /NativeDatabase\.prepareSync/);
  // One retry per operation: the failed retry consumed no second reopen.
  assert.equal(reopenCount, 2);
});

test('a native death inside a transaction propagates; the next statement outside reopens', () => {
  const logs: string[] = [];
  const db = fakeDb(logs, { 'SELECT v FROM t': [{ v: 1 }] });
  const fresh = fakeDb([], { 'SELECT v FROM t': [{ v: 1 }] });
  let reopenCount = 0;
  const driver = createExpoSqliteDriver(db as never, () => {
    reopenCount += 1;
    return fresh as never;
  });
  driver.execSql('BEGIN IMMEDIATE');
  armNativeDeath(db);
  // No mid-transaction reopen: a partial transaction must never commit.
  assert.throws(() => driver.prepare('SELECT v FROM t').get(), /NativeDatabase\.prepareSync/);
  assert.equal(reopenCount, 0);
  // The failed ROLLBACK ends the transaction state even though it dies too.
  assert.throws(() => driver.execSql('ROLLBACK'), /NativeDatabase\.prepareSync/);
  assert.deepEqual(driver.prepare('SELECT v FROM t').get(), { v: 1 });
  assert.equal(reopenCount, 1);
});

test('isExpoNativeDatabaseRejection names the expo native rejection, not other errors', () => {
  assert.equal(isExpoNativeDatabaseRejection(new Error(NATIVE_DEATH_MESSAGE)), true);
  assert.equal(
    isExpoNativeDatabaseRejection(
      new Error("Call to function 'NativeDatabase.execSync' has been rejected.\n→ Caused by: java.lang.NullPointerException"),
    ),
    true,
  );
  // The same rejection wording on a live connection is NOT a dead handle:
  // expo-modules wraps ordinary SQLite failures with the identical
  // 'NativeDatabase.<fn>' sentence, and only the dead-handle case carries
  // the NPE cause (issue #986).
  assert.equal(
    isExpoNativeDatabaseRejection(
      new Error(
        "Call to function 'NativeDatabase.execSync' has been rejected.\n→ Caused by: android.database.sqlite.SQLiteException: database is locked",
      ),
    ),
    false,
  );
  assert.equal(
    isExpoNativeDatabaseRejection(
      new Error("Call to function 'NativeDatabase.execSync' has been rejected."),
    ),
    false,
  );
  assert.equal(isExpoNativeDatabaseRejection(new Error('database is locked')), false);
  assert.equal(isExpoNativeDatabaseRejection(new TypeError('bigint-param')), false);
  assert.equal(isExpoNativeDatabaseRejection(null), false);
});

test('openExpoDatabase retries a rejected open with a new connection', () => {
  const calls: boolean[] = [];
  const opened = openExpoDatabase((useNewConnection) => {
    calls.push(useNewConnection);
    if (!useNewConnection) throw new Error(NATIVE_DEATH_MESSAGE);
    return { fresh: true } as never;
  });
  assert.deepEqual(calls, [false, true]);
  assert.deepEqual(opened, { fresh: true });
  // A non-rejection open failure propagates untouched.
  assert.throws(
    () =>
      openExpoDatabase(() => {
        calls.push(false);
        throw new Error('database is locked');
      }),
    /database is locked/,
  );
  assert.deepEqual(calls, [false, true, false]);
});
