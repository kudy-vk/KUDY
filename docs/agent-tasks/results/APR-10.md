# APR-10 — мяжа падтрымкі Android UI: вялікі шрыфт, арыентацыя, планшэты

Дата: 2026-11-01. Задача: #813. Эпік: #299. База: main `ff9cea15`.

Вынік: запісанае рашэнне ўладара (крытэрый 3, прынята ў жывой сэсіі 2026-11-01), матрыца сцэнарыяў на чатырох AVD API 36 (тэлефон, фолд, Resizable, планшэт) са здымкамі, дэфектаў вялікага шрыфту не знойдзена, заведзеныя дзве задачы-наступствы #958, #959. Runtime не крануты (правіла эпіка: APR-06–APR-10 — задачы рашэнняў).

## Рашэнне ўладара (крытэрый 3)

**«Тэлефон вертыкальна, вялікія экраны — абедзве арыентацыі»**, прынята ўладарам прадукта 2026-11-01 у сэсіі выканання (выбар з трох варыянтаў, рэкамендаваны варыянт прыняты).

Падтрыманы ўзровень і паводзіны:

| Вобласць | Мяжа | UX-наступствы |
| --- | --- | --- |
| Арыентацыя тэлефона | `orientation: portrait` захоўваецца (`app.json:7`, маніфест `screenOrientation=portrait`) | Аднаручная ўстойлівасць; гарызанталь на тэлефоне не падтрымліваецца свядома |
| Арыентацыя ≥600dp (планшэт, разгорнуты фолд) | Не фіксуецца на правераным Android 16 (API 36) пры `targetSdk=36`: сістэма ігнаруе `screenOrientation` на ≥600dp (ёсць выключэнні); на Android 12–15 універсальнай гарантыі няма — абедзве арыентацыі патрабуюць асобнай праверкі | Прылады вяртаюцца, стан захоўваецца (засталяна); двухкалонныя варыяцыі — добраахвотныя |
| Сістэмны шрыфт | Да 200% уключна; UI-тэкст праз `ScaledText` з капам `font.big-text-factor` 1.25 (`components/scaled-text.tsx`) | Пры 200% тэкст расе да 1.25×, раскладкі трымаюцца (засталяна); uncapped `Text` забаронены ў production (гейт #718, G21.50 для zh) |
| Display size | Правераны крок ≈максімальны (`wm density 540` на базе 420) | Без абразання; рады дзеянняў пераносяцца |
| Multi-window / split-screen | `RESIZEABLE_VIA_SDK_VERSION`; split-screen на эмулятары NOT-VERIFIED → #958 | Прабел зафіксаваны, не залічваецца як pass |
| Шырыня кантэнту на планшэце | Поўная шырыня акна без капа — Tier-2 паляпшэнне → #959 | Line_Length (45–75 сімв.) на 800dp трымаецца фактычна; паліпшэнне шчыльнасці адкладзенае |
| TalkBack/ Accessibility Scanner | Па-за гэтай задачай (UX-01) | Прабел у матрыцы UX-01 захоўваецца |

Наступствы для напісання кода: uncapped `Text` і фіксаваныя без пераносу рады дзеянняў — адзіныя вядомыя дэфекты 200%, абодва маюць межу ў ідыёме `ScaledText` + фіксы #719; партрэт-лак тэлефона не знімаць без новага рашэння; на ≥600dp нельга дадаваць код, што абапіраецца на забарону павароту або спрабуе адключыць multi-window.

## Крытэрый 1 — супастаўленне зыходнікаў і гайдлайнаў

Крыніцы прачытаны 2026-11-01 па `ff9cea15`:

- `app.json:7` — `orientation: portrait`; `userInterfaceStyle: automatic`.
- `components/scaled-text.tsx` — адзіны ідыём карыстальніцкага тэксту: `maxFontSizeMultiplier={tokens.fontBigTextFactor}` (1.25, G06.05).
- Дэфекты 200%: #718 (закрыты) — uncapped `Text` на font_scale 2.0 дае ≈1.762× і абрэз гліфаў праз Fabric-cache; production бяспечны (ідыёма + G21.50), дэфект жыве толькі ў dev-probe экранах. #719 (закрыты) — фіксаваныя рады дзеянняў перапаўняліся на 200%; выправлена пераносам.
- Маніфест усталяванага APK (debug, 27.10): `targetSdk=36`, `minSdk=24`, `screenOrientation=1 (portrait)` на галоўнай актыўнасці, `RESIZE_MODE_RESIZEABLE_VIA_SDK_VERSION`, `supportsScreens=[small…xlarge, resizeable, anyDensity]` (aapt2 dump + `dumpsys package`).
- Android core app quality (2026-11-01): абавязковыя — `Orientation_Transitions` (у т.л. fold/unfold без страты стану), `Display_State_Parity`, `Fullscreen_Display` (без letterbox ад канфігурацыйных зменаў), `State_Preservation`, `Touch_Target_Size` ≥48dp, `Line_Length` 45–75 сімвалаў, `Theme_Support` (цаляпад → #436, па-за гэтай задачай).
- Adaptive app quality Tier 3 (2026-11-01): усе патрабаванні абавязковыя — `Config_Changes` (запаўненне акна, без letterbox/compat, resize + стан), `Config_Combinations`, `Multi-Window_Functionality`, `Multi-Resume`, клавіятура/мыш; на Android 16 (API 36) пры targetSdk 36 на экранах sw ≥600dp сістэма ігнаруе арыентацыйныя і resize-абмежаванні (з дакументаванымі выключэннямі); гэта не гарантыя API 31+ на ўсіх прыладах. Маштаб шрыфту ў Tier 3 не ўваходзіць — гэта core/accessibility.
- Размежаванне: абавязковая сумяшчальнасць = core + Tier 3 (малюнак вышэй); **пажаданыя Tier 2** — desktop windowing, двухпанэльныя раскладкі і зместавая шчыльнасць (#959), стылус-паляпшэнні. Гэтыя не мяжа выпуску.

## Крытэрый 2 — матрыца прылад і станаў (эмулятары, здымкі)

Асяроддзе: Linux-хост, API 36 (`system-images;android-36;google_apis;x86_64`), `-gpu swiftshader_indirect`. APK: debug `by.kudy.app` ад 27.10 (без перазборкі). Metro з клону `ff9cea15` на :8081; кантэнт — G23.01 e2e-origin :8791 (catalog sha256 `c5774ecc…`, маршруты 2). Здымкі: `docs/testing/evidence/2026-11-01-issue813/`.

Сцэнарыі з issue: прагляд гідаў (галоўнае меню + горад + спіс), Run (прагулка: старт, прыпыніць/завяршыць, дыялаг, рэзюме), карта (рэзюме прагулкі з MapLibre-картай), пакупка (платны гід: поўнае + закрытая кропка), налады (экран KUDY: мова 8 шт., бягучая прагулка, гісторыя).

| Прылада (AVD) | Стан | Сцэнарыі | Вынік | Здымкі |
| --- | --- | --- | --- | --- |
| Тэлефон `kudy-test` (Pixel 6, 1080×2400 @420) | font 1.0 | усе 5 | чыста | phone/00,01,02,03,04,05,06,07,08 |
| тое ж | font 2.0 (сістэмны максімум) | усе 5 | чыста; рады дзеянняў Run пераносяцца ў дзве наступныя радкі (фіксы #719); дыялагі і поўнае чыстыя | phone/11,12,14,15,17,18 |
| тое ж | display size ≈макс (`wm density 540`) | дом, Run, рэзюме, поўнае (гід прагнаны без асобнага здымка прэв'ю) | чыста; кнопкі stacked | phone/21,24,25,27 |
| тое ж | font 2.0 + 540dpi (камбінацыя) | дом, гід (без асобнага здымка прэв'ю), Run | чыста | phone/31,32,34 |
| Фолд `kudy-813-fold` (7.6", унутраны 1768×2208 @420 = 673dp) | партрэт, font 1.0 | усе 5 | чыста; поўная шырыня без letterbox | fold/41,43,78,79,80,81 |
| тое ж | партрэт, font 2.0 | усе 5 | чыста; рады дзеянняў Run у шэрагу (шырыні хапае) | fold/62,63,64,65,66,67 |
| тое ж | landscape (user_rotation=1), font 1.0 | дом | дадатак паварочваецца нягледзячы на партрэт-лак (адпавядае паводзінам Android 16 / targetSdk 36 на ≥600dp); гіды ў дзве калонкі | fold/42 |
| тое ж | landscape, font 2.0 | усе 5 | чыста; адна наступная навігацыя пасля рэзюме трапіла на dev-оверлей NPE (#979, аднаўленне перазапускам; здымкі да/пасля карэктныя) | fold/82,83,84,85,86,87,88 |
| тое ж | fold/unfold дысплея | — | **NOT-VERIFIED**: профіль не пераключае дысплеі (`DeviceStateToLayoutMap` пусты); пакрыта Resizable AVD | fold/43 (факт: пераключэнне не эмулюецца) |
| Resizable `kudy-813-resizable` | OPENED (1080×2400), font 2.0 | усе 5 | чыста | fold/68,69,70,71,72,73 |
| тое ж | CLOSED (1080×2092), font 2.0 | усе 5 | чыста; поўны набор у закрытым стане | fold/74,75,76,77,78-resizable,79-resizable |
| тое ж | OPENED ↔ CLOSED з адкрытым прэв'ю гіда | гід | стан захаваны ў абодвух пераходах, без краху — fold-частка `Orientation_Transitions` | fold/44,45 |
| тое ж | font 1.0, акрамя прэв'ю-пераходаў | Run, карта, пакупка, налады | **NOT-VERIFIED** (не праганяліся ў гэтай сэсіі; прыёмачны бар #813/#976 — вялікі шрыфт, які пакрыты; фолд-профіль на font 1.0 пакрыты поўнасцю) | — |
| Планшэт `kudy-813-tablet` (2560×1600 @320 = 800dp партрэт / 1280dp landscape) | font 1.0, landscape, партрэт | дом, горад, прэв'ю | поўны экран без letterbox у абедзвюх арыентацыях; горад і прэв'ю захоўваюць стан праз паварот | tablet/50,51,52,53-city,53-guide,54 |
| тое ж | font 2.0, landscape | усе 5 (дом, гід, Run, карта/рэзюме, пакупка, налады) | чыста; рады дзеянняў Run у шэрагу (шырыні хапае), поўнае і налады без абразання | tablet/56,57,58,59,60,61 |
| тое ж | split-screen | спроба | **NOT-VERIFIED**: сэанс пікера лаўнчара скідаецца пры скрыптаванні → #958 | tablet/55-tablet-splitscreen-pick.png |
| Фізічныя тэлефон/фолд/планшэт | — | — | **прабел** (адсутнасць прылады; не pass) — трэк рэлізу #299/#330 | — |
| TalkBack поўны праход | — | — | **прабел** (UX-01) | — |

Дэфектаў на 200% не знойдзена (тэлефон: поўны набор; планшэт: усе крытычныя сцэнарыі на font 2.0 — tablet/56–61; фолд: поўныя партрэт font-1.0, партрэт і landscape font-2.0; Resizable: поўныя OPENED і CLOSED font-2.0). Назіранні і адзін інцыдэнт: menu-карткі на 1280dp расцягваюцца на ўсю шырыню (→ #959); першы запуск на кожнай прыладзе паказвае dev-меню лаўнчара — артэфакт dev-зборкі, не production (fold/40); адзін рэндэр-збой dev-кліента (NPE натыўнага SQL-хэндла пасля перастварэння актыўнасці) на навігацыі пасля рэзюме прагулкі ў landscape — асобны дэфект #979, на зробленыя здымкі не ўплывае (fold/88).

### Метаданыя прагонаў (вымаганне #976)

Агульныя: Linux-хост, AVD на `system-images;android-36;google_apis;x86_64`, `-gpu swiftshader_indirect`; APK `by.kudy.app` versionName 0.1.0, versionCode 1, sha256 `f7e30d0f8b56c571…` (debug, збудаваны 2026-10-27 у main-checkout, без перазборкі — адзін і той самы APK на ўсіх прагонах); JS-бандл — Metro з асобнай копіі рэпазіторыя, кантэнт — G23.01 e2e-origin :8791 (catalog sha256 `c5774ecc…`).

| Прагон | font_scale | wm density | wm size | Вокны/арыентацыя | Здымкі |
| --- | --- | --- | --- | --- | --- |
| Фолд партрэт 1.0 | 1.0 | 420 | 1768×2208 | партрэт, 673dp | fold/41,43,78–81 |
| Фолд партрэт 2.0 | 2.0 | 420 | 1768×2208 | партрэт, 673dp | fold/62–67 |
| Фолд landscape 1.0 | 1.0 | 420 | 1768×2208 | landscape (user_rotation=1), 843dp | fold/42 |
| Фолд landscape 2.0 | 2.0 | 420 | 1768×2208 | landscape (user_rotation=1), 843dp | fold/82–88 |
| Resizable OPENED 2.0 | 2.0 | 420 | 1080×2400 | device_state=OPENED | fold/68–73 |
| Resizable CLOSED 2.0 | 2.0 | 420 | 1080×2092 | device_state=CLOSED | fold/74–77,78–79-resizable |
| Планшэт 1.0 / 2.0 | 1.0 / 2.0 | 320 | 2560×1600 | landscape натуральная + партрэт (user_rotation=1) | tablet/50–61 |
| Тэлефон 1.0/2.0/540dpi | 1.0 / 2.0 | 420 / 540 (override) | 1080×2400 | партрэт (лак дзейнічае, sw<600dp) | phone/00–34 |

## Крытэрый 3 — праверка выканання

Рашэнне прынятае і запісанае (раздзел «Рашэнне ўладара»): узровень, паводзіны арыентацыі і шрыфту, прынятыя абмежаванні з UX-наступствамі і датай 2026-11-01.

## Крытэрый 4 — fix-issues і асобныя дэфекты

Створаныя асобныя задачы без зменаў runtime:

1. #958 — split-screen доказ + камітная ахова «без letterbox/compat» + паўтор матрыцы Resizable на фінальнай зборцы.
2. #959 — кананічны максімум шырыні кантэнту на ≥600dp + revert-праверка.
3. #979 — NPE натыўнага SQL-хэндла ў dev-кліенце пасля перастварэння актыўнасці (знойдзена пашыранай матрыцай; фікс/ацэнка — асобная задача, тут runtime не кранаецца).

## Абнаўленні дакументаў у гэтым PR

- `docs/audits/android-google-guidelines.md` — радкі UX-02/UX-03/UX-05: стан на 2026-11-01 са спасылкай на гэты results і рашэнне; сцяжкі не пераводзяцца (TalkBack/фізічныя прылады/split — прабелы).
- `docs/agent-tasks/android-play-readiness/README.md` — радок UX-02/03/05: рашэнне APR-10 прынятае, наступствы #958/#959.

## Scope і мяжы

Змены толькі ў дакументах і evidence-здымках; runtime, схемы, пераклады і .github не кранутыя. Усе прыладныя сцвярджэнні — эмулятары API 36 на x86_64 са swiftshader; фізічныя прылады і TalkBack — зафіксаваныя прабелы; split-screen NOT-VERIFIED → #958; NPE-інцыдэнт ландшафту → #979; усе — не залічаныя як pass.

## Proof

Цэласны кантроль матрыцы (вымаганне 3 #976): праверка, што КОЖНЫ здымак, цытуемы радкамі матрыцы, існуе на дыску, плюс анкеры межы. Падае пры выдаленні любога радка матрыцы разам з яго здымкамі або пры змене межы (`ScaledText`-кап 1.25, партрэт-лак) без новага рашэння:

```sh
node -e "const a=require('node:assert/strict'),f=require('node:fs');const base='docs/testing/evidence/2026-11-01-issue813/';const rows={'phone/':[ '00-baseline-home.png','01-baseline-home-catalog.png','02-baseline-guide.png','03-baseline-guide-downloaded.png','04-baseline-run.png','05-baseline-walk-confirm-dialog.png','06-baseline-map.png','07-baseline-paywall.png','08-baseline-kudy-info.png','11-font200-home.png','12-font200-guide.png','14-font200-run.png','15-font200-walk-summary.png','17-font200-paywall.png','18-font200-settings.png','21-density540-home.png','24-density540-run.png','25-density540-walk-summary.png','27-density540-paywall.png','31-combined-home.png','32-combined-guide.png','34-combined-run.png'],'fold/':['40-folded-unfolded-inner-home.png','41-unfolded-home.png','42-unfolded-landscape.png','43-fold-avd-portrait-guide-display-switch-not-emulated.png','44-resizable-closed-guide.png','45-resizable-reopened-guide.png','62-fold-font200-home.png','63-fold-font200-guide-preview.png','64-fold-font200-run.png','65-fold-font200-walk-map.png','66-fold-font200-paywall.png','67-fold-font200-settings.png','68-resizable-font200-opened-home.png','69-resizable-font200-opened-guide-preview.png','70-resizable-font200-opened-run.png','71-resizable-font200-opened-walk-map.png','72-resizable-font200-opened-paywall.png','73-resizable-font200-opened-settings.png','74-resizable-font200-closed-home.png','75-resizable-font200-closed-run.png','76-resizable-font200-closed-walk-map.png','77-resizable-font200-closed-paywall.png','78-fold-font100-run.png','79-fold-font100-walk-map.png','80-fold-font100-paywall.png','81-fold-font100-settings.png','82-fold-font200-landscape-home.png','83-fold-font200-landscape-guide.png','84-fold-font200-landscape-run.png','85-fold-font200-landscape-walk-map.png','86-fold-font200-landscape-paywall.png','87-fold-font200-landscape-settings.png','88-fold-font200-landscape-render-error.png','78-resizable-font200-closed-guide-preview.png','79-resizable-font200-closed-settings.png'],'tablet/':['50-tablet-landscape-home.png','51-tablet-landscape-home-after-dialog.png','52-tablet-rotated-portrait.png','53-tablet-landscape-city-preserved.png','53-tablet-landscape-guide-preserved.png','54-tablet-portrait-guide-preserved.png','55-tablet-splitscreen-pick.png','56-tablet-font200-home.png','57-tablet-font200-guide.png','58-tablet-font200-run.png','59-tablet-font200-walk-map.png','60-tablet-font200-paywall.png','61-tablet-font200-settings.png']};let n=0;for(const d of Object.keys(rows))for(const p of rows[d]){a.ok(f.existsSync(base+d+p),'missing '+d+p);n++}console.log('matrix PNGs verified:',n);a.equal(n,70);const s=f.readFileSync('components/scaled-text.tsx','utf8');a.ok(s.includes('maxFontSizeMultiplier={tokens.fontBigTextFactor}'));const j=f.readFileSync('app.json','utf8');a.ok(j.includes('\"orientation\": \"portrait\"'));console.log('APR-10 proof: OK')"
```
