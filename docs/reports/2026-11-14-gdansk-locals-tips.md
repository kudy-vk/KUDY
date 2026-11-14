# Гданьск: саветы ад рэальных людзей — даведнік для будучай старонкі

- **Дата:** 2026-11-14
- **Мэта:** адшліфаваны збор саветаў мясцовых і турыстаў пад будучую старонку KUDYapp (саветы мясцовых / «Побач з горадам»)
- **Машынны датасет:** [2026-11-14-gdansk-locals-tips.json](./2026-11-14-gdansk-locals-tips.json) — тыя ж дадзеныя ў структураваным выглядзе (катэгорыі, месцы, крыніцы, лайфхакі, пасткі, цытаты)
- **Прэвью для чалавека:** PDF «Гданьск-даведнік.pdf» зрабілены паза рэпазіторыем у `~/Documents` (зборка: `.scratch/gdansk-pdf/generate.py`)

## Адкуль дадзеныя

Шэсць жывых трэдаў Reddit прачытаныя цалкам праз рэндар у браўзеры (Reddit блакуе прамыя запыты), дапаўненне — пошукавыя вынікі X і Threads (без лагіна глыбіна недаступная). Кожнае месца ў JSON мае `sourceIds` на крыніцу. Спасылкі на ўсе крыніцы — у раздзеле [Крыніцы](#крыніцы) і ў JSON.

**Правіла спасылак:** усе `mapsQuery` з JSON разгортваюцца ў спасылку пошуку Google Maps: `https://www.google.com/maps/search/?api=1&query=<URL-enc mapsQuery>`. Гэта пошукавая спасылка, не маркер — рэдкія назвы (напр., «Узгорак Лагры») перад публікацыяй у прадукце трэба пераправерыць; у JSON такія месцы пазначаны `flag: "verify-name"`.

## Галоўныя месцы

| Месца | Што гэта | Крыніцы |
|---|---|---|
| [Стары горад: Длуга і Марыяцкая](https://www.google.com/maps/search/?api=1&query=ulica%20D%C5%82uga%20Gda%C5%84sk) | Галоўная пешаходная зона з каляровымі фасадамі; на Марыяцкай — бурштынавыя крамы. Побач набярэжная Мотлавы з надпісам «Gdańsk». | S1, S5 |
| [Журав (Żuraw)](https://www.google.com/maps/search/?api=1&query=%C5%BBuraw%20Gda%C5%84sk) | Старадаўні портавы кран, сімвал горада. | S1, S5 |
| [Базіліка Марыяцкая](https://www.google.com/maps/search/?api=1&query=Bazylika%20Mariacka%20Gda%C5%84sk) | Вялізарны гатычны касцёл; вежа з відам на дахі (узімку часам зачынена). | S1, S2, S6 |
| [Ратуша Галоўнага горада](https://www.google.com/maps/search/?api=1&query=Ratusz%20G%C5%82%C3%B3wnego%20Miasta%20Gda%C5%84sk) | Музей і вежа з панарамай. Водгук: «не занадта доўга і не нудна». | S2, S5 |
| [Музей Другой сусветнай вайны](https://www.google.com/maps/search/?api=1&query=Muzeum%20II%20Wojny%20%C5%9Awiatowej%20Gda%C5%84sk) | Наймацнейшы музей горада; аўдыёгід, плануйце амаль увесь дзень. | S1, S2, S6 |
| [Еўрапейскі цэнтр Салідарнасці](https://www.google.com/maps/search/?api=1&query=Europejskie%20Centrum%20Solidarno%C5%9Bci%20Gda%C5%84sk) | Музей пра «Салідарнасць»; аўдыёгід. Водгук: «адзін вартае ўсяго падарожжа». | S1, S2, S6 |
| [Нацыянальны музей](https://www.google.com/maps/search/?api=1&query=Muzeum%20Narodowe%20Gda%C5%84sk) | «Страшны суд» Мемлінга — адна з дзвюх найкаштоўнейшых карцін Польшчы. | S5 |
| [Вестэрплатэ](https://www.google.com/maps/search/?api=1&query=Westerplatte%20Gda%C5%84sk) | Месца пачатку вайны: бункеры, від з узгорка. Транспартам даўжэй за іншыя кропкі. | S1 |
| [Мост Кахання](https://www.google.com/maps/search/?api=1&query=Most%20Mi%C5%82o%C5%9Bci%20Gda%C5%84sk) | Мост з замочкамі, бясплатная фота-кропка. | T |

## Сакрэтныя месцы (чаго няма ў гідах)

| Месца | Што там добра | Крыніцы |
|---|---|---|
| [Гара Градова](https://www.google.com/maps/search/?api=1&query=G%C3%B3ra%20Gradowa%20Gda%C5%84sk) | Панарама на стары горад і верф; «людзей амаль няма». | S5 |
| [Узгорак Пахолка](https://www.google.com/maps/search/?api=1&query=Wzg%C3%B3rze%20Pacho%C5%82ka%20Gda%C5%84sk) | Панарама горада, лепшая ў яснае надвор'е. | S5 |
| [Узгорак Лагры](https://www.google.com/maps/search/?api=1&query=Wzg%C3%B3rze%20Lagry%20Gda%C5%84sk) | Доўгая фотагенічная прагулка. Назва са старога водгуку — пераправерыць. | S5 |
| [Шведская грабля](https://www.google.com/maps/search/?api=1&query=Szwedzka%20Grobla%20Gda%C5%84sk) | Прыгожы веламаршрут уздоўж ракі. | S5 |
| [Аліўскі парк і лес](https://www.google.com/maps/search/?api=1&query=Park%20Oliwski%20Gda%C5%84sk) | Парк у любы сезон; лес — прагулкі і веласіпед. Побач [кафейня Las Oliwa](https://www.google.com/maps/search/?api=1&query=Kawiarnia%20Las%20Oliwa%20Gda%C5%84sk). | S1, S5 |
| [Вуліца Электрыкаў](https://www.google.com/maps/search/?api=1&query=Ulica%20Elektryk%C3%B3w%20Gda%C5%84sk) | Баровая вуліца ў верфі: альтэрнатыўнае начное жыццё. | T |
| [Пляж Стогі](https://www.google.com/maps/search/?api=1&query=Pla%C5%BCa%20Stogi%20Gda%C5%84sk) | Спакойны гарадскі пляж далей ад цэнтра. | T |
| [Востраў Собешава](https://www.google.com/maps/search/?api=1&query=Wyspa%20Sobieszewska%20Gda%C5%84sk) | Дзікія пляжы і сосны, без натоўпу. | T |
| [Пляж Бжэзна](https://www.google.com/maps/search/?api=1&query=Pla%C5%BCa%20Brze%C5%BAno%20Gda%C5%84sk) | Старт пешай прагулкі ўздоўж мора да Сопата. | S1 |

Парада: прагулку ўздоўж абрыва рабіце праз лес па яго верху, а не па пляжу.

## Трыгарад: Сопат і Гдыня

| Месца | Што казалі | Крыніцы |
|---|---|---|
| [Сопат: мол](https://www.google.com/maps/search/?api=1&query=Molo%20Sopot) | Найдаўжэйшы драўляны мол у Еўропе; начное жыццё Трыгарада — таксама тут. | S1, S3 |
| [Гдыня: сквер Касцюшкі](https://www.google.com/maps/search/?api=1&query=Skwer%20Ko%C5%9Bciuszki%20Gdynia) | Парк з караблямі; у канцы — [Акварыум Гдыня](https://www.google.com/maps/search/?api=1&query=Akwarium%20Gdy%C5%84skie). | S1 |

Цытата: «Шмат хто засяроджваецца толькі на старым горадзе Гданьска і прапускае астатнюю агламерацыю. А Сопат і Гдыня варта дзень кожны».

## Ежа

### Молачныя бары (bar mleczny) — дзешава і па-мясцоваму

| Месца | Раён / водгук | Крыніцы |
|---|---|---|
| [Bar Syrena](https://www.google.com/maps/search/?api=1&query=Bar%20Syrena%20Gda%C5%84sk) | Вжэсч; «я тут часта еў, калі вучыўся ў Гданьску». | S4 |
| [Bar Akademicki](https://www.google.com/maps/search/?api=1&query=Bar%20Akademicki%20Gda%C5%84sk) | Вжэсч, студэнцкі раён. | S4 |
| [Stołówka Gdańska](https://www.google.com/maps/search/?api=1&query=Sto%C5%82%C3%B3wka%20Gda%C5%84ska%20Gda%C5%84sk) | Długie Ogrody; бывае чарга, але «варта». | S4 |
| [Bar Mleczny Jaros](https://www.google.com/maps/search/?api=1&query=Bar%20Mleczny%20Jaros%20Gda%C5%84sk) | «Найтаннейшыя, там едуць толькі мясцовыя». | S4 |
| [Bar Mleczny Fala](https://www.google.com/maps/search/?api=1&query=Bar%20Mleczny%20Fala%20Gda%C5%84sk) | Найбольш «схаваны» і танны варыянт. | S4 |
| [Bar Neptun](https://www.google.com/maps/search/?api=1&query=Bar%20Neptun%20Gda%C5%84sk) | ⚠ Пазбягайце: «найгоршы молачны бар горада». | S4 |

### Пельмені (pierogi)

Шукайце ў «pierogarnia» — установе-спэцыялісце; у молачных барах гэта не фірмовая страва.

| Месца | Водгук | Крыніцы |
|---|---|---|
| [Pierogarnia Stary Młyn](https://www.google.com/maps/search/?api=1&query=Pierogarnia%20Stary%20M%C5%82yn%20Gda%C5%84sk) | Найчасцейшая рэкамендацыя: «вялізныя, свежыя». | S4, S2 |
| [Pierogarnia na Pierogi](https://www.google.com/maps/search/?api=1&query=Pierogarnia%20na%20Pierogi%20Gda%C5%84sk) | Каля Жабянкі SKM; «ні турыстаў, толькі мясцовыя». | S4 |
| [Kocham Pierogi](https://www.google.com/maps/search/?api=1&query=Kocham%20Pierogi%20Gda%C5%84sk) | вул. Hynka. | S4 |
| [Pierogarnia Mandu](https://www.google.com/maps/search/?api=1&query=Pierogarnia%20Mandu%20Gda%C5%84sk) | ⚠ Мясцовы: «раней добрая, цяпер пастка»; смачныя толькі з чоррызо. | S4 |
| [Pierogarnia Pruszcz](https://www.google.com/maps/search/?api=1&query=Pierogarnia%20Pruszcz%20Pruszcz%20Gda%C5%84ski) | Прадмесце. | S4 |

### Іншае асноўнае

| Месца | Што казалі | Крыніцы |
|---|---|---|
| [Pyra Bar](https://www.google.com/maps/search/?api=1&query=Pyra%20Bar%20Gda%C5%84sk) | Бульба: «хутка і сытна»; не ўсе стравы аднолькава добрыя. | S1, S4 |
| [Ostro](https://www.google.com/maps/search/?api=1&query=Ostro%20Gda%C5%84sk) | Неапалітанская піца: «адна з найлепшых у маім жыцці». | S4, S5 |
| [Calma](https://www.google.com/maps/search/?api=1&query=Calma%20Gda%C5%84sk) | Той жа шэф, што Ostro, але без чаргаў. | S4 |
| [Publiczna](https://www.google.com/maps/search/?api=1&query=Publiczna%20Gda%C5%84sk) | Піца і спецыяльная кава; 15 хв пешкі ад цэнтра. | S4 |
| [Surf Burger](https://www.google.com/maps/search/?api=1&query=Surf%20Burger%20Gda%C5%84sk) | «Добрыя, нядорагія бургеры». | S1, S4 |
| [Burger Stacja](https://www.google.com/maps/search/?api=1&query=Burger%20Stacja%20Gda%C5%84sk) | Рэкамендацыя ад нядаўняга жыхара. | S4 |
| [Holy Burger](https://www.google.com/maps/search/?api=1&query=Holy%20Burger%20Gda%C5%84sk) | «Варта спрабаваць». | S4 |
| [Rybakówka](https://www.google.com/maps/search/?api=1&query=Rybak%C3%B3wka%20Gda%C5%84sk) | «Найлепшая смажаная рыба ў Трыгарадзе». | S4 |
| [Bar pod Rybą](https://www.google.com/maps/search/?api=1&query=Bar%20pod%20Ryb%C4%85%20Gda%C5%84sk) | Фаршыраваная бульба; месца пераехала з цэнтра. | S4 |
| [Moja Gruzja](https://www.google.com/maps/search/?api=1&query=Moja%20Gruzja%20Gda%C5%84sk) | Грузінская: хінкалі, хачапуры. | S4 |
| [Aichi](https://www.google.com/maps/search/?api=1&query=Aichi%20Gda%C5%84sk) | Карэйская. | S4 |
| [Pueblo](https://www.google.com/maps/search/?api=1&query=Pueblo%20Gda%C5%84sk) | Мексіканская. | S4 |
| [Węgierski Langos](https://www.google.com/maps/search/?api=1&query=W%C4%99gierski%20Langos%20Gda%C5%84sk) | Венгерскі лангош. | S4 |
| [Riverside Dym i Ogień](https://www.google.com/maps/search/?api=1&query=Dym%20i%20Ogie%C5%84%20Gda%C5%84sk) | Класічная польская. | S4 |
| [Nowy Browar Gdańsk](https://www.google.com/maps/search/?api=1&query=Nowy%20Browar%20Gda%C5%84sk) | Пывоварня з ежай. | S4 |

### Фуд-холы

| Месца | Што казалі | Крыніцы |
|---|---|---|
| [100cznia](https://www.google.com/maps/search/?api=1&query=100cznia%20Gda%C5%84sk) | Тройка фуд-холаў «у адзін голас». | S4 |
| [Montownia](https://www.google.com/maps/search/?api=1&query=Montownia%20Gda%C5%84sk) | Той жа тройкі. | S4 |
| [Słony Spichlerz](https://www.google.com/maps/search/?api=1&query=S%C5%82ony%20Spichlerz%20Gda%C5%84sk) | Той жа тройкі. | S4 |
| [Lepione (ТЦ Forum)](https://www.google.com/maps/search/?api=1&query=Lepione%20Gda%C5%84sk) | Буфет; скідкі пасля 19:00 і 20:00, але менш выбару. | S4 |
| [Thali](https://www.google.com/maps/search/?api=1&query=Thali%20Gda%C5%84sk) | Індыйская; абед 12:00–15:00 у будні — танна. | S4 |

### Кава, бары і дзесерты

| Месца | Што казалі | Крыніцы |
|---|---|---|
| [Cafe Leń](https://www.google.com/maps/search/?api=1&query=Cafe%20Le%C5%84%20Gda%C5%84sk) | «Цудоўна для ранішняй кавы». | S5 |
| [Kawiarnia Publiczna](https://www.google.com/maps/search/?api=1&query=Kawiarnia%20Publiczna%20Gda%C5%84sk) | Выдатная спецыяльная кава. | S4 |
| [Umam bakery](https://www.google.com/maps/search/?api=1&query=Umam%20bakery%20Gda%C5%84sk) | Пякарня з тэмы «што не прапускаць». | S5 |
| [Eklerownia](https://www.google.com/maps/search/?api=1&query=Eklerownia%20Gda%C5%84sk) | «Смачныя элеры з кавай». | S2 |
| [No To Cyk](https://www.google.com/maps/search/?api=1&query=No%20To%20Cyk%20Gda%C5%84sk) | «Маленькі і весёлы». | S1 |
| [Laka bar](https://www.google.com/maps/search/?api=1&query=Laka%20bar%20Gda%C5%84sk) | «На ўвесь дзень»; бранч-хайлайт, вялікія порцыі за смяшныя грошы. | S4 |
| [Śliwka w Kompot](https://www.google.com/maps/search/?api=1&query=%C5%9Aliwka%20w%20Kompot%20Gda%C5%84sk) | Рэстаран-хайлайт сольнага падарожжа. | S6 |
| [Winston](https://www.google.com/maps/search/?api=1&query=Winston%20bar%20Gda%C5%84sk) | Кактэйльны бар-хайлайт. | S6 |
| [Restauracja Motława](https://www.google.com/maps/search/?api=1&query=Restauracja%20Mot%C5%82awa%20Gda%C5%84sk) | «Выдатныя вячэры». | S6 |
| [Piwnica Rajców](https://www.google.com/maps/search/?api=1&query=Piwnica%20Rajc%C3%B3w%20Gda%C5%84sk) | Піва і качыны пельмені. | S5 |
| [Wiśniewski](https://www.google.com/maps/search/?api=1&query=Wi%C5%9Bniewski%20Gda%C5%84sk) | Вішнёвая настойка. | S4 |
| [Pułapka](https://www.google.com/maps/search/?api=1&query=Pu%C5%82apka%20Gda%C5%84sk) / [Labeerynt](https://www.google.com/maps/search/?api=1&query=Labeerynt%20Gda%C5%84sk) | Піва; названы ў пытанні пра жывую музыку. | S6 |

### За горадам

| Месца | Што казалі | Крыніцы |
|---|---|---|
| [Chata nad Radunią (Bąkowo)](https://www.google.com/maps/search/?api=1&query=Chata%20nad%20Raduni%C4%85%20B%C4%85kowo) | «Цудоўная ежа і месца» — «варта паездкі». | S4 |
| [Gościniec dla Przyjaciół (Kleszczowo)](https://www.google.com/maps/search/?api=1&query=Go%C5%9Bciniec%20dla%20Przyjaci%C3%B3%C5%82%20Kleszczowo) | Рыба і хатнія вэнджаныя калбасы. | S4 |

## Лайфхакі

| Тэма | Савет | Крыніцы |
|---|---|---|
| Транспарт | Праграма JakDojade: маршруты + білеты. «Таксі наогул не патрэбнае». | S1, S3 |
| Цягнік SKM | Гданьск–Сопат–Гдыня на адной лініі; у пік каля кожных 10 хвілін. | S1, S3 |
| Білет на SKM | Купілі ў кіёску — прабіце на платформе да паездкі, інакш штраф. | S3 |
| Таксі | Uber і Bolt: параўнайце кошт, бярыце дзешэўшы варыянт. | S1, S3 |
| Таксі ля вакзала | Не браць ля Dworzec Główny: «шмат завышаных коштаў». | S3 |
| Бясплатныя музеі | Дзень бясплатнага ўваходу ў шмат якіх музеяў (адзін кажа «часта панядзелак», другі — што ў панядзелкі могуць не працаваць: правярайце на сайце). Ідзіце раніцай. | S2, S3 |
| Рэчы ў музеях | Бясплатныя шафикі, залог вяртаюць. | S2 |
| Грошы | Мяняць гатоўку ў канторы — курс лепшы за банк і аэрапорт; картай плацяць амаль усюды, кэш — запас на крайні выпадак. | S5, S3 |
| Аўтамабіль | Не ездзіце па Obwodnica S6/S7 — аварыі і коркі. | S3 |
| Музей вайны | Аўдыёгід + увесь дзень: «выганялі ў час закрыцця». | S1, S6 |

## Пасткі і бяспека

- **Стрып-клубы** — галоўная пастка: вулічныя «запрашальнікі» (у Сопаце — ружовыя парасоны); напояць, накручваюць кошт, выбіваюць грошы. Не ідзіце і не размаўляйце. (S1, S3)
- **Запрашэнні з вуліцы ў бар/клуб і бясплатныя напоі** — адна схема; адмаўляйцеся. (S3)
- **[Muzeum Iluzji](https://www.google.com/maps/search/?api=1&query=Muzeum%20Iluzji%20Gda%C5%84sk)** — названая турыстычная пастка-музей. (S2)
- **[AmberSky](https://www.google.com/maps/search/?api=1&query=AmberSky%20Gda%C5%84sk)** — «завышаная цана»; уначы падчас каляднага кірмашу прымальна. (S2)
- **Рэчы на пляжы** — не пакідаць без нагляду; кішэнных злодзеяў амаль няма. (S3)
- **Ноччу** — Dolne Orunia і Nowy Port праходзіць днём (не з-за злачыннасці; Nowy Port прызнавалі «насамрэч бяспечным»). (S6)
- **Бяспека агулам:** «калі ведаеце пражскія махлярствы — тут вы імунныя». (S3)

## Крыніцы

| ID | ID у JSON | Платформа | Трэд / улік | Пакрыццё |
|---|---|---|---|---|
| S1 | `reddit-126hrep` | Reddit r/poland | [Tips to tourists visiting Gdansk?](https://www.reddit.com/r/poland/comments/126hrep/tips_to_tourists_visiting_gdansk/) | прачытаны цалкам |
| S2 | `reddit-102yo3j` | Reddit r/gdansk | [Must sees that aren't tourist-traps](https://www.reddit.com/r/gdansk/comments/102yo3j/must_sees_for_visitors_that_arent_touristtraps/) | прачытаны цалкам |
| S3 | `reddit-1n8vz03` | Reddit r/poland | [What to watch out for in Gdańsk?](https://www.reddit.com/r/poland/comments/1n8vz03/what_to_watch_out_for_in_gda%C5%88sk/) | прачытаны цалкам |
| S4 | `reddit-1ri1pdg` | Reddit r/gdansk | [Food recommendations, not tourist traps](https://www.reddit.com/r/gdansk/comments/1ri1pdg/food_and_restaurantplaces_to_eat_recommendations/) | прачытаны цалкам |
| S5 | `reddit-zd4ca3` | Reddit r/poland | [Things not to miss in Gdańsk?](https://www.reddit.com/r/poland/comments/zd4ca3/things_not_to_miss_in_gda%C5%84sk/) | прачытаны цалкам |
| S6 | `reddit-1w411tl` | Reddit r/gdansk | [Monthly tourist thread 09/2026](https://www.reddit.com/r/gdansk/comments/1w411tl/visiting_gda%C5%84sk_this_is_monthly_tourist_thread/) | прачытаны цалкам |
| X | `x-kamischka` · `x-anamatei` · `x-polandtravelus` | X (Twitter) | [kamischka](https://x.com/kamischka) · [AnaMatei](https://x.com/AnaMatei) · [PolandtravelUS](https://x.com/PolandtravelUS) | індэкс |
| T | `threads-search` | Threads | [пошук #gdansk](https://www.threads.net/search?q=Gdansk) | індэкс (113 тыс. постаў) |

## Прымяненне для будучай старонкі

1. Катэгорыі ўжо разрэзаныя як старонкавыя блокі: «Галоўнае», «Сакрэтнае», «Трыгарад», «Ежа» (6 падкатэгорый), «Лайфхакі», «Пасткі».
2. У JSON кожнае месца мае: `name`, `desc` (водгук чалавека, не маркетынг), `mapsQuery` → спасылка на Maps, `district`/`city` дзе вядома, `sourceIds` для правярымасці і «паказаць крыніцу».
3. `flag: "avoid"` (Bar Neptun) і `flag: "mixed"` (Mandu) — для блоку «аглядацца», `flag: "verify-name"` (Лагры) — перад публікацыяй праверыць назву на мапе.
4. Разнамкавасць крыніц: Reddit 2019–2026. Перад прадакшэнам дарагія праверкі (графік працы, закрыцці) рабіць свяжымі; у дадзеных гэтага няма.
