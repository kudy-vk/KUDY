# #212 — шакаладна-цагляная цёмная тэма

Рэалізацыя: `4873bf736075b9f4928f17b5d30ac7eb7aae29fe`.
База: `6e2c93d5bc97dfbdd4ce6c807cb2401fa3588481`.
Дата праверкі: 2026-11-11, Windows, Node v24.13.0, `core.autocrlf=true`.

## Крытэрыі задачы

| Крытэрый | Вынік | Доказ |
|---|---|---|
| 1. Вердыкт уладальніка | Выканана | [Пацверджанне палітры справа](https://github.com/kudy-vk/KUDY/issues/212#issuecomment-6807955099), [M3](../../design/brand/decisions.md#m3). |
| 2. Канон, люстра і кантраст | Выканана | [Канон](../../design/visual-language.md), [спецыфікацыя](../../design/dark-theme.md), `test/design-dark-theme.test.mjs`. Усе канонавыя пары і стопы градыенту правераныя. |
| 3. Гард і вяртанне старога колеру | Выканана | Гард `M3 uses the owner-approved production palette and radial background (#212)` падае, калі ў канон часова вярнуць `color.paper` #171d1c. Пасля спробы файл адноўлены і тэсты пераправераныя. |
| 4. Токены і фон дадатку | Выканана ў кодзе і render-тэстах | `components/design-tokens.ts`, `ScreenSurface`, `PaperSurface`; `app/dark-theme-render.test.tsx` правярае сапраўдныя экранныя кампаненты. |
| 5. Светлая картаграфія і застава | Выканана з агаворкай | Гарды DT-4/DT-6, dark-theme render-тэсты, Jest-тэсты заставы; walk-сцэнарый 5/0 на каміце прайшоў рэальны OSM-флоў прагулкі. Код картаграфіі і заставы змена не чапае; тайлаў у дадатку яшчэ няма па дызайне ([#213](https://github.com/kudy-vk/KUDY/issues/213)), таму цёмныя пікселі картаграфіі да яго рашэння неіснуюць; застава на прыладзе не знятая. |
| 6. Здымкі дадатку да і пасля | Выканана | 6 натыўных здымкаў цёмнай тэмы да/пасля ў эквівалентных умовах: [маніфест](../../design/brand/outputs/dark-theme-212/native/capture-manifest.json), [папка](../../design/brand/outputs/dark-theme-212/native/) (меню, Explore, карта × да/пасля). Маркеры бандла пацверджаныя curl-грэпам; HTML-параўнанне засталося доказам выбару колераў. |

## Праверкі

- `npx jest --runInBand --config jest.config.js`: 47 набораў, 363 тэсты прайшлі.
- Поўная Node-частка `npm test` з тымі ж аргументамі і файламі, але з
  `--test-concurrency=2`: 3037 тэстаў; 2943 прайшлі, 20 не прайшлі, 74 прапушчаныя.
  Гэта першасны прагон, да выпраўлення двух залежных дакументных узораў.
- `node --no-warnings --test test/design-dark-theme.test.mjs test/design-runtime-theme.test.mjs test/map-05-specimen.test.mjs tools/docs-ledger/ledger.test.mjs`:
  пасля сінхранізацыі ўзору MAP-05 і захавання гістарычнага тэрміна `--badge`
  прайшлі 32 тэсты, без збояў. Поўны Node-прагон пасля гэтых двух правак не паўтараўся.
- Пакінутыя 18 збояў паўтораныя на нязмененай базе ў тым жа checkout:
  `node --test --test-concurrency=2 --experimental-strip-types --experimental-test-module-mocks --test-reporter=spec test/apr04-showboat-output.test.mjs tools/ci/g20-35-mutation.test.mjs tools/e2e-android/run-local.test.mjs tools/e2e-android/visual-a11y.test.mjs tools/e2e-android/visual-check.test.mjs`:
  67 тэстаў, 49 прайшлі, 18 не прайшлі. Змены задачы былі часова захаваныя
  праз stash і адноўленыя; асобны клон не ствараўся.
- `npm run typecheck`: прайшла.
- `npm run arch:check`: прайшла, новых парушэнняў няма.
- `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .`: дубляў няма.
- Impeccable detector для фону, зерня і токенаў: `[]`.
- [Showboat](../../demos/2026-11-11-dark-theme-212.md):
  `uvx showboat==0.6.1 verify docs/demos/2026-11-11-dark-theme-212.md` прайшоў;
  дэма правярае канон і сапраўдныя экранныя render-шляхі.
- `npm run ci:local`: NOT-VERIFIED на win32, ранер адмовіўся ад няпоўнага
  прагона паводле сваёй палітыкі. Асобныя праверкі вышэй гэта не хаваюць.

## Рашэнні і межы

Палітра перанесеная дакладна. `color.note` застаўся ранейшым: прыняты макет
не прапануе яму замены, а новы другарадны тэкст на ім праходзіць кантраст.
Для цёмнага зерня выбраныя дазволеныя 4% і `color.muted`: светлы тон пры 5%
зніжаў кантраст рамкі ніжэй за 3:1 на самым яркім стопе.

Новых залежнасцей няма. `npm audit --json` паведаміў пра 47 існых знаходак:
8 low, 29 moderate, 9 high, 1 critical. Critical — транзітыўны `shell-quote`;
сярод прамых залежнасцей high маюць `expo-router` і `zod`.
Абнаўленне залежнасцей адкладзенае за межы #212: яно патрабуе асобнай
праверкі сумяшчальнасці Expo і кантрактаў; чысты аўдыт не заяўлены.

## Адкрытыя праверкі

`npm run e2e:android:local` на каміце кода сабраў APK: Gradle `BUILD SUCCESSFUL`
за 3m 1s; ранер запісаў 184s. APK SHA-256:
`F582C473D7593AD04D1AE61A5A6EE64582C79D07C36090D80C7FFEFC45F4C476`.
Сцэнары smoke/walk/discovery не пачаліся: порт Metro 8083 заняты.
Ранер вярнуў exit 1 з паведамленнем пра заняты порт; гэта
**Android E2E: NOT-VERIFIED**, а не вынік сцэнарыяў.
Чужы сервер і эмульятар не спыняліся.

Лакальныя доказы: `D:\KUDY-Android\logs\run-2026-11-11T22-02-16-668Z.jsonl`,
`D:\KUDY-Android\build\records\assembleDebug-2026-11-11T22-02-30-411Z.json`.

[Design-QA](../../design-qa/reports/2026-11-11-dark-theme-212.md): INSUFFICIENT_EVIDENCE.
[Voka](https://github.com/kudy-vk/KUDY/pull/245#pullrequestreview-5866018344) і
[Judge](https://github.com/kudy-vk/KUDY/pull/245#pullrequestreview-5866025216)
вярнулі BLOCK на `ab2dd62`: абодва назвалі адсутнасць натыўнай прыёмкі.
Яны пазначылі абмежаванне лакальнага MCP і не запускалі ўласныя лакальныя тэсты.
Задача не закрытая і мерж не выкананы.

## Паўторная праверка пасля рэв'ю

Уладальнік дазволіў спыніць ранейшы Metro: «Так, спыні Metro і правер Android».
Перад спыненнем правераныя PID 34708 і каманда Expo на порце 8083.
Паўторны `npm run e2e:android:local` на `ab2dd62` сабраў APK, але smoke
скончыўся вынікам 0 passed / 12 failed: эмульятар перайшоў у offline,
перазапусціўся і не дайшоў да экранаў дадатку. Android паведаміў:

```output
kernel_panic,ext4-fs_(device_dm-46):_panic_forced_abugr_error
```

`sys.boot_completed` застаўся пустым; пры зборы артэфактаў Android
ActivityManager таксама быў недаступны. Walk і discovery не запускаліся.
Гэта NOT-VERIFIED для прыёмкі дадатку, хоць ранер называе вынік `failed (smoke)`.

У існым ранерным checkout часова выбраная база `6e2c93d`, і базавы APK
перасабраны за 150s. Яго SHA-256 супадае з APK змены. АС і на базе
не завяршыла загрузку з тым жа паведамленнем пра ext4; базавы smoke
не выканаўся. Checkout адноўлены на `ab2dd62`, абодва замкі вызваленыя.
Даныя AVD не выдаляліся, эмульятар не спыняўся.

Доказы: [запіс базавай праверкі](../../design/brand/outputs/dark-theme-212/android-baseline.json),
[экран загрузкі Android](../../design/brand/outputs/dark-theme-212/android-boot-failure.png).
Паўторны лог: `D:\KUDY-Android\logs\run-2026-11-11T22-17-25-402Z.jsonl`.

Дадатковая LOW-заўвага Voka пацверджаная: нязменены кандыдат Tier-2
меў памылкова запісаную верхнюю мяжу 9.03:1 замест 8.73:1. Лічба
выпраўленая; новы гард вылічае абедзве мяжы з кандыдатных колераў і
падаў на старым запісе. Фінальны мэтавы Node-прагон: 33 тэсты прайшлі.
Showboat пераправераны пасля дадання гарда.

Усе праверкі CI на `ab2dd62` прайшлі, уключна з web-e2e. Гэта не закрывае
блакуючую прыладавую заўвагу Voka/Judge і не замяняе паўторнае рэв'ю пасля яе выпраўлення.

## Прыладавая прыёмка 2026-11-12

AVD `kudy-ci` адноўлены wipe-data-загрузкай пасля ext4 kernel_panic
(даныя AVD дыспазітарныя: CI-прылада, дадатак пераўсталёўваецца кожным
прагонам). Далей тры прагоны:

1. Поўны `npm run e2e:android:local` на `e3aef49`: smoke 12/0, walk
   зваліўся на двух GPS-кейсах (таймаўт статусу стопа і захаплення радка
   сесіі), discovery не пачаўся.
2. Дыферэнцыял §3 на main `31bc7e3` (той самы APK, JS базы праз Metro):
   walk 0/5, ва ўсіх кейсах `uiautomator dump failed: adb timed out` —
   флейк-клас [#173](https://github.com/kudy-vk/KUDY/issues/173), на main
   падае горш, прычына не ў змене.
3. Чысты паўтор на `e3aef49` пры вызваленай памяці хоста:
   **`Android E2E: passed on e3aef498640d11f2f26ce88a025c5ca8b7751252`**
   — smoke 12/0, walk 5/0 (абодва ранейшыя GPS-кейсы прайшлі),
   discovery 4/0; non-gating `visual:check` PASS 11 · DIFF 1 · FAIL 0
   (адзіны DIFF — `guide-card-long-title@font1.5-be`, 0.0546% пікселяў
   супраць парога 0.05%, светлая тэма, non-gating).
   APK SHA-256: `F582C473D7593AD04D1AE61A5A6EE64582C79D07C36090D80C7FFEFC45F4C476`.

Натыўныя здымкі цёмнай тэмы да (JS базы `6e2c93d`) і пасля (JS каміты
`e3aef49`) знятыя на той самай прыладзе з тым жа APK: меню, Explore, карта.
Умовы і маркеры бандла — [маніфест](../../design/brand/outputs/dark-theme-212/native/capture-manifest.json).
Блакуючую заўвагу Voka/Judge пра натыўную прыёмку знята; фінальнае рэв'ю
гэтых дакументаў — асобны крок канвеера.

## Праверка змержанага дрэва 5f736b3

Мерж origin/main (`2979327`: #242, #246, #249, #262) унёс новыя экраны і
змену меню. Праверкі на каміце:

- CI GitHub Actions: усе 15 чэкаў `5f736b3` зялёныя (required-checks
  уключна з tests 22/24, web-e2e, jscpd, showboat, guard).
- Smoke: 11 passed / 1 failed — кейс «map menu routes…» чакае `reserve-1`
  адключаным, а main у #200 наўмысна зрабіў яго жывой спасылкай
  «Пра горад». Дыферэнцыял §3 на нязмененым main `2979327` (той самы APK,
  JS базы праз Metro): той самы адзін fail, 11/1. Гэта састарэлы сцэнарый
  main, не гэтай змены — [issue #266](https://github.com/kudy-vk/KUDY/issues/266).
- Walk: 3 passed / 2 failed — тыя ж два GPS-кейсы, што і ў першым прагоне
  `e3aef49` (флейк-клас #173: на чыстым паўторы таго ж кода яны прайшлі
  5/0). Discovery: 4 passed / 0 failed.
- Дыферэнцыял main для walk раней: 0/5 з `uiautomator dump: adb timed out`
  — падае горш без гэтай змены.
- Тэмавыя гарды на змержаным дрэве: `design-dark-theme` +
  `design-runtime-theme` + `map-05-specimen` 21/21; render-тэсты
  `dark-theme-render` + `screen-surface` 20/20; `npm run typecheck` прайшоў.
- Judge-знаходка low (пусты радок у human-actions) выпраўленая ў мерж-каміце:
  [issue #265](https://github.com/kudy-vk/KUDY/issues/265) закрыты з доказам.
