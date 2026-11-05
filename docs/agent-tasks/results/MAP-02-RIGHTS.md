# MAP-02-RIGHTS — паходжанне і правы вытворчай графікі карты

Дата: 2026-11-04. Задача: kudy-vk/KUDY#108 (перанесена з vokhandcrafts/KUDY#1008). Эпік: kudy-vk/KUDY#77.

Метад: дакументальная праверка жывых каталогавых старонак (спампоўка HTML 2026-11-04) і палітык правоў, праверка ланцуга файлаў у checkout праз sha256. Runtime, API, аўтарызацыя і захаваныя даныя не змяняліся.

## 1. Ланцуг асетаў і класіфікацыя (AC1)

```
дзве гістарычныя выявы ўладальніка (прыватныя) ─┐
рэферэнс простай контурнай ілюстрацыі (прыватны) ├─ ImageGen → v1 → step1 → map-cutout-v2.png
assets/kudy-icon/icon.png (уладнік праекта) ─────┘        │
                                                          ├─ package-cutout.py: убудаваны PNG + контур альфа-канала → map-cutout-v2.svg
                                                          └─ наразанне паводле абводкі ўладальніка (OpenCV) → menu-map-city-only/*
```

| Вузел | Класіфікацыя | Паходжанне | Доказ |
|---|---|---|---|
| `map-cutout-v2.png` 1351×1164 | **ImageGen-трансфармацыя** | Убудаваны ImageGen, ланцуг рэдагаванняў v1 → step1 → v2 (промпты: [map-cutout-v2-prompts.txt](../../design/brand/outputs/MAP-02/map-cutout-v2-prompts.txt)); уваходы — прыватныя рэферэнсы ўладальніка | [WORK-ASSET.md](../../design/brand/outputs/MAP-02/WORK-ASSET.md); [MAP-02.md](MAP-02.md) |
| `map-cutout-v2.svg` | Вытворны ад PNG + вектарны контур | Той самы PNG убудаваны без змены байтаў; вонкавы шлях — сілуэт альфа-канала (парог 128, спрашчэнне 0,6 px), не гістарычны GIS-контур | WORK-ASSET.md; verify-cutout.mjs |
| `menu-map-city-only/source.png` | Байт-ідэнтычная копія майстар-PNG | sha256 супадае з `map-cutout-v2.png` (`72c208a8a14a687f…`), праверана 2026-11-04 | уласнае вымярэнне ў гэтай сесіі |
| `pieces/{nearby,guides,discovery,reserve-1,kudy}{,--ui,--light}.png` | Вытворныя ад source.png | Нарэзаныя паводле абводкі ўладальніка (`Untitled.jpg`, прыватны рэферэнс); новая графіка не генеравалася | [README.md](../../design/brand/outputs/menu-map-city-only/README.md); [brief.md](../../design/brand/outputs/menu-map-city-only/brief.md) |
| `layers/water.png`, `layers/fortifications.png`, маскі `native-layout.ts` | Вытворныя ад source.png | Астатнія пікселы сцэны і альфа-маскі націску | README.md menu-пакета |
| `styled-source.png` | Вытворны ад source.png | Кантрольная карта з перафарбаванай унутранай абводкай; геаметрыя і альфа захаваныя | README.md menu-пакета |

Уваходныя рэферэнсы ImageGen — прыватныя выявы ўладальніка; па ўмове задачы яны не раскрываюцца (без URL і апісанняў зместу). Іх паходжанне гэтай праверкай **не ўстаноўлена** — гл. §3.

Класіфікацыйныя катэгорыі з умовы задачы: арыгінальны гістарычны твор / сучасны скан / аўтарскі малюнак / ImageGen-трансфармацыя. Ніводзін вузел вытворчага ланцуга не з'яўляецца ні арыгінальным гістарычным творам, ні сучасным сканам, ні непасрэднай копіяй скана: усе вузлы — ImageGen-вынік або вытворныя ад яго.

## 2. Правераныя крыніцы (AC2)

Усе спасылкі адкрытыя і спампаваныя 2026-11-04; цытаты — даслоўныя з жывых старонак.

