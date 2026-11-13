# База ведаў «Пра горад» — Гданьск

Поўная катэгарызаваная база фактаў, сабраных для даведніка «Пра горад» (issue #200): усё, што было праверана даследчымі праходамі, — у тым ліку тое, што не ўвайшло ў публічны тэкст. Дапаўняльны файл да [табліцы крыніц](about-city-sources.md): табліца крыніц доказвае словы даведніка, гэтая база трыма ўсе веды даўней.

## Як дадаваць новае

1. Новы факт — новы радок у табліцы адпаведнага раздзела: значэнне, афіцыйная крыніца (URL), дата праверкі, умовы (сезон/святы/тып білета).
2. Пазнака статусу: ✅ пацверджана афіцыйнай старонкай; ⚠️ часткова (крыніца прэсы ці несуяветныя старонкі); ❔ не пацверджана — у публічны тэкст даведніка не трапляе, чакае праверкі.
3. Калі факт ідзе ў даведнік — ён таксама дадаецца ў [табліцу крыніц](about-city-sources.md) і ў словы (`contracts/ui-messages/source.json`, домен `native.aboutCity`); пазнака праверкі пад загалоўкам раздзела (запіс `native.aboutCity.verified` у слоўніку) ставіць дату апошняй поўнай праверкі.
4. Крыніцы — толькі афіцыйныя; прэса дапушчальная як ⚠️ з указаннем выдавецтва.

## 1. Аэрапорт ⇄ горад

| Факт | Значэнне | Крыніца | Праверана | Умовы | Статус |
|---|---|---|---|---|---|
| Аўтобусныя прыпынкі | насупраць тэрмінала каля P1; Port Lotniczy 01/02/04/09 | [airport.gdansk.pl — Autobus](https://www.airport.gdansk.pl/przed-podroza/dojazd-na-lotnisko/autobus), mapa.ztm.gda.pl | 2026-11-10 | — | ✅ |
| Аўтобус 210 | цэнтр ⇄ аэрапорт, ~40 хв; з аэрапорта будні ~кожныя 30 хв (04:50–23:05), нядзеля штогадзіну; з цэнтра (Dworzec Główny 10) 04:30–22:27; прыпынкі Hucisko, Urząd Miejski, Hevelianum, Płowce, Focha | airport.gdansk.pl + [расклад 210](https://ztm.gda.pl/rozklady/linia-210.html) | 2026-11-10 | расклад ад 02.11.2026 «do odwołania»; адыход ±1–3 хв | ✅ |
| Аўтобус 110 | Wrzeszcz ⇄ аэрапорт; з Port Lotniczy 02 будні кожныя 20 хв (05:05–23:20); з Wrzeszcza 04:52–22:30 | airport.gdansk.pl + [расклад 110](https://ztm.gda.pl/rozklady/linia-110.html) | 2026-11-10 | расклад ад 01.10.2026 | ✅ |
| Аўтобус 120 | Łostowice Świętokrzyska ⇄ аэрапорт (~50–60 хв) | airport.gdansk.pl + ztm.gda.pl | 2026-11-10 | — | ✅ |
| Начны N3 | штоночы 23:00–04:00 штогадзіну; Dworzec Główny ⇄ аэрапорт ⇄ Wrzeszcz; да Сопата/Гдыні не ідзе; з аэрапорта 23:15/00:06/01:15 (01), 23:40/00:49 (02) | airport.gdansk.pl + [расклад N3](https://ztm.gda.pl/rozklady/linia-N3.html) | 2026-11-10 | расклад ад 07.10.2026 | ✅ |
| Цягнік | станцыя Gdańsk Port Lotniczy перад тэрміналам (крытая хада); аператар POLREGIO з 11.12.2022; да Gdańsk Wrzeszcz ~25 хв, ~штогадзіну; перасадка ў Gdańsk Wrzeszcz, перон 3, на SKM; прамыя да Gdańsk Główny рэдкія | airport.gdansk.pl + [pkm-sa.pl](https://www.pkm-sa.pl) + [станцыйны PDF](https://www.pkm-sa.pl/przystanki/timetables/GdanskPortLotniczy.pdf) | 2026-11-10 | замены расклад 25.10–12.12.2026, сталы з 13.12.2026 | ✅ |
| Білеты на аўтобусы аэрапорта | ZTM: адна паездка 4,80/2,40; 75 хв 6,00/3,00; дзень 22/11; N3 без даплаты | airport.gdansk.pl + [цэннік ZTM](https://ztm.gda.pl/bilety/bilety-jednorazowe,a,3019) | 2026-11-10 | цэннік ад 03.04.2023 | ✅ |
| Білет на цягнік аэрапорта | гарадскі адзіны ZTM не дзейнічае; асабістыя месячныя ZTM (GKM) — дзейнічаюць; купля: аўтаматы на перонах, Polregio/Jakdojade, FALA | airport.gdansk.pl + [ztm.gda.pl — skm-polregio](https://ztm.gda.pl/bilety/skm-polregio,a,6042) | 2026-11-10 | пакрыццё адзінага білета на ланцуг Polregio+SKM — ❔ | ✅/❔ |

## 2. Транспарт і білеты

| Факт | Значэнне | Крыніца | Праверана | Умовы | Статус |
|---|---|---|---|---|---|
| Арганізатары | ZTM Гданьск — горад; агламерацыя (14 гмін) — звяз MZKZG; ZKM Гдыня, MZK Wejherowo — свае сеткі | [ztm.gda.pl/bilety](https://ztm.gda.pl/bilety), [mzkzg.org](https://mzkzg.org/) | 2026-11-10 | старыя «strefa metropolitalna 1/2», «aglomeracyjny» больш не ўжываюцца | ✅ |
| Білеты ZTM | 75 хв — 4,80/2,40; адна паездка — 6,00/3,00; дзень — 22/11; месячны Гданьск — 117/58,50 | [bilety-jednorazowe](https://ztm.gda.pl/bilety/bilety-jednorazowe,a,3019), [bilety-okresowe](https://ztm.gda.pl/bilety/bilety-okresowe,a,3020) | 2026-11-10 | цэннік ад 03.04.2023; толькі сетка ZTM | ✅ |
| Метрапалітальныя MZKZG | адна паездка 4,80 (тэлефон)/5,20 (папера); 75 хв — 6,00/3,00; дзень — 24/12; 72 гад — 48/24 | [mzkzg.org — jednorazowe i czasowe](https://mzkzg.org/bilety-metropolitalne/bilety-jednorazowe-czasowe/) | 2026-11-10 | абноўлена 14.10.2026; weekend-білета няма | ✅ |
| У цягнік (kolejowo-komunalne) | дзень «двух арганізатараў» 30/15; «усіх» 34/17; 72 гад — 68/34; адзіныя ZTM/MZKZG у цягніках не дзейнічаюць | [mzkzg.org — kolejowo-komunalne](https://mzkzg.org/bilety-metropolitalne/miesieczne-kolejowo-komunalne/) | 2026-11-10 | ад 01.07.2026 месячныя — толькі праз FALA | ✅ |
| SKM | вось Гдыня–Сопат–Гданьск; будні ~кожныя 10–15 хв; уласны тарыф паясамі: 1–6 км 7 zł … 25–30 км 12 zł | [skm.pkp.pl](https://skm.pkp.pl/), [tabele opłat](https://skm.pkp.pl/dla-pasazera/taryfy-i-przepisy/tabele-oplat) | 2026-11-10 | рэгулярнасць — толькі прэса (Rynek Kolejowy), афіцыйных лічбаў няма | ⚠️ |
| PKM | лінія Wrzeszcz–Port Lotniczy–Osowa; ад 11.12.2022 возіць POLREGIO; расклады на pkm-sa.pl | [pkm-sa.pl](https://www.pkm-sa.pl) | 2026-11-10 | не блытаць з pkm.pl (іншая кампанія) | ✅ |
| Актывацыя папяровага з QR | скан у прыладзе FALA знізу (10–15 см, «Bilet aktywny») альбо прабіральнік у салоне | [systemfala.pl — help](https://systemfala.pl/help/informacje-dla-turystow/jak-skanowac-w-urzadzeniach-systemu-fala-bilety-papierowe-z-kodem-qr) | 2026-11-10 | — | ✅ |
| Актывацыя мабільнага | у jakdojade актывуецца сам падчас куплі — купляць адразу пасля ўваходу; адна паездка — да выхаду; 75 хв/24/72 — ад актывацыі | [company.jakdojade.pl](https://company.jakdojade.pl/trojmiasto-jak-kupic-bilety-ztm-gdansk-gdynia-sopot-wejherowo) | 2026-11-10 | — | ✅ |
| Дзе купіць | FALA (усё, у т. л. чыгуначныя); jakdojade, GoPay, moBilet, mPay, SkyCash, zBiletem (метрапалітальныя); прылады FALA ў салоне; касы SKM/ZTM, пошта | [mzkzg.org — sprzedaż](https://mzkzg.org/bilety-metropolitalne/sprzedaz-biletow/), [ztm.gda.pl — aplikacje](https://ztm.gda.pl/ztm/bilety-w-aplikacjach,a,9089) | 2026-11-10 | спіс аўтаматаў па-за салонам — ❔ | ✅/❔ |
| FALA | агульная сістэма білетаў Гданьска і Памор'я: апікацыя, партал systemfala.pl, картка, falomat; з плацёжнай карткай — «Płać automatycznie» | [ztm.gda.pl — czym jest FALA](https://ztm.gda.pl/bilety/czym-jest-system-fala,a,10943), [systemfala.pl](https://systemfala.pl) | 2026-11-10 | гэта не ўласная сістэма SKM | ✅ |
| Начныя рэйсы | даплаты няма; адзін білет «na jeden przejazd» на ўсім N1 (Гданьск–Сопат–Гдыня) | [ztm.gda.pl — FAQ N1](https://ztm.gda.pl/ztm/korzystam-z-linii-nocnej-n1-na-trasie-gdansk-sopot-gdynia-czy-musze-dokupywac-bilety-jednorazowe-na-terenie-sopotu-gdyni,a,9086) | 2026-11-10 | — | ✅ |
| Штрафы | без білета — 210 zł (7 дзён) / 300 zł; без льготнай легітымацыі — 168/240 | [ztm.gda.pl — opłaty dodatkowe](https://ztm.gda.pl/bilety/oplaty-dodatkowe,a,3151) | 2026-11-10 | цэннік ад 03.04.2023 | ✅ |
| Бясплатны праезд | 70+ па дакументзе; дзеці да 4 год; 4–7 і вучні — праз картку GKM; асобы з істотнай інваліднасцю + апекун | [ztm.gda.pl — przejazdy bezpłatne](https://ztm.gda.pl/bilety/przejazdy-bezplatne,a,9003) | 2026-11-10 | частка льготаў — толькі з картамі гмін | ✅ |

## 3. Арыенціры і раёны

| Факт | Значэнне | Крыніца | Праверана | Умовы | Статус |
|---|---|---|---|---|---|
| Główne Miasto | турыстычнае сэрца: Długa, Długi Targ, Нептун, Ратуша, Св. Марыя, Жураве, Golden/Green Gate, Артуса двор — на заходнім беразе Motławy | [visitgdansk.com](https://visitgdansk.com/en), даведнікі горада | 2026-11-10 | — | ✅ |
| Stare Miasto | асобны гістарычны квартал на поўнач: Св. Кацярына, Вялікі млын (XIV ст.), канал Radunia | [visitgdansk.com](https://visitgdansk.com/?setLanguage=en) + даведнікі гісторыі горада | 2026-11-10 | — | ✅ |
| Вакзал | Gdańsk Główny: ~10 хв пешкі да Галоўнага горада (⚠️ лічба з падарожніцкіх крыніц); трамвайныя выхады з тунэляў; бліжэйшая станцыя SKM — Gdańsk Śródmieście | даведнікі станцыі + Wikivoyage | 2026-11-10 | афіцыйных лічбаў хвілін няма | ⚠️ |
| Wrzeszcz | найбольшы жылы раён; вуліца Wajdeloty — «сэрца раёна»; вілы XIX ст.; SKM/цягнік да Gdańsk Wrzeszcz | [visitgdansk.com — Wrzeszcz](https://visitgdansk.com/wrzeszcz?setLanguage=en) | 2026-11-10 | Bohaterów Monte Cassino як шопінг-вуліца — ❔ (афіцыйна пацверджана Wajdeloty) | ✅/❔ |
| Oliwa | катэдра цыстэрцыянцаў з арганам (канцэрты; фестываль ліпень–жнівень), парк Міцкевіча, заапарк (найбольшы ў PL па плошчы); трамвай 5 (таксама 6), SKM Gdańsk Oliwa | [archikatedraoliwa.pl](https://archikatedraoliwa.pl/), даведнікі | 2026-11-10 | транспарт да ўваходу ў заапарк — ❔ | ✅/❔ |
| Brzeźno | найпапулярнейшы гарадскі пляж (пір 140 м); трамвай 3 да Brzeźno Dom Zdrojowy | [visitgdansk — plaże](https://visitgdansk.com/najpiękniejsze-plaże?setLanguage=en) + ztm.gda.pl/rozklady | 2026-11-10 | сезонны трамвай 63 — летні | ✅ |
| Jelitkowo | сямейны пляж каля мяжы з Сопатам; трамваі 2 і 4 (таксама 6, 8), аўтобус 227 | visitgdansk.com + ztm.gda.pl/rozklady | 2026-11-10 | — | ✅ |
| Stogi | шырокі спакойны пляж, Blue Flag; цяпер аўтобус T8/158: мост Siennicki закрыты, трамваі 8/9 скарочаныя да Głęboka да 2027 | visitgdansk.com + ztm.gda.pl/rozklady | 2026-11-10 | вяртанне трамвая — праз рэканструкцыю моста | ✅ |
| Wyspa Sobieszewska | «дзікі» зялёны канец горада; рэзерваты Ptasi Raj і Mewia Łacha (птушкі, цюлені); аўтобус 512 (112/212 да Przegalina) | visitgdansk.com + ztm.gda.pl/rozklady | 2026-11-10 | летнія нумары могуць мяняцца | ✅ |
| Мапы цэнтра | [mapa-centrum-gdanska.pdf](https://visitgdansk.com/cmsImages/dokumenty/mapa-centrum-gdanska.pdf) (200 OK) + A3-мапа 2025 і мапа Sobieszewo на [magazyn-online](https://visitgdansk.com/en/magazyn-online.qbpage) | visitgdansk.com | 2026-11-10 | — | ✅ |

## 4. Дастаўка ежы

| Сэрвіс | Працуе ў Гданьску | Метады аплаты (афіцыйна) | Крыніца | Праверана | Статус |
|---|---|---|---|---|---|
| Pyszne.pl | так | карткі, BLIK (праз PayU), Apple Pay, Google Pay, PayPal, гатоўка | [метады аплаты](https://www.pyszne.pl/obsluga-klienta/artykul/z-jakich-metod-platnosci-moge-skorzystac-pl) | 2026-11-10 | ✅ |
| Glovo | так (зона Trójmiasto) | карткі Visa/MC/AMEX, BLIK, гатоўка пры атрыманні (PLN) | [Glovo Terms §4.5](https://glovoapp.com/docs/pl/legal/terms), FAQ | 2026-11-10 | ✅ |
| Wolt | так | карткі, BLIK (у т. л. one-click), гатоўка ў Польшчы | [Wolt — BLIK](https://wolt.com/pl/pol/lodz/article/wolt-blik-cashback0223), [ToS §6.5](https://explore.wolt.com/en/pol/terms) | 2026-11-10 | ✅ |
| Uber Eats | так | карткі, BLIK, Apple Pay | help.uber.com (афіцыйныя артыкулы) | 2026-11-10 | ✅ |
| Bolt Food | так | карткі (AMEX, Visa, MC…), гатоўка пры атрыманні; Google Pay/Maestro/Verve выключаныя | [bolt.eu — support](https://bolt.eu/pl-pl/support/articles/360021470740) | 2026-11-10 | BLIK не названы — ❔ |

## 5. Аплата і BLIK

| Факт | Значэнне | Крыніца | Праверана | Статус |
|---|---|---|---|---|
| Што такое BLIK | польскі мабільны плацёж: аднаразовы 6-лічбавы код з банкоўскага ап; кантактлес у крамах; P2P па нумары тэлефона; зняцце ў банкамаце без карты | [blik.com — how to use](https://www.blik.com/en/how-to-use-blik) | 2026-11-10 | ✅ |
| Што патрэбна | рахунак у банку-ўдзельніку + мабільная аплікацыя банка | blik.com | 2026-11-10 | ✅ |
| Банкі-ўдзельнікі | PKO BP, mBank, ING, Millennium, Pekao, Santander/BNP, Credit Agricole, Alior, VeloBank, Nest, Revolut і інш. (поўны спіс на старонцы) | [blik.com/partnerzy](https://blik.com/partnerzy) | 2026-11-10 | ✅ |
| Карткі/гатоўка «паўсюль» | афіцыйнай статыстыкі няма (NBP пад бот-блокам); у даведніку трымаецца сумленная фармулёўка без агульнага абяцання | — | 2026-11-10 | ❔ |

## 6. Karta Turysty

| Факт | Значэнне | Крыніца | Праверана | Умовы | Статус |
|---|---|---|---|---|---|
| Пакеты | Odkrywca 24/48/72 гад — 75/85/95 zł (льготны 60/70/80); Odkrywca Premium — 90/110/130 (70/85/100); Smaki Gdańska Duet — 216 zł, 30 дзён, 2 асобы | [cennik](https://kartaturysty.visitgdansk.com/cennik) | 2026-11-10 | старая сетка 12/24/48/72 больш не прадаецца | ✅ |
| Odkrywca — 13 уваходаў | Нац. марскі музей (Ołowianka, Dar Pomorza, Sołdek), Muzeum Gdańska (Ратуша ГМ, Бурштын), Археалагічны (3 аддзелы), Hevelianum, ZOO, Нацыянальны (Этнаграфія, Сучаснае мастацтва/Pałac Opatów, Зялёная брама) + скідкі | [пакет](https://kartaturysty.visitgdansk.com/gdansk-szczegoly-pakietu.qbpage?id=670637) | 2026-11-10 | спіс з афіцыйнай старонкі пакета | ✅ |
| Premium — 23 уваходы | усё з Odkrywca + Артуса двор, Дом Уфагена, Пошты музей, Zespół Przedbramia, Віслагродзкая цытадзель, Музей ІІ сусветнай вайны, ECS, NOMUS, Sztuka Dawna, Жураве + скідкі | [пакет Premium](https://kartaturysty.visitgdansk.com/gdansk-szczegoly-pakietu.qbpage?id=670805) | 2026-11-10 | — | ✅ |
| Транспарт дапаўненне | Bilet Metropolitalny: дзень 34/17, 72 гад 68/34 (SKM + POLREGIO + гарадскі транспарт); актывацыя пакета і білета ў розныя дні | [FAQ Karta Turysty](https://kartaturysty.visitgdansk.com/en/faq-pytania-ogolne) | 2026-11-10 | — | ✅ |
| Купля і правілы | онлайн/ап; пункты: Plac Solidarności 1, аэрапорт (Słowackiego 210A, 24/7); персанальная, подпіс; вяртанне неўжытай — 4 гад ад куплі; згубленая — замена 25 zł | [FAQ](https://kartaturysty.visitgdansk.com/en/faq-pytania-ogolne) | 2026-11-10 | — | ✅ |

## 7. Музеі: бясплатныя дні

| Музей | Бясплатна | Умовы | Крыніца | Праверана | Статус |
|---|---|---|---|---|---|
| Музей ІІ сусветнай вайны | уторак, усе выставы | білет 0 zł толькі ў касе ў дзень наведвання (≤1 гад да зачынення); онлайн-браніравання бясплатных няма; панядзелкі звычайна закрыты; святы — свой расклад | [visiting rules](https://www.muzeum1939.pl/en/visit-and-tickets/wwii-museum-visit/sightseeing/visiting-rules) | 2026-11-10 | ✅ |
| Muzeum Gdańska | панядзелак: Ратуша ГМ, Артуса двор, Дом Уфагена 10:00–16:00; Бурштын 10:00–18:00 | уторак асноўныя аддзелы закрытыя; на бясплатны дзень частка часовых выставак можа не працаваць; закрытыя дні — на афіцыйнай старонцы | [oddziały](https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/), [darmowy wstęp](https://muzeumgdansk.pl/zaplanuj-wizyte/darmowy-wstep/) | 2026-11-10 | ⚠️ EN-старонка free-entrance несінхронная («зіма — уторак») — рашэнне ўладальніка ў [human-actions](https://github.com/kudy-vk/KUDY/blob/main/docs/human-actions.md) |
| ECS | рэгулярнага бясплатнага дня выстаў няма; уторак — тэхнічны дзень; уваход у будынак бясплатны | X–IV: пн, ср–пт 10–17, сб–нд 10–18 | [ecs.gda.pl — godziny](https://ecs.gda.pl/zaplanuj-wizyte/godziny-otwarcia) | 2026-11-10 | ✅ |

## 8. Мальбарк

| Факт | Значэнне | Крыніца | Праверана | Умовы | Статус |
|---|---|---|---|---|---|
| ЮНЕСКА | «Castle of the Teutonic Order in Malbork», 1997, крытэрыі (ii)(iii)(iv) | [whc.unesco.org/en/list/847](https://whc.unesco.org/en/list/847) | 2026-11-10 | — | ✅ |
| «Найбуйнейшы цагляны замак свету» | фраза афіцыйнага сайта замка; ЮНЕСКА фармулюе «выдатны прыклад цаглянага замка» | [zamek.malbork.pl](https://zamek.malbork.pl/en/home/visit/) | 2026-11-10 | у тэксцах атрыбутаваць сайту замка | ✅ |
| Цягнік | POLREGIO прама з Gdańsk Główny, ~штогадзіну, 45–65 хв; зварот да позняга вечара | [расклад GD5 (PDF)](https://polregio.pl/media/30173/gd5_20261025_20261212.pdf) | 2026-11-10 | расклад да 12.12.2026; ад 13.12.2026 новы | ✅ |
| Станцыя → замак | пешкі праз горад; з 16.11.2026 кладка праз Nogat закрыта — пераход мостам Пілцкага (DK55) | [навіна 04.11.2026](https://zamek.malbork.pl/aktualnosci/wazna-informacja-dla-odwiedzajacych-muzeum-zamkowe-w-malborku) | 2026-11-10 | пешы час ~15–20 хв — толькі неафіцыйна, у тэкст не ўвайшло | ✅ |
| Гадзіны (зім. сезон 01.10.2026–25.04.2027) | уторак–нядзеля Trasa historyczna 9:00–16:00 (апошні ўваход 12:45, інтэр'еры да 15:00); панядзелак — толькі бясплатныя падворкі (білет на месцы) | [opening hours](https://zamek.malbork.pl/en/opening-hours/) | 2026-11-10 | летнія гадзіны — на старонцы; 11.11 адкрыта 9–16; 24–25.12 закрыта; 31.12 скарочана | ✅ |
| Білеты | Trasa historyczna 80/60 zł; spacerowa 35/25; сямейны 70/60; аўдыёгід у цане; дзеці да 7 бясплатна; онлайн [bilety.zamek.malbork.pl](https://bilety.zamek.malbork.pl/trasy-zwiedzania.html) | [tickets](https://zamek.malbork.pl/en/home/visit/tickets/) | 2026-11-10 | парог 500 чал/гад — купляць загадзя | ✅ |
| Цана цягніка | дыяпазон Taryfa Pomorska 51–60 км = 18 zł; 61–70 км = 20 zł | [Taryfa Pomorska](https://polregio.pl/pl/oferty-i-promocje/oferty-regionalne/taryfa-pomorska) | 2026-11-10 | ❔ дакладная тарыфная адлегласць Gdańsk–Malbork не пацверджана | ⚠️ |

## 9. Адкрытыя пытанні (чаго не хапае — чым дапоўніць)

| Пытанне | Што трэба | Як праверыць |
|---|---|---|
| Бок перону 3 у Gdańsk Wrzeszcz (цэнтр vs Гдыня) | напрамак для турыста да аэрапорта і назад | станцыйныя схемы PKP/паркінг-покажчыкі на месцы; запытаць у SKM |
| Пакрыццё адзінага білета на ланцуг Polregio + SKM (аэрапорт → Wrzeszcz → цэнтр) | ці хапае адной куплі | тарыфны каляктор MZKZG/POLREGIO або пытанне ў падтрымку |
| Аўтаматы білетаў на прыпынках (за салонам) | спіс месцаў для даведніка | [ztm.gda.pl — automaty](https://ztm.gda.pl/link/5754/automaty-biletowe) — прайсці спіс |
| NBP-статыстыка аплаты (дзелі гатоўкі) | лічбы для радка пра карткі і гатоўку | ручная загрузка [PDF NBP](https://nbp.pl/wp-content/uploads/2026/09/Raport-o-obrocie-gotowkowym-2025-v1.10-INT.pdf) (прымаў пад бот-блокам) |
| Дзень бясплатнага ўваходу Muzeum Gdańska | рашэнне: панядзелак (PL-расклад) vs EN-старонка («зіма — уторак») | рашэнне ўладальніка — [human-actions](https://github.com/kudy-vk/KUDY/blob/main/docs/human-actions.md) |
| Пешы час ад станцыі Malbork да замка | афіцыйная лічба хвілін | запыт да музея або зацверджаны маршрут на старонцы access |
| BLIK на Bolt Food; гатоўка на Uber Eats; Apple/Google Pay на Glovo/Wolt для PL | афіцыйныя пацвярджэнні па сэрвісах | старонкі падтрымкі сэрвісаў ці тэстовая замова |
