-- T-K1 (issue #411) — the ops_error_events retention sweep: the failure
-- tags are kept 90 days (the relay's D6 verdict, matching the Telegram
-- auto-delete window) and then deleted. The single realization of the GC —
-- the committed ops-retention.test.ts replays this exact file on PGlite;
-- docs/runbooks/ops-errors.md runs it through the existing administrative
-- access (MFA). The schedule itself is deploy wiring, not-run in-repo (the
-- G08.01/G09.02 precedent). Idempotent: a second run deletes nothing new.
--
-- The table is an append log without foreign keys — the sweep touches only
-- aged tags; the reader role (telegram_ops_reader) and the five catch-path
-- writers are unaffected.

delete from ops_error_events
where created_at < now() - interval '90 days';
