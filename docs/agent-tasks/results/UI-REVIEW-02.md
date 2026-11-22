# UI-REVIEW-02 — шапка: Back і вяртанне да прагулкі

**Стан: уладальнік прыняў выгляд A 2026-11-22; частка правілаў вузкай шапкі яшчэ чакае рашэння.** Крыніца: [#99](https://github.com/kudy-vk/KUDY/issues/99). База: `origin/main` (`9f7c8de4` на момант падрыхтоўкі). Production-код і зацверджаны канон не змяняліся.

## Фактычны стан

| Элемент | Production | Макет з каталога | Кантракт |
|---|---|---|---|
| Back | `components/back-button.tsx`: `arrow-left` разам з бачным `ScaledText`, `router.back()`, зона не меншая за 48×48 dp і `hitSlop` | `docs/design/production/kit.mjs`: `topbar()`, `arrow-left` без асобнага подпісу | `docs/design/screens-and-transitions.md`: вяртанне на паверхню-крыніцу без заканчэння Run |
| Прагулка | `components/walk-button.tsx`: `walk.liveSession()`, толькі пры жывой сесіі; `route` у `iconOnly`; `router.push('/run/'+live.routeId)` | `walkButton()`: заліты круг `footprints` | `docs/design/screens-and-transitions.md`: вяртанне ў Run з ранейшай панэллю, без запуску гуку |
| Загаловак | `app/_layout.tsx`: натыўны `Stack` header выключаны; экраны цяпер збіраюць уласны Back | `topbar()`: Back злева, загаловак, дзеянні справа | [#214](https://github.com/kudy-vk/KUDY/issues/214) інтэгруе адну production-шапку толькі пасля вердыкту |

## Лакальнае параўнанне

Працоўны макет: [`docs/design/brand/outputs/UI-REVIEW-02/index.html`](../../design/brand/outputs/UI-REVIEW-02/index.html) і [інструкцыі](../../design/brand/outputs/UI-REVIEW-02/README.md).

| Варыянт | Back | Return to Run | Перавагі і абмежаванні |
|---|---|---|---|
| A — класічны | Простая стрэлка | Акцэнтны круг са `footprints` | Добра розніць дзеянні; акцэнт моцны |
| B — сіметрычны | Стрэлка ў абводцы | `footprints` у абводцы | Цішэйшы дызайн; цяжэй вылучыць Resume |
| C — куты | Стрэлка з ціхай падкладкай | `navigation` у скругленым квадраце | Адрозніваецца формай; гліф можа быць прыняты за GPS |

Дошка мае пераключальнікі 320, 360, 390 і 430 dp; light/dark; мову; памер тэксту ×1 і ×1,5; active/paused/none; унутраны экран/Run; дадатковае дзеянне. Кнопкі маюць CSS 48×48 px, `aria-label` і `focus-visible`, загаловак абразаецца шматкроп'ем. Пры active/paused паказваем Resume за межамі Run; пры none і на Run — не. На 320 dp з ×1,5 дадатковае info хаваецца; гэта толькі дэманстрацыя аднаго кампрамісу, не ўзгодненая production-логіка.

## Вердыкт уладальніка 2026-11-22

У сесіі KUDY_CHAT уладальнік адказаў: **«A варыянт»** ([запіс у #99](https://github.com/kudy-vk/KUDY/issues/99#issuecomment-7071519467)). Гэта выбар аднаго камплекту, а не гібрыду:

- **Back**: контурная стрэлка `arrow-left` злева, без фону і бачнага подпісу.
- **Вяртанне да прагулкі**: `footprints` у залітым акцэнтным крузе справа.
- Звыклы кантракт навігацыі захоўваецца: Back не спыняе Run, shortcut пры active/paused і па-за Run, без аўтазапуску гуку. Кнопкі — не менш за 44×44 dp, з назвамі доступу і фокусам.

Адказы на варыянты B/C: **не выбраны**. Вердыкт пра форму занесены ў [UI99-1](../../design/brand/decisions.md#ui99-1).

**Адкрытае пытанне:** на 320 dp з буйным тэкстам у макеце інфармацыйная кнопка info знікае. Уладальнік выбраў выгляд A, але не вызначыў, ці пераносіць дадатковыя дзеянні ў меню, ці рабіць іншае. Гэта **не зацверджанае правіла**. Перад production у [#214](https://github.com/kudy-vk/KUDY/issues/214) трэба вырашыць размяшчэнне гэтых дзеянняў і праверыць чытанне загалоўка.

Production-код і агульны `topbar()` не змяняліся; па гэтай задачы захоўваецца асобнае зацвярджэнне дызайну ад інтэграцыі.

## Праверка і недаступныя доказы

- PASS: `node --check docs/design/brand/outputs/UI-REVIEW-02/board.mjs`.
- PASS: `node --test docs/design/brand/outputs/UI-REVIEW-02/board.regression.mjs` — 6 тэстаў на выбраны A, правілы бачнасці shortcut і 13 моў, уключаючы pl/de/es. Гэта выпраўляе знаходкі [Voka ў PR #392](https://github.com/kudy-vk/KUDY/pull/392#issuecomment-7071592552) з папярэдняга head `8d0ef107`. Уласныя подпісы дэма — лакалізаваныя fixtures; назвы Back/Walk/Resume па-ранейшаму ідуць з `contracts/ui-messages`.
- NOT-VERIFIED: рэндэр на прыладзе, TalkBack/VoiceOver, сапраўдныя 44 dp, маштаб і перакрыцце на экранах. Спроба запусціць Chromium у лакальным MCP-пясочніку скончылася `SIGTRAP` без здымка; наяўнасць CSS правіл не замяняе візуальнай праверкі.
- PASS: `node --test tools/design/gen-paper-grain.test.mjs tools/design/image-check.test.mjs docs/design/brand/outputs/UI-REVIEW-02/board.regression.mjs tools/docs-ledger/counts-guard.test.mjs` — 32 тэсты прайшлі.
- BLOCKED (не пройдзена): `npm run typecheck` — TS6053: у ізаляваным worktree адсутнічае `spikes/G00.03-sandbox-grant/server/device-auth.mjs`, які патрабуе бягучая канфігурацыя. Гэты PR не змяняе `spikes` або TypeScript-канфігурацыю; прычыну адсутнасці файла трэба высветліць на асноўнай машыне.
- NOT-VERIFIED: `npm run ci:local` у MCP-пясочніцы спыніўся праз 55 секунд на этапе `npm ci`; Git-каманда ўнутры CI таксама не змагла прачытаць службовы `.git` гэтага worktree.
- NOT-VERIFIED: `npm run e2e:android:local` завяршыўся кодам 3: `Android E2E: NOT-VERIFIED (git rev-parse HEAD failed ())`. На момант гэтага прагона файл `tools/design/ui-review-02.test.mjs` быў па-за allowlist і азначаў `docs-only=false`; таму ранер патрабавала паўтарыць E2E на лакальным хосце. Глядзі пазнейшае ўдакладненне ніжэй.
- Сістэмны Back у праграме не змяняўся; production-інтэграцыя яшчэ не праводзілася.

## Удакладненне праверак 2026-11-22

Пачатковы Android E2E з `run=true` быў выкліканы тым, што дызайнерскі рэгрэсійны тэст знаходзіўся ў `tools/design/`, па-за docs-only allowlist. Тэст перанесены ў `docs/design/brand/outputs/UI-REVIEW-02/board.regression.mjs` побач з дызайн-дошкай без змены сцвярджэнняў тэста. Усе шляхі PR цяпер пад `docs/` і не змяняюць код мабільнага дадатку. Для поўнага спісу гэтых файлаў `docsOnlyChange(...)` вяртае `true`, `androidE2eNeeded(...)` — `false`; перад merge трэба пацвердзіць гэта на фактычным Git diff. Вынік лакальнага Android E2E з папярэдняга каміта застаецца ў гісторыі як NOT-VERIFIED, але не павінен блакаваць чыста дызайнерскі PR. Далейшы CI для каміта `10fd9634` паказаў, што перанесены `board.test.mjs` не быў падключаны да стандартнага ранера `npm test` (праверка G20.28 `test-discovery`): гэта быў сапраўдны блокер CI. Файл перайменаваны ў `board.regression.mjs` і імпартуецца з ужо падключанага `docs/run-model/run-model.test.mjs`; гэта захоўвае ўсе шэсць сцвярджэнняў і запуск у `npm test`, не закранаючы product-код і Android scope. У гэтым выпраўленні `node --test docs/run-model/run-model.test.mjs` прайшоў; CI на канчатковым SHA патрабуе асобнай праверкі.
