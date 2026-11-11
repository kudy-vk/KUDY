# MAP-06 — канфігурацыйнае галоўнае меню

Задача: [#80](https://github.com/kudy-vk/KUDY/issues/80). Дата: 2026-11-04. Крыніцы прачытаныя на `6dfc81b6`: задача і яе ўладарскія ўдакладненні, `visual-language.md`, `brand/decisions.md`, `design-qa/exceptions.md`, native README і існы код карты. Уладальнік у гэтай сесіі яўна даручыў узяць #80; гэта не закрывае гістарычныя залежнасці MAP-04/MAP-05 і не азначае праверкі правоў на карту.

## Рашэнне перад рэалізацыяй

Узровень `smol`: UI, навігацыя і праекцыя лакалізацыі; няма новых сэрвісаў або залежнасцяў дадатку.

| Пытанне | Рашэнне і правераная крыніца |
|---|---|
| Паводзіны | AC #80 і заўвагі ўладальніка: галоўны экран з кавалкаў, тры існыя маршруты, два неактыўныя пункты, скід пры вяртанні. |
| Уласнік | `CityPuzzle` валодае толькі часовай геаметрыяй; экран валодае навігацыяй. Існы ўласнік Run не мяняецца. |
| Кантракт | `CityMapMenuProps`: ID, подпісы, станы, іконкі, раскладка; `onSelect(id)` толькі для актыўнага пункта. Хост паўторна правярае наяўнасць маршруту. |
| Пласт | UI імпартуе існы UI-пакет і статычныя асеты; няма новых сеткавых, OS або DB-выклікаў. |
| Пераўжыванне | Адзін `CityMapMenu`, яго маскі, `CityPuzzle`, канонавыя токены, `CanonIcon`, `ScaledText`, `WalkButton` і каталог перакладаў. Другой копіі renderer няма. |
| Час | Выбар ID → праверка канфіга → `router.push`; focus → новы ключ renderer. Змена мовы не скідае раскладку. Аддаленых адказаў і retry няма. |
| Аднаўленне | Новы ўваход стварае часовую разабраную карту; мадэль і таймеры чысцяцца пры дэмантаванні. Сховішча і гісторыя не перапісваюцца. |
| Кантэкст | #80, [публічны кантракт](../../design/brand/outputs/menu-map-city-only/native/README.md), тэсты ніжэй і [дэмка](../../demos/2026-11-04-map-06.md). |

Прамы імпарт існага пакета абраны замест капіявання: гэта захоўвае адзін зыходнік для preview і production. Новы renderer або WebView не патрэбныя. Межы бяспекі: маршрут выбіраецца толькі са статычнага канфіга, знешнія URL і параметры не прымаюцца, неактыўны пункт не адкрываецца ні праз маску, ні праз accessibility; сакрэты, аўтарызацыя і незваротныя аперацыі не закранаюцца.

## Адпаведнасць крытэрыям

| AC | Рэалізацыя і доказ |
|---|---|
| 1 | [Канфіг](../../../components/city-map-menu.tsx) звязвае ID існых масак, `manifest.version`, ключы лакалізацыі, іконкі і маршруты. Renderer прымае набор пунктаў, мадэль падтрымлівае паднабор без патрабавання адсутнага пятага кавалка. |
| 2 | [Route-тэсты](../../../app/menu.test.tsx) адкрываюць сапраўдныя Map, Guides і Discovery; native-тэст правярае забарону выбару disabled праз маску, Pressable і accessibility. |
| 3 | [Экран](../../../app/menu.tsx) улічвае ўсе safe-area insets, абмяжоўвае шырыню карты і дазваляе вертыкальны скрол. Accessibility-парадак задаецца канфігам. Браўзерныя вымярэнні кнопак і праверкі неперакрыцця — у [маніфесце](../../design-qa/evidence/MAP-06/browser-manifest.json). Native safe area і павялічаны сістэмны шрыфт — NOT-VERIFIED. |
| 4 | Пераўжытыя канонавыя Lucide-іконкі і адзін каталог. «Хутка» даслоўна перанесена з існага зацверджанага web-перакладу ў native-паведамленне для ўсіх зарэгістраваных лакаляў. MAP-05 цалкам не закрываецца гэтай працай. Run/audio не мяняюцца; вяртанне да актыўнай прагулкі правяраецца route-тэстам. |
| 5 | [Светлы здымак](../../design-qa/evidence/MAP-06/light-390-be.png), [цёмны](../../design-qa/evidence/MAP-06/dark-390-be.png), [вузкі de](../../design-qa/evidence/MAP-06/light-320-de.png), [zh](../../design-qa/evidence/MAP-06/dark-430-zh.png), [focus](../../design-qa/evidence/MAP-06/focused-light-390-be.png), [design-QA](../../design-qa/MAP-06.md) і [Showboat](../../demos/2026-11-04-map-06.md). Гэта браўзерны рэндэр сапраўднага кампанента праз React Native Web, не здымкі Android. |

Production-паводзіны гэтай задачы — tap-навігацыя. Drag/snap, persistence, рэклама, футэр і асобны web-дызайн не дададзеныя. Зыходныя картаграфічныя PNG не мяняліся. Паходжанне і правы застаюцца асобнай [задачай #108](https://github.com/kudy-vk/KUDY/issues/108); прававая або гістарычная прыёмка тут не сцвярджаецца.

## Праверкі

UI-крыніца: `2a7980f6f170023e338790e3fc77c8b4a9e6a88f`. Праверкі выкананыя 2026-11-04 у Windows; дакументацыя і скрыншоты дадаюцца асобным камітам.

| Каманда | Вынік |
|---|---|
| `npm run typecheck` | PASS: асноўная, services і core канфігурацыі. |
| `npm run arch:check` | PASS: 718 modules cruised, 0 violations. |
| `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .` | PASS: 0 clones. |
| `npm run messages:generate:check` | PASS: 17 files fresh. |
| `npx jest --runInBand --silent` | PASS: 42 suites, 328 tests; 60.952 s. |
| `node docs/design/brand/outputs/menu-map-city-only/native/verify-component.mjs app/menu.test.tsx docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx` | PASS: 11/11. |
| `node --no-warnings --experimental-strip-types --test docs/design/brand/outputs/menu-map-city-only/native/model.test.mjs` | PASS: 7/7. |
| `node --no-warnings --experimental-strip-types --test tools/e2e-android/wiring.test.mjs` | PASS: 14/14. |
| `npm run tools:check` | PASS: 92 production tool files clean. |
| `uvx showboat==0.6.1 verify docs/demos/2026-11-04-map-06.md` | PASS; паўторныя вывады супадаюць. |
| `npm test` | FAIL у Node-частцы: 2935 tests, 2856 passed, 6 failed, 73 skipped; 100932.9669 ms. Каманда не даходзіць да Jest праз `&&`; Jest выкананы асобна вышэй. |

Збоі поўнай Node-праверкі не замоўчваюцца. Іх файлы і ўваходныя крыніцы не змененыя гэтай задачай:

| Праверка | Назіраная прычына |
|---|---|
| `test/apr04-showboat-output.test.mjs` | LF-рэгулярны выраз не знаходзіць executable block у CRLF-копіі ранейшай APR-04 дэмкі. |
| `tools/ci/g20-35-mutation.test.mjs` | LF-фрагмент скіду dwell не знаходзіцца ў CRLF-копіі orchestrator: чакалася 2, атрымана 0. |
| `tools/e2e-android/visual-a11y.test.mjs`: registry | Праверка шукае `components/back-button.tsx:`; Windows-шлях у registry не адпавядае гэтаму прэфіксу. |
| `tools/e2e-android/visual-a11y.test.mjs`: CLI `--from`, no emulator, no APK | Тры Unix `adb-stub` сцэнары ў Windows не выконваюцца (`spawn ... adb-stub ENOENT`), чаканы далейшы вынік не атрыманы. |

Першапачатковы прагон дадаткова выявіў няправільна запісаны новы zh-радок і адсутныя web-залежнасці. Escape-памылка выпраўленая, залежнасці ўсталяваныя з існага `web/package-lock.json`; адпаведныя праверкі ў фінальным Node-прагоне прайшлі. Ніякія required checks або asserts не аслабленыя.

Voka: незалежны субагент Codex з чыстым кантэкстам; пасля выпраўлення `assembled-menu-label-overlap` — Crit 0, High 0, Medium 0, Low 0, нявырашаных знаходак няма. Падаючы тэст пасля рэальнай зборкі быў запушчаны да выпраўлення; пасля яго правяраюцца схаваныя подпісы і pointer passthrough. Judge не запускаўся; агульны merge gate не сцвярджаецца зялёным. Скіл `arch-review` недаступны: асобны структурны вердыкт не выдадзены, межы правераныя `arch:check` і Voka.

Перад перадачай дадаткова знойдзены і выпраўлены `stale-android-home-boot-contract`: `coldStart` раней чакаў толькі Explore і не мог прайсці новае меню. Цяпер кожны старт абавязкова бачыць Menu; старыя праверкі каталога затым яўна адкрываюць `/explore`, а home-only smoke правярае самі пункты карты і Back. Новыя тэсты не прымаюць стары Explore як доказ новага галоўнага экрана. Voka паўторна праверыў гэтую змену: нявырашаных знаходак няма. Эмулятарны прагон застаецца NOT-VERIFIED лакальна; наяўнасць гэтага кода не выдаецца за доказ CI-праходу.

Retest focus: запусці дадатак → адкрыецца меню; націсні «Гіды» → Back → зноў разабраная карта. «Хутка» і KUDY не адкрываюць маршрутаў. Пры актыўным Run яго іконка вяртае ў тую самую прагулку.

> Рэзалюцыя 2026-11-10 (PR issue #200): «Хутка» больш не тычыцца reserve-1 — фрагмент адкрывае даведнік «Пра горад» (`/city/gdansk/about`), заякарцэна тэстам навігацыі ў `app/menu.test.tsx`; без маршрута застаўся толькі KUDY. Запіс вышэй — гістарыя MAP-06, не зменены.
