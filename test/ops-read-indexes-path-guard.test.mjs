// #444: only one exported path may name the read-index migration.
// This static guard runs without the PGlite dependency used by the ops suites.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const supportPath = new URL('../supabase/tests/ops/test-support.ts', import.meta.url);

function readIndexPathExports(source) {
  return [...source.matchAll(/\bexport\s+const\s+(OPS_(?:READ_)?INDEXES_MIGRATION_PATH)\b/g)]
    .map(([, name]) => name);
}

test('ops read-index migration exports only its canonical path', () => {
  const exports = readIndexPathExports(readFileSync(supportPath, 'utf8'));
  assert.deepEqual(exports, ['OPS_READ_INDEXES_MIGRATION_PATH']);
});
