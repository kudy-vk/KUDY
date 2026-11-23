-- Selfer #469 (telegram-ops follow-ups) — the read index for the feedback
-- window scans: the relay worker (factory/telegram-ops/, Selfer) filters
-- feedback_current by updated_at on every polling cycle (the S1 digest
-- window and the <=2-star trigger watermark). The G16.01 primary key
-- (device, target...) does not serve those scans. Applied to production
-- through the admin MCP on 2026-11-23 and verified via pg_indexes (0 rows
-- at creation time, idempotent).
--
-- The created_at index on ops_error_events lives in the sibling migration
-- 20261123000000 (Selfer #478, merged via PR #438) — this file deliberately
-- does not duplicate it.
--
-- IF NOT EXISTS: this file is the single source for clean environments —
-- production was seeded earlier, so a re-run does not duplicate.

create index if not exists feedback_current_updated_at_idx
  on feedback_current (updated_at);