| Крыніца | URL / каталожны ID | Установа / праваўладальнік | Дата праверкі | Фактычныя ўмовы (даслоўна) | Камерцыйнае | Вытворныя творы | Атрыбуцыя |
|---|---|---|---|---|---|---|---|
| Erik Dahlbergh, *Ichnographia Urbi Gedani et Castelli ad ostium Uistulae uulgo Weichselmunde […] ; Dantiscvm*, [ca 1696], медзярыт, каля 1:32 000 | [rcin.org.pl/igipz/dlibra/publication/195](https://rcin.org.pl/igipz/dlibra/publication/195); OAI `oai:rcin.org.pl:93`; арыгінал CBGiOŚ, IGiPZ PAN, D.1892 [IX.11B-9] | CBGiOŚ/IGiPZ PAN (ацыфроўка IGiPZ PAN) | 2026-11-04 | `Rights: Public Domain`; `Terms of use: "Material outside of copyright protection. May be used without restrictions following from economic copyrights"` | дазволена | дазволены | добраахвотная; рэкамендаваная фармулёўка — §4 |
| Franz Müller, *Plan der Stadt und Festung Danzig mit ihren Vorstädten und aeusseren Umgebungen 1807*, Leipzig | [rcin.org.pl/dlibra/publication/6164](https://rcin.org.pl/dlibra/publication/6164); OAI `oai:rcin.org.pl:7378`; арыгінал CBGiOŚ, IGiPZ PAN, [IX.11B-10] | CBGiOŚ/IGiPZ PAN | 2026-11-04 | тыя самыя дзве радкі `Rights`/`Terms of use` | дазволена | дазволены | добраахвотная |
| *Plan von Danzig*, Stadt-Geometers Block, 1886, Danzig, Eigenthum und Verlag von Richard Bertling, літаграфія 1:5 000 | [rcin.org.pl/dlibra/publication/2773](https://rcin.org.pl/dlibra/publication/2773); OAI `oai:rcin.org.pl:465`; арыгінал CBGiOŚ, IGiPZ PAN, PAN D.1917 [IX.11B-6] | CBGiOŚ/IGiPZ PAN | 2026-11-04 | тыя самыя дзве радкі | дазволена | дазволены | добраахвотная |
| A. Koch, *Plan des Territorii der freien Stadt Danzig*, 1808, Danzig, in der Troschelschen Buchhandlung | [rcin.org.pl/dlibra/publication/6029](https://rcin.org.pl/dlibra/publication/6029); OAI `oai:rcin.org.pl:384`; арыгінал CBGiOŚ, IGiPZ PAN, D.1920 [II.5C-3] | CBGiOŚ/IGiPZ PAN | 2026-11-04 | тыя самыя дзве радкі | дазволена | дазволены | добраахвотная |
| Палітыка правоў RCIN («Copyrights») | [rcin.org.pl/dlibra/text?id=copyright-law](https://rcin.org.pl/dlibra/text?id=copyright-law) | RCIN | 2026-11-04 | «Even if there are no restrictions following from copyright law, it does not follow that the material may be freely used»; пра сучасныя вытворныя і навуковыя выданні: «…Hence, we cannot automatically assume that each work of a person who died more than 70 years ago can be marked as public domain» | — | — | — |
| Сканы [planygdanska.eu](https://planygdanska.eu/en/copyright) | старонка Copyright | Bartosz Cieślik (уладальнік сайта) | 2026-11-04 | «However, scans posted on planygdanska.eu are also protected. They may be used for personal use only.» | **забаронена** | забаронены | — |
| W. Długokęcki, 2015, Kwartalnik Historii Kultury Materialnej 63/2, IAE PAN | [journals.iaepan.pl/khkm/article/view/848](https://journals.iaepan.pl/khkm/article/view/848) | IAE PAN | 2026-11-04 | CC BY-NC-ND 4.0 (старонка артыкула) | **не** | **не** (без асобнага дазволу) | абавязковая пры цытаванні |

Папярэджанне AC2 выканана дзейнасцю, не толькі словамі: пазнака `Public Domain` у запісе RCIN ставіцца да **арыгінальнага твора і лічбавай копіі ў рэпазіторыі RCIN** (поле `Terms of use` запісу), а не да любога старонняга сучаснага скана. Палітыка RCIN сама фіксуе рызыку сучасных вытворных і навуковых выданняў; сканы planygdanska.eu — асобны ахоўваны матэрыял з забаронай камерцыйнага выкарыстання.

## 3. Вердыкты па асновах (AC3, AC5)

| Аснова | Вердыкт | Абгрунтаванне | Патрэбнае дазвол / бяспечная альтэрнатыва |
|---|---|---|---|
| `map-cutout-v2.png` і ўсе вытворныя (svg, `source.png`, pieces, layers, маскі, styled) | **not cleared** | ImageGen-вынік ад прыватных рэферэнсаў з недакументаваным паходжаннем; умовы невядомыя — таму не `cleared` | Уладальнік дакументуе два гістарычныя рэферэнсы (што за твор, чый скан, крыніца, ліцэнзія) або пацвярджае ўласнае аўтарства/права на пераработку; бяспечная альтэрнатыва — перагенерацыя/перамалёўка ад правераных RCIN-арыгіналаў з §2 |
| Чатыры RCIN-арыгіналы (файлы, атрыманыя з уласных запісаў RCIN) | **cleared** | `Public Domain` + `Terms of use` запісаў; маёмасныя правы скончыліся (творы XVII–XIX ст.), ацыфроўца не дадае маёмасных абмежаванняў паводле запісаў | Умовы: файл браць толькі з запісаў RCIN; не выкарыстоўваць староннія сучасныя сканы і выданні; не скажаць твор пры пераапрацоўцы (асабістыя немаёмасныя правы не маюць тэрміну); атрыбуцыя добраахвотная, але рэкамендаваная |
| Сканы planygdanska.eu | **not cleared** | «personal use only» на старонцы Copyright | Толькі асабістая праглядка; для production — не выкарыстоўваць |
| Ілюстрацыі Długokęcki 2015 | **not cleared** | CC BY-NC-ND 4.0: NC і ND выключаюць мадыфікаванае камерцыйнае выкарыстанне | Толькі тэкставая даследчая спасылка |

**Галоўная выснова:** вытворчую графіку меню (`map-cutout-v2` і ўсе вытворныя) **не пазначаць** дапушчанай да рэлізу; для камерцыйнай зборкі патрэбнае альбо дакументаванне ўладальнікам рэферэнсаў, альбо аснова ад RCIN-арыгіналаў.

Уплыў абмежаванняў на вытворны камерцыйны асет: сканы planygdanska.eu (personal use only) і ілюстрацыі Długokęcki 2015 (CC BY-NC-ND 4.0) не могуць увайсці ў камерцыйную вытворную графіку ні цалкам, ні ў мадыфікаваным выглядзе; умова ODbL дзейнічала б толькі пры ўзянцці геаметрыі з OpenStreetMap і не датычыць старадаўніх гравюр.

Нявызначанасці не «падганяліся» пад станоўчы вердыкт: невядомае застаецца `not cleared` паводле крытэрыю 3 задачы.

## 4. Атрыбуцыя (AC4)

**Варыянт A — для асновы ад RCIN-арыгіналаў (патрэбны пры перамалёўцы):**

> Map artwork: schematic reconstruction based on public-domain plans of Gdańsk held by the Central Library of Geography and Environmental Protection, IGiPZ PAN, digitized in RCIN (rcin.org.pl): Erik Dahlbergh, «Ichnographia Urbi Gedani…; Dantiscvm», ca. 1696; Stadt-Geometer Block, «Plan von Danzig», 1886. Artistic stylization and layout: KUDY.

**Варыянт B — што паказваць сёння (да перамалёўкі):** асобнага абавязковага тэксту атрыбуцыі для `map-cutout-v2` няма (няма пацверджанай трэцяй крыніцы), але малюнак характарызуецца ў матэрыялах як схематычная рэканструкцыя паводле гістарычных планаў Гданьска, без назвы канкрэтных твораў — пакуль паходжанне рэферэнсаў не дакументаванае ўладальнікам.

Атрыбуцыя добраахвотная і таму, дзе маёмасная ліцэнзія яе не патрабуе (RCIN запісы) — рэкамендаваныя радкі вышэй.

## 5. Паўторнае выкарыстанне (MAP-04, MAP-12)

- Гатовы для паўторнага выкарыстання спіс крыніц з поўнымі метаданымі: [docs/design/brand/outputs/MAP-02/rights-sources.md](../../design/brand/outputs/MAP-02/rights-sources.md).
- Для MAP-12: перад кожным рэлізам паўтарыць праверку — запісы RCIN жывыя, радкі `Rights`/`Terms of use` не змяніліся, дата праверкі абнаўляецца; пры змене ўмоў — новы вердыкт.

## 6. Межы гэтай праверкі

- `verify-cutout.mjs` — **NOT-VERIFIED** тут (патрэбны ўсталяваны Google Chrome, у асяроддзі яго няма); `verify.py` меню-пакета — **NOT-VERIFIED** (патрэбны OpenCV). Ланцуг паходжання доказаны праз супадзенне sha256 майстар-PNG і `source.png` і праз git-гісторыю працоўных файлаў.
- Тэрміны ўбудаванага інструмента генерацыі (ImageGen) рэтраспектыўна не правяраліся: іх дзеянне кіруе выкарыстаннем выніку карыстальнікам, але **не чысцяць** правы трэціх асоб уваходных рэферэнсаў.
- Шрыфты пакета menu у гэты рэестр не ўваходзяць: задача ахоплівае правы гістарычнай графікі карты.
- Прыватныя рэферэнсы ўладальніка не раскрываюцца і не капіруюцца ў рэпазіторый (умова задачы).
