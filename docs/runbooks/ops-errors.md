# Runbook: тэхнічныя зббоі edge-функцый — ops_error_events, retention і роля рэлея

Дата: 2026-11-22 · задача T-K1 ([#411](https://github.com/kudy-vk/KUDY/issues/411)) ·
статус: жывы оператыўны дакумент.

Кананічныя крыніцы (гэты runbook іх не пераказвае, а выконвае крокі):
схема сігналаў — міграцыя
[`supabase/migrations/20261122000000_ops_error_events.sql`](../../supabase/migrations/20261122000000_ops_error_events.sql),
retention-запыт —
[`supabase/queries/ops-error-retention.sql`](../../supabase/queries/ops-error-retention.sql)
(адзіная рэалізацыя GC, дубляваць яго дзесьці яшчэ раз забаронена), праводка
пазнак — `supabase/functions/_shared/ops-error-core.ts`. Дызайн сігналаў для
рэлея — спэка telegram-ops-mvp у рэпазіторыі Selfer (эпік #274, вердыкты
D1–D7).

Мяжа доказу: жывы праект Supabase да рэпазітара не падключаны — прымяненне
міграцыі да жывой БД і прагон retention выконвае ўладальнік праз існы
адміністрацыйны доступ; на PGlite механіку даказваюць комітныя тэсты
`supabase/tests/ops/ops-pglite.test.ts` і `supabase/tests/ops/ops-retention.test.ts`.

## Трыаж: сімптом → раздзел

| Сімптом / патрэба | Раздзел |
|---|---|
| Трэба ачысціць пазнакі збояў старэйшыя за тэрмін | [1](#1-retention-прагон) |
| Рэлей-worker не чытае зводкі / адмовы SELECT | [2](#2-роля-telegram_ops_reader) |
| Пазнакі збояў не з'яўляюцца ў табліцы | [3](#3-межы-даступу-і-праводка) |

## 1. Retention прагон

Тэрмін захавання пазнак збояў: 90 дзён з `created_at` (вердыкт D6 —
супадае з аўтаматычным ачышчэннем супергрупы Telegram). Табліца —
append-журнал без FK, таму прагон не датычыцца нічога, акрамя састарэлых
пазнак; роля рэлея і catch-праводкі ад прагону не залежаць.

```sh
psql "$ADMIN_DB_URL" -f supabase/queries/ops-error-retention.sql
```

Крокі:

1. Выканаць файл на жывой БД тым жа адміністрацыйным доступам (MFA-адмін,
   dashboard або `psql`). Прагон ідэмпатэнтны: паўторны выклік не выдаляе
   нічога новага.
2. Расклад (cron/pg_cron) — deploy-праводка, у рэпазітары не ганяецца
   (прэцэдэнт G08.01/G09.02); у комітным рэпазітары механіку даказваюць
   тэсты retention-сюты.

## 2. Роля telegram_ops_reader

Роля рэлея — read-only: `SELECT` толькі на названыя ў AC3 табліцы
(`feedback_current`, `webhook_events`, `ops_error_events`,
`feedback_target_registry`); ні INSERT/UPDATE/DELETE; нічога па-за гэтага
спісу (device/events-табліцы, ліджэр і лічыльнікі — denied).

Крокі па падключэнні рэлея (Selfer-бок, задачы T1/T3):

1. Стварыць на жывой БД login-карыстальніка для worker-а і даць яму
   членства ў `telegram_ops_reader` (роля NOLOGIN — непасрэдна
   злучыцца ёй нельга; права наследуецца з INHERIT, RLS-палітыкі
   ўжываюцца да членаў): `create role telegram_ops_login login password
   '<сакрэт>';` + `grant telegram_ops_reader to telegram_ops_login;`.
   DSN гэтага login-карыстальніка — толькі env на Selfer
   (`TELEGRAM_OPS_KUDY_DSN`; адсутнасць env — fail-closed старт без друку
   значэнняў).
2. Праверыць правы на жывой БД: `SELECT` з названых табліц вяртае радкі,
   спроба запісу і `SELECT` з чужых табліц — `permission denied`.
3. Ратацыя DSN — ратацыя пароля login-карыстальніка
   (`ALTER ROLE telegram_ops_login WITH PASSWORD '<новы>';` — не роля
   `telegram_ops_reader`: яна NOLOGIN і пароля не мае); пасля ратацыі
   абнавіць env на Selfer і перазапусціць worker.

## 3. Межы доступу і праводка

- `anon` і `authenticated` адрэзаны на `ops_error_events` цалкам
  (`revoke all` + RLS без палітык для гэтых роляў) — мабільны кліент мае
  нулявы доступ нават пры даданым гранце.
- Пазнакі пішуць пяць edge-функцый з catch-шляхоў праз
  `recordOpsError` (`ops-error-core.ts`) — best-effort: збой запісу пазнакі
  не ламае адказ function-а; у пазнаку трапляюць толькі фіксаваныя
  літэралы (endpoint, error_code, note), ніколі — аргументы або даныя
  запыту.
- Wire не мае маршруту чытання пазнак: `ops_error_events` не датычыцца
  мабільных кантрактаў.
