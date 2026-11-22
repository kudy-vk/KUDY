# 2026-11-16 — gdansk-places-verified: рэпарт праверкі

Вердыкт: уваходны датасэт [#297](https://github.com/kudy-vk/KUDY/blob/main/docs/reports/2026-11-14-gdansk-locals-tips.json) (67 месцаў + 10 лайфхакаў + 7 пастак) перавераны і дапоўнены да фармату для раздзела «Чым заняцца». **Нічога не выдумана: усе пустыя палі маюць `*_reason` альбо `unverified`-вэрдыкты.**

Па-за волнай гэтай праверкі: масіў `quotes` таго ж уваходнага датасэту (3 запісы водгукаў наведвальнікаў) не перавяраўся і ў выніковы JSON гэтай хвалі не пераносіўся.

## Што зроблена

- **67/67 месцаў** у выніку, кожны `id` з уваходу — роўна адзін раз; ніякіх новых месцаў.
- **63/67 коардынатаў**: Wikidata (CC0) — 8 аб'ектаў з афіцыйным QID; астатнія — OSM/Nominatim (ODbL). 4 месцы — `null` + `location_reason` (не знайдзены ў Wikidata/OSM па назве за 3 праходы: `bar-mleczny-fala`, `calma`, `dym-i-ogien`, `restauracja-motlawa`). З Google Maps нічога не пераносілася.
- **8 Wikidata ID**; **6 фота** з Wikimedia Commons з аўтарам і ліцэнзіяй (паля `photo` без ліцэнзіі не запісваліся).
- **Афіцыйныя крыніцы** (з праверанымі цэнамі): [muzeum1939.pl — білеты](https://www.muzeum1939.pl/wizyta/wizyta-miiws/bilety-i-cennik) (33/23 zł, аўдыёгід 12 zł дадаткова), [bilety.ecs.gda.pl](https://bilety.ecs.gda.pl/index/cennik.html?lang=en) (40/35 zł, аўдыёгід у цане), [nmm.pl](https://nmm.pl) (марскі комплекс 23/64 zł), [company.jakdojade.pl](https://company.jakdojade.pl/trojmiasto-jak-kupic-bilety-ztm-gdansk-gdynia-sopot-wejherowo), [ztm.gda.pl — opłaty dodatkowe](https://ztm.gda.pl/bilety/oplaty-dodatkowe,a,3151) (210/300 zł).
- **Статусы**: 66× `open`, 1× `unclear` (Stołówka Gdańska — асобную картку ў Google/сеты не знайшлі, водгук толькі з #297). Зачыненых/пераехалых не выявілася; сцвярджэнне «Bar pod Rybą пераехаў з цэнтра» **абвергнута** OSM-адрасам (Długi Targ 35/38B).

## Спецыяльныя пытанні

- **Wzgórze Lagry існуе**: OSM way/140487202, назва «Lagry», раён VII Dwór, Гданьск (54.3849, 18.5660). Статус `open`, вэрдыкт claim-а «confirmed».
- **Kawiarnia Publiczna і Publiczna — адно месца**: абедзве назвы вядуць да аднаго вузла OSM node/7704294303 (Dolne Miasto; кавярня + піца). У JSON — два id з уваходу захаваныя, абодва `confirmed` у claims.

## Лайфхакі і пасткі: вердыкты

| id | Вердыкт | Каментар / крыніца |
|---|---|---|
| jakdojade | ✅ confirmed | афіцыйная ZTM-аплікацыя Трыгараду (company.jakdojade.pl) |
| skm | ✅ confirmed* | лінія афіцыйная; частата ў пік ≈10–15 хв — правяраць расклад (*corrected_en) |
| punch | ✅ confirmed* | папяровы — прабіць адразу; **новыя QR-білеты сканіраваць, не прабіваць** (ztm.gda.pl: штраф 210/300 zł; trojmiasto.pl 2025) |
| apps | ✅ confirmed | Uber і Bolt працуюць у Трыгарадзе |
| station | 🟡 partly | завышэнне цэнаў — анекдычнае; афіцыйна: ліцэнзаваныя стаянкі/Uber/Bolt |
| free | 🟡 partly | бясплатныя дні ёсць, але розныя; шмат музеяў закрытыя ў панядзелак |
| lockers | ⚪ unverified | «бясплатныя шафикі з залогам» не пацверджана паасобна па музеях |
| cash | 🟡 partly | kantory звычайна выгоднейшыя за аэрапорт/картку; пацверджанай статыстыкі няма |
| ring | ⚪ unverified | статыстыкі аварый/корак па Obwodnica не правяраліся |
| ww2 | 🟡 partly | аўдыёгід існуе, але 12 zł зверху 33 zł (афіцыйна); «увесь дзень» — па водгуках |
| strip | ✅ confirmed | некалькі незалежных водгукаў Reddit (ружовыя парасоны, Сопот) |
| drink | ✅ confirmed | тая ж схема ў водгуках Reddit |
| station-dup | 🟡 partly | дубль лайфхака «station»; аб'яднанае фармуляванне ў corrected_en |
| illusion | ⚪ unverified | Muzeum Iluzji — адно суб'ектыўнае «маё меркаванне» мясцовага |
| amber | ⚪ unverified | AmberSky (коле, не музей бурштыну) — адна суб'ектыўная «завышаная цана» |
| beach | ✅ confirmed | кішэнных амаль няма; стандартная асцярожнасць на пляжы |
| night | ✅ confirmed | Dolne Orunia/Nowy Port днём — пра асяроддзе, не злачыннасць |

Правілы розніцы вердыктаў: `confirmed` = ёсць афіцыйная крыніца альбо некалькі незалежных водгукаў; `partly` = ісціна толькі часткова/з нюансам (дадзена `corrected_en`); `unverified` = толькі адзін суб'ектыўны водгук альбо праверка немагчымая без Google Maps.

## Што засталося неправераным і чаму

1. **Коардынаты/адрасы 4 месцаў** (`bar-mleczny-fala`, `calma`, `dym-i-ogien`, `restauracja-motlawa`) — не знайдзены ў Wikidata/OSM па назве за 3 праходы з варыянтамі; з Google Maps не бралі. Статусы `open` па свежых водгуках #297.
2. **Гадзіны працы і цэны ежа-месцаў** — пазначаныя ў водгуках (Lepione «скідкі пасля 19:00», Thali «абед 12:00–15:00», Mandu «турастычная пастка» і пад.) — `unverified`: праверка патрабуе прагляд афіцыйных сайтаў/меню кожнага заклада (гэта Google Maps-незалежная праца ~30 візітаў, не ўваходзіла ў гэтую хвалю).
3. **transit (прыпынак + хвіліны пешшу)** — усюды `null`: надзейную прывязку без maps-API дастаць нельга; адзіная правераная альтэрнатыва — ручная звярка OSM-маршрутаў для 67 месцаў.
4. **seasonal** — усюды `null`: адзіная вядомая сезоннасць (вежа Базілікі ўзімку) — `unverified` claim, афіцыйнай крыніцы не знайшлі.
5. **Фота** — 6 з 15 музеяў/лэндмаркаў з Commons P18; для ежа-месцаў адкрытых ліцэнзійных фота ў Commons звычайна няма — `null`.
6. **visit_minutes** — усюды `basis: estimate` з крыніцай src-input: афіцыйныя таймінгі заяўлены толькі ў WW2/ECS.

## Гігіена працэсу

- Збор геаданых: бэтч-скпіпт, 3 праходы з бэк-офам (429), User-Agent з указаннем задачы; Nominatim 1 rps.
- Egress: wikidata/commons/nominatim дададзеныя ў allowlist з адобры ўладальніка (15.11.2026).
- Змяненні ў гэтай хвалі — толькі дакументы: `docs/reports/2026-11-16-gdansk-places-verified.json` і гэты файл; android-e2e прагон не патрэбны (праверана `android-e2e-scope.mjs` перад пушам).
