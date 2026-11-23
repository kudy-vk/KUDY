// Selfer #469 — form guard for the feedback_current updated_at index
// migration (the read path of the telegram-ops relay window scans). The
// sibling suites pin migration files by assert.match (the ops-pglite
// idiom): a dropped file, a SQL typo or an index-name drift fails here.
// The verbatim replay into freshOpsDatabase() is deliberately absent —
// the session harness guard (Mimosa PreToolUse hook) blocks adding a new
// db.exec replay to test-support.ts (false-positive command injection on
// the committed idiom); the live application is verified via the
// pg_indexes probe (PR #440, 2026-11-23).
// English comments per the sibling-suite convention
// (docs/agent-rules/documentation-language.md).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPS_READ_INDEXES_MIGRATION_PATH } from './test-support.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('ops read indexes migration (Selfer #469)', () => {
  const sql = () => readFileSync(OPS_READ_INDEXES_MIGRATION_PATH, 'utf8');

  it('the file contains the feedback_current updated_at index with if not exists', () => {
    const text = sql();
    assert.match(
      text,
      /create index if not exists feedback_current_updated_at_idx\s+on feedback_current \(updated_at\)/,
    );
  });

  it('the file does not duplicate the created_at index owned by 20261123000000', () => {
    assert.doesNotMatch(sql(), /ops_error_events_created_at_idx/);
  });

  it('the migration path points into supabase/migrations (single source)', () => {
    assert.match(OPS_READ_INDEXES_MIGRATION_PATH, /supabase[/\\]migrations/);
    assert.ok(readFileSync(OPS_READ_INDEXES_MIGRATION_PATH, 'utf8').length > 0);
  });
});
