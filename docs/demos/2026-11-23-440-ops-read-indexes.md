# Дэма: індэксы чытання рэлея (#469/#478, PR #440)

Задача: міграцыя `supabase/migrations/20261122170000_ops_read_indexes.sql` —
два індэксы пад сканы worker-а telegram-ops (Selfer #469/#478).

## Крокі

1. Файл міграцыі існуе і змяшчае абодва індэксы (form-guard тэст у сюіце):

```sh
CI=true npx vitest run supabase/tests/ops/ops-indexes.test.ts
```

Чаканы вывад: `Tests  3 passed (3)` — тэсты правяраюць наяўнасць абодвух
`create index if not exists` з правільнымі табліцамі/калонкамі.

2. На жывой праекце індэксы ўжо прымененыя праз адмін-MCP (2026-11-23,
`mcp__supabase-kudy__execute_sql`); верыфікацыя — запыт да `pg_indexes`:

```sql
select indexname, indexdef from pg_indexes
where indexname in ('ops_error_events_created_at_idx', 'feedback_current_updated_at_idx');
```

Чаканы вывад: два радкі з `USING btree (created_at)` / `(updated_at)`.

## Бар'еры

Verbatim-replay файла ў `freshOpsDatabase()` быў спробаваны, але харнэс-ахова
(Mimosa PreToolUse-хук гэтай сесіі) блакуе дадаванне новага `db.exec`-рэплэю ў
`test-support.ts` (фальшывы command-injection на кантрактным ідыёме — той жа
ідіём, што ўжо ўcommitted-кодзе). Таму form-guard + жывая верыфікацыя
pg_indexes; полны рэплэй — кандыдат у follow-up, калі ахова дазволіць.
