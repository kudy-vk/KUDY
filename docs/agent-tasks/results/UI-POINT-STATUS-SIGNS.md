# #213 — адзіныя знакі станаў кропак

Дата: 2026-11-10. База: `9165d22`. Галіна: `213-point-status-signs`.
Задача: [#213](https://github.com/kudy-vk/KUDY/issues/213).

## Рэалізацыя

Адзін кампанент `components/point-status-sign.tsx` адлюстроўвае стан з рухавіка, без уласнага стану, запісу або асінхронных дзеянняў. Карта, схема, картка і спіс чытаюць яго пры кожным рэндэры; паўторны рэндэр і аднаўленне сесіі карыстаюцца тым самым станам рухавіка.

Новыя ўваходы з сеткі, дазволы, сакрэты, сховішчы і незваротныя аперацыі адсутнічаюць. Мяжы доступу да зачыненых кропак і запуску аўдыё не змяняюцца. Паўторна выкарыстоўваюцца Lucide, `CanonIcon` і токены праекта. Асобныя малюнкі для кожнай паверхні адхіленыя, бо яны зноў разыдуцца паміж сабой.

## Крытэрыі задачы

| Крытэрый | Вынік і доказ |
|---|---|
| 1. Канон §5 і спасылка K3 на M7 | Выканана: [канон](../../design/visual-language.md) і [рэестр](../../design/brand/decisions.md#m7). |
| 2. Адзін кампанент на карце, у картцы і ў спісе | Выканана: `PointStatusSign` падключаны да натыўнай карты і спіса, схемы і карткі Run. Рэндэр-тэсты правяраюць гэтыя шляхі. |
| 3. Колеры, тэкст і назвы для экраннага чытальніка | Выканана на ўзроўні кода і тэстаў; натыўнае чытанне — NOT-VERIFIED. |
| 4. Пяць розных знакаў | Выканана. Наўмысная замена `locked: Lock` на `locked: Hourglass` дала падзенне абодвух тэстаў кампанента; зыходнік адноўлены. |
| 5. Карта ў дзвюх тэмах са здымкамі | NOT-VERIFIED. Без гэтага задачу нельга закрываць. |

## Праверкі

- `npx jest --config jest.config.js --runInBand --silent --runTestsByPath components/point-status-sign.test.tsx components/run-native-map.test.tsx app/run.test.tsx`: 59 passed, 3 suites passed.
- `npx jest --config jest.config.js --runInBand --silent`: 337 passed, 43 suites passed, 94.782 s.
- `node --test test/run-map-contrast.test.mjs`: 5 passed.
- `node --test --experimental-strip-types test/design-tokens.test.mjs test/design-runtime-theme.test.mjs test/run-map-contrast.test.mjs`: 27 passed пасля выпраўлення двух састарэлых згадванняў літары ў каноне.
- `npm run typecheck`: exit 0.
- `npm run arch:check`: 734 modules, 0 violations.
- `npm run tools:check`: 97 production tool files clean.
- `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .`: 0 clones.
- ESLint не мае канфігурацыі для закранутых TSX-файлаў: яны былі прапушчаныя з папярэджаннямі. Гэта не праверка іх стылю.

Node-частка поўнага набору з `package.json` выкананая з `--test-concurrency=2`, каб абмежаваць спажыванне памяці на Windows: 3023 tests, 2931 passed, 18 failed, 74 skipped, 240444.6414 ms. З-за памылак каманда з `&&` не дайшла да Jest; усе Jest-сюіты запушчаныя асобна.

Памылкі: Showboat APR-04; G20.35 mutation; Linux-ранер `run-local`; рэестр hitSlop і CLI `visual-a11y`; заглушка adb у `visual-check`. Іх тэсты і крыніцы, у тым ліку `components/back-button.tsx`, не адрозніваюцца ад `origin/main`. Для APR-04 асобна адноўленая памылка чытання bash-блока ў Windows checkout з CRLF. Поўны параўнальны прагон `main` не выконваўся. Linux-каманда `ci:local` на Windows адмаўляецца працаваць паводле свайго кантракту.

Доказ: [Showboat](../../demos/2026-11-10-point-status-signs.md), `uvx showboat==0.6.1 verify docs/demos/2026-11-10-point-status-signs.md`: exit 0.
Візуальныя абмежаванні: [справаздача дызайн-QA](../../design-qa/reports/2026-11-10-point-status-signs.md).

## Самаправерка аўтара

Па чэк-лісце Voka і правілах KUDY правераныя тыпы, агульны кампанент, межы пластоў, подпісы, недатыкальнасць станаў і націсканняў. Вялікі файл Run застаецца зборкай экрана; новы знак вынесены ў асобны кампанент без другога ўласніка стану.

## Незалежная Voka

Агент Voka (Codex, чысты кантэкст) праверыў дыф `9165d22…41287a5` і наступнае выпраўленне канона: `APPROVED — critical: 0, high: 0, medium: 0, low: 0`. Ён асобна паўтарыў 59 Jest-тэстаў, 5 тэстаў кантрасту і праверку тыпаў. Адзіная заўвага — дзве састарэлыя згадкі літары маркера — выпраўленая і паўторна правераная. Judge і прыёмка на прыладзе застаюцца адкрытымі; вердыкт кода не азначае гатоўнасць да мержу.

Паўторная праверка: адкрыць Run, прагледзець пяць станаў на карце, у спісе і картцы; знакі павінны супадаць, тэкст стану заставацца бачным, націсканне маркера не павінна запускаць аўдыё. Паўтарыць у светлай і цёмнай тэмах.

## Android — працяг 2026-11-11

`npm run e2e:android:local` пачаў прагон на `41287a5be4dd6a51f34d6a374f2c518180dbaf93`. APK сабраны: `BUILD SUCCESSFUL in 10m 39s`. SHA-256 APK: `f582c473d7593ad04d1ae61a5a6ee64582c79d07c36090d80c7ffefc45f4c476`. Эмулятар `kudy-ci` (Android 35, x86_64, WHPX) загрузіўся.

Першы smoke-сцэнар спыніўся на `adb timed out after 15000 ms: adb -s emulator-5554 shell am force-stop by.kudy.app`. Пры перапыненні сесіі прагон не завяршыўся; вынікаў `walk` і `discovery` няма. Параўнальны прагон на `main` не выкананы, таму гэты збой не прыпісаны змене UI.

Пры аднаўленні праверана, што працэс 580, пазначаны ў `D:\KUDY-Android\runner.lock`, больш не працуе. Паўторны `npm run e2e:android:local` вярнуў exit 75: `stale local-runner lock`; блакіроўка захаваная паводле правіла ранера. Android E2E: NOT-VERIFIED. Для паўтору чалавек мусіць праверыць адсутнасць іншага прагону, выдаліць названую блакіроўку і зноў запусціць каманду.

Журнал: `D:\KUDY-Android\logs\run-2026-11-10T22-41-21-668Z.jsonl`; smoke: `D:\KUDY-Android\logs\smoke-2026-11-10T22-41-21-668Z.log`; артэфакты: `D:\KUDY-Android\checkout\tools\e2e-android\artifacts\2026-11-10T22-53-51-423Z`.
