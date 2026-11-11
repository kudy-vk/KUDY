# MAP-04 — экспарт фрагментаў карты

Задача [#79](https://github.com/kudy-vk/KUDY/issues/79), база `ddff623`. Праца ў асобным клоне на галіне `79-map-04-versioned-fragment-export`.

| Крытэрый | Вынік і доказ |
|---|---|
| 1. Часткі ў каардынатах крыніцы | [Экспарт](../../design/brand/outputs/MAP-04/export_map.py) чытае геаметрыю MAP-03 і існыя маскі; кожны SVG змяшчае графіку таго ж майстра і дакладны вектарны clip. ID, межы, апорныя пункты і суседства не мяняюцца. |
| 2. SVG і растравыя шчыльнасці | Адна каманда стварае пяць самастойных SVG, сцэну і PNG 1×/2×/3×. 29 асетаў, 16 031 240 байтаў пры ліміце 24 MiB. Подпісаў і значкоў у экспарце няма. |
| 3. Кантрольная зборка | Валідатар пацвердзіў дакладную RGBA-зборку з пяці частак і сцэны на ўсіх трох шчыльнасцях. [Светлы](../../design/brand/outputs/MAP-04/assets/preview-light-320.png) і [цёмны](../../design/brand/outputs/MAP-04/assets/preview-dark-320.png) ўзоры паказваюць карту на 320 px. Гэта агляд асетаў у Chrome, не прыёмка на прыладзе. |
| 4. Крыніцы і маніфест | [Маніфест](../../design/brand/outputs/MAP-04/assets/manifest.json) утрымлівае `mapVersion: 2`, геаметрыю, SHA-256 і памеры ўваходных і выходных файлаў. [Інструкцыя](../../design/brand/outputs/MAP-04/README.md) апісвае паўторны экспарт і рэгістрацыю ў renderer. |

## Праверкі

- `python docs/design/brand/outputs/MAP-04/test_export.py` — 6 тэстаў прайшлі. Правераныя сапраўдны экспарт, паўторны байт-ідэнтычны экспарт, захаванне адтулін, адмова пры зрушаным PNG і зламаным clip нават з абноўленымі хэшамі, захаванне папярэдняга пакета пры адмове браўзера.
- `python docs/design/brand/outputs/MAP-04/export_map.py --verify` — 5 фрагментаў, 29 асетаў; зборка 1×/2×/3× дакладная.
- `node --test test/menu-map-export.test.mjs` — 2 тэсты прайшлі; набор уваходзіць у `npm test`.
- `python docs/design/brand/outputs/menu-map-city-only/verify.py` — 1 143 233 пікселі існага растравага пакета адноўленыя дакладна; пакет не зменены.
- `python docs/design/brand/outputs/MAP-03/test_geometry.py` — 14 тэстаў прайшлі.
- `python docs/design/brand/outputs/MAP-02/vector/verify-vector.py` — усе праверкі існага вектарнага майстра прайшлі. CPU-рэжым уключаецца толькі для MAP-04.
- `npm run typecheck` і `npx tsc --noEmit -p web` — прайшлі.
- `npm run arch:check` — 734 модулі, 0 парушэнняў. `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .` — 0 дубляў.
- `node tools/ci/check-required-checks.mjs` — прайшоў; `.github/` не змянялася.
- `npm test` на Windows — Node: 3025 тэстаў, 2933 прайшлі, 18 упалі, 74 прапушчаныя. На `main ddff623` паўторна запушчаныя ўсе пяць файлаў са збоямі: 67 тэстаў, 49 прайшлі, тыя ж 18 упалі. Спісы назваў збояў супалі. Збоі ў `apr04-showboat-output`, `g20-35-mutation`, `run-local`, `visual-a11y` і `visual-check` не выдаюцца за PASS.
- `npx jest --config jest.config.js --runInBand` — асобна прайшлі 43 наборы, 337 тэстаў.
- `npm run ci:local` — NOT-VERIFIED: каманда адмаўляецца працаваць на `win32`; Linux-хост у гэтай сесіі не выкарыстоўваўся.
- `npm run e2e:android:local` на `693017d` — NOT-VERIFIED: састарэлы `D:\KUDY-Android\runner.lock`, працэс 580, пачатак 2026-11-10T22:41:21.679Z. Ранэр адмовіўся працягваць; файл блакіроўкі не выдаляўся. Scope — `run=true`.
- `npm audit --json` — 48 паведамленняў у існым дрэве залежнасцей: 1 critical, 9 high, 30 moderate, 8 low. `shell-quote` — critical; high: `decode-uri-component`, `expo-router`, `image-size`, `node-forge`, `postcss`, `query-string`, `source-map-js`, `undici`, `zod`. Маніфесты і lock-файлы не змяняліся; абнаўленне залежнасцей адкладзена за межы экспарту карты.

[Showboat-доказ](../../demos/2026-11-11-map-04-export.md) правярае гатовы пакет; `uvx showboat==0.6.1 verify docs/demos/2026-11-11-map-04-export.md` прайшоў. Для Windows у гэтай сесіі выкарыстоўваўся Python з асобнага асяроддзя праз `MAP04_PYTHON`.

## Межы доказу

Майстар застаецца `draft`. Візуальная прыёмка ўладальнікам, натыўны SVG-рэндэр, фізічная прылада і абодва мабільныя рухавікі — NOT-VERIFIED. Укараненне новых асетаў у дадатак не ўваходзіць у задачу. Графіка карты, геаметрыя, маршруты, жэсты, назвы і значкі не змяняліся. Публікацыя існай ілюстрацыі апісаная ў [MAP-02-RIGHTS](MAP-02-RIGHTS.md).

Аўтарская праверка ахоплівае толькі экспарт, яго тэсты, асеты і налады заканчэння радкоў. Яна не замяняе незалежныя Voka і Judge. Да іх вердыктаў і візуальнай прыёмкі задача застаецца адкрытай. Падрыхтаваны новы чарнавік у `KUDY_Chat` з выключаным Work і High, але паведамленне не адпраўлена: карыстальнік спыніў кіраванне інтэрфейсам, а ўнутраны `create_thread` не мае маршруту для звычайнага ChatGPT Chat.

Паўторная праверка: запусці экспарт і `--verify`; зруш адзін фрагмент PNG або прыбяры яго clip — праверка павінна завяршыцца памылкай. Для незалежных адмоўных пробаў запусці `test_export.py`.
