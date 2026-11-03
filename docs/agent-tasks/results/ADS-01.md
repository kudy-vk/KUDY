# ADS-01 — даследаванне рэкламнага банэра галоўнага экрана

- Дата: 2026-11-02.
- Issue: #988.
- Статус: даследаванне + ізаляваны PoC. **Ніякай рэкламы ў production не дададзена**; меню-карта, навігацыя і футэр не закранутыя (рашэнні #771/#888 яшчэ не інтэграваныя).
- Артэфакты PoC: [specimen.html](../../design/brand/outputs/ADS-01/specimen.html) (генератар `build-specimen.mjs`, матэматыка `layout-math.mjs`), гард [test/ads-01-layout.test.mjs](../../../test/ads-01-layout.test.mjs) у наяўным glob `test/*.test.mjs` каманды `npm test`.
- Скрыншоты: `docs/testing/evidence/2026-11-02-ads01/` (3 PNG, назвы ніжэй).
- Захоп задачы: 2026-11-02T21:43:49Z, ад main `2af123b4`.

## Кароткі вывад

1. Тэхнічна інтэгруецца **Google AdMob** праз супольны модуль `react-native-google-mobile-ads`: Expo 54/RN 0.81.5 сёння трэба пінаціць на v16.5.0 (v17.x патрабуе RN ≥ 0.86); патрэбны dev-build, Expo Go не працуе.
2. Памер банэра **не адзін**: афіцыйныя правілы даюць дыяпазон [50dp .. cap], cap залежыць ад вышыні экрана (15% / 20% + ліміт 150dp). Канкрэтную вышыню верне SDK на прыладзе — гэта NOT VERIFIED без рэальнай зборкі.
3. Для месца «пад меню-картай, над футэрам» працуе **ўласны ліміт кантэйнера ≈ 90dp** (large anchored adaptive з cap у дадатку): змяшчаецца на ўсіх прадстаўнічых прыладах 320–430dp пры футэры 96dp. Поўны cap (128–150dp) на 320×640 з футэрам 128dp **перакрывае карту на 48dp** — забаронена.
4. Юрыдычны мінімум: для персаналізаванай рэкламы ў ЕЭЗ/Вялікабрытаніі патрэбны Google-сертыфікаваны CMP (з 16.01.2024, Швейцарыя — з 31.07.2024); Play патрабуе дэкларацыю даных у Data safety; дзіцячая аўдыторыя (#880) цягне Families-палітыку — **уладарскае рашэнне**.
5. Камерцыя: афіцыйных eCPM няма; неафіцыйныя ацэнкі банэраў для Польшчы/ЕЭЗ — ~$0.15–0.60 з згодай (крыніцы ніжэй, датаваныя). Доля даходу AdMob 68% пацверджана другасна, афіцыйная старонка недаступная (404, 02.11.2026).

## Крытэрый 1 — факты production аддзелены ад макетаў

Зыходны код прачытаны на main `2af123b4`:

| Факт | Крыніца |
|---|---|
| Home = Explore-укладка, FlatList **без футэра і ніжняй навігацыйнай панэлі** | `app/(tabs)/explore.tsx:78-108`, `components/guide-card.tsx:162-210` |
| Меню-карта (5 фрагментаў) **яшчэ не ў production** — дызайн-артэфакт | `docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.tsx` (ноль згадак з `app/`, `components/`) |
| Блок карты: `width × 1.125` (9:8), viewBox 1600×1800, падыходзіць да 320–430dp, safe-area не ўваходзіць у шырыню | `CityMapMenu.tsx:107,110`, `native/README.md:24` |
| Expo ~54.0.37, RN 0.81.5, React 19.1.0, newArchEnabled, no ads-пакетаў (ёсць толькі react-native-purchases 10.9.1) | `package.json:48,66-73`, `app.json:9` |
| Safe-area: react-native-safe-area-context 5.6.2, edge-to-edge (targetSdk 36), inset-ы ўвязаны ў экраны | `app/(tabs)/explore.tsx:74,82` |
| Арыентацыя: portrait на тэлефонах; ≥600dp — без блокавання; дзве калонкі добраахвольныя (isWide ≥ 821dp) | `app.json:7`, `docs/agent-tasks/results/APR-10.md:15,29` |
| Шрыфт: ScaledText з cap 1.25 | `components/scaled-text.tsx:14` |
| «Кнопкі ≈ 2,5/4 карты» — рашэнне ўладара, канстанты ў кодзе няма; фрагменты ў canvas 1600×1800 канчаюцца на y≤1320 | #771 (квіз 02.11.2026), `native-layout.ts` |

Рашэнні ўладара (#771, 02.11.2026): банэр **над асобным футэрам з відарысам**; відарыс футэра — #990 (`needs:owner`), вэб — #989 (`needs:owner`). Размяшчэнне/фарматы **не зацверджаны** да гэтага даследавання.

## Крытэрый 2 — параўнанне правайдэраў (афіцыйныя крыніцы, датаваныя 02.11.2026)

| | **Google AdMob** | **AppLovin MAX** (медыяцыя) | **Unity LevelPlay** (медыяцыя) |
|---|---|---|---|
| Роля | прамая сетка | медыяцыя (AdMob/Bidding як крыніцы) | медыяцыя |
| RN-модуль | `react-native-google-mobile-ads` v17.4.0 (21.10.2026): **RN ≥ 0.86**, new arch; для RN 0.81.5 — пін v16.5.0 (18.08.2026, peer `expo>=47`) | `react-native-applovin-max` 9.6.0, peer `react-native: "*"` | RN-плагін v9.0.0+, Kotlin 2.0+/stdlib 2.1.x |
| Android-патрабаванні GMA SDK 25.5.0: minSdk 24, compileSdk 35+ | AppLovin: NOT VERIFIED (старонка патрабаванняў не адкрылася) | LevelPlay: minSdk NOT VERIFIED |
| Expo | config plugin `androidAppId`/`iosAppId`; **толькі dev-build**, Expo Go не працуе (README модуля) | падтрымка Expo заяўленая супольнасцю; афіцыйная старонка не адкрылася — NOT VERIFIED | NOT VERIFIED |
| Банэры | BANNER 320×50, LARGE_BANNER 320×100, MEDIUM_RECTANGLE 300×250, FULL_BANNER 468×60, LEADERBOARD 728×90; adaptive (ніжэй) | банэр + MREC; adaptive праз `setBannerExtraParameter("adaptive_banner","true")` | adaptive банэр у changelog; дэталі NOT VERIFIED |
| Consent | UMP SDK (API 21+), TCF-сертыфікаваны | уласны/іншы CMP | уласны/іншы CMP |
| Рызыкі | дэпрэкацыя legacy-памераў; Fabric-банэр у main модуля «Partial» | закрыты код медыяцыі, менш празрыстасці | паведамленне супольнасці пра Play-флаг пермісій SDK (неафіцыйна) |

Крыніцы (усе адчыненыя 02.11.2026): [GMA quick-start](https://developers.google.com/admob/android/quick-start) (25.5.0, minSdk 24, compileSdk 35+); [AdSize reference](https://developers.google.com/ad-manager/mobile-ads-sdk/android/reference/com/google/android/gms/ads/AdSize); [баннеры GMA](https://developers.google.com/admob/android/banner); [Announcing GMA SDK 25.0.0, 19.02.2026](https://ads-developers.googleblog.com/2026/02/announcing-android-google-mobile-ads.html); [рэлізы модуля](https://github.com/invertase/react-native-google-mobile-ads/releases); [README модуля](https://github.com/invertase/react-native-google-mobile-ads); npm-мэтаданыя `react-native-google-mobile-ads`/`react-native-applovin-max` (peerDependencies, 02.11.2026); [MAX RN integration](https://support.applovin.com/max/react-native/overview/integration) (адкрылася праз пошук, прамы fetch упаў — дэталі NOT VERIFIED); [LevelPlay RN](https://docs.unity.com/en-us/grow/levelplay/sdk/react/plugin-integration) і [рэпазітарый плагіна](https://github.com/ironsource-mobile/react-native-SDK); [Meta Audience Network](https://developers.facebook.com/documentation/audience-network/setting-up/platform-setup/android/changelog) — не зачынены афіцыйна, але новы онбардынг абмежаваны; як прамы кандыдат адпадае, толькі як крыніца медыяцыі.

**Выбар для параўнання:** AdMob (адзіны з поўнай афіцыйнай дакументацыяй для RN+Expo), MAX і LevelPlay — медыяцыйныя альтэрнатывы. Для старта адной зонай банэра медыяцыя не дае перавагі (даход з адной сеткі без fill-праблем стартаваць прасцей).

## Крытэрый 3 — памеры: dp vs px, дыяпазоны па шырынях

Афіцыйныя правілы (AdSize reference + баннеры GMA, праверана 02.11.2026):

| сямейства | floor | cap | дзе ўжываць |
|---|---|---|---|
| anchored adaptive (legacy, `ANCHORED_ADAPTIVE_BANNER`) | 50dp | `floor(15% вышыні экрана)` | фіксаванае месца; **дэпрэкацыя** ў GMA 25.0.0 (19.02.2026) |
| large anchored adaptive (`LARGE_ANCHORED_ADAPTIVE_BANNER`) | 50dp | `min(floor(20% вышыні экрана), 150)` | не-скрол раскладкі («designed for non-scrolling layouts») |
| inline adaptive (`INLINE_ADAPTIVE_BANNER`) | maxHeight ≥ 32dp (рэкаменд. 50+) | задаецца распрацоўнікам, да вышыні экрана | скрол-кантэнт |

Фікаваныя памеры (dp): BANNER 320×50, LARGE_BANNER 320×100, MEDIUM_RECTANGLE 300×250, FULL_BANNER 468×60, LEADERBOARD 728×90. `px` у javadoc («never smaller than 50px») — адзінка даведніка; практычны floor у dp-тэрміналогіі дакументацыі — 50dp.

Дыяпазоны межаў па прадстаўнічых прыладах (лічбы з `layout-math.mjs`, узнаўляецца тэстам; вышыня экрана ў портрэтнай арыентацыі, dp):

| прылада (dp) | anchored floor..cap | large anchored floor..cap |
|---|---|---|
| 320×640 | 50..96 | 50..128 |
| 360×800 | 50..120 | 50..150 |
| 360×800 (gesture nav) | 50..120 | 50..150 |
| 390×844 | 50..126 | 50..150 |
| 430×932 | 50..139 | 50..150 |

Ад чаго залежыць вышыня: шырыня зоны (adaptive шырыню = шырыня кантэйнера), вышыня экрана прылады (cap-адсотак), сямейства памера, арыентацыя (на ≥600dp прыладах арыентацыя не блокуецца — cap лічыцца ад бягучай арыентацыі), шрыфт accessibility на cap не ўплывае (банэр — web-кантэнт), no-fill/офлайн — банэр схаваць (кантэйнер з рэзервам фіксаванай вышыні інакш дае скачок раскладкі; refresh «occurs only if the banner is visible on screen»).

## Крытэрый 4 — UX: банэр пад картай, над футэрам (2 кампазіцыі)

Параметры PoC: карта 9:8 (width×1.125), gap 8dp (токен spaceS), футэр 96dp (рэпрэзентатыўны — #990 не зацверджаны), insets: статус 24/47, навігацыя 48 (3-кнопкі)/34/16 (gesture).

- **A — «packed»**: карта → банэр (legacy anchored 50dp) → футэр → вольнае месца да ніжняга inset-а. Банэр заўсёды бачны адразу пад картай; на высокіх экранах застаецца пустка да футэра (213dp на 430×932).
- **B — «bottom-anchored», ад ніза экрана**: карта зверху; футэр прыціснуты да ніжняга inset-а, банэр (large anchored, **уласны cap 90dp**) — над футэрам; абодва лічацца ад ніжняга краю. **Рашэнне ўладара (02.11.2026, жывая сесія): гэты кірунак выбраны** — банэр і футэр адлічваюцца ад ніза экрана; стабільная бачнасць банэра ў класічнай ніжняй зоне; зазор карта↔банэр 22–181dp, вольнае месца ад 14dp.

| прылада | A: mapH / bannerTop / вольна | B: mapH / bannerTop / вольна | перакрыцце |
|---|---|---|---|
| 320×640 (3-btn) | 360 / 392 / 54 | 360 / 406 / 14 | няма |
| 360×800 (3-btn) | 405 / 437 / 169 | 405 / 566 / 129 | няма |
| 360×800 (gesture) | 405 / 437 / 201 | 405 / 598 / 161 | няма |
| 390×844 (gesture) | 438.75 / 493.75 / 170.3 | 438.75 / 624 / 130.3 | няма |
| 430×932 (gesture) | 483.75 / 538.75 / 213.3 | 483.75 / 712 / 173.3 | няма |

Сэнсітыўнасць (worst case: large на поўным cap + футэр 128dp, bottom-anchored): 320×640 — **зазор −48dp = перакрыццё карты**; астатнія — +45..+89dp. Вывад: cap кантэйнера ў дадатку абавязковы; 90dp працуе на ўсіх пяці прыладах пры футэры 96dp (на 320×640 зазор 22dp). Калі футэр вырасце да 128dp, на 320×640 cap трэба зніжаць да 72dp альбо хаваць банэр.

Супраць перахопу націскаў: банэр — асобны блок **ніжэй** межаў карты (матэматыка `touchOverlap` правярае двухмернае перасячэнне рэктанглаў усіх 5 фрагментаў + іх 48dp-падпісаў супраць зоны банэра на ўсіх прыладах/варыянтах — 0 перасячэнняў); адмоўныя margin і absolute-накладанні на карту забароненыя гардам тэста, а пры no-fill кантэйнер хаваецца цалкам. Заўвага ўладара (02.11.2026) пра **большую адлегласць паміж фрагментамі меню** — да кампазіцыі карты (#888), не да банэр-зоны; на дошцы фрагменты паказаныя bounding-box сапраўднай геаметрыі пазла, дзе рамкі перакрываюцца самі па сабе.

Скрыншоты: ads01-light-320x640-A-B.png · ads01-light-430x932-A-B.png · ads01-dark-320x640-A-B.png.

## Крытэрый 5 — privacy / consent / Play-матрыца

| патрабаванне | сутнасць | крыніца (адкрыта 02.11.2026) | што рабіць |
|---|---|---|---|
| CMP для ЕЭЗ/ВБ/Швейцарыі | персаналізаваная рэклама толькі праз Google-сертыфікаваны CMP з TCF: ЕЭЗ/ВБ з 16.01.2024, Швейцарыя з 31.07.2024; без яе — толькі NPA/limited | [consent requirements](https://support.google.com/adsense/answer/13554116), [абвяшчэнне 16.05.2023](https://blog.google/products/admanager/new-cmp-requirement) | UMP SDK + «Privacy & messaging» AdMob — сам шлях сертыфікаваны |
| UMP SDK | Android API 21+; тэставая геаграфія `setDebugGeography` (ЕЭЗ/ВБ/Швейцарыя) | [UMP/privacy](https://developers.google.com/admob/android/privacy) | інтэграцыя ў follow-up |
| Play Data safety | збор/шэрынг SDK (Device ID, дыягностыка, app interactions) мусіць быць у форме | [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [User data policy](https://support.google.com/googleplay/android-developer/answer/10144311) | абнавіць форму + privacy-policy лакаляў (вопыт APR-07) |
| Ads policy Play | рэклама адрозная ад кантэнту, без выпадковых націскаў, без disruptive-адалонак; забарона накладання | [Developer Policy Center — Monetization and Ads](https://play.google/developer-content-policy) | дызайн зоны (гэты PoC) |
| Цэлевы API | new apps/updates: API 35 з 31.08.2025; API 36 з 31.08.2026 (расшырэнне да 01.11.2026) | [target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878) | Expo 54 ужо targetSdk 36 (APR-05) — запас ёсць |
| Дзіцячая аўдыторыя | калі дадатак падпадае пад Families (у т.л. змешаная аўдыторыя) — Families Self-Certified Ads SDK; праграма **не прымае новых заяў** | [палітыка](https://support.google.com/googleplay/android-developer/answer/12918983), [праграма](https://support.google.com/googleplay/android-developer/answer/12955712) | **Уладар**: ці трапляе KUDY (план #880 — дзіцячы пункт) пад Families? Ад гэтага залежыць увесь ad-стэк |
| Ads ID | AD_ID пермісія аўтаматычна ад GMA 20.4.0+ | [quick-start](https://developers.google.com/admob/android/quick-start) | дэкларацыя ў Data safety |
| Прававая кансультацыя | GDPR/ePrivacy тлумачэнні, узрост згоды | — | па-за межамі даследавання; аддзелена ад дакументальна праверанага |

## Крытэрый 6 — камерцыйныя ўмовы

| параметр | значэнне | статус крыніцы |
|---|---|---|
| Доля даходу AdMob | 68% выдаўцу | афіцыйная старонка даведкі 404 (02.11.2026); пацверджана [супольнасцю падтрымкі](https://support.google.com/adsense/thread/104642779) і гістарычна [блогам AdSense](https://blog.google/products/adsense/evolving-how-publishers-monetize-with-adsense); канчаткова — пры рэгістрацыі акаунта |
| AppLovin/LevelPlay доля | не публікуецца афіцыйна | NOT VERIFIED |
| Выплаты/парогі AdMob | патрабуе акаунта | NOT VERIFIED (рэгістрацыя забаронена без уладарскага рашэння) |
| eCPM банэра, Польшча/ЕЭЗ, Android | ~$0.15–0.60 з згодай (персаналізаваная); NPA ≈ у два разы ніжэй | **неафіцыйна**: [Adnimation, 08.2025](https://www.adnimation.com/mobile-optimization-in-2025-turning-every-tap-into-revenue) (банэры <$1, лепшыя рынкі ~$1–1.30), [AnyMind, 05.2025](https://anymindgroup.com/report/download-ecpm-mobile-ads-2025), [AdReact, 2026](https://adreact.com/blog/app-ad-revenue-benchmarks-2026); афіцыйных лічбаў Google не публікуе |

Пры такой eCPM-шкале банэр самастойна амаль не манетызуе; гэта довад у карысць прыярытэту IAP (react-native-purchases ужо ёсць) і супраць агрэсіўнай рэкламы ў галоўным патоку.

## Крытэрый 7 — практычны PoC (ізаляваны, без рэальных ключоў)

Што праверана фактычна:

- Матэматыка размяшчэння (dp) на 5 прадстаўнічых прыладах × 2 кампазіцыі × family-дыяпазоны: `node --no-warnings --test --experimental-strip-types test/ads-01-layout.test.mjs` → pass 9 / fail 0 (02.11.2026). Гард уваходзіць у `npm test` (glob `test/*.test.mjs`), ён падае пры рэверсе любой змены лічбаў у спекімене.
- Перакрыцці націскаў: 0 на ўсіх камбінацыях (тэст `the banner never touches a piece...`), checker самаправяральны (`touchOverlap` бачыць наўмыснае перасячэнне).
- Візуальныя кадры light/dark: 3 скрыншоты (лінкі ў крытэрыі 4), згенераваныя з таго ж layout-math.

Команды ўзнаўлення (з кораня рэпазіторыя):

```
node docs/design/brand/outputs/ADS-01/build-specimen.mjs
node --no-warnings --test --experimental-strip-types test/ads-01-layout.test.mjs
```

**NOT VERIFIED** (без рэальнай зборкі з SDK, тэставага ad unit і прылад):

- Сапраўдная вышыня, якую верне адаптыўны SDK на канкрэтнай прыладзе (правілы даюць толькі дыяпазон).
- Фактычныя insets канкрэтных тэлефонаў (узятыя прадстаўнічыя).
- Прыём шырыні adaptive-памераў у `react-native-google-mobile-ads` у RN (як модуль бярэ шырыню кантэйнера).
- Тэставая рэклама ў рэальным дадатку; паводзіны no-fill на рэальнай сетцы.
- AppLovin/LevelPlay дэталі патрабаванняў (афіцыйныя старонкі не адкрыліся прамым fetch-ам).
- iOS (ATT) — па-за межамі: Android-first па задачы.

Design-QA: не ўжываецца — інтэрфейс прадукта не змяніўся (прапанова-артэфакт толькі); базавай прылады для дызайн-аўдыту не патрабуецца. NOT-VERIFIED запісаны вышэй.

## Крытэрый 8 — рэкамендацыя і follow-up

Рэкамендацыя (прапанова, не рашэнне):

1. **Сетка**: AdMob напрамую, адна банэр-зона; медыяцыю (MAX/LevelPlay) не пачынаць да стабільнага трафіку.
2. **Фармат**: large anchored adaptive з **уласным cap 90dp** (ці inline adaptive з maxHeight 90dp) у зоне «пад картай, над футэрам», кампазіцыя **B — ад ніза экрана (уладар выбраў 02.11.2026)**; legacy anchored не ўжываць (дэпрэкацыя 19.02.2026).
3. **Consent**: UMP SDK з «Privacy & messaging» да любога запыту рэкламы; еўрапейскі трафік — толькі пасля рашэння карыстальніка.
4. **Парадак рашэнняў**: спачатку ўладар прымае: (а) ці ўвогуле рэклама ў KUDY, (б) Families-статус (#880), (в) выгляд/вышыня футэра #990, (г) выбар кампазіцыі A/B. Потым тэхнічны follow-up.
5. Рызыкі: рэзкі ScaledText/сістэмны шрыфт не ўплывае на банэр, але no-fill павінен хаваць кантэйнер без скачка; на ≥600dp прыладах арыентацыя незаблакаваная — пераствор банэра пры павароце; дзіцячы пункт #880 можа заблакаваць увесь план (Families).

Follow-up issue: створана інтэграцыйная задача #996 з этапамі, тэставым ad unit і ўладарскімі гейтамі; без пазнакі `agent:ready`, blocked-by рашэнні #771/#990 і гэтым даследаваннем.

## Мапінг на крытэрыі issue #988

- [x] Evidence-based параўнанне правайдэраў, афіцыйныя спасылкі, датаваныя ўмовы, табліца патрабаванняў — крытэрый 2.
- [x] Табліца адаптыўных памераў для 320/360/390/430 dp; два варыянты размяшчэння — крытэрыі 3–4.
- [x] Працуючы ізаляваны PoC + скрыншоты + праверка перакрыццяў; праверанае/NOT VERIFIED разведзены — крытэрый 7.
- [x] Privacy/consent/Play пералік з крыніцамі і адкрытымі ўладарскімі рашэннямі — крытэрый 5.
- [x] Вынік у `docs/agent-tasks/results/ADS-01.md` са спасылкамі і ўзнаўляльнымі камандамі — гэты файл.
- [x] Follow-up задача без `agent:ready` — крытэрый 8.
