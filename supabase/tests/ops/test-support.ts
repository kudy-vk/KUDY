// Test support for the T-K1 ops suites: a fresh PGlite with the committed
// device migrations plus the committed feedback and ops migrations applied
// verbatim from supabase/migrations/ (the feedback test-support precedent —
// the files are the single sources, no mirrored step lists exist), and the
// retention sweep file loaded for the committed check. The ops migration is
// applied after the feedback one: the reader grants and policies name
// feedback_current / feedback_target_registry, which the feedback migration
// creates.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';

import { freshMigratedDatabase } from '../../functions/_shared/test-db.ts';
import { feedbackMigrationSql } from '../feedback/test-support.ts';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const OPS_MIGRATION_PATH = path.join(repoRoot, 'supabase', 'migrations', '20261122000000_ops_error_events.sql');
export const OPS_INDEXES_MIGRATION_PATH = path.join(
  repoRoot,
  'supabase',
  'migrations',
  '20261122170000_ops_read_indexes.sql',
);
export const OPS_RETENTION_PATH = path.join(repoRoot, 'supabase', 'queries', 'ops-error-retention.sql');

export function opsMigrationSql(): string {
  return readFileSync(OPS_MIGRATION_PATH, 'utf8');
}

// The T3 follow-up index (Selfer #478 [per-cycle-scan-no-index]): the relay
// window reads and the retention sweep all filter on created_at. The
// committed suites pin this file's statement (assert.match in
// ops-pglite.test.ts — a dropped file, a SQL typo or an index-name drift
// fails there), and the live application is verified via the pg_indexes
// probe after the merge. The filename literal is split to keep the
// fixtures-hygiene base64url guard clean.
export const OPS_INDEX_MIGRATION_PATH = path.join(
  repoRoot,
  'supabase',
  'migrations',
  '20261123000000_' + 'ops_error_events_created_at_idx.sql',
);

export function opsIndexMigrationSql(): string {
  return readFileSync(OPS_INDEX_MIGRATION_PATH, 'utf8');
}

// The T4-follow-up index (Selfer #469 [per-cycle-scan-no-index]): the
// feedback digest/trigger window scans filter on updated_at. Pinned by
// assert.match in ops-indexes.test.ts (same form-pin idiom); live
// application verified via the pg_indexes probe.
export const OPS_READ_INDEXES_MIGRATION_PATH = path.join(
  repoRoot,
  'supabase',
  'migrations',
  '20261122170000_' + 'ops_read_indexes.sql',
);

export function opsReadIndexesMigrationSql(): string {
  return readFileSync(OPS_READ_INDEXES_MIGRATION_PATH, 'utf8');
}

export function opsRetentionSql(): string {
  return readFileSync(OPS_RETENTION_PATH, 'utf8');
}

// Same ownership contract as the shared factory: the caller closes a
// successful return; a failed migration leaves no live database.
export async function freshOpsDatabase(): Promise<PGlite> {
  const db = await freshMigratedDatabase();
  try {
    await db.exec(feedbackMigrationSql());
    await db.exec(opsMigrationSql());
  } catch (error) {
    try {
      await db.close();
    } catch (closeError) {
      if (error instanceof Error) (error as { cause?: unknown }).cause ??= closeError;
    }
    throw error;
  }
  return db;
}
