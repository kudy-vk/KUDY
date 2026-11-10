# Каталог дызайну KUDY

Адна старонка, дзе відаць увесь дызайн: які экран ёсць у дадатку, які макет для яго апошні, што прынята ўладальнікам і што яшчэ чакае рашэння. Стан крыніц — main `a985b72` (2026-11-10).

Каталог нічога не ўхваляе. Рашэнні запісаныя ў [рэестры рашэнняў](brand/decisions.md) і ў вердыктах уладальніка ў issues; правілы выгляду — у [візуальным каноне](visual-language.md). Калі каталог разыходзіцца з імі, слушныя яны, а каталог трэба паправіць.

Статусы:

- **Прынята** — ёсць запісанае рашэнне ўладальніка.
- **Часткова** — прынятая толькі названая частка.
- **Прапанова** — макет ёсць, вердыкту няма.
- **Гісторыя** — адхілена або заменена пазнейшым матэрыялам.
- **Няма макета** — экран ёсць толькі ў кодзе або толькі ў плане.

## 1. Аснова

| Дакумент | Што задае | Статус |
|---|---|---|
| [Візуальны канон](visual-language.md) | Колеры, шрыфты, інтэрвалы, карткі, кнопкі, маркеры, панэль Run | Прынята |
| [Цёмная тэма](dark-theme.md) | Цёмныя значэнні і паводзіны тэмы | Прынята (DT-1…DT-6) |
| [Схемы экранаў і пераходаў](screens-and-transitions.md) | Адкуль і куды вядзе кожны экран, станы | Прынята; уваход апісаны праз Explore — гл. раздзел 5 |
| [Рэестр рашэнняў](brand/decisions.md) | Рашэнні ўладальніка з датамі | Дзейны рэестр |
| [Брыф «Атлас знаходак»](brand/atlas-brief.md) | Характар і сэнс брэнда | Прынятая аснова (B01–B03) |
| [Сінтэз патрабаванняў 17.10](brand/2026-10-17-requirements-synthesis.md) | Зводка патрабаванняў да дызайну | Часткова: D1–D4 |
| [Канцэпцыя налад](settings/2026-10-17-settings-concept.md) | Блокі экрана налад | Часткова: S1–S3 |

## 2. Экраны

