# Каталог дызайну KUDY

Адна старонка, дзе відаць увесь дызайн: які экран ёсць у дадатку, які макет для яго апошні, што прынята ўладальнікам і што яшчэ чакае рашэння. Стан крыніц — main `a985b72` (2026-11-10).

Паглядзець і паклікаць макеты можна ў [галерэі](catalog.html). Яна чытае гэты файл, таму запусці з кораня рэпазіторыя просты сервер і адкрый `http://127.0.0.1:4400/docs/design/catalog.html`:

```sh
python -m http.server 4400 --bind 127.0.0.1
```

Фінальныя макеты, якія ідуць ва ўкараненне, ляжаць у папцы [production](production/README.md).

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

## Раздзелы галоўнага меню

Якую задачу вырашае кожны раздзел. Канчатковая раскладка меню і месца для «Пра горад» яшчэ адкрытыя.

- **Гіды** — выбар аўдыяпрагулкі: маршрут, працягласць, кропка старту і запуск.
- **Побач** — што цікавага вакол мяне зараз: мапа бліжэйшых знаходак, кароткія гісторыі і падказкі, на што паглядзець на месцы.
- **Чым заняцца** — асобны раздзел, які напаўняецца кантэнтам. На першым экране прапануюцца гатовыя аўтарскія планы пад сітуацыю, а час, тэма і сезон дапамагаюць удакладніць выбар. Першы прыклад ужо ёсць — «Гданьск за паўдня»: аўдыяпрагулка і прыпынак у манастыры, 65–100 хвілін з пераходам. «Гадзіна да цягніка» і «Што рабіць у дождж» — ідэі для напаўнення. «Падборка» адкрывае падрабязнасці канкрэтнага плана ўнутры гэтага раздзела.
- **Пра горад** — практычны даведнік у асобным раздзеле з каруселлю: «Аэрапорт», «Транспарт і білеты», «Дзе што ў горадзе», «Побач з горадам». У апісанне ўваходзяць Мальбарк, аплата і карысныя праграмы, бясплатныя дні музеяў і пацверджаныя перавагі турыстычнай карты. Асноўная даведка задумана даступнай без сеткі, а актуальныя расклады і квіткі адкрываюцца ў афіцыйных сэрвісах. Збор і праверка матэрыялаў — [#200](https://github.com/kudy-vk/KUDY/issues/200), дызайн і напаўненне экрана — [#202](https://github.com/kudy-vk/KUDY/issues/202).

Прапанова агента, якая чакае вердыкту: усё, што мае месца ў горадзе, паказваецца на адной мапе ў «Побач» са слаямі, а не на асобных мапах у кожным раздзеле. Слаі пераключаюцца значкамі на мапе: пачаткі маіх маршрутаў з пазнакай платнага, месцы; новы від кропак (кавярні, аглядныя пляцоўкі) дадаецца яшчэ адным значком. Іншыя раздзелы адкрываюць гэтую ж мапу з патрэбным слоем.

## 2. Экраны

| Экран | У дадатку | Апошні макет | Статус макета | Адкрыта |
|---|---|---|---|---|
| Застаўка з анімацыяй | [app/index.tsx](../../app/index.tsx), [animated-splash.tsx](../../components/animated-splash.tsx) | [Канон §3](visual-language.md) | Прынята 2026-10-28 | Шрыфт надпісу — працоўны |
| Галоўнае меню | [app/menu.tsx](../../app/menu.tsx), [city-map-menu.tsx](../../components/city-map-menu.tsx) | [Фінальны макет](production/menu.html), [пяць частак карты](brand/outputs/menu-map-city-only/index.html), [свячэнне](brand/outputs/menu-glow-options/index.html), [подпісы і станы](brand/outputs/MAP-05/specimen.html) | Часткова: пяць частак, бурштынавае свячэнне, тры актыўныя і дзве неактыўныя часткі ([#42](https://github.com/kudy-vk/KUDY/issues/42)); раскладка і тэксты — M1, M2 | Вердыкт па фінальным макеце; перацягванне і зборка ў дадатку ([#84](https://github.com/kudy-vk/KUDY/issues/84)); футэр ([#97](https://github.com/kudy-vk/KUDY/issues/97)) |
| Гіды | [app/city/[id]/guides.tsx](../../app/city/%5Bid%5D/guides.tsx) | [Фінальны макет](production/guides.html), [Каталог гідаў](brand/outputs/GUIDES-catalog/prototype.html) | Прапанова | Фільтры, банер, зверка з карткамі Run |
| Прэв'ю гіда | [app/route/[id].tsx](../../app/route/%5Bid%5D.tsx) | [Фінальны макет](production/preview.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадры C, D, M, N, O | Прапанова | Кнопка загрузкі і старту ([#100](https://github.com/kudy-vk/KUDY/issues/100)) |
| Run | [app/run/[id].tsx](../../app/run/%5Bid%5D.tsx) | [Фінальны макет](production/run.html), [Карткі паміж кропкамі](brand/outputs/RUN-card-states/prototype.html); [G25.07](brand/outputs/G25.07/contact-sheet.html), кадры F, G, H | Прапанова | Play і Pause ([#98](https://github.com/kudy-vk/KUDY/issues/98)); банер у Run |
| Завяршэнне прагулкі | Асобнага маршруту няма | [Фінальны макет](production/end.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадр J | Прапанова | — |
| Ацэнка | [app/feedback.tsx](../../app/feedback.tsx) | [Фінальны макет](production/feedback.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадр K | Часткова: пяць зорачак замест лічбаў ([#39](https://github.com/kudy-vk/KUDY/issues/39), рэалізацыя — [#102](https://github.com/kudy-vk/KUDY/issues/102)) | Астатні выгляд формы |
| KUDY (гісторыя прагулак) | [app/(tabs)/my.tsx](../../app/%28tabs%29/my.tsx) | [Фінальны макет](production/my.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадры L, Q | Прапанова | Уваход з меню: частка `kudy` неактыўная |
| Налады | Маршруту няма ([#51](https://github.com/kudy-vk/KUDY/issues/51)) | [Фінальны макет](production/settings.html), [Макет налад](settings/settings-sheet.html) | Часткова: іерархія блокаў (S1) | Тэксты радкоў, выгляд |
| Побач | [app/map.tsx](../../app/map.tsx) | [Фінальны макет](production/nearby.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадр P | Прапанова | — |
| Чым заняцца | [app/discovery.tsx](../../app/discovery.tsx) | [Фінальны макет](production/discovery.html), [G25.07](brand/outputs/G25.07/contact-sheet.html), кадр B | Прапанова | Гатовыя аўтарскія планы на першым экране — кірунак напаўнення |
| Месца | [app/place/[id].tsx](../../app/place/%5Bid%5D.tsx) | [Фінальны макет](production/place.html) | Прапанова | — |
| Падборка | [app/collection/[id].tsx](../../app/collection/%5Bid%5D.tsx) | [Фінальны макет](production/collection.html) | Прапанова | Гэта падрабязнасці канкрэтнага плана ўнутры «Чым заняцца», не асобны раздзел |
| Пра горад | Экрана няма | Няма макета | Запланаваны: дызайн і ўкараненне пачнуцца пасля мержу каталога ў main ([#201](https://github.com/kudy-vk/KUDY/issues/201)) і гатоўнасці матэрыялаў | Матэрыялы [#200](https://github.com/kudy-vk/KUDY/issues/200), дызайн [#202](https://github.com/kudy-vk/KUDY/issues/202) |
| Explore | [app/(tabs)/explore.tsx](../../app/%28tabs%29/explore.tsx) | [G25.07](brand/outputs/G25.07/contact-sheet.html), кадр A | Гісторыя як уваход: заменены меню ([#42](https://github.com/kudy-vk/KUDY/issues/42), п. 1) | Роля экрана пасля меню |
| Вэб-версія | `web/` | [G25.07](brand/outputs/G25.07/contact-sheet.html), кадры W–Z | Адкладзена ўладальнікам ([#96](https://github.com/kudy-vk/KUDY/issues/96)) | Увесь выгляд |

## 3. Агульныя дэталі

| Дэталь | Што ёсць | Статус | Адкрыта |
|---|---|---|---|
| Іконкі інтэрфейсу | У кодзе адзін набор Lucide праз [canon-icon.tsx](../../components/canon-icon.tsx); [інвентар G25.04](../agent-tasks/results/G25.04.md) | Часткова: «пераважна іконкі без бачных подпісаў», стыль выбіраецца па кожным элеменце ([#39](https://github.com/kudy-vk/KUDY/issues/39)) | [#98](https://github.com/kudy-vk/KUDY/issues/98), [#99](https://github.com/kudy-vk/KUDY/issues/99), [#100](https://github.com/kudy-vk/KUDY/issues/100) |
| Шапка: «Назад» і вяртанне да прагулкі | [back-button.tsx](../../components/back-button.tsx), [walk-button.tsx](../../components/walk-button.tsx) | Часткова: прынцып прыняты ([#42](https://github.com/kudy-vk/KUDY/issues/42), п. 6–7) | Выгляд і месца ([#99](https://github.com/kudy-vk/KUDY/issues/99)) |
| Карткі, кнопкі, чыпы | Канон §5; [узоры G25.06](brand/outputs/G25.06/contact-sheet.html) | Часткова: K1–K3 | Паіменны прагляд ([#41](https://github.com/kudy-vk/KUDY/issues/41)) |
| Маркеры мапы | Канон §5; [markers.svg](brand/outputs/G25.06/markers.svg); знакі станаў у [фінальным макеце Run](production/run.html) | Прынята: каляровыя кружкі з тэкставымі станамі ([#39](https://github.com/kudy-vk/KUDY/issues/39), п. 4); знак стану замест літары — M7 | Сінхранізацыя канона §5 з M7 |
| Кампас | [Макет G25.04](brand/outputs/G25.04/kudy-compass-mock.svg) | Прынята: кампаса няма ў першым рэлізе ([#39](https://github.com/kudy-vk/KUDY/issues/39), п. 1) | — |
| Рэкламны банер | [Даследаванне ADS-01](../agent-tasks/results/ADS-01.md), [дошка](brand/outputs/ADS-01/specimen.html) | Часткова: банер заўсёды ўнізе экрана — M6; рэклама ў дадатку не ўключаная | Інтэграцыя ([#101](https://github.com/kudy-vk/KUDY/issues/101)); на якіх экранах, акрамя галоўнага, «Гідаў» і Run, ёсць банер |
| Колеры гліны і бурштыну | [Дошка G25.01](brand/outputs/G25.01/board.html) | Прапанова (B04.1–B04.3) | [#36](https://github.com/kudy-vk/KUDY/issues/36) |
| Назвы раздзелаў | [Наборы назваў](brand/outputs/G25.02/naming-sets.html), [гласарый](brand/outputs/G25.02/glossary.md) | Часткова: «Мае знаходкі» (B06.1) | [#37](https://github.com/kudy-vk/KUDY/issues/37) |
| Дракон | Прыняты дракон — іконка «медны дракон з абрамленнем» (`assets/kudy-icon/`) і вектарны цмок застаўкі, разабраны на лапы, галаву, вочы і рот (`assets/kudy-splash/dragon-paths.json`); [позы G25.03](brand/outputs/G25.03/contact-sheet.html) — толькі прапановы | Часткова: іконка (2026-10-26), застаўка (2026-10-28), роля (B02.1, D4) | Ці застаецца дракон у дадатку ([#204](https://github.com/kudy-vk/KUDY/issues/204)); калі так — дракон па экранах ([#205](https://github.com/kudy-vk/KUDY/issues/205)), калі не — новы лагатып і застаўка ([#206](https://github.com/kudy-vk/KUDY/issues/206)) |
| Памятныя прадметы | [Узоры G25.05](brand/outputs/G25.05/contact-sheet.html) | Прапанова | [#40](https://github.com/kudy-vk/KUDY/issues/40) |
| Іконка дадатку | `assets/kudy-icon/`; канон §3 | Прынята (2026-10-26, I1) | — |
| Узоры для праверкі выгляду | [baselines](../design-qa/baselines/README.md): картка гіда і Explore | Знятыя, уладальнікам не ўхваленыя | [#87](https://github.com/kudy-vk/KUDY/issues/87) |

## 4. Папкі з матэрыяламі

Усе папкі ляжаць у `docs/design/brand/outputs/`.

| Папка | Што ўнутры | Статус |
|---|---|---|
| [menu-map-city-only](brand/outputs/menu-map-city-only/index.html), [агляд частак](brand/outputs/menu-map-city-only/proof.html), [апісанне](brand/outputs/menu-map-city-only/README.md) | Пяць частак карты, зборка, кампанент для дадатку | Прынята: абводка ўладальніка 2026-10-31 |
| [menu-glow-options](brand/outputs/menu-glow-options/index.html), [апісанне](brand/outputs/menu-glow-options/README.md) | Пяць варыянтаў свячэння пасля зборкі | Прынята: варыянт 1, бурштынавы |
| [MAP-05](brand/outputs/MAP-05/specimen.html) | Подпісы, іконкі і станы частак меню | Прапанова |
| [MAP-03](brand/outputs/MAP-03/README.md) | Геаметрыя частак і яе праверка | Тэхнічны вынік, змержаны |
| [MAP-02](brand/outputs/MAP-02/cutout-preview.html), [апісанне](brand/outputs/MAP-02/WORK-ASSET.md) | Карта-аснова, выразка, вектар | Працоўны асет; дакладнасць карты і перыяд адкрытыя |
| [ADS-01](brand/outputs/ADS-01/specimen.html) | Дзве раскладкі банера пад меню | Гісторыя ў частцы раскладкі: заменена M1 |
| [GUIDES-catalog](brand/outputs/GUIDES-catalog/prototype.html), [апісанне](brand/outputs/GUIDES-catalog/README.md) | Экран «Гіды» | Прапанова |
| [RUN-card-states](brand/outputs/RUN-card-states/prototype.html), [апісанне](brand/outputs/RUN-card-states/README.md) | Карткі Run паміж кропкамі | Прапанова |
| [G25.07](brand/outputs/G25.07/contact-sheet.html) | Макеты асноўных экранаў, тэлефон і вэб | Часткова: гл. раздзел 2; вэб адкладзены |
| [G25.06](brand/outputs/G25.06/contact-sheet.html) | Кампаненты і іх станы | Часткова: K1–K3 |
| [G25.05](brand/outputs/G25.05/contact-sheet.html) | Памятныя прадметы і іх станы | Прапанова |
| [G25.04](brand/outputs/G25.04/contact-sheet.html) | Іконкі і кампас | Часткова: вердыкт у [#39](https://github.com/kudy-vk/KUDY/issues/39) |
| [G25.03](brand/outputs/G25.03/contact-sheet.html) | Позы і голас дракона | Часткова: роля |
| [G25.02](brand/outputs/G25.02/naming-sets.html) | Назвы меню і слоўнік | Часткова: B06.1 |
| [G25.01](brand/outputs/G25.01/board.html) | Колеры, шрыфты, матэрыял | Прапанова: B04.1–B04.3 |
| [G25.09](brand/outputs/G25.09/contact-sheet.html), [экраны для крам](brand/outputs/G25.09/store-screens.html), [картка для сацсетак](brand/outputs/G25.09/social-card.html), [QR-запрашэнне](brand/outputs/G25.09/qr-invitation.html), [вэб-уводзіны](brand/outputs/G25.09/web-intro.html), [апісанне](brand/outputs/G25.09/README.md) | Шаблоны для крам, сацсетак, QR | Прапанова ([#43](https://github.com/kudy-vk/KUDY/issues/43)) |
| [G24.02](brand/outputs/G24.02/compare.html) | Кандыдаты іконкі дадатку | Гісторыя: іконка прынятая асобна (канон §3) |
| [icon-directions-2026-10-17](brand/outputs/icon-directions-2026-10-17/icons.html), [цёмныя экраны](brand/outputs/icon-directions-2026-10-17/dark-home.html), [светлыя экраны](brand/outputs/icon-directions-2026-10-17/anime-ink-home.html), [апісанне](brand/outputs/icon-directions-2026-10-17/README.md) | Шэсць набораў іконак, цёмныя і светлыя галоўныя экраны | Чарнавікі, не зацверджаныя (пазнака заснавальніка 20.10) |
| [2026-10-17-style-exploration](brand/outputs/2026-10-17-style-exploration/style-board-01.png), [апісанне](brand/outputs/2026-10-17-style-exploration/README.md) | Агульная дошка стылю 01 | Эскіз; паіменныя высновы чакаюць ([#44](https://github.com/kudy-vk/KUDY/issues/44)) |
| [brand-splash-directions-2026-10-19](brand/outputs/brand-splash-directions-2026-10-19/all-ten.png), [апісанне](brand/outputs/brand-splash-directions-2026-10-19/README.md) | Дзесяць напрамкаў уваходу | Гіпотэзы; выбар аднаго з дзесяці не запісаны, прыняты ўваход — застаўка з анімацыяй |
| [brand-entry-2026-10-19](brand/outputs/brand-entry-2026-10-19/entry-pair.png), [апісанне](brand/outputs/brand-entry-2026-10-19/README.md) | Пара экранаў уваходу | Гісторыя: заменена дзесяццю напрамкамі |
| [app-entry-2026-10-19](brand/outputs/app-entry-2026-10-19/entry-pair.png), [варыянты](brand/outputs/app-entry-2026-10-19/entry-options.png), [апісанне](brand/outputs/app-entry-2026-10-19/README.md) | Гарадскія напрамкі заставы | Гісторыя: адхілена |
| [mobile-welcome-2026-10-19](brand/outputs/mobile-welcome-2026-10-19/all-eight.png), [апісанне](brand/outputs/mobile-welcome-2026-10-19/README.md) | Восем сцэн-ілюстрацый для гіда | Параўнанне ілюстрацый; выбар не запісаны |

Па-за `docs/design/` ёсць прататыпы ў папцы `spikes/`:

| Прататып | Што ўнутры | Статус |
|---|---|---|
| [spikes/G06.08-prototype](../../spikes/G06.08-prototype/prototype/index.html) | Клікабельны прататып сцэнарыяў прагулкі, падбору і водгукаў; з яго ўзятыя назвы ў [схемах экранаў](screens-and-transitions.md). Перад праглядам падбору трэба выканаць `npm run prepare` у папцы прататыпа: файл з данымі не захоўваецца ў рэпазіторыі | Гісторыя: крыніца назваў і станаў, не выгляду |
| [spikes/MAP-07-tap-drag](../../spikes/MAP-07-tap-drag/index.html) | Націск і перацягванне частак меню на простых фігурах | Працоўны прататып для [#84](https://github.com/kudy-vk/KUDY/issues/84) |
| [spikes/2026-09-29-style-showcase.html](../../spikes/2026-09-29-style-showcase.html) | Ранняя прэзентацыя стылю | Гісторыя |

## 5. Разыходжанні

Месцы, дзе матэрыялы супярэчаць адно аднаму або запіс адстаў ад рашэння.

1. **Вердыкты 2026-11-02 няма ў рэестры.** Рашэнні пра галоўны экран ([#42](https://github.com/kudy-vk/KUDY/issues/42)) і пра іконкі ([#39](https://github.com/kudy-vk/KUDY/issues/39)) запісаныя толькі ў issues, у [рэестры рашэнняў](brand/decisions.md) іх няма.
2. **Уваход апісаны па-старому.** Канон §3 і [схемы экранаў](screens-and-transitions.md) кажуць, што пасля заставы адкрываецца Explore. У дадатку пасля заставы адкрываецца меню.
3. **Explore і KUDY без уваходу з меню.** Меню вядзе ў «Побач», «Гіды» і «Чым заняцца». Explore адкрываецца толькі са старонкі памылкі, KUDY — з Explore і з прэв'ю гіда.
4. **Радок B05 у рэестры адстаў.** Ён называе форму іконкі і месца кампаса адкрытымі; іконка дадатку прынятая, кампаса ў першым рэлізе няма.
5. **Знак кампаса ў меню.** Часткі «Чым заняцца» і `kudy` у кодзе маюць аднолькавы знак `compass`. Трэба вырашыць, ці не супярэчыць гэта вердыкту «кампаса няма» і ці могуць дзве часткі мець адзін знак.
6. **Раскладка банера змянілася.** 2026-11-02 была выбраная раскладка «банер і футэр ад ніза экрана»; M1 ставіць банер адразу пад часткамі карты. Дошка ADS-01, [#106](https://github.com/kudy-vk/KUDY/issues/106) і [#97](https://github.com/kudy-vk/KUDY/issues/97) апісваюць ранейшую раскладку.
7. **Макеты «Гіды» і Run зробленыя асобна.** Макет Run бярэ іконкі Lucide з сеткі, макет «Гіды» нясе ўсё ў сабе. Шапка, картка, фота і зона банера паміж імі не звераныя. Вырашана ў макетах: [фінальныя макеты](production/README.md) абодвух экранаў збіраюцца з адной асновы.
8. **Шэсць набораў іконак супраць аднаго ў кодзе.** Чарнавыя наборы 17.10 не выбраныя; дадатак малюе Lucide.
