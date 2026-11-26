# Дэма: індэкс feedback_current(updated_at) (#469, PR #440)

Задача: міграцыя `supabase/migrations/20261122170000_ops_read_indexes.sql` —
індэкс для вокнаў дайджэста і трыгера ≤2★ worker-а telegram-ops.
Індэкс `ops_error_events(created_at)` належыць асобнай міграцыі
`20261123000000` (#478/#438).

## Лакальны доказ

Каманда запускае праверкі формы міграцыі: наяўнасць
`feedback_current_updated_at_idx`, адсутнасць дубля індэкса
`ops_error_events(created_at)` і правільны шлях да файла.
Рэпарцёр `dot` выключае нестабільны час выканання з захаванага вываду.
Вынік атрыманы з рэальнага запуску 2026-11-23 (exit code 0).

```bash
node --no-warnings --test --experimental-strip-types --experimental-test-module-mocks --test-reporter=dot supabase/tests/ops/ops-indexes.test.ts
```

```output
....
```

## Жывая база

2026-11-23 асобна выкананы read-only запыт праз падлучаны Supabase MCP:

```sql
select indexname, indexdef from pg_indexes
where indexname = 'feedback_current_updated_at_idx';
```

Запыт вярнуў адзін радок: `feedback_current_updated_at_idx`,
`CREATE INDEX feedback_current_updated_at_idx ON public.feedback_current USING btree (updated_at)`.
Гэта назіранне ў жывой базе, **не** выканальны крок лакальнага Showboat.

## Абмежаванні праверкі

- **Showboat: ПРАВЕРАНА карыстальнікам 2026-11-23** на каміце
  `f4a47b04a855c6bafa7ebdaa564e3afb7dc4dcf3`.
  `uvx showboat==0.6.1 verify docs/demos/2026-11-23-440-ops-read-indexes.md`
  завяршылася без памылак; пасля замены захаванага `....` на `BROKEN`
  `verify` выдаў `block 2: expected: BROKEN; actual: ....`.
  Гэта пацвярджае, што `output` сапраўды параўноўваецца, а не ігнаруецца.
  Лакальны MCP агента па-ранейшаму не запускае `uvx` у гэтым worktree
  (`uvx is limited to the KUDY #835 worktree.`).
- **Verbatim-replay SQL: NOT-VERIFIED.** Тэст міграцыі правярае форму файла,
  але не выконвае SQL у новай базе праз `freshOpsDatabase()`. У PR #440
  быў задакументаваны блок Mimosa PreToolUse для дадання `db.exec` у
  `test-support.ts`; у гэтай задачы тэставы harness і міграцыі не змяняліся.
- **Паўтор жывога SQL праз Showboat: NOT-VERIFIED.** Запыт выкананы
  праз Supabase MCP, але ў лакальным shell няма падлучэння гэтага MCP да
  выканання блока `bash`. Вынік з жывой базы не з'яўляецца захаваным
  `output` Showboat.