| Экран | У дадатку | Апошні макет | Статус макета | Адкрыта |
|---|---|---|---|---|
| Застаўка з анімацыяй | [app/index.tsx](../../app/index.tsx), [animated-splash.tsx](../../components/animated-splash.tsx) | [Канон §3](visual-language.md) | Прынята 2026-10-28 | Шрыфт надпісу — працоўны |
| Галоўнае меню | [app/menu.tsx](../../app/menu.tsx), [city-map-menu.tsx](../../components/city-map-menu.tsx) | [Пяць частак карты](brand/outputs/menu-map-city-only/README.md), [свячэнне](brand/outputs/menu-glow-options/README.md), [подпісы і станы](brand/outputs/MAP-05/specimen.html) | Часткова: пяць частак, бурштынавае свячэнне, тры актыўныя і дзве неактыўныя часткі ([#42](https://github.com/kudy-vk/KUDY/issues/42)); раскладка — M1 | Іконкі замест подпісаў; перацягванне і зборка ў дадатку ([#84](https://github.com/kudy-vk/KUDY/issues/84)); футэр ([#97](https://github.com/kudy-vk/KUDY/issues/97)) |
| Гіды | [app/city/[id]/guides.tsx](../../app/city/%5Bid%5D/guides.tsx) | [Каталог гідаў](brand/outputs/GUIDES-catalog/README.md) | Прапанова | Фільтры, банер, зверка з карткамі Run |
| Прэв'ю гіда | [app/route/[id].tsx](../../app/route/%5Bid%5D.tsx) | [G25.07](brand/outputs/G25.07/contact-sheet.html), кадры C, D, M, N, O | Прапанова | Кнопка загрузкі і старту ([#100](https://github.com/kudy-vk/KUDY/issues/100)) |
| Run | [app/run/[id].tsx](../../app/run/%5Bid%5D.tsx) | [Карткі паміж кропкамі](brand/outputs/RUN-card-states/README.md); G25.07, кадры F, G, H | Прапанова | Play і Pause ([#98](https://github.com/kudy-vk/KUDY/issues/98)); банер у Run |
| Завяршэнне прагулкі | Асобнага маршруту няма | G25.07, кадр J | Прапанова | — |
| Ацэнка | [app/feedback.tsx](../../app/feedback.tsx) | G25.07, кадр K | Часткова: пяць зорачак замест лічбаў ([#39](https://github.com/kudy-vk/KUDY/issues/39), рэалізацыя — [#102](https://github.com/kudy-vk/KUDY/issues/102)) | Астатні выгляд формы |
| KUDY (гісторыя прагулак) | [app/(tabs)/my.tsx](../../app/%28tabs%29/my.tsx) | G25.07, кадры L, Q | Прапанова | Уваход з меню: частка `kudy` неактыўная |
| Налады | Маршруту няма ([#51](https://github.com/kudy-vk/KUDY/issues/51)) | [Макет налад](settings/settings-sheet.html) | Часткова: іерархія блокаў (S1) | Тэксты радкоў, выгляд |
| Побач | [app/map.tsx](../../app/map.tsx) | G25.07, кадр P | Прапанова | — |
| Чым заняцца | [app/discovery.tsx](../../app/discovery.tsx) | G25.07, кадр B | Прапанова | — |
| Месца | [app/place/[id].tsx](../../app/place/%5Bid%5D.tsx) | Няма макета | — | — |
| Падборка | [app/collection/[id].tsx](../../app/collection/%5Bid%5D.tsx) | Няма макета | — | — |
| Explore | [app/(tabs)/explore.tsx](../../app/%28tabs%29/explore.tsx) | G25.07, кадр A | Гісторыя як уваход: заменены меню ([#42](https://github.com/kudy-vk/KUDY/issues/42), п. 1) | Роля экрана пасля меню |
| Вэб-версія | `web/` | G25.07, кадры W–Z | Адкладзена ўладальнікам ([#96](https://github.com/kudy-vk/KUDY/issues/96)) | Увесь выгляд |

## 3. Агульныя дэталі

| Дэталь | Што ёсць | Статус | Адкрыта |
|---|---|---|---|
| Іконкі інтэрфейсу | У кодзе адзін набор Lucide праз [canon-icon.tsx](../../components/canon-icon.tsx); [інвентар G25.04](../agent-tasks/results/G25.04.md) | Часткова: «пераважна іконкі без бачных подпісаў», стыль выбіраецца па кожным элеменце ([#39](https://github.com/kudy-vk/KUDY/issues/39)) | [#98](https://github.com/kudy-vk/KUDY/issues/98), [#99](https://github.com/kudy-vk/KUDY/issues/99), [#100](https://github.com/kudy-vk/KUDY/issues/100) |
| Шапка: «Назад» і вяртанне да прагулкі | [back-button.tsx](../../components/back-button.tsx), [walk-button.tsx](../../components/walk-button.tsx) | Часткова: прынцып прыняты ([#42](https://github.com/kudy-vk/KUDY/issues/42), п. 6–7) | Выгляд і месца ([#99](https://github.com/kudy-vk/KUDY/issues/99)) |
| Карткі, кнопкі, чыпы | Канон §5; [узоры G25.06](brand/outputs/G25.06/contact-sheet.html) | Часткова: K1–K3 | Паіменны прагляд ([#41](https://github.com/kudy-vk/KUDY/issues/41)) |
| Маркеры мапы | Канон §5; [markers.svg](brand/outputs/G25.06/markers.svg) | Прынята: каляровыя кружкі з тэкставымі станамі ([#39](https://github.com/kudy-vk/KUDY/issues/39), п. 4) | — |
| Кампас | [Макет G25.04](brand/outputs/G25.04/kudy-compass-mock.svg) | Прынята: кампаса няма ў першым рэлізе ([#39](https://github.com/kudy-vk/KUDY/issues/39), п. 1) | — |
| Рэкламны банер | [Даследаванне ADS-01](../agent-tasks/results/ADS-01.md), [дошка](brand/outputs/ADS-01/specimen.html) | Часткова: месца ў меню — M1; рэклама ў дадатку не ўключаная | Інтэграцыя ([#101](https://github.com/kudy-vk/KUDY/issues/101)); банер у Run і ў «Гідах» |
| Колеры гліны і бурштыну | [Дошка G25.01](brand/outputs/G25.01/board.html) | Прапанова (B04.1–B04.3) | [#36](https://github.com/kudy-vk/KUDY/issues/36) |
| Назвы раздзелаў | [Наборы назваў](brand/outputs/G25.02/naming-sets.html), [гласарый](brand/outputs/G25.02/glossary.md) | Часткова: «Мае знаходкі» (B06.1) | [#37](https://github.com/kudy-vk/KUDY/issues/37) |
| Дракон | [Позы G25.03](brand/outputs/G25.03/contact-sheet.html) | Часткова: роля (B02.1, D4) | Позы і падабенства да фігуркі ([#38](https://github.com/kudy-vk/KUDY/issues/38), [#47](https://github.com/kudy-vk/KUDY/issues/47)) |
| Памятныя прадметы | [Узоры G25.05](brand/outputs/G25.05/contact-sheet.html) | Прапанова | [#40](https://github.com/kudy-vk/KUDY/issues/40) |
| Іконка дадатку | `assets/kudy-icon/`; канон §3 | Прынята (2026-10-26, I1) | — |
| Узоры для праверкі выгляду | [baselines](../design-qa/baselines/README.md): картка гіда і Explore | Знятыя, уладальнікам не ўхваленыя | [#87](https://github.com/kudy-vk/KUDY/issues/87) |

## 4. Папкі з матэрыяламі

Усе папкі ляжаць у `docs/design/brand/outputs/`.

| Папка | Што ўнутры | Статус |
|---|---|---|
| [menu-map-city-only](brand/outputs/menu-map-city-only/README.md) | Пяць частак карты, зборка, кампанент для дадатку | Прынята: абводка ўладальніка 2026-10-31 |
| [menu-glow-options](brand/outputs/menu-glow-options/README.md) | Пяць варыянтаў свячэння пасля зборкі | Прынята: варыянт 1, бурштынавы |
| [MAP-05](brand/outputs/MAP-05/specimen.html) | Подпісы, іконкі і станы частак меню | Прапанова |
| [MAP-03](brand/outputs/MAP-03/README.md) | Геаметрыя частак і яе праверка | Тэхнічны вынік, змержаны |
| [MAP-02](brand/outputs/MAP-02/WORK-ASSET.md) | Карта-аснова, выразка, вектар | Працоўны асет; дакладнасць карты і перыяд адкрытыя |
| [ADS-01](brand/outputs/ADS-01/specimen.html) | Дзве раскладкі банера пад меню | Гісторыя ў частцы раскладкі: заменена M1 |
| [GUIDES-catalog](brand/outputs/GUIDES-catalog/README.md) | Экран «Гіды» | Прапанова |
| [RUN-card-states](brand/outputs/RUN-card-states/README.md) | Карткі Run паміж кропкамі | Прапанова |
| [G25.07](brand/outputs/G25.07/contact-sheet.html) | Макеты асноўных экранаў, тэлефон і вэб | Часткова: гл. раздзел 2; вэб адкладзены |
| [G25.06](brand/outputs/G25.06/contact-sheet.html) | Кампаненты і іх станы | Часткова: K1–K3 |
| [G25.05](brand/outputs/G25.05/contact-sheet.html) | Памятныя прадметы і іх станы | Прапанова |
| [G25.04](brand/outputs/G25.04/contact-sheet.html) | Іконкі і кампас | Часткова: вердыкт у [#39](https://github.com/kudy-vk/KUDY/issues/39) |
| [G25.03](brand/outputs/G25.03/contact-sheet.html) | Позы і голас дракона | Часткова: роля |
| [G25.02](brand/outputs/G25.02/naming-sets.html) | Назвы меню і слоўнік | Часткова: B06.1 |
| [G25.01](brand/outputs/G25.01/board.html) | Колеры, шрыфты, матэрыял | Прапанова: B04.1–B04.3 |
| [G25.09](brand/outputs/G25.09/README.md) | Шаблоны для крам, сацсетак, QR | Прапанова ([#43](https://github.com/kudy-vk/KUDY/issues/43)) |
| [G24.02](brand/outputs/G24.02/compare.html) | Кандыдаты іконкі дадатку | Гісторыя: іконка прынятая асобна (канон §3) |
| [icon-directions-2026-10-17](brand/outputs/icon-directions-2026-10-17/README.md) | Шэсць набораў іконак, цёмныя і светлыя галоўныя экраны | Чарнавікі, не зацверджаныя (пазнака заснавальніка 20.10) |
| [2026-10-17-style-exploration](brand/outputs/2026-10-17-style-exploration/README.md) | Агульная дошка стылю 01 | Эскіз; паіменныя высновы чакаюць ([#44](https://github.com/kudy-vk/KUDY/issues/44)) |
| [brand-splash-directions-2026-10-19](brand/outputs/brand-splash-directions-2026-10-19/README.md) | Дзесяць напрамкаў уваходу | Гіпотэзы; выбар аднаго з дзесяці не запісаны, прыняты ўваход — застаўка з анімацыяй |
| [brand-entry-2026-10-19](brand/outputs/brand-entry-2026-10-19/README.md) | Пара экранаў уваходу | Гісторыя: заменена дзесяццю напрамкамі |
| [app-entry-2026-10-19](brand/outputs/app-entry-2026-10-19/README.md) | Гарадскія напрамкі заставы | Гісторыя: адхілена |
| [mobile-welcome-2026-10-19](brand/outputs/mobile-welcome-2026-10-19/README.md) | Восем сцэн-ілюстрацый для гіда | Параўнанне ілюстрацый; выбар не запісаны |

Па-за `docs/design/` ёсць яшчэ папка `spikes/` з раннімі прататыпамі (`G06.08-prototype`, `MAP-07-tap-drag`, `2026-09-29-style-showcase.html`). У гэтым праходзе яна не разбіралася.

## 5. Разыходжанні

Месцы, дзе матэрыялы супярэчаць адно аднаму або запіс адстаў ад рашэння.

1. **Вердыкты 2026-11-02 няма ў рэестры.** Рашэнні пра галоўны экран ([#42](https://github.com/kudy-vk/KUDY/issues/42)) і пра іконкі ([#39](https://github.com/kudy-vk/KUDY/issues/39)) запісаныя толькі ў issues, у [рэестры рашэнняў](brand/decisions.md) іх няма.
2. **Уваход апісаны па-старому.** Канон §3 і [схемы экранаў](screens-and-transitions.md) кажуць, што пасля заставы адкрываецца Explore. У дадатку пасля заставы адкрываецца меню.
3. **Explore і KUDY без уваходу з меню.** Меню вядзе ў «Побач», «Гіды» і «Чым заняцца». Explore адкрываецца толькі са старонкі памылкі, KUDY — з прэв'ю гіда.
4. **Радок B05 у рэестры адстаў.** Ён называе форму іконкі і месца кампаса адкрытымі; іконка дадатку прынятая, кампаса ў першым рэлізе няма.
5. **Знак кампаса ў меню.** Часткі «Чым заняцца» і `kudy` у кодзе маюць аднолькавы знак `compass`. Трэба вырашыць, ці не супярэчыць гэта вердыкту «кампаса няма» і ці могуць дзве часткі мець адзін знак.
6. **Раскладка банера змянілася.** 2026-11-02 была выбраная раскладка «банер і футэр ад ніза экрана»; M1 ставіць банер адразу пад часткамі карты. Дошка ADS-01, [#106](https://github.com/kudy-vk/KUDY/issues/106) і [#97](https://github.com/kudy-vk/KUDY/issues/97) апісваюць ранейшую раскладку.
7. **Макеты «Гіды» і Run зробленыя асобна.** Макет Run бярэ іконкі Lucide з сеткі, макет «Гіды» нясе ўсё ў сабе. Шапка, картка, фота і зона банера паміж імі не звераныя.
8. **Шэсць набораў іконак супраць аднаго ў кодзе.** Чарнавыя наборы 17.10 не выбраныя; дадатак малюе Lucide.
