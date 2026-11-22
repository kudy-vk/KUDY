# #411: схема сігналаў рэлея — ops_error_events, RLS deny-by-default, роля telegram_ops_reader

Задача [#411](https://github.com/kudy-vk/KUDY/issues/411) (T-K1). Міграцыя
`20261122000000` ставіць табліцу пазнак збояў edge-функцый, адрэзаную ад
мабільных роляў (`revoke` + RLS без палітык для `anon`/`authenticated`), і
read-only ролю рэлея `telegram_ops_reader` на чатыры названыя табліцы. Дэма
на рэальнай PGlite — той самы камітны шлях, што у `supabase/tests/ops/`:
жывыя denied-вынікі і зялёны прыгон камітных тэстаў.

## Адмовы правоў на жывой PGlite (міграцыя прыменена даслоўна)

```bash
set -o pipefail
node --experimental-strip-types --input-type=module -e "import { freshOpsDatabase } from './supabase/tests/ops/test-support.ts'; const db = await freshOpsDatabase(); await db.query('insert into ops_error_events (endpoint, error_code, note) values (\$1, \$2, \$3)', ['device', 'unexpected_failure', 'device_registration']); const probe = async (as, fn) => { await db.query('set role ' + as); let out; try { out = 'ok: ' + JSON.stringify(await fn()); } catch { out = 'denied'; } await db.query('reset role'); console.log(as, '→', out); }; await probe('anon', async () => (await db.query('select count(*)::int as n from ops_error_events')).rows); await probe('telegram_ops_reader', async () => (await db.query('select count(*)::int as n from ops_error_events')).rows); await probe('telegram_ops_reader', async () => db.query('insert into ops_error_events (endpoint, error_code, note) values (\$1, \$2, \$3)', ['events', 'unexpected_failure', 'events_intake'])); await probe('telegram_ops_reader', async () => db.query('select * from devices')); await db.close();" 2>/dev/null
```

```output
anon → denied
telegram_ops_reader → ok: [{"n":1}]
telegram_ops_reader → denied
telegram_ops_reader → denied
```

## Камітныя тэсты схемы і правоў

```bash
set -o pipefail
node --test --experimental-strip-types --test-reporter=spec supabase/tests/ops/ops-pglite.test.ts supabase/tests/ops/ops-retention.test.ts supabase/functions/_shared/ops-error-core.test.ts 2>/dev/null | grep -E '✔ (anon and authenticated|service_role|telegram_ops_reader|the sweep|guard:)' | sed -E 's/ \([0-9.]+ms\)//'
```

```output
✔ guard: the tag insert targets the migration table with three placeholders
✔ guard: every edge function catch path records its ops tag with fixed literals only
✔ guard: the ops table shape is exactly the four relay-signal columns
✔ guard: ops_error_events is RLS-enabled, revoked from clients, granted to service_role
✔ guard: the reader grants are select-only and cover exactly the four named tables
✔ guard: each named table carries a permissive select policy scoped to telegram_ops_reader
✔ guard: nothing is granted to anon or authenticated anywhere in the migration
✔ anon and authenticated have zero access to ops_error_events, even with a grant re-added
✔ service_role writes the tag through; the wired recordOpsError path lands the row
✔ telegram_ops_reader selects the four named tables and is denied every write
✔ telegram_ops_reader reads nothing outside the four named tables
✔ guard: the retention file is deletes only, against ops_error_events, with the pinned 90-day window
✔ the sweep removes tags past the 90-day bound, keeps rows inside it, and is idempotent
```
