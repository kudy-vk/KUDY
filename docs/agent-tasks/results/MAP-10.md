# MAP-10 — гістарычная карта і альтэрнатыўнае кіраванне

Задача: [#83](https://github.com/kudy-vk/KUDY/issues/83). Рэалізацыя ў асобным працоўным дрэве `/home/viktar/Projects/KUDY-chatgpt-83`, галіна `chatgpt/83`; асноўны checkout паралельных сесій не змяняўся.

## Рашэнні ўладальніка

- 23.11.2026: зацверджаны **варыянт A** — без дадатковых бачных кнопак, з клавіятурай і дзеяннямі TalkBack/VoiceOver.
- 24.11.2026: зацверджаны **гістарычны выгляд карты Гданьска ў пяці кавалках**, з візуальнага рэферэнсу Etsy. Новых знакаў, што прэтэндуюць на рэальныя аб'екты, не дадаваць без праверкі.

Выявы на аснове генерацыі ў сесіі з'яўляюцца мастацкай стылізацыяй. Гэта **не** дакладная архіўная карта; датаванне і лакалізацыя дэталяў не пацверджаныя.

## Рэалізавана

1. `docs/design/brand/outputs/MAP-10/approved-historical-source.jpg` — лакальны экспарт зацверджанай карты. Сыходны малюнак Etsy ў рэпазіторыі адсутнічае.
2. `build-approved-menu.py` выбірае пяць `historical/pieces/*.png` з адзінай карціны, не змяняючы прынятыя альфа-маскі. Асобныя `*--ui.png` захоўваюць цені і абводку; два дадатковыя `historical/layers/*.png` запаўняюць астатнюю сцэну. `scattered.png` і `assembled.png` дапамагаюць візуальнай праверцы.
3. `MAP-10/native-assets.ts` — статычныя `require()` для Metro. Імпарт у `menu-map-city-only/native/CityMapMenu.tsx` пераключаны на новы набор без змены стыкоўкі і маршрутаў.
4. `CityPuzzle` падтрымлівае `moveAccessible`, `snapAccessible`, `cancelAccessible`, `groupSize`; магніты далучаюць толькі сапраўдных суседзяў. Сістэмны жэст пачатку перацягвання больш не перахопліваецца пры `dragEnabled:false`.
5. Натыўны `Pressable` падтрымлівае стрэлкі, S, Escape, custom accessibility actions, захоўвае фокус на «Хутка», паведамляе колькасць злучаных фрагментаў. Гатовыя подпісы дзеянняў на be/en/uk/pl, для астатніх моў часова en fallback.
6. Падчас вяртання ў меню renderer па-ранейшаму перамантоўваецца, скідвае раскладку і не захоўвае пазіцыі. Навігацыя адкрываецца адразу, без складання карты.

## Праверкі ў ізаляваным Linux-клоне

| Каманда | Вынік |
|---|---|
| `python3 docs/design/brand/outputs/MAP-10/build-approved-menu.py` | **PASS** — пяць частак, два слаі, алфа-маска поўнай карты дакладна адноўленая |
| `node --test tools/design/map10-historical.test.mjs` | **PASS: 3/3** — сем слаёў, колеры, памеры, арыгінальныя маскі, фактычнае ўключэнне ў native |
| `node --experimental-strip-types --test docs/design/brand/outputs/menu-map-city-only/native/model.test.mjs` | **PASS: 15/15** |
| `node docs/design/brand/outputs/menu-map-city-only/native/verify-component.mjs` | **PASS: 7/7** |
| `node node_modules/typescript/bin/tsc -p tools/design/tsconfig.map10.json --noEmit --pretty false` | **PASS** — мэтавы TypeScript-кантур змененых файлаў |
| `npm run arch:check` | **PASS** — 825 модуляў, 0 парушэнняў |
| `node node_modules/typescript/bin/tsc --noEmit` | **FAIL (не ў гэтай змене)** — TS6053: адсутнічае `spikes/G00.03-sandbox-grant/server/device-auth.mjs` |
| `node node_modules/jest/bin/jest.js --config jest.config.js --runInBand --runTestsByPath app/menu.test.tsx` | **FAIL (не ў гэтай змене)** — адсутнічае `controllers/run/runSurfaceController.ts`; тэст не даходзіць да выканання |
| `npm run ci:local` | **NOT-VERIFIED** — лакальны MCP-выканаўца не вярнуў вынік да тайм-аўту |
| `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .` | **NOT-VERIFIED** — няма лакальна ўсталяванага `jscpd`, сеткавы запуск па-за дазволеным npm-ci |
| `uvx showboat==0.6.1 verify ...` | **NOT-VERIFIED** — `uvx` не даступны ў ізаляваным выканаўцы |

## Design-QA: прамежкавая праверка

**Вердыкт: INSUFFICIENT_EVIDENCE.** RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 4.

Зменены экран — галоўнае меню з пяццю часткамі. Праверка масак і стыкоўкі аўтаматызаваная; фактычная графіка згенераваная, зацверджаны візуальны кірунак зафіксаваны. Ранейшы браўзерны макет M11 не з'яўляецца супастаўным production-бэйзлайнам новага native PNG, таму `DIFF` не прыдумваецца.

- **NOT-VERIFIED:** Android/iOS 320/360/390/430 dp, safe areas, паварот, вялікія шрыфты, абедзве тэмы; патрэбныя супастаўныя скрыншоты/скрынрыдары.
- **NOT-VERIFIED:** TalkBack/VoiceOver і фізічная клавіятура на сапраўдных прыладах; unit-тэст не можа даказаць сістэмныя жэсты.
- **NOT-VERIFIED:** кантраст на сапраўдных экранах і мінімальныя зоны дотыку пры змене маштабу шрыфту; разліковыя 48 dp не замяняюць вымярэнне.
- **NOT-VERIFIED:** незалежная гістарычная дакладнасць і крыніца асобных аб'ектаў малюнка; зацверджана эстэтыка, не дакументальная карта.

Спроба абвергнуць `RULE`: не знойдзена вымеранага парушэння прынятага канона; ніводнае адхіленне не было павышанае да `RULE` без рэальных Android/iOS-скрыншотаў. Зялёнага Design-QA-вердыкту пакуль няма.

## Межы і далейшыя дзеянні

Пакуль `components/city-map-menu.tsx` выкарыстоўвае `dragEnabled:false`, перацягванне пальцам у production не ўключанае; гэта інтэграцыйная задача [MAP-11 (#84)](https://github.com/kudy-vk/KUDY/issues/84). Клавіятура і экранны чытальнік дазваляюць зборку незалежна ад drag.

Засталіся прыладная прыёмка, праверка ўсіх лакаляў і поўная CI-пацверджаная праверка. Нічога з гэтага не падаецца як выкананае. Мерж у `main` не дазволены без зялёных праверак і вердыктаў Voka/Judge.
