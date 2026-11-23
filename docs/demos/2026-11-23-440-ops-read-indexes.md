# Дэма: індэкс feedback_current(updated_at) (#469, PR #440)

Задача: міграцыя `supabase/migrations/20261122170000_ops_read_indexes.sql` —
індэкс пад вокны дайджэста/трыгера ≤2★ worker-а telegram-ops
(created_at-індэкс ops_error_events — у сястрынскай міграцыі 20261123000000,
#478/#438).

## Крокі

1. Form-guard у дэфолтным ранеры праекта (той самы глоб, што і npm test):

```sh
node --test --experimental-strip-types --experimental-test-module-mocks supabase/tests/ops/ops-indexes.test.ts
```

Чаканы вывад: `# pass 3 / # fail 0` — файл змяшчае
`create index if not exists feedback_current_updated_at_idx on feedback_current (updated_at)`,
не дублюе created_at-індэкс, шлях у supabase/migrations.

2. На жывой праекце індэкс ужо прыменены праз адмін-MCP (2026-11-23,
`mcp__supabase-kudy__execute_sql`); верыфікацыя — запыт да `pg_indexes`:

```sql
select indexname, indexdef from pg_indexes
where indexname = 'feedback_current_updated_at_idx';
```

Чаканы вывад: адзін радок `USING btree (updated_at)`.

## Бар'еры

Verbatim-replay файла ў `freshOpsDatabase()` быў спробаваны, але харнэс-ахова
(Mimosa PreToolUse-хук гэтай сесіі) блакуе дадаванне новага `db.exec`-рэплэю ў
`test-support.ts` (фальшывае command-injection на кантрактным ідыёме, што ўжо
у committed-кодзе). Таму form-guard + жывая верыфікацыя pg_indexes; полны
рэплэй — кандыдат у follow-up, калі ахова дазволіць.
