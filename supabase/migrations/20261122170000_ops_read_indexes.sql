-- Selfer #469/#478 (telegram-ops follow-ups) — read indexes for the relay
-- scans: the worker (factory/telegram-ops/, Selfer) reads ops_error_events
-- and feedback_current by created_at/updated_at on every polling cycle
-- (S3/S4 window aggregates + the digest and the <=2-star trigger). The T-K1
-- migration created ops_error_events without a PK or index (append log),
-- and G16.01 created feedback_current with a (device, target...) PK whose
-- index does not serve updated_at scans. Applied to production through the
-- admin MCP on 2026-11-23 and verified via pg_indexes (both indexes
-- present; 0 rows at creation time, idempotent).
--
-- IF NOT EXISTS: this file is the single source for clean environments —
-- production was seeded earlier, so a re-run does not duplicate.

create index if not exists ops_error_events_created_at_idx
  on ops_error_events (created_at);

create index if not exists feedback_current_updated_at_idx
  on feedback_current (updated_at);
