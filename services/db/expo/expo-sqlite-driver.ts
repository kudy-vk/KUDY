// G20.20 — the production SqlDriver over expo-sqlite (the stack baseline the
// services/db header names as the candidate). The surface is the minimal
// execSql + prepared statements of services/db/types.ts; the value mapping
// mirrors the node:sqlite fixture (blob = Uint8Array, numbers pass through).
// The one own rule: a bigint param is a named diagnostic, never a silent
// precision loss — the schema writes epoch-ms timestamps and counters that
// stay in the number range. The SQLiteDatabase instance is injected (the app
// root opens it with openDatabaseSync); this module stays importable in
// plain node tests.
//
// Issue #979 — the dead-handle guard. On Android an activity recreation
// (rotation/font scale) rebuilds the React surface; the composition root
// reopens the database while expo-sqlite's native fast-refresh path hands
// back the SAME cached binding. When the stale JS wrapper is collected, its
// sharedObjectDidRelease closes that shared binding WITHOUT setting
// isClosed, so every later sync call rejects with a NativeDatabase
// NullPointerException instead of the clean closed-resource error. Outside
// a transaction the driver reopens once through `reopen` and retries; a
// death inside a transaction propagates — the store treats it as a crash
// (no partial commits), and the next statement outside reopens.
import type { SQLiteDatabase } from 'expo-sqlite';
import type { SqlDriver, SqlStatement, SqlValue } from '../types.ts';

// The rejection shape of a dead native handle: expo-modules wraps the JNI
// NullPointerException as "Call to function 'NativeDatabase.<fn>' has been
// rejected.\n→ Caused by: java.lang.NullPointerException …". Both markers are
// required (issue #986): on a live connection expo-modules can wrap an
// ordinary SQLite failure with the same 'NativeDatabase.<fn>' wording, and
// only the dead-handle case carries the NPE cause in the message. Matched on
// the message so the guard stays importable in node.
const NATIVE_DATABASE_REJECTION = /'NativeDatabase\.[A-Za-z]+' has been rejected/;
const NATIVE_NULL_POINTER = /java\.lang\.NullPointerException/;

export function isExpoNativeDatabaseRejection(error: unknown): boolean {
  return (
    error instanceof Error &&
    NATIVE_DATABASE_REJECTION.test(error.message) &&
    NATIVE_NULL_POINTER.test(error.message)
  );
}

// The app root's open with the same guard one level earlier: the poisoned
// cached binding can die before the driver exists (the native initSync of
// the fast-refresh hit throws the same rejection). The retry must open a
// NEW connection — the cached entry would be handed back unchanged.
export function openExpoDatabase(open: (useNewConnection: boolean) => SQLiteDatabase): SQLiteDatabase {
  try {
    return open(false);
  } catch (error) {
    if (!isExpoNativeDatabaseRejection(error)) throw error;
    return open(true);
  }
}

function assertBindable(params: readonly SqlValue[]): void {
  for (const value of params) {
    if (typeof value === 'bigint') {
      throw new TypeError(`expo-sqlite-driver#bigint-param:${value}`);
    }
  }
}

export function createExpoSqliteDriver(db: SQLiteDatabase, reopen?: () => SQLiteDatabase): SqlDriver {
  let current = db;
  // Tracks the store's BEGIN IMMEDIATE..COMMIT/ROLLBACK boundary (the store
  // owns transactions, ADR G01.03 §3.3): inside one, a dead handle must
  // propagate — the transaction is lost whole, never half-committed. A
  // COMMIT/ROLLBACK call clears the flag even when it dies — a connection
  // that fails to end a transaction is unusable either way.
  let inTransaction = false;
  const guarded = <T>(op: (handle: SQLiteDatabase) => T): T => {
    try {
      return op(current);
    } catch (error) {
      if (!reopen || inTransaction || !isExpoNativeDatabaseRejection(error)) throw error;
      current = reopen();
      return op(current);
    }
  };
  return {
    execSql: (sql) => {
      const endsTransaction = sql === 'COMMIT' || sql === 'ROLLBACK';
      try {
        const result = guarded((handle) => handle.execSync(sql));
        if (sql === 'BEGIN IMMEDIATE') inTransaction = true;
        return result;
      } finally {
        if (endsTransaction) inTransaction = false;
      }
    },
    prepare: (sql): SqlStatement => ({
      run: (...params: SqlValue[]) => {
        assertBindable(params);
        // Expo's database wrappers finalize their prepared statements. A
        // bare prepareSync/executeSync leaves a cursor open and the next
        // BEGIN IMMEDIATE can fail with `database is locked` on Android.
        const result = guarded((handle) => handle.runSync(sql, ...(params as never[])));
        return { changes: result.changes };
      },
      get: (...params: SqlValue[]) => {
        assertBindable(params);
        return (
          guarded(
            (handle) => handle.getFirstSync<Record<string, SqlValue>>(sql, ...(params as never[])),
          ) ?? undefined
        );
      },
      all: (...params: SqlValue[]) => {
        assertBindable(params);
        return guarded((handle) => handle.getAllSync<Record<string, SqlValue>>(sql, ...(params as never[])));
      },
    }),
  };
}
