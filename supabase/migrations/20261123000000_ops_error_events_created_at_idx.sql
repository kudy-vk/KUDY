-- Selfer telegram-ops T3 follow-up (voka [per-cycle-scan-no-index],
-- vokhandcrafts/Selfer#478): the relay worker reads the 15-minute window
-- twice per polling cycle — S3 and S4 deliberately run separate reads for
-- stream-failure isolation (issue #453 criterion 4) — and the retention
-- sweep (supabase/queries/ops-error-retention.sql) walks the same column.
-- The append log has no PK and no created_at index, so the per-cycle cost
-- grows linearly with the 90-day log volume during a sustained incident.
--
-- This index covers both relay window queries and the retention sweep;
-- it is the only change — no data, no grants, no contract shift. The
-- migration file stays the single source (the ops suites replay
-- 20261122000000 verbatim and do not depend on indexes).

create index ops_error_events_created_at_idx on ops_error_events (created_at);
