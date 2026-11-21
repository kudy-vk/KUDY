# Табліца крыніц даведніка «Пра горад»

Поўная база ведаў — у тым ліку тое, што не ўвайшло ў даведнік, і адкрытыя пытанні — у сястрынскім файле [about-city-knowledge.md](about-city-knowledge.md).

Звесткі даведніка (issue #200) правераныя па афіцыйных крыніцах **2026-11-10**. Кожны зменлівы факт мае: крыніцу, дату праверкі і ўмовы (сезон, святочныя выключэнні, тып білета, патрэба браніравання). Факт, які не атрымалася пацвердзіць, у публічны тэкст не ўваходзіць — такія выпадкі пералічаныя ў канцы кожнага раздзела.

Правіла абнаўлення: калі факт у даведніку мяняецца — у гэтай табліцы абнаўляецца яго радок (крыніца + дата), а дата праверкі застаецца ў радку гэтай табліцы; у макеце #257 і дадатку (#334) пазнакі пад загалоўкамі раздзелаў няма. Словы даведніка — у `contracts/ui-messages/source.json` (домен `native.aboutCity`), спасылкі і даныя — у `components/about-city-content.ts`.

Запіс абнаўлення (#252, 2026-11-12): экран перанесены на кола раздзелаў паводле фінальнага макета — раздзелы «Аэрапорт», «Транспарт і білеты», «Дзе што ў горадзе», «Ежа і аплата», «Картка і музеі»; раздзел «Побач з горадам» перанесены ў галоўнае меню, паездка ў Мальбарк з экрана прыбраная (рашэнне M10). Радкі Мальбарка ніжэй — гістарычны запіс праверкі #200.

Запіс абнаўлення (#254, 2026-11-16): раздзел «Транспарт і білеты» пераправераны па афіцыйных крыніцах; дапоўненыя радкі праграм, FALA і начных рэйсаў; дададзеныя радкі KomPas і бясплатных праездаў. Табліца рашэнняў і прапанова складу раздзела — у [выніку задачы](../agent-tasks/results/254.md); змест раздзела яшчэ не ўнесены ў макет і дадатак — чакае ўзгаднення ўладальніка.

## З аэрапорта і назад

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Аўтобусныя прыпынкі на аэрапорце | насупраць тэрмінала каля P1; Port Lotniczy 01/02 | [airport.gdansk.pl — Autobus](https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus) | 2026-11-10 | — |
| Аўтобус 210 (цэнтр ⇄ аэрапорт) | ~40 хв; з аэрапорта Port Lotniczy 01: будні ~кожныя 30 хв (04:50–23:05), нядзеля штогадзіну; з цэнтра Dworzec Główny 10 (Podwale Grodzkie): 04:30–22:27 | airport.gdansk.pl + [расклад 210](https://ztm.gda.pl/rozklady/linia-210.html) | 2026-11-10 | расклад ад 02.11.2026 «do odwołania»; адыход можа зрушыцца на −1/+3 хв |
| Аўтобус 110 (Wrzeszcz ⇄ аэрапорт) | з Port Lotniczy 02: будні кожныя 20 хв (05:05–23:20); з Wrzeszcza 04:52–22:30 | airport.gdansk.pl + [расклад 110](https://ztm.gda.pl/rozklady/linia-110.html) | 2026-11-10 | расклад ад 01.10.2026 |
| Аўтобус 120 (дадатковы) | Łostowice Świętokrzyska ⇄ аэрапорт | airport.gdansk.pl + ztm.gda.pl | 2026-11-10 | — |
| Начны N3 | штоночы 23:00–04:00 штогадзіну; Dworzec Główny ⇄ аэрапорт ⇄ Wrzeszcz; да Сопата/Гдыні не ідзе | airport.gdansk.pl + [расклад N3](https://ztm.gda.pl/rozklady/linia-N3.html) | 2026-11-10 | расклад ад 07.10.2026; з аэрапорта 23:15/00:06/01:15 (Port Lotniczy 01) |
| Білет на аўтобусы аэрапорта | ZTM: адна паездка 4,80/2,40 zł; 75 хв 6,00/3,00; дзень 22/11; N3 без даплаты | airport.gdansk.pl + [цэннік ZTM](https://ztm.gda.pl/bilety/bilety-jednorazowe,a,3019) | 2026-11-10 | цэннік ад 03.04.2023 |
| Цягнік: станцыя і хада | Gdańsk Port Lotniczy адразу перад тэрміналам, крытая хада | [airport.gdansk.pl — Pociąg](https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/pociag) | 2026-11-10 | — |
| Цягнік: аператар | POLREGIO (ад 11.12.2022); SKM на лінію не ідзе | airport.gdansk.pl + [pkm-sa.pl](https://www.pkm-sa.pl) | 2026-11-10 | гістарычна да 12.2022 ездзілі і SKM |
| Цягнік: час і перасадка | да Wrzeszcz ~25 хв, ~штогадзіну; перасадка ў Gdańsk Wrzeszcz з перону 3 на SKM да цэнтра; прамыя да Głównego ёсць (рэдкія) | airport.gdansk.pl + [станцыйны PDF PKM](https://www.pkm-sa.pl/przystanki/timetables/GdanskPortLotniczy.pdf) | 2026-11-10 | бок платформы на Gdańsk Wrzeszcz крыніцы не пазначаюць — у тэкст не ўвайшло |
| Цягнік: білет | гарадскі адзіны ZTM у цягніку не дзейнічае; чыгуначны — аўтаматы на перонах, аплікацыі, FALA | airport.gdansk.pl + ztm.gda.pl + mzkzg.org | 2026-11-10 | асабістыя месячныя ZTM (GKM) дзейнічаюць — турысцкая гэта не дакранаецца |
| Заменны расклад цягнікоў | да 12.12.2026 — часовы расклад, сталы з 13.12.2026 | pkm-sa.pl | 2026-11-10 | пасля 13.12.2026 радок абнавіць |

**Не ўключана** (не пацверджана): бок перону 3 у Gdańsk Wrzeszcz (цэнтр vs Гдыня); час ходу прамых цягнікоў аэрапорт → Gdańsk Główny; ці пакрывае адзін білет увесь ланцуг Polregio + SKM праз Wrzeszcz; згадка аўтобуса «з Сопата» на старонцы аэрапорта (нумар лініі крыніцы не называюць).

## Транспарт і білеты

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Арганізатары тарыфу | ZTM Гданьск — горад; агламерацыя (14 гмін) — звяз MZKZG; ZKM Гдыня, MZK Wejherowo — свае сеткі | [ztm.gda.pl/bilety](https://ztm.gda.pl/bilety), [mzkzg.org](https://mzkzg.org/) | 2026-11-10 | старыя назвы «strefa metropolitalna 1/2», «aglomeracyjny» больш не ўжываюцца |
| Білеты ZTM Гданьска | адна паездка — 4,80/2,40; 75 хвілін — 6,00/3,00; дзень — 22/11 | [ztm.gda.pl — bilety-jednorazowe](https://ztm.gda.pl/bilety/bilety-jednorazowe,a,3019) | 2026-11-16 | цэннік ад 03.04.2023; дзейнічаюць толькі ў сетцы ZTM; папярэдні радок меў пераблытаныя цэны адна паездка/75 хв — выпраўлена і пераправерана 2026-11-12 (#252), зноў пацверджана 2026-11-16 (#254) |
| Метрапалітальныя білеты MZKZG | адна паездка 4,80 (тэлефон)/5,20 (папера), льготныя 2,40/2,60; 75 хв — 6,00/3,00; дзень — 24/12; 72 гад — 48/24 | [mzkzg.org — jednorazowe i czasowe](https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/) | 2026-11-16 | старонка абноўленая 14.10.2026; weekend-білета няма |
| Білеты ў цягнік (kolejowo-komunalne) | дзень «двух арганізатараў» 30/15; «усіх» 34/17; 72 гад — 68/34 | [mzkzg.org — jednorazowe i czasowe](https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/) | 2026-11-16 | адзіныя білеты ZTM/MZKZG у цягніках не дзейнічаюць; дзённыя і 72-гадзінавыя «з цягнікамі» жывуць на старонцы jednorazowe i czasowe; ад 01.07.2026 месячныя — толькі праз FALA |
| SKM: вось і рэгулярнасць | Гдыня–Сопат–Гданьск; будні ~кожныя 10–15 хв | [skm.pkp.pl](https://www.skm.pkp.pl/) + прэса (Rynek Kolejowy) | 2026-11-16 | афіцыйныя старонкі рэгулярнасць не фіксуюць — у даведніку «прыблізна» + спасылка на расклад |
| Тарыф SKM па-за мэтрапалітальных | паясы адлегласці: 1–6 км — 7 zł … 25–30 км — 12 zł; льготныя — адсоткі ад цаны (60+ — 25%) | [skm.pkp.pl — tabele opłat](https://skm.pkp.pl/dla-pasazera/taryfy-i-przepisy/tabele-oplat) | 2026-11-16 | дзейнай даты цэнніка старонка не піша; дакладны паяс — праз «Wyszukaj połączenie» |
| PKM (лінія аэрапорта) | Gdańsk Wrzeszcz–Port Lotniczy–Osowa; ад 11.12.2022 возіць POLREGIO | [pkm-sa.pl](https://www.pkm-sa.pl) | 2026-11-10 | pkm.pl — другая кампанія, не блытаць |
| Актывацыя: паперавы з QR | скан у прыладзе FALA знізу (10–15 см, «Bilet aktywny») альбо прабіральнік у салоне | [systemfala.pl — help](https://systemfala.pl/help/informacje-dla-turystow/jak-skanowac-w-urzadzeniach-systemu-fala-bilety-papierowe-z-kodem-qr) | 2026-11-10 | — |
| Актывацыя: мабільны | у jakdojade актывуецца сам падчас куплі — купляць адразу пасля ўваходу | [company.jakdojade.pl](https://company.jakdojade.pl/trojmiasto-jak-kupic-bilety-ztm-gdansk-gdynia-sopot-wejherowo) | 2026-11-16 | адна паездка — да выхаду; 75 хв/дзень — ад актывацыі; правілы актывацыі 75 хв/24/72 старонка jakdojade не піша |
| Дзе купіць | FALA (усё, у т. л. чыгуначныя і месячныя); камерцыйныя праграмы jakdojade, GoPay, moBilet, mPay, SkyCash, zBiletem — толькі метрапалітальныя аднаразовыя і караткатэрміновыя; прылады ў салоне — толькі метрапалітальныя 24/72; касы SKM/ZTM, пошта (без чыгуначных); ад 01.07.2026 месячныя — толькі праз FALA | [ztm.gda.pl — bilety w aplikacjach](https://ztm.gda.pl/ztm/bilety-w-aplikacjach,a,9089), [mzkzg.org — sprzedaż](https://mzkzg.org/bilety-metropolitalne/sprzedaz-biletow/) | 2026-11-16 | ZTM-старонка: FALA — адзіная праграма з гарадскімі аднаразовымі ZTM-білетамі; спіс аўтаматаў на прыпынках (за салонам) не правераны — у тэкст не ўвайшло |
| FALA | агульная білетная сістэма Гданьска і Памор'я: аплікацыя, партал systemfala.pl, картка, чытальнікі і falomaty; чыгуначныя білеты ўключаныя (POLREGIO, PKP SKM); «Płać automatycznie»: «Wybierz bilet lub pozwól, aby system sam dopasował opłaty do Twojej podróży» | [ztm.gda.pl — czym jest FALA](https://ztm.gda.pl/bilety/czym-jest-system-fala,a,10943), [systemfala.pl](https://systemfala.pl) | 2026-11-16 | гэта не ўласная сістэма SKM; дэталі падліку кошту старонка не раскрывае |
| Начны транспарт | даплатаў няма; адзін білет «na jeden przejazd» на ўсім N1 (Гданьск–Сопат–Гдыня); межы тарыфных зон — толькі для перыядных білетаў | [ztm.gda.pl — FAQ N1](https://ztm.gda.pl/ztm/korzystam-z-linii-nocnej-n1-na-trasie-gdansk-sopot-gdynia-czy-musze-dokupywac-bilety-jednorazowe-na-terenie-sopotu-gdyni,a,9086) | 2026-11-16 | — |
| SKM KomPas (аплікацыя) | афіцыйная бясплатная аплікацыя PKP SKM: планавы расклад офлайн да 3 тыдняў, тры мовы, паведамленні дыспетчараў, цаны білетаў | [skm.pkp.pl — Pobierz SKM KomPas](https://skm.pkp.pl) | 2026-11-16 | для куплі білетаў не прызначана; спасылкі на App Store і Google Play — на той жа старонцы |
| Бясплатны праезд | 70+ — па дакуменце, што пацвярджае ўзрост; дзеці да 4 год — па заяве апякуна; катэгорыі вучняў — толькі праз GKM гданьскіх жыхароў | [ztm.gda.pl — przejazdy bezpłatne](https://ztm.gda.pl/bilety/przejazdy-bezplatne,a,9003) | 2026-11-16 | GKM-катэгорыі не тычацца турыстаў |

**Не ўключана**: дакладная рэгулярнасць SKM з афіцыйных старонак (толькі прэса); аўтаматы на прыпынках; афлайн-паказ гарадскіх білетаў у jakdojade (пацверджана толькі для чыгуначных); «bilet weekendowy» (не існуе ў цэнніках); дзяленне аднаразовага ZTM-білета на тэлефон/паперу (старонка ZTM падае адну цану, дзяленне ёсць толькі ў MZKZG); механізм падліку «Płać automatycznie»; месячны ZTM Гданьска 117,00/58,50 zł (пераправераны 2026-11-16 — у дадатак не паказуецца, рашэнне #254).

## Ежа, аплата і праграмы

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Дастаўка ў Гданьску | Pyszne.pl, Glovo, Wolt, Uber Eats, Bolt Food — усе працуюць | [pyszne.pl](https://www.pyszne.pl/restauracja-gdansk), [glovoapp.com](https://glovoapp.com/pl/pl/trojmiasto), [wolt.com](https://wolt.com/en/pol/gdansk), [uber.com](https://uber.com/global/en/r/cities/gdansk-pomorskie-pl), [bolt.eu](https://bolt.eu/en/food/courier/earn/poland/gdansk) | 2026-11-10 | — |
| Аплата Pyszne.pl | карткі, BLIK (PayU), Apple/Google Pay, PayPal, гатоўка | [pyszne.pl — метады аплаты](https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl) | 2026-11-10 | «некаторыя метады — толькі ў пэўных краінах і рэстаранах» |
| Аплата Glovo | карткі Visa/MC/AMEX, BLIK, гатоўка пры атрыманні (PLN) | [Glovo FAQ і Terms §4.5](https://glovoapp.com/docs/pl/legal/terms) | 2026-11-10 | Apple/Google Pay у афіцыйных дакументах не названыя — у тэкст не ўвайшлі |
| Аплата Wolt | карткі, BLIK (у т. л. one-click), гатоўка ў Польшчы | [Wolt — BLIK](https://wolt.com/pl/pol/lodz/article/wolt-blik-cashback0223), [Wolt ToS §6.5](https://explore.wolt.com/en/pol/terms) | 2026-11-10 | — |
| Аплата Uber Eats | карткі, BLIK, Apple Pay | help.uber.com (афіцыйныя артыкулы) | 2026-11-10 | гатоўка для PL не пацверджана — у тэкст не ўвайшла |
| Аплата Bolt Food | карткі, гатоўка пры атрыманні; BLIK у падтрымцы не названы | [bolt.eu — support](https://bolt.eu/pl-pl/support/articles/360021470740) | 2026-11-10 | Google Pay/Maestro/Verve выключаныя афіцыйна |
| BLIK: механіка | рахунак у польскім банку-ўдзельніку + ап банка; 6-лічбавы аднаразовы код; кантактлес у крамах; P2P па тэлефоне; зняцце ў банкамаце | [blik.com — how to use](https://www.blik.com/en/how-to-use-blik) | 2026-11-10 | — |
| Карткі/гатоўка «паўсюль» | афіцыйнага сцвярджэння няма — у даведніку сумленная фармулёўка без агульнага абяцання | — | 2026-11-10 | NBP-статыстыкі пад бот-блокам; лічбы не цытуем |

**Не ўключана**: NBP-статыстыка дзелі гатоўкі (напрамую не вынята); дзелі Apple/Google Pay на Glovo/Wolt для PL; BLIK на Bolt Food.

## Картка турыста і бясплатныя музеі

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Пакеты Karta Turysty | Odkrywca 24/48/72 гад — 75/85/95 zł (льготны 60/70/80); Premium — 90/110/130 (70/85/100); Smaki Gdańska Duet — 216 zł, 30 дзён, 2 асобы | [kartaturysty.visitgdansk.com — cennik](https://kartaturysty.visitgdansk.com/cennik) | 2026-11-10 | старая сетка 12/24/48/72 больш не прадаецца |
| Што ўваходзіць | Odkrywca — 13 бясплатных уваходаў (Ратуша ГМ, Бурштын, Hevelianum, ZOO, марскія і археалагічныя музеі); Premium — 23 (+Артуса двор, WWII, ECS, Жураве…) | [пакет Odkrywca](https://kartaturysty.visitgdansk.com/gdansk-szczegoly-pakietu.qbpage?id=670637), [Premium](https://kartaturysty.visitgdansk.com/gdansk-szczegoly-pakietu.qbpage?id=670805) | 2026-11-10 | толькі пералік з афіцыйных старонак пакетаў |
| Транспартнае дапаўненне | Bilet Metropolitalny: дзень 34/17, 72 гад 68/34; SKM + POLREGIO + гарадскі транспарт | [FAQ Karta Turysty](https://kartaturysty.visitgdansk.com/en/faq-pytania-ogolne), [MZKZG](https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/) | 2026-11-10 | пакет і білет актывуюцца ў розныя дні |
| Музей ІІ сусветнай вайны: бясплатны дзень | уторак, усе выставы; білет 0 zł толькі ў касе ў дзень наведвання (≤1 гад да зачынення); онлайн-браніравання бясплатных няма; панядзелкі звычайна закрыты | [muzeum1939.pl — visiting rules](https://www.muzeum1939.pl/en/visit-and-tickets/wwii-museum-visit/sightseeing/visiting-rules) | 2026-11-10 | музей можа закрывацца ў асобныя святы |
| Muzeum Gdańska: бясплатны дзень | панядзелак (Ратуша ГМ, Артуса двор, Дом Уфагена 10–16; Бурштын 10–18); уторак аддзелы цэнтра закрытыя | [muzeumgdansk.pl — oddziały](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/), [gdansk.pl — Za darmo do muzeum](https://www.gdansk.pl/wiadomosci/Za-darmo-do-muzeum-Gdzie-i-kiedy,a,299023) | 2026-11-17 | канфлікт вырашаны: аператыўны расклад аддзелаў (праверкі 2026-11-10 і 2026-11-17) і партал горада кажуць панядзелак; EN-тэкст free-entrance («зіма — уторак») састарэлы — верагодна, змяшаны з уторкам Нацыянальнага музея (MNG); старонка [BIP — ceny biletów](https://bip.muzeumgdansk.pl/ogolne-dane/ceny-biletow) дня не называе |
| Выключэнні музеяў | на бясплатны дзень частка часовых выставак можа не працаваць; святыя дні — свой расклад; закрытыя дні Muzeum Gdańska — на афіцыйнай старонцы | [muzeumgdansk.pl — darmowy wstęp](https://muzeumgdansk.pl/zaplanuj-wizyte/darmowy-wstep/) | 2026-11-10 | у тэксце даведніка агульная фармулёўка + спасылка |
| ECS | рэгулярнага бясплатнага дня выстаў няма; уторак — тэхнічны дзень | [ecs.gda.pl — godziny](https://ecs.gda.pl/zaplanuj-wizyte/godziny-otwarcia) | 2026-11-10 | уваход у будынак бясплатны; у тэкст даведніка не ўвайшло |

**Не ўключана**: білет 0 zł у Muzeum Gdańska на бясплатны дзень (старонкі не пішуць пра абавязковасць); сезонныя аддзелы Muzeum Gdańska (Пошты, Віслагродзе — красавік–верасень); профілі мясцовых гідаў у Instagram не чытаюцца ананімна — пакрыццё праз пошук (пост @asteroid_empire: панядзелак; «уторак» у гідаў — пра Нацыянальны музей).

Запіс абнаўлення (#254, 2026-11-17): дзень бясплатнага ўваходу Muzeum Gdańска вырашаны — панядзелак; пытанне з «Адкрытых пытанняў» базы ведаў зачынена, запіс у human-actions зняты.

Запіс дадатковай праверкі (#257, 2026-11-17): афіцыйныя цэннікі, каталог пакетаў і музеі пераправераныя; ніжэй — асобная табліца **дадатковых** фактаў. Рашэнне аб паказе ў дадатку яшчэ **не ўхвалена ўладальнікам**; табліца рашэнняў і прапанова зместу — у [выніку #257](../agent-tasks/results/257.md). Гэты запіс не замяняе гістарычныя радкі #200 вышэй.

### Дадатковая праверка #257 — цэны, пакеты, музеі

**Рашэнне ўладальніка пра паказ зменлівых звестак (#257, 2026-11-17):** правераныя ніжэй дні, цэны, колькасць уваходаў, умовы пакетаў і выключэнні захоўваюцца **толькі як даследчыя звесткі**. У KUDY не паказваць чужыя цэннікі і льготныя тарыфы, працягласць і склад пакетаў, колькасць бясплатных уваходаў, акупнасць, кошты транспарту, музейны расклад або табліцу бясплатных дзён. Замест гэтага — нейтральны тэкст, адна кароткая рэмарка пра магчымасць бясплатнага ўваходу ў некаторыя музеі па панядзелках ці аўторках, прамыя афіцыйныя спасылкі і патрабаванне самастойна правяраць актуальныя ўмовы.


| Факт | Значэнне пасля праверкі | Афіцыйная крыніца | Дата праверкі | Умовы і статус |
|---|---|---|---|---|
| Odkrywca: кошт | 24/48/72 гадзіны: 75/85/95 PLN звычайны, 60/70/80 PLN льготны | [Karta Turysty — cennik](https://kartaturysty.visitgdansk.com/cennik), [Odkrywca](https://kartaturysty.visitgdansk.com/pl/pl/szczegoly-pakietu?id=670637) | 2026-11-17 | ✅ праверана; кошты зменлівыя, **у інтэрфейс прапануецца толькі спасылка** |
| Premium: кошт | 24/48/72 гадзіны: 90/110/130 PLN звычайны, 70/85/100 PLN льготны | [Karta Turysty — cennik](https://kartaturysty.visitgdansk.com/cennik), [Premium](https://kartaturysty.visitgdansk.com/szczegoly-pakietu?id=670805) | 2026-11-17 | ✅ праверана; кошты зменлівыя, толькі спасылка |
| Склад Odkrywca/Premium | Уваходы ў выбраныя музеі і іншыя аб'екты; Premium змяшчае дадатковыя ўваходы і зніжкі | [Odkrywca](https://kartaturysty.visitgdansk.com/pl/pl/szczegoly-pakietu?id=670637), [Premium](https://kartaturysty.visitgdansk.com/szczegoly-pakietu?id=670805) | 2026-11-17 | ✅ праверана; партнёры і колькасць могуць змяніцца, поўны спіс не дубляваць афлайн |
| Асартымент картак | Каталог называе Odkrywca, Premium, Smaki Gdańska Solo/Duet/Kwartet і іншыя пакеты | [Karta Turysty — pakiety](https://kartaturysty.visitgdansk.com/pl/pakiety) | 2026-11-17 | ✅ праверана; набор з трох пакетаў у папярэднім макеце няпоўны |
| Транспарт на турыстычнай картцы | Дадатковы Bilet Metropolitalny на 24 або 72 гадзіны; набываецца пасля пакета, але актывуецца незалежна | [Karta Turysty — FAQ](https://kartaturysty.visitgdansk.com/faq-pytania-ogolne.qbpage) | 2026-11-17 | ✅ праверана; 24 гадзіны 34/17 PLN, 72 гадзіны 68/34 PLN у цэнніку FAQ; у макеце толькі механізм і спасылка |
| Muzeum Gdańska: бясплатны дзень | Панядзелак у некалькіх аддзелах; напрыклад, Muzeum Bursztynu 10–18, асноўныя цэнтральныя аддзелы 10–16; у аўторак яны закрытыя | [Muzeum Gdańska — oddziały](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/), [горад Гданьск](https://www.gdansk.pl/wiadomosci/Za-darmo-do-muzeum-Gdzie-i-kiedy,a,299023) | 2026-11-17 | ✅ актуальны расклад; [старонка з ранейшай інфармацыяй](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/bezplatny-wstep/) згадвае зімовы аўторак — супярэчнасць названа, перавага актуальным аддзелам; гадзіны ў прыкладзе, **не ў афлайн-тэксце** |
| Музей ІІ сусветнай вайны: бясплатны дзень | Аўторак, квіткі ў касе ў дзень візіту, без загадзя зробленага браніравання, ліміт 2500 наведвальнікаў | [Muzeum II Wojny Światowej — bilety](https://www.muzeum1939.pl/wizyta/wizyta-miiws/bilety-i-cennik) | 2026-11-17 | ✅ праверана; магчымыя чэргі і святочныя змены |
| Narodowe Muzeum Morskie: бясплатны дзень | Серада, асноўная пастаянная экспазіцыя без трэцяга паверха; Żuraw — бясплатна; Ośrodek Kultury Morskiej — толькі названыя выставы, без інтэрактыўнай залы | [NMM — ceny biletów](https://nmm.pl/ceny-biletow/) | 2026-11-17 | ✅ праверана; цэннік з пазнакай тэрміну да 31.12.2026; пасля гэтай даты паўторная праверка абавязковая |
| Muzeum Narodowe w Gdańsku і NOMUS | Гарадскі партал пералічвае чатыры аддзелы з бясплатным аўторкам; асобная абвестка NOMUS таксама пацвярджае аўторак для выставы | [горад Гданьск, артыкул 2025-10-29](https://www.gdansk.pl/wiadomosci/Za-darmo-do-muzeum-Gdzie-i-kiedy,a,299023), [NOMUS — выстава 2026](https://www.mng.gda.pl/wystawy/zapisy-leszek-brogowski-i-galeria-gn-1978%E2%80%921981/) | 2026-11-17 | ⚠️ **не пацверджаны актуальны агульны рэжым усіх філій**; толькі спасылка |
| Spichlerz Błękitny Baranek: бясплатны дзень | Гарадскі артыкул 2025 года называе чацвер | [горад Гданьск](https://www.gdansk.pl/wiadomosci/Za-darmo-do-muzeum-Gdzie-i-kiedy,a,299023) | 2026-11-17 | ⚠️ няма незалежнай свежай праверкі на сайце музея; **не друкаваць дзень афлайн** |
| Акупнасць карткі | Не падлічана: вынік залежыць ад наведаных месцаў, даты, бясплатнага дня і льгот | [Karta Turysty — cennik](https://kartaturysty.visitgdansk.com/cennik), [Muzeum Gdańska — oddziały](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/), [NMM — cennik](https://nmm.pl/ceny-biletow/) | 2026-11-17 | ⚠️ **не сцвярджаць эканомію без індывідуальнага разліку** |

**Не пацверджана для публікацыі:** кошт і склад усіх Smaki Solo/Duet/Kwartet на дату будучага выпуску; бясплатны аўторак без выключэння для ўсіх філій Muzeum Narodowe; актуальны бясплатны чацвер Błękitny Baranek; бясплатныя дні і цэны NMM пасля 31.12.2026; абяцанне «картка акупляецца пасля N наведванняў».

## Дзе што ў горадзе

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Główne Miasto vs Stare Miasto | Główne Miasto — турыстычнае сэрца (Długa, Długi Targ, Нептун, Ратуша, Св. Марыя, Жураве) на Motławie; Stare Miasto — асобны гістарычны квартал на поўнач (Св. Кацярына, Вялікі млын, канал Radunia) | [visitgdansk.com](https://visitgdansk.com/) + даведнікі гісторыі горада | 2026-11-21 | ⚠️ афіцыйная крыніца пакрывае толькі Główne Miasto: згадак Stare Miasto, Вялікага млына, Св. Кацярыны або канала Radunia на партале і ў пошуку па сайце няма (2026-11-13, PR #287); форма visitgdansk.com/en мёртвая — 404 (2026-11-13, пераправерана 2026-11-21); спасылка зменена на жывую галоўную старонку партала — 200 (2026-11-21) |
| Вакзал → цэнтр | Gdańsk Główny ~10 хв пешкі да Галоўнага горада; трамвайныя выхады з тунэляў; бліжэйшая станцыя SKM — Gdańsk Śródmieście | даведнікі станцыі + Wikivoyage | 2026-11-10 | ⚠️ лічба ~10 хв — з падарожніцкіх крыніц, афіцыйных лічбаў няма; у даведніку «каля» |
| Wrzeszcz | найбольшы жылы раён; вуліца Wajdeloty — «сэрца раёна»; SKM/цягнік да Gdańsk Wrzeszcz | [visitgdansk.com — Wrzeszcz](https://visitgdansk.com/wrzeszcz?setLanguage=en) | 2026-11-10 | Bohaterów Monte Cassino як шопінг-вуліца афіцыйна не пацверджана — не ўключана |
| Oliwa | катэдра з арганам (канцэрты; фестываль ліпень–жнівень), парк Міцкевіча, заапарк (найбольшы ў PL па плошчы); трамвай 5 (таксама 6), SKM Gdańsk Oliwa | [archikatedraoliwa.pl](https://archikatedraoliwa.pl/), даведнікі Oliwa і трамваяў | 2026-11-10 | транспарт менавіта да ўваходу ў заапарк не правераны |
| Brzeźno | найпапулярнейшы гарадскі пляж; трамвай 3 да Brzeźno Dom Zdrojowy | [visitgdansk.com — пляжы](https://visitgdansk.com/najpiękniejsze-plaże?setLanguage=en) + ztm.gda.pl/rozklady | 2026-11-10 | сезонны трамвай 63 не ўключаны (летні) |
| Jelitkowo | сямейны пляж каля мяжы з Сопатам; трамваі 2 і 4 | visitgdansk.com + ztm.gda.pl/rozklady | 2026-11-10 | — |
| Stogi | шырокі спакойны пляж; цяпер аўтобус T8/158: мост Siennicki закрыты, трамваі 8/9 скарочаныя да Głęboka да 2027 | visitgdansk.com + ztm.gda.pl/rozklady + даведнік трамваяў | 2026-11-10 | вяртанне трамвая — праз рэканструкцыю моста |
| Wyspa Sobieszewska | «дзікі» зялёны канец горада; рэзерваты птушак; аўтобус 512 | visitgdansk.com + ztm.gda.pl/rozklady | 2026-11-10 | летнія нумары могуць мяняцца |
| Мапа цэнтра (PDF) | спасылка адказвае 200 OK, application/pdf | [mapa-centrum-gdanska.pdf](https://visitgdansk.com/cmsImages/dokumenty/mapa-centrum-gdanska.pdf) | 2026-11-10 | ёсць свежэйшая A3-мапа 2025 на [magazyn-online](https://visitgdansk.com/en/magazyn-online.qbpage) |

**Не ўключана**: час язды SKM Główny→Wrzeszcz у хвілінах; адлегласці да пляжаў у хвілінах; Bohaterów Monte Cassino як шопінг-вуліца; адмена пляжных трамваяў пазней 2027 (за межамі праверкі).

## Паездка ў Мальбарк

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| ЮНЕСКА | «Castle of the Teutonic Order in Malbork», 1997, крытэрыі (ii)(iii)(iv) | [whc.unesco.org/en/list/847](https://whc.unesco.org/en/list/847) | 2026-11-10 | — |
| «Найбуйнейшы цагляны замак свету» | фраза з афіцыйнага сайта замка (UNESCO фармулюе інакш — «выдатны прыклад цаглянага замка») | [zamek.malbork.pl](https://zamek.malbork.pl/en/home/visit/) | 2026-11-10 | у даведніку атрыбутавана сайту замка, не ЮНЕСКА |
| Цягнік з Гданьска | POLREGIO прама з Gdańsk Główny, ~штогадзіну, 45–65 хв; зварот да позняга вечара | [расклад GD5 (PDF)](https://polregio.pl/media/30173/gd5_20261025_20261212.pdf) | 2026-11-10 | расклад да 12.12.2026; ад 13.12.2026 — новы |
| Ад станцыі да замка | пешкі праз горад; з 16.11.2026 кладка праз Nogat закрыта — пераход па мосту Пілцкага (DK55) | [zamek.malbork.pl — навіна 04.11.2026](https://zamek.malbork.pl/aktualnosci/wazna-informacja-dla-odwiedzajacych-muzeum-zamkowe-w-malborku) | 2026-11-10 | пешы час ~15–20 хв — толькі неафіцыйныя крыніцы, у тэкст не ўвайшло |
| Гадзіны (лістапад) | уторак–нядзеля Trasa historyczna 9:00–16:00 (апошні ўваход 12:45, інтэр'еры да 15:00); панядзелак — толькі бясплатныя падворкі (білет на месцы) | [zamek.malbork.pl — opening hours](https://zamek.malbork.pl/en/opening-hours/) | 2026-11-10 | сезон 01.10.2026–25.04.2027; летнія гадзіны — на старонцы |
| Білеты | Trasa historyczna 80/60 zł; spacerowa 35/25; сямейны 70/60; аўдыёгід у цане; дзеці да 7 бясплатна | [zamek.malbork.pl — tickets](https://zamek.malbork.pl/en/home/visit/tickets/) | 2026-11-10 | онлайн [bilety.zamek.malbork.pl](https://bilety.zamek.malbork.pl/trasy-zwiedzania.html); парог 500 чал/гад — купляць загадзя |
| Святыя дні | 11.11 адкрыта 9:00–16:00; 24–25.12 закрыта; 31.12 скарочана | zamek.malbork.pl — opening hours | 2026-11-10 | — |
| Цана цягніка | дыяпазон Taryfa Pomorska 51–60 км = 18 zł, 61–70 км = 20 zł | [Taryfa Pomorska](https://polregio.pl/pl/oferty-i-promocje/oferty-regionalne/taryfa-pomorska) | 2026-11-10 | ❔ дакладная тарыфная адлегласць Gdańsk–Malbork не пацверджана — у тэкст не ўвайшло |

**Не ўключана**: неафіцыйны пешы час ад станцыі (~15–20 хв); дакладная цана цягніка; канкрэтныя рэйсы PKP Intercity (wyszukiwarka не чыталася); нумар аўтобуса ад станцыі да замка.


## Картка жыхара (перанос #334)

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Jestem z Gdańska | Гарадскія прапановы і транспартныя магчымасці карткі жыхара | [Афіцыйны сайт](https://jestemzgdanska.pl/), [FAQ](https://jestemzgdanska.pl/faq-pytania-ogolne.qbpage), [FALA](https://jestemzgdanska.pl/pl/system-fala) | 2026-11-18 | Паводле [выніку #257, §9](../agent-tasks/results/257.md); правы і прапановы залежаць ад катэгорыі жыхара і дзейных умоў, кошты не дублюем. |
