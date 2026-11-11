# Табліца крыніц даведніка «Пра горад»

Звесткі даведніка (issue #200) правераныя па афіцыйных крыніцах **2026-11-10**. Кожны зменлівы факт мае: крыніцу, дату праверкі і ўмовы (сезон, святочныя выключэнні, тып білета, патрэба браніравання). Факт, які не атрымалася пацвердзіць, у публічны тэкст не ўваходзіць — такія выпадкі пералічаныя ў канцы кожнага раздзела.

Правіла абнаўлення: калі факт у даведніку мяняецца — у гэтай табліцы абнаўляецца яго радок (крыніца + дата), а дата пад загалоўкам экрана (`ABOUT_CITY_VERIFIED_ON` у `components/about-city-content.ts`) ставіць дату апошняй поўнай праверкі. Словы даведніка — у `contracts/ui-messages/source.json` (домен `native.aboutCity`), спасылкі — у `components/about-city-content.ts`.

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
| Арганізатары тарыфу | ZTM Гданьск — горад; агламерацыя (14 гмін) — звяз MZKZG; ZKM Гдыня, MZK Wejherowo — свае сеткі | [ztm.gda.pl/bilety](https://ztm.gda.pl/bilety), [mzkzg.org](https://mzkzg.org/) | 2026-11-10 | старыя назвы «стrefa metropolitalna 1/2», «aglomeracyjny» больш не ўжываюцца |
| Білеты ZTM Гданьска | 75 хв — 4,80/2,40; адна паездка — 6,00/3,00; дзень — 22/11 | [ztm.gda.pl — bilety-jednorazowe](https://ztm.gda.pl/bilety/bilety-jednorazowe,a,3019) | 2026-11-10 | цэннік ад 03.04.2023; дзейнічаюць толькі ў сетцы ZTM |
| Метрапалітальныя білеты MZKZG | адна паездка 4,80 (тэлефон)/5,20 (папера); 75 хв — 6,00/3,00; дзень — 24/12; 72 гад — 48/24 | [mzkzg.org — jednorazowe i czasowe](https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/) | 2026-11-10 | старонка абноўленая 14.10.2026; weekend-білета няма |
| Білеты ў цягнік (kolejowo-komunalne) | дзень «двух арганізатараў» 30/15; «усіх» 34/17; 72 гад — 68/34 | [mzkzg.org — miesięczne kolejowo-komunalne](https://mzkzg.org/bilety-metropolitalne/miesieczne-kolejowo-komunalne/) | 2026-11-10 | адзіныя білеты ZTM/MZKZG у цягніках не дзейнічаюць; ад 01.07.2026 месячныя — толькі праз FALA |
| SKM: вось і рэгулярнасць | Гдыня–Сопат–Гданьск; будні ~кожныя 10–15 хв | [skm.pkp.pl](https://www.skm.pkp.pl/) + прэса (Rynek Kolejowy) | 2026-11-10 | афіцыйныя старонкі рэгулярнасць не фіксуюць — у даведніку «прыблізна» + спасылка на расклад |
| Тарыф SKM па-за мэтрапалітальных | паясы адлегласці: 1–6 км — 7 zł … 25–30 км — 12 zł | [skm.pkp.pl — tabele opłat](https://skm.pkp.pl/dla-pasazera/taryfy-i-przepisy/tabele-oplat) | 2026-11-10 | дакладны паяс — праз «Wyszukaj połączenie» |
| PKM (лінія аэрапорта) | Gdańsk Wrzeszcz–Port Lotniczy–Osowa; ад 11.12.2022 возіць POLREGIO | [pkm-sa.pl](https://www.pkm-sa.pl) | 2026-11-10 | pkm.pl — другая кампанія, не блытаць |
| Актывацыя: паперавы з QR | скан у прыладзе FALA знізу (10–15 см, «Bilet aktywny») альбо прабіральнік у салоне | [systemfala.pl — help](https://systemfala.pl/help/informacje-dla-turystow/jak-skanowac-w-urzadzeniach-systemu-fala-bilety-papierowe-z-kodem-qr) | 2026-11-10 | — |
| Актывацыя: мабільны | у jakdojade актывуецца сам падчас куплі — купляць адразу пасля ўваходу | [company.jakdojade.pl](https://company.jakdojade.pl/trojmiasto-jak-kupic-bilety-ztm-gdansk-gdynia-sopot-wejherowo) | 2026-11-10 | адна паездка — да выхаду; 75 хв/дзень — ад актывацыі |
| Дзе купіць | FALA (усё, у т. л. чыгуначныя); jakdojade, GoPay, moBilet, mPay, SkyCash, zBiletem (метрапалітальныя); прылады FALA ў салоне; касы SKM/ZTM, пошта | [mzkzg.org — sprzedaż](https://mzkzg.org/bilety-metropolitalne/sprzedaz-biletow/), [ztm.gda.pl — bilety w aplikacjach](https://ztm.gda.pl/ztm/bilety-w-aplikacjach,a,9089) | 2026-11-10 | спіс аўтаматаў на прыпынках (за салонам) не правераны — у тэкст не ўвайшло |
| FALA | агульная білетная сістэма Гданьска і Памор'я: апікацыя, партал, картка, falomat; з плацёжнай карткай — «Płać automatycznie» | [ztm.gda.pl — czym jest FALA](https://ztm.gda.pl/bilety/czym-jest-system-fala,a,10943), [systemfala.pl](https://systemfala.pl) | 2026-11-10 | гэта не ўласная сістэма SKM |
| Начны транспарт | даплатаў няма; адзін білет «na jeden przejazd» на ўсім N1 (Гданьск–Сопат–Гдыня) | [ztm.gda.pl — FAQ N1](https://ztm.gda.pl/ztm/korzystam-z-linii-nocnej-n1-na-trasie-gdansk-sopot-gdynia-czy-musze-dokupywac-bilety-jednorazowe-na-terenie-sopotu-gdyni,a,9086) | 2026-11-10 | — |

**Не ўключана**: дакладная рэгулярнасць SKM з афіцыйных старонак (толькі прэса); аўтаматы на прыпынках; афлайн-паказ гарадскіх білетаў у jakdojade (пацверджана толькі для чыгуначных); «bilet weekendowy» (не існуе ў цэнніках).

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
| Muzeum Gdańska: бясплатны дзень | панядзелак (Ратуша ГМ, Артуса двор, Дом Уфагена 10–16; Бурштын 10–18); уторак аддзелы цэнтра закрытыя | [muzeumgdansk.pl — oddziały](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/) | 2026-11-10 | ⚠️ EN-старонка free-entrance несінхронная («w zimowym — wtorek»); дзеючы PL-расклад аддзелаў паказвае панядзелак; сумніўны выпадак — глядзі «Адкрытыя пытанні» ў PR |
| Выключэнні музеяў | на бясплатны дзень частка часовых выставак можа не працаваць; святыя дні — свой расклад; закрытыя дні Muzeum Gdańska — на афіцыйнай старонцы | [muzeumgdansk.pl — darmowy wstęp](https://muzeumgdansk.pl/zaplanuj-wizyte/darmowy-wstep/) | 2026-11-10 | у тэксце даведніка агульная фармулёўка + спасылка |
| ECS | рэгулярнага бясплатнага дня выстаў няма; уторак — тэхнічны дзень | [ecs.gda.pl — godziny](https://ecs.gda.pl/zaplanuj-wizyte/godziny-otwarcia) | 2026-11-10 | уваход у будынак бясплатны; у тэкст даведніка не ўвайшло |

**Не ўключана**: білет 0 zł у Muzeum Gdańska на бясплатны дзень (старонкі не пішуць пра абавязковасць); сезонныя аддзелы Muzeum Gdańska (Пошты, Віслагродзе — красавік–верасень).

## Дзе што ў горадзе

| Факт | Значэнне ў даведніку | Крыніца | Дата праверкі | Умовы |
|---|---|---|---|---|
| Główne Miasto vs Stare Miasto | Główne Miasto — турыстычнае сэрца (Długa, Długi Targ, Нептун, Ратуша, Св. Марыя, Жураве) на Motławie; Stare Miasto — асобны гістарычны квартал на поўнач (Св. Кацярына, Вялікі млын, канал Radunia) | [visitgdansk.com](https://visitgdansk.com/en) + даведнікі гісторыі горада | 2026-11-10 | — |
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

