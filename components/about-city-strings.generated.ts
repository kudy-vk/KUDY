// GENERATED FILE — do not edit. Regenerate with:
//   node --experimental-strip-types tools/i18n/generate-messages.mjs
//
// Source of truth: contracts/ui-messages/source.json (the be base text) and
// contracts/ui-messages/translations/<locale>.json (the reviewed translations).
// G21.25 (single-source-translations.md): the catalogues are generated projections — edit the
// source/translation data, never this file; the generator's --check mode
// fails on any hand edit.
// the «Пра горад» guide (issue #200; the #252 wheel screen); base language English per decision L1 (docs/design/brand/decisions.md) — a locale without its own words shows the English text (the be-only fallback of #200 is retired)

import type { AboutCityStrings } from "../contracts/ui-message-types.ts";

export const ABOUT_CITY_STRINGS: Record<"be" | "en", AboutCityStrings> = {
  "be": {
    "wheel": {
      "label": "Раздзелы даведніка",
    },
    "tab": {
      "airport": "Аэрапорт",
      "transport": "Транспарт і білеты",
      "city": "Дзе што ў горадзе",
      "food": "Ежа і аплата",
      "card": "Картка і музеі",
    },
    "head": {
      "airport": "З аэрапорта і назад",
      "transport": "Як ездзіць па горадзе",
      "city": "Дзе што ў горадзе",
      "food": "Ежа і аплата",
      "card": "Картка турыста і бясплатныя дні музеяў",
    },
    "verified": "Праверана 10 лістапада 2026",
    "sources": {
      "title": "Афіцыйныя старонкі",
      "note": "Расклады, цэны і гадзіны працы мяняюцца. Спасылкі адкрываюцца ў браўзеры, для іх патрэбная сетка; сам даведнік працуе без сеткі.",
    },
    "link": {
      "failed": (url: string) => `Не ўдалося адкрыць старонку. Яе адрас: ${url}`,
    },
    "u": {
      "aboutMin": (n: number) => `каля ${n} хв`,
      "everyWeekdays": (n: number) => `у будні кожныя ${n} хв`,
      "hourly": "штогадзіну",
      "aboutHourly": "прыблізна штогадзіну",
      "reduced": (price: string) => `льготны ${price}`,
      "decimal": ",",
    },
    "sr": {
      "bus": "Аўтобус",
      "night": "Начны аўтобус",
      "train": "Цягнік",
    },
    "air": {
      "dirLabel": "Кірунак",
      "dirFrom": "З аэрапорта",
      "dirTo": "У аэрапорт",
      "from": {
        "s1": {
          "title": "Выйдзі з тэрмінала",
          "text": "Аўтобусныя прыпынкі — насупраць тэрмінала, каля паркінгу P1. Да станцыі цягніка Gdańsk Port Lotniczy вядзе крыты пераход.",
          "stop01": "Port Lotniczy 01 — у цэнтр",
          "stop02": "Port Lotniczy 02 — у Wrzeszcz",
        },
      },
      "to": {
        "s1": {
          "title": "Дабярыся да прыпынку",
          "text": "Аўтобус 210 адпраўляецца з цэнтра з прыпынку Dworzec Główny 10 на вуліцы Podwale Grodzkie; аўтобус 110 — з Gdańsk Wrzeszcz.",
        },
      },
      "s2": {
        "title": "Выберы рэйс",
      },
      "s3": {
        "title": "Вазьмі білет",
      },
      "ticket": {
        "bus": {
          "title": "Аўтобус: білет ZTM",
          "where": "Купі ў праграме Jakdojade або FALA ці аплаці карткай у прыладзе FALA ў салоне.",
        },
        "train": {
          "title": "Цягнік: асобны чыгуначны білет",
          "where": "Гарадскі білет ZTM у цягніку не дзейнічае. Чыгуначны білет купі ў аўтамаце на пероне або ў праграме Polregio, Jakdojade ці FALA.",
        },
      },
      "notice": "Да 12 снежня 2026 цягнікі ходзяць па часовым раскладзе, сталы пачынаецца 13 снежня 2026. Расклады аўтобусаў мяняюцца па сезонах — перад паездкай правер актуальны расклад.",
    },
    "ride": {
      "110": {
        "from": "У Gdańsk Wrzeszcz",
        "to": "З Gdańsk Wrzeszcz",
        "also": "Аўтобус 120 ходзіць паміж аэрапортам і Łostowice Świętokrzyska.",
      },
      "210": {
        "from": "У цэнтр горада",
        "to": "З цэнтра горада",
      },
      "n3": {
        "from": "Уначы: цэнтр і Wrzeszcz",
        "to": "Уначы: з цэнтра і Wrzeszcz",
        "when": "штоночы, 23:00 – 04:00",
        "toCentre": "З Port Lotniczy 01 у 23:15, 00:06, 01:15 і далей; каля 50 хв.",
        "toWrzeszcz": "З Port Lotniczy 02; каля 20 хв.",
        "route": "Dworzec Główny ⇄ аэрапорт ⇄ Gdańsk Wrzeszcz. Да Сопата і Гдыні не ідзе.",
      },
      "train": {
        "from": "Цягнік да Gdańsk Wrzeszcz",
        "to": "Цягнік з Gdańsk Wrzeszcz",
        "change": "Прамыя цягнікі да Gdańsk Główny ёсць, але часцей патрэбная перасадка ў Gdańsk Wrzeszcz: з перона 3 на SKM у бок цэнтра.",
        "line": "Gdańsk Wrzeszcz – Gdańsk Port Lotniczy – Osowa. Прамыя цягнікі паміж Gdańsk Główny і аэрапортам ёсць, але часцей патрэбная перасадка ў Gdańsk Wrzeszcz.",
        "operator": "POLREGIO. SKM да станцыі аэрапорта не ходзіць.",
      },
    },
    "row": {
      "stop": "Прыпынак",
      "firstLast": "Першы і апошні",
      "sunday": "У нядзелю",
      "centreStops": "Прыпынкі ў цэнтры",
      "also": "Яшчэ",
      "route": "Маршрут",
      "toCentre": "У цэнтр",
      "toWrzeszcz": "У Wrzeszcz",
      "operator": "Перавозчык",
    },
    "tk": {
      "75": "75 хвілін",
      "singleRide": "Адна паездка",
      "single": {
        "phone": "Адна паездка, у тэлефоне",
        "paper": "Адна паездка, папяровы",
      },
      "day24": "24 гадзіны",
      "24h": {
        "two": "24 гадзіны, два арганізатары",
        "all": "24 гадзіны, усе арганізатары",
      },
      "72h": "72 гадзіны",
      "night": "Начныя рэйсы каштуюць столькі ж.",
    },
    "tr": {
      "modes": "Чым ехаць",
      "ztm": {
        "title": "Аўтобусы і трамваі",
        "meta": "ZTM · па Гданьску",
        "text": "Галоўны транспарт горада і суседніх гмін. Сопат і Гдыня маюць свае сеткі ZKM. Агульны тарыф на ўсю агламерацыю вядзе саюз MZKZG: яго білеты дзейнічаюць і ў Гданьску, і ў суседніх гарадах.",
      },
      "skm": {
        "title": "Цягнік SKM",
        "meta": "У Сопат і Гдыню",
        "text": "Галоўная лінія Гдыня – Сопат – Гданьск. У будні цягнікі ходзяць прыблізна кожныя 10–15 хвілін; дакладны час — у раскладзе.",
        "warn": "Разавыя білеты ZTM у цягніках не дзейнічаюць. Патрэбны білет MZKZG «з цягнікамі» або білет SKM.",
      },
      "rail": {
        "title": "Цягнікі POLREGIO",
        "meta": "Аэрапорт, Мальбарк і далей",
        "text": "POLREGIO абслугоўвае лінію PKM да аэрапорта (Gdańsk Wrzeszcz – Gdańsk Port Lotniczy – Osowa) і рэгіянальныя цягнікі ў Мальбарк, Слупск і Картузы. Расклад і білеты — polregio.pl.",
      },
      "prices": "Білеты і цэны",
      "zoneLabel": "Дзе дзейнічае білет",
      "zone": {
        "ztm": "Гданьск",
        "metro": "Трайместа",
        "rail": "З цягнікамі",
      },
      "zoneNote": {
        "ztm": "Білеты ZTM Гданьска: аўтобусы і трамваі гарадской сеткі.",
        "metro": "Метрапалітальныя білеты MZKZG: гарадскі транспарт Гданьска, Сопата, Гдыні і Wejherowo.",
        "rail": "Білеты MZKZG, якія дзейнічаюць і ў цягніках.",
      },
      "activate": "Як актываваць білет",
      "act": {
        "paper": {
          "title": "Папяровы білет з QR-кодам",
          "text": "Скануй у салоне ў прыладзе FALA: трымай білет пад прыладай на адлегласці 10–15 см да сігналу і надпісу «Bilet aktywny». Або прабі яго ў кампасцеры.",
        },
        "mobile": {
          "title": "Мабільны білет у Jakdojade",
          "text": "Актывуецца ў момант куплі, таму купляй адразу пасля ўваходу ў салон.",
        },
        "valid": {
          "title": "Колькі дзейнічае",
          "text": "Адна паездка — да выхаду. 75 хвілін, 24 і 72 гадзіны — ад моманту актывацыі.",
        },
      },
      "buyLabel": "Дзе купіць",
      "buy": {
        "fala": {
          "title": "Праграма FALA",
          "text": "Найбольшы выбар, у тым ліку чыгуначныя білеты.",
        },
        "apps": {
          "title": "Jakdojade і іншыя праграмы",
          "text": "Метрапалітальныя білеты: Jakdojade, GoPay, moBilet, mPay, SkyCash, zBiletem.",
        },
        "board": {
          "title": "У салоне",
          "text": "Прылады FALA, толькі безнаяўная аплата.",
        },
        "desk": {
          "title": "Касы і кіёскі",
          "text": "Касы SKM і ZTM, кіёскі і пошта.",
        },
      },
      "tip": {
        "card": "З плацёжнай карткай можна ехаць без загадзя купленага білета: сістэма FALA сама падбірае тарыф.",
        "kompas": "Праграма SKM KomPas трымае расклад цягнікоў без сеткі.",
      },
    },
    "city": {
      "pick": "Месцы на схеме",
      "caption": "Схема з прыблізнымі прапорцыямі, не мапа. Дакладная мапа цэнтра — па спасылцы ніжэй.",
      "sea": "Балтыйскае мора",
      "get": "Як дабрацца",
      "summer": "Улетку пляжныя рэйсы ходзяць часцей.",
      "motlawa": "Motława",
    },
    "kind": {
      "centre": "Гістарычны цэнтр",
      "quarter": "Гістарычны квартал",
      "station": "Галоўны вакзал",
      "district": "Раён",
      "beach": "Пляж",
      "island": "Востраў і пляж",
    },
    "place": {
      "glowne": "Турыстычнае сэрца Гданьска на рацэ Motława: вуліцы Długa і Długi Targ, фантан Нептуна, Ратуша, касцёл Святой Марыі і Żuraw.",
      "stare": "Асобны гістарычны квартал на поўнач ад Główne Miasto, з касцёлам Святой Кацярыны і Вялікім млынам. Назва азначае «стары горад», але славутасці, па якія прыязджаюць, — у Główne Miasto.",
      "station": "Галоўны чыгуначны вакзал. З яго тунэляў ёсць выхады да трамвайных прыпынкаў. Бліжэйшая да цэнтра чыгуначная станцыя — Gdańsk Śródmieście на лініі SKM.",
      "wrzeszcz": "Самы населены жылы раён: крамы і кавярні, вілы канца XIX стагоддзя і вуліца Wajdeloty ў самым сэрцы.",
      "oliwa": "Катэдра цыстэрцыянцаў са знакамітым арганам (канцэрты; міжнародны фестываль арганнай музыкі ў ліпені і жніўні), парк Адама Міцкевіча і найбольшы ў Польшчы па плошчы заапарк.",
      "brzezno": "Самы папулярны гарадскі пляж.",
      "jelitkowo": "Сямейны пляж каля мяжы з Сопатам.",
      "stogiBeach": "Шырокі спакойны пляж.",
      "stogi": {
        "warn": "Мост Siennicki закрыты, трамваі скарочаныя да 2027 года, таму едзь аўтобусам.",
      },
      "sobieszewo": "«Дзікі» зялёны край горада з птушынымі запаведнікамі.",
    },
    "get": {
      "glowne": "каля 10 хв пешкі ад Gdańsk Główny",
      "station": {
        "walk": "каля 10 хв пешкі да Główne Miasto",
        "skm": "SKM: Gdańsk Śródmieście бліжэй да цэнтра",
      },
      "wrzeszcz": "SKM або цягнік да Gdańsk Wrzeszcz",
      "oliwa": {
        "tram": "трамвай 5, таксама 6",
        "skm": "SKM да Gdańsk Oliwa",
      },
      "brzezno": "трамвай 3 да Brzeźno Dom Zdrojowy",
      "jelitkowo": "трамваі 2 і 4",
      "stogi": "аўтобус T8 або 158",
      "sobieszewo": "аўтобус 512",
    },
    "food": {
      "deliveryLabel": "Дастаўка ежы",
      "delivery": {
        "lead": "Усе пяць сэрвісаў працуюць па ўсім Гданьску. Выберы спосаб аплаты, каб убачыць, хто яго прымае.",
      },
      "pay": "Спосаб аплаты",
      "unconfirmed": "афіцыйна не пацверджана",
      "bolt": {
        "note": "гатоўка пры атрыманні",
      },
      "note": "Калі спосабу ў сэрвіса няма, гэта значыць, што афіцыйныя старонкі яго не пацвярджаюць, а не што ён забаронены.",
      "city": "Аплата ў горадзе",
      "cards": {
        "title": "Карткі і гатоўка",
        "meta": "Visa, Mastercard, злотыя",
        "text": "Бескантактавыя Visa і Mastercard — асноўны спосаб аплаты ў дастаўцы і ў крамах. Гатоўку ў злотых прымаюць толькі там, дзе гэта яўна пазначана. Афіцыйнага абяцання, што карткі ці гатоўку прымаюць паўсюль, няма: дзейныя спосабы пазначаныя на тэрмінале і на касе.",
      },
      "blik": {
        "title": "BLIK",
        "meta": "Польскі мабільны плацёж",
        "need": "Патрэбны рахунак у польскім банку-ўдзельніку і мабільная праграма банка.",
        "online": {
          "title": "У інтэрнэце",
          "text": "Увядзі аднаразовы шасцізначны код з праграмы і пацвердзі.",
        },
        "till": {
          "title": "На касе",
          "text": "Плаці бескантактава з праграмы або ўвядзі той самы код на тэрмінале.",
        },
        "more": "BLIK таксама пераводзіць грошы па нумары тэлефона і здымае гатоўку ў банкамаце без карткі.",
      },
    },
    "pay": {
      "any": "Любы",
      "card": "Картка",
      "blik": "BLIK",
      "cash": "Гатоўка",
      "apple": "Apple Pay",
      "google": "Google Pay",
      "paypal": "PayPal",
    },
    "card": {
      "title": "Gdańska Karta Turysty",
      "lead": "Картка з бясплатнымі ўваходамі. Цэны на лістапад 2026.",
      "duration": "Тэрмін дзеяння",
      "hours": (n: number) => `${n} г`,
      "odkrywca": {
        "entries": "13 бясплатных уваходаў",
        "list": "Сярод іх: Ратуша Галоўнага горада, Музей бурштыну, Hevelianum, заапарк і Нацыянальны марскі музей.",
      },
      "premium": {
        "entries": "23 бясплатныя ўваходы",
        "list": "Усё з Odkrywca, а таксама Двор Артуса, Музей Другой сусветнай вайны, Еўрапейскі цэнтр салідарнасці, Żuraw і іншае.",
      },
      "smaki": "Smaki Gdańska Duet — кулінарны пакет на дваіх, дзейнічае 30 дзён.",
      "transport": {
        "title": "Дадаць транспарт",
        "meta": "Bilet Metropolitalny",
        "text": "Транспарт купляецца асобна ад карткі: аўтобусы, трамваі, цягнікі SKM і POLREGIO ў метраполіі. Картку і білет можна актываваць у розныя дні.",
      },
      "freeHeading": "Бясплатныя дні музеяў без карткі",
      "day": "Дзень тыдня",
      "free": {
        "badge": "бясплатна",
      },
      "closed": {
        "badge": "закрыта",
      },
      "mon": {
        "gdanska": "Ратуша Галоўнага горада, Двор Артуса і Дом Уфагена 10:00 – 16:00, Музей бурштыну 10:00 – 18:00.",
        "ww2": "Па панядзелках звычайна закрыты.",
      },
      "tue": {
        "ww2": "Усе выставы. Білет за 0 zł выдаюць толькі ў касе ў дзень наведвання, не пазней як за гадзіну да закрыцця; забраніраваць бясплатны білет онлайн нельга.",
        "gdanska": "Асноўныя аддзелы па аўторках закрытыя.",
      },
      "other": "У гэты дзень сталага бясплатнага ўваходу ў гэтых двух музеях няма.",
      "notice": "У бясплатны дзень частка часовых выстаў можа не працаваць, а ў дзяржаўныя і царкоўныя святы музеі мяняюць расклад. Правярай афіцыйную старонку кожнага музея.",
    },
    "museum": {
      "gdanska": "Muzeum Gdańska",
      "ww2": "Музей Другой сусветнай вайны",
    },
    "day": {
      "1": "пн",
      "2": "аўт",
      "3": "ср",
      "4": "чц",
      "5": "пт",
      "6": "сб",
      "7": "нд",
    },
    "links": {
      "airportBuses": "Аўтобусы ў аэрапорт і назад — airport.gdansk.pl",
      "airportTrains": "Цягнікі ў аэрапорт і назад — airport.gdansk.pl",
      "ztmSchedule": "Расклады ZTM Гданьска",
      "ztmTickets": "Білеты ZTM Гданьска",
      "skmSearch": "Пошук рэйсаў SKM",
      "jakdojade": "Jakdojade — планаванне паездак і білеты",
      "mzkzg": "Метрапалітальныя білеты MZKZG",
      "visitGdanskMap": "Афіцыйная мапа цэнтра Гданьска (PDF)",
      "kartaTurysty": "Karta Turysty — пакеты і цэны",
      "muzeumGdanska": "Muzeum Gdańska — бясплатны ўваход",
      "muzeum1939": "Музей Другой сусветнай вайны — правілы наведвання",
      "pysznePayment": "Аплата ў Pyszne.pl",
      "blikHow": "Як карыстацца BLIK — blik.com",
    },
  },
  "en": {
    "wheel": {
      "label": "Guide sections",
    },
    "tab": {
      "airport": "Airport",
      "transport": "Transport and tickets",
      "city": "What’s where",
      "food": "Food and payment",
      "card": "Card and museums",
    },
    "head": {
      "airport": "To and from the airport",
      "transport": "Getting around",
      "city": "What’s where in the city",
      "food": "Food and payment",
      "card": "Tourist card and free museum days",
    },
    "verified": "Checked on 10 November 2026",
    "sources": {
      "title": "Official pages",
      "note": "Timetables, prices and opening hours change. Links open in the browser and need a connection; the guide itself works offline.",
    },
    "link": {
      "failed": (url: string) => `Could not open the page. Its address: ${url}`,
    },
    "u": {
      "aboutMin": (n: number) => `about ${n} min`,
      "everyWeekdays": (n: number) => `every ${n} min on weekdays`,
      "hourly": "hourly",
      "aboutHourly": "about hourly",
      "reduced": (price: string) => `reduced ${price}`,
      "decimal": ".",
    },
    "sr": {
      "bus": "Bus",
      "night": "Night bus",
      "train": "Train",
    },
    "air": {
      "dirLabel": "Direction",
      "dirFrom": "From the airport",
      "dirTo": "To the airport",
      "from": {
        "s1": {
          "title": "Leave the terminal",
          "text": "Bus stops are across from the terminal, next to car park P1. A covered walkway leads to the train station Gdańsk Port Lotniczy.",
          "stop01": "Port Lotniczy 01 — to the centre",
          "stop02": "Port Lotniczy 02 — to Wrzeszcz",
        },
      },
      "to": {
        "s1": {
          "title": "Get to your stop",
          "text": "Bus 210 leaves the centre from the stop Dworzec Główny 10 on Podwale Grodzkie street; bus 110 leaves from Gdańsk Wrzeszcz.",
        },
      },
      "s2": {
        "title": "Pick your ride",
      },
      "s3": {
        "title": "Get a ticket",
      },
      "ticket": {
        "bus": {
          "title": "Bus: a ZTM ticket",
          "where": "Buy it in the Jakdojade or FALA app, or pay by card at the FALA device on board.",
        },
        "train": {
          "title": "Train: a separate rail ticket",
          "where": "The city ZTM ticket is not valid on the train. Buy a rail ticket at the platform machine or in the Polregio, Jakdojade or FALA app.",
        },
      },
      "notice": "Until 12 December 2026 trains run on a temporary timetable; the regular one starts on 13 December 2026. Bus timetables change with the season — check the live timetable before you go.",
    },
    "ride": {
      "110": {
        "from": "To Gdańsk Wrzeszcz",
        "to": "From Gdańsk Wrzeszcz",
        "also": "Bus 120 runs between the airport and Łostowice Świętokrzyska.",
      },
      "210": {
        "from": "To the city centre",
        "to": "From the city centre",
      },
      "n3": {
        "from": "At night: centre and Wrzeszcz",
        "to": "At night: from the centre and Wrzeszcz",
        "when": "every night, 23:00 – 04:00",
        "toCentre": "From Port Lotniczy 01 at 23:15, 00:06, 01:15 and on; about 50 min.",
        "toWrzeszcz": "From Port Lotniczy 02; about 20 min.",
        "route": "Dworzec Główny ⇄ airport ⇄ Gdańsk Wrzeszcz. It does not go to Sopot or Gdynia.",
      },
      "train": {
        "from": "Train to Gdańsk Wrzeszcz",
        "to": "Train from Gdańsk Wrzeszcz",
        "change": "Direct trains to Gdańsk Główny exist, but more often you change at Gdańsk Wrzeszcz: from platform 3 take the SKM towards the centre.",
        "line": "Gdańsk Wrzeszcz – Gdańsk Port Lotniczy – Osowa. Direct trains between Gdańsk Główny and the airport exist, but more often you change at Gdańsk Wrzeszcz.",
        "operator": "POLREGIO. The SKM does not serve the airport station.",
      },
    },
    "row": {
      "stop": "Stop",
      "firstLast": "First and last",
      "sunday": "On Sundays",
      "centreStops": "Stops in the centre",
      "also": "Also",
      "route": "Route",
      "toCentre": "To the centre",
      "toWrzeszcz": "To Wrzeszcz",
      "operator": "Operator",
    },
    "tk": {
      "75": "75 minutes",
      "singleRide": "One ride",
      "single": {
        "phone": "One ride, in the phone",
        "paper": "One ride, paper",
      },
      "day24": "24 hours",
      "24h": {
        "two": "24 hours, two operators",
        "all": "24 hours, all operators",
      },
      "72h": "72 hours",
      "night": "Night buses cost the same.",
    },
    "tr": {
      "modes": "What to ride",
      "ztm": {
        "title": "Buses and trams",
        "meta": "ZTM · around Gdańsk",
        "text": "The city’s main transport, also serving neighbouring communes. Sopot and Gdynia run their own ZKM networks. One shared fare for the whole area is kept by the MZKZG union: its tickets are valid in Gdańsk and in the neighbouring towns.",
      },
      "skm": {
        "title": "SKM train",
        "meta": "To Sopot and Gdynia",
        "text": "The main line Gdynia – Sopot – Gdańsk. On weekdays trains run roughly every 10–15 minutes; exact times are in the timetable.",
        "warn": "ZTM single tickets are not valid on trains. Take an MZKZG ticket “with trains” or an SKM ticket.",
      },
      "rail": {
        "title": "POLREGIO trains",
        "meta": "Airport, Malbork and beyond",
        "text": "POLREGIO runs the PKM line to the airport (Gdańsk Wrzeszcz – Gdańsk Port Lotniczy – Osowa) and regional trains to Malbork, Słupsk and Kartuzy. Timetable and tickets: polregio.pl.",
      },
      "prices": "Tickets and prices",
      "zoneLabel": "Where the ticket is valid",
      "zone": {
        "ztm": "Gdańsk",
        "metro": "Tricity",
        "rail": "With trains",
      },
      "zoneNote": {
        "ztm": "ZTM Gdańsk tickets: buses and trams of the city network.",
        "metro": "MZKZG metropolitan tickets: city transport in Gdańsk, Sopot, Gdynia and Wejherowo.",
        "rail": "MZKZG tickets that are also valid on trains.",
      },
      "activate": "How to activate a ticket",
      "act": {
        "paper": {
          "title": "Paper ticket with a QR code",
          "text": "Scan it on board at the FALA device: hold the ticket under the device, 10–15 cm away, until the signal sounds and “Bilet aktywny” appears. Or stamp it in the validator.",
        },
        "mobile": {
          "title": "Mobile ticket in Jakdojade",
          "text": "It activates at the moment of purchase, so buy it right after you board.",
        },
        "valid": {
          "title": "How long it lasts",
          "text": "One ride — until you get off. 75 minutes, 24 and 72 hours — counted from activation.",
        },
      },
      "buyLabel": "Where to buy",
      "buy": {
        "fala": {
          "title": "FALA app",
          "text": "The widest choice, rail tickets included.",
        },
        "apps": {
          "title": "Jakdojade and other apps",
          "text": "Metropolitan tickets: Jakdojade, GoPay, moBilet, mPay, SkyCash, zBiletem.",
        },
        "board": {
          "title": "On board",
          "text": "FALA devices, cashless payment only.",
        },
        "desk": {
          "title": "Ticket offices and kiosks",
          "text": "SKM and ZTM ticket offices, kiosks and post offices.",
        },
      },
      "tip": {
        "card": "With a payment card you can ride without a ticket bought in advance: the FALA system picks the fare itself.",
        "kompas": "The SKM KomPas app keeps the train timetable offline.",
      },
    },
    "city": {
      "pick": "Places on the schematic",
      "caption": "A schematic with approximate proportions, not a map. The exact map of the centre is in the link below.",
      "sea": "Baltic Sea",
      "get": "How to get there",
      "summer": "In summer, beach services run more often.",
      "motlawa": "Motława",
    },
    "kind": {
      "centre": "Historic centre",
      "quarter": "Historic quarter",
      "station": "Main station",
      "district": "District",
      "beach": "Beach",
      "island": "Island and beach",
    },
    "place": {
      "glowne": "The tourist heart of Gdańsk on the Motława river: Długa and Długi Targ streets, the Neptune Fountain, the Town Hall, St Mary’s Church and the Crane.",
      "stare": "A separate historic quarter north of Główne Miasto, with St Catherine’s Church and the Great Mill. Its name means “old town”, but the famous sights are in Główne Miasto.",
      "station": "The main railway station. Its tunnels lead out to the tram stops. The rail stop closest to the centre is Gdańsk Śródmieście on the SKM line.",
      "wrzeszcz": "The most populous residential district: shops and cafés, villas from the late 19th century, and Wajdeloty street at its heart.",
      "oliwa": "The Cistercian cathedral with its famous organ (concerts; an international organ festival in July and August), Adam Mickiewicz Park and the largest zoo in Poland by area.",
      "brzezno": "The most popular city beach.",
      "jelitkowo": "A family beach near the border with Sopot.",
      "stogiBeach": "A wide, quiet beach.",
      "stogi": {
        "warn": "Siennicki bridge is closed and trams are cut short until 2027, so take the bus.",
      },
      "sobieszewo": "The “wild” green end of the city, with bird reserves.",
    },
    "get": {
      "glowne": "about 10 min on foot from Gdańsk Główny",
      "station": {
        "walk": "about 10 min on foot to Główne Miasto",
        "skm": "SKM: Gdańsk Śródmieście is closer to the centre",
      },
      "wrzeszcz": "SKM or train to Gdańsk Wrzeszcz",
      "oliwa": {
        "tram": "tram 5, also 6",
        "skm": "SKM to Gdańsk Oliwa",
      },
      "brzezno": "tram 3 to Brzeźno Dom Zdrojowy",
      "jelitkowo": "trams 2 and 4",
      "stogi": "bus T8 or 158",
      "sobieszewo": "bus 512",
    },
    "food": {
      "deliveryLabel": "Food delivery",
      "delivery": {
        "lead": "All five services deliver across Gdańsk. Pick a way to pay to see who takes it.",
      },
      "pay": "Way to pay",
      "unconfirmed": "not confirmed officially",
      "bolt": {
        "note": "cash on delivery",
      },
      "note": "A method missing from a service means its official pages do not confirm it — not that it is refused.",
      "city": "Paying around town",
      "cards": {
        "title": "Cards and cash",
        "meta": "Visa, Mastercard, złoty",
        "text": "Contactless Visa and Mastercard are the main way to pay for delivery and in shops. Cash in złoty is accepted only where it is clearly marked. There is no official promise that cards or cash work everywhere: the accepted methods are shown at the terminal and at the till.",
      },
      "blik": {
        "title": "BLIK",
        "meta": "Polish mobile payment",
        "need": "You need an account at a participating Polish bank and the bank’s mobile app.",
        "online": {
          "title": "Online",
          "text": "Enter the one-time six-digit code from the app and confirm.",
        },
        "till": {
          "title": "At the till",
          "text": "Pay contactless from the app, or type the same code on the terminal.",
        },
        "more": "BLIK also sends money to a phone number and withdraws cash at an ATM without a card.",
      },
    },
    "pay": {
      "any": "Any",
      "card": "Card",
      "blik": "BLIK",
      "cash": "Cash",
      "apple": "Apple Pay",
      "google": "Google Pay",
      "paypal": "PayPal",
    },
    "card": {
      "title": "Gdańska Karta Turysty",
      "lead": "A pass with free entries. Prices for November 2026.",
      "duration": "Valid for",
      "hours": (n: number) => `${n} h`,
      "odkrywca": {
        "entries": "13 free entries",
        "list": "Among them: the Main Town Hall, the Amber Museum, Hevelianum, the zoo and the National Maritime Museum.",
      },
      "premium": {
        "entries": "23 free entries",
        "list": "Everything in Odkrywca plus Artus Court, the Museum of the Second World War, the European Solidarity Centre, the Crane and more.",
      },
      "smaki": "Smaki Gdańska Duet — a food pass for two, valid for 30 days.",
      "transport": {
        "title": "Add transport",
        "meta": "Bilet Metropolitalny",
        "text": "Transport is bought on top of the pass: buses, trams, SKM and POLREGIO trains in the metropolitan area. The pass and the ticket can be activated on different days.",
      },
      "freeHeading": "Free museum days without the card",
      "day": "Day of the week",
      "free": {
        "badge": "free",
      },
      "closed": {
        "badge": "closed",
      },
      "mon": {
        "gdanska": "Main Town Hall, Artus Court and Uphagen House 10:00 – 16:00, Amber Museum 10:00 – 18:00.",
        "ww2": "Usually closed on Mondays.",
      },
      "tue": {
        "ww2": "All exhibitions. The 0 zł ticket is issued only at the ticket desk on the day of the visit, no later than an hour before closing; free tickets cannot be booked online.",
        "gdanska": "The main branches are closed on Tuesdays.",
      },
      "other": "These two museums have no regular free entry on this day.",
      "notice": "On a free day some temporary exhibitions may be closed, and on public and church holidays museums change their hours. Check each museum’s official page.",
    },
    "museum": {
      "gdanska": "Muzeum Gdańska",
      "ww2": "Museum of the Second World War",
    },
    "day": {
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
      "7": "Sun",
    },
    "links": {
      "airportBuses": "Buses to and from the airport — airport.gdansk.pl",
      "airportTrains": "Trains to and from the airport — airport.gdansk.pl",
      "ztmSchedule": "ZTM Gdańsk timetables",
      "ztmTickets": "ZTM Gdańsk tickets",
      "skmSearch": "SKM connection search",
      "jakdojade": "Jakdojade — trip planner and tickets",
      "mzkzg": "MZKZG metropolitan tickets",
      "visitGdanskMap": "Official map of central Gdańsk (PDF)",
      "kartaTurysty": "Karta Turysty — packages and prices",
      "muzeumGdanska": "Muzeum Gdańska — free entry",
      "muzeum1939": "Museum of the Second World War — visiting rules",
      "pysznePayment": "Payment in Pyszne.pl",
      "blikHow": "How to use BLIK — blik.com",
    },
  },
};
