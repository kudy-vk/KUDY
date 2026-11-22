-- T-K1 (issue #411) — the relay signal schema: ops_error_events + the
-- read-only role telegram_ops_reader (spec 2026-11-22-telegram-ops-mvp,
-- «Рашэнні рэалізацыі»: the rejected Supabase Logs API would need a
-- PAT with org scope — the table + a scoped reader stay least-privilege).
--
--   ops_error_events — the technical-failure tag the five edge functions
--     (device, events, feedback, grant, rc-webhook) write best-effort from
--     their catch paths: endpoint (the function name, not PII), error_code,
--     note (a short fixed label — never arguments or payload data) and
--     created_at. An append log: no PK, no device link, the retention sweep
--     (supabase/queries/ops-error-retention.sql, 90 days) is its only
--     consumer besides the relay's SELECT.
--
-- Deny-by-default in the stacked layers of the feedback migration
-- (20261004000000 idiom): REVOKE from `anon`/`authenticated` first, then
-- RLS with no policy matching those roles — the mobile client has zero
-- access even if a grant is re-added; only the service role (Edge
-- Functions) writes rows.
--
-- telegram_ops_reader — the relay worker's read-only role (SELECT only,
-- no INSERT/UPDATE/DELETE, nothing outside the four named tables). The
-- four tables carry RLS with no policy for it otherwise, so a permissive
-- SELECT policy scoped to telegram_ops_reader is part of the grant: a bare
-- table grant would still answer zero rows. The policy matches only its
-- role — the deny-by-default contract of anon/authenticated is unchanged.
--
-- Portable check: runs on plain Postgres once the Supabase roles exist;
-- the ops suites in supabase/tests/ops/ replay this exact file on PGlite —
-- it is the single source, no mirrored step list (the feedback-migration
-- precedent: applied verbatim from this file).

create role telegram_ops_reader nologin;

grant usage on schema public to telegram_ops_reader;

create table ops_error_events (
  endpoint text not null,
  error_code text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table ops_error_events enable row level security;

revoke all on ops_error_events from anon, authenticated;

grant select, insert, update, delete on ops_error_events to service_role;

grant select on ops_error_events to telegram_ops_reader;
grant select on feedback_current to telegram_ops_reader;
grant select on webhook_events to telegram_ops_reader;
grant select on feedback_target_registry to telegram_ops_reader;

create policy ops_error_events_reader_select on ops_error_events for select to telegram_ops_reader using (true);
create policy feedback_current_reader_select on feedback_current for select to telegram_ops_reader using (true);
create policy webhook_events_reader_select on webhook_events for select to telegram_ops_reader using (true);
create policy feedback_target_registry_reader_select on feedback_target_registry for select to telegram_ops_reader using (true);
