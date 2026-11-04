# MAP-02-VECTOR — вектарная майстар-карта (draft)

Дата: 2026-11-04. Задача: [#109](https://github.com/kudy-vk/KUDY/issues/109) (перанесена з vokhandcrafts/KUDY#1009); эпік vokhandcrafts/KUDY#881. Статус: **draft** — не дапушчаная да вытворчасці, пакуль не закрытыя [MAP-02-HIST #107](https://github.com/kudy-vk/KUDY/issues/107) і [MAP-02-RIGHTS #108](https://github.com/kudy-vk/KUDY/issues/108).

## Вынік

Пакет [vector/](../../design/brand/outputs/MAP-02/vector/README.md) замяняе гібрыдны SVG (растр + вонкавы контур) паўнавартаснай вектарнай майстар-картай [map-master-vector.svg](../../design/brand/outputs/MAP-02/vector/map-master-vector.svg). Яна займае 1,0 МБ і змяшчае 2 913 шляхоў без убудаванага растра. Старыя файлы `map-cutout-v2.*` і пакет `menu-map-city-only/` не змяняліся.

## Як зроблена

1. Кожны непразрысты піксель [map-cutout-v2.png](../../design/brand/outputs/MAP-02/map-cutout-v2.png) (sha256 `72c208a8…f80f0`) аднесены да аднаго з 21 фіксаванага колеру. Палітра — 20 цэнтраў k-means у Lab па ўсім малюнку і адзін сярэдні зялёны тон схілаў. Яна запісаная ў [build-vector.py](../../design/brand/outputs/MAP-02/vector/build-vector.py) з назвамі роляў, таму зборка не залежыць ад выпадковасці.
2. Пласт вызначаецца колерам і месцам. Часткі меню бяруцца з альфы `menu-map-city-only/pieces/<id>.png`, гэта значыць з тых самых масак, што і manifest. Дрэвы — кампактныя цёмна-зялёныя плямы. Вуліцы — святлейшыя за фон тоны ўнутры раёна. Зялёныя ўчасткі па-за меню аднесены да ўмацаванняў, палос горада або лугоў паводле таго, што іх акружае.
3. Базавыя пласты цалкам пакрываюць сілуэт, а дэталі ляжаць зверху суцэльнымі шляхамі. Межы трасіруюцца па сярэдзіне паміж пікселямі (marching squares) і спрашчаюцца з дакладнасцю 0,45–0,55 px.

## Крыніцы, версія геаметрыі і дапушчэнні

- Крыніцы: [WORK-ASSET](../../design/brand/outputs/MAP-02/WORK-ASSET.md), [map-cutout-v2.svg](../../design/brand/outputs/MAP-02/map-cutout-v2.svg), [manifest.json](../../design/brand/outputs/menu-map-city-only/manifest.json) і альфа пяці частак, [MAP-02](MAP-02.md).
- Версія геаметрыі: `map-02-vector-draft-1` (атрыбут `data-geometry-version` у SVG).
- Будынкі, арыенціры і раённыя маркеры не дададзеныя: у абранай выяве іх няма. Уладальнік 2026-11-03 вырашыў пакінуць гэтыя групы пустымі ([каментар у #109](https://github.com/kudy-vk/KUDY/issues/109)). Пласты `buildings-landmarks` і `district-markers` існуюць пустымі з пазнакай рашэння.
- Мастацкія дапушчэнні: градыенты і мазкі сталі плоскімі плямамі. Лініі маюць адзін колер на кожны кавалак. Масты не вылучаныя ў асобную групу. Цёмны край ракі аднесены да вады.
- Растравая фактура не дадавалася: фіксаванай палітры хапае, і асобны неабавязковы пласт не спатрэбіўся.

## Крытэрыі

| Крытэрый | Вынік |
|---|---|
| AC1 — адзіны вектарны зыходнік з асобнымі групамі | ✅ 10 пластоў Inkscape: вонкавы контур, вада (192 шляхі), умацаванні (575), зеляніна (56), раёны (6 груп, 308), вуліцы (198), дрэвы (120 груп дрэў ці купак, 1 189 шляхоў), лініі (394). Будынкі і маркеры пустыя паводле рашэння ўладальніка. Растра няма |
| AC2 — агульная сістэма каардынат і пяць зон | ✅ `viewBox="0 0 1351 1164"`, арыентацыя і сілуэт захаваныя (IoU 0,9970). Кожная `district-<id>` пакрывае 0,9993–1,0000 сушы сваёй часткі. Па-за часткай застаецца 880–1 280 px: гэта паласа шырынёй 0,6 px ад штрыха, які закрывае швы. Найбольшае перакрыццё дзвюх груп — 263 px. ID і маршруты не змяняліся |
| AC3 — паўтаральны экспарт і прэв'ю | ✅ Адна каманда `export.py` стварае SVG, PNG 1351 × 1164 і тры прэв'ю на `color.paper`. Прэв'ю: поўная карта, 240 × 207 px, пяць частак на шырыні 390 px. Кантраст вонкавага контуру з паперай — 12,8 : 1. ⚠️ Кантраст вуліц з раёнамі — 1,08–1,39 : 1, як у арыгінале (гл. ніжэй) |
| AC4 — механічная праверка | ✅ `verify-vector.py`: структура, 4 адмоўныя выпадкі, паўтор SVG да байта, паўтор PNG, супадзенне з арыгіналам, швы, межы раёнаў |
| AC5 — вынік і спасылка ў WORK-ASSET | ✅ Гэты файл; [WORK-ASSET](../../design/brand/outputs/MAP-02/WORK-ASSET.md) спасылаецца на вектарную карту толькі пасля праверанага экспарту. Статус `draft` |

## Праверка

Каманды запускаліся з кораня рэпазіторыя на `6dfc81b` + змены галіны `109-map-02-vector`:

```text
$ python docs/design/brand/outputs/MAP-02/vector/export.py
svg: map-master-vector.svg (997 kB) · png (660 kB) · full (656 kB) · small (75 kB) · phone (229 kB)

$ python docs/design/brand/outputs/MAP-02/vector/verify-vector.py
Structure: fully vector, layers outer-contour=1, water=192, fortifications=575, greenery=56,
  districts=308, streets=198, buildings-landmarks=0, trees=1189, outlines=394, district-markers=0
  rejected as expected: hybrid raster SVG (map-cutout-v2.svg)
  rejected as expected: streets replaced by a PNG
  rejected as expected: trees layer removed
  rejected as expected: fortifications flattened to one shape
Export: SVG reproduced byte for byte; 4 PNG exports reproduced (<=0.2% pixels differ)
Fidelity: silhouette IoU 0.9970; dE mean 6.46, p95 21.7, share dE<20 0.944
  pieces dE mean: nearby 5.92, guides 4.41, discovery 6.21, reserve-1 3.79, kudy 5.19
Seams: interior pixels with alpha<240 — base layers without contour backing 87, full map 0
Districts: coverage 0.9993–1.0000, 880–1280 px outside, largest pairwise overlap 263 px
Contrast: outer rim vs color.paper #faf7f2 = 12.8:1
MAP-02 vector master: all checks passed (draft; not production-approved).
```

ΔE — адлегласць колеру ў CIELAB (шкала L 0–100) пасля накладання на паперу. Мяжа «ΔE < 20» азначае, што колер пазнаецца як той самы. Парогі праверкі: IoU ≥ 0,995, сярэдні ΔE ≤ 8 па карце і па кожнай частцы, доля ΔE < 20 ≥ 0,92, 0 празрыстых пікселяў унутры карты.

Асяроддзе: Windows 11, Python 3.14.6, OpenCV 4.14.0, NumPy 2.5.3, SciPy 1.18.1, scikit-image 0.26.0, Node.js 24.13.0, Playwright 1.63.0, Chrome 156.0.8078.80. SVG паўтараецца да байта на гэтых версіях. Версіі Python-бібліятэк зафіксаваныя ў [requirements.txt](../../design/brand/outputs/MAP-02/vector/requirements.txt); з іншымі версіямі праверка паўтаральнасці можа ўпасці.

## Абмежаванні і пытанні ўладальніку

- Кантраст вуліц у абранай карце нізкі. Пры 240 px вуліцы чытаюцца як фактура. Змена колеру вуліц — мастацкае рашэнне. Яго трэба прыняць асобна. Колер задаецца атрыбутам `fill` на шасці групах `streets-*` (уласны колер маюць толькі 5 масткоў у `streets-discovery`); каб змена перажыла перазборку, яе ўносяць у `build-vector.py`.
- Плоскія плямы на схілах валоў адрозніваюцца ад мяккіх градыентаў арыгінала (p95 ΔE 21,7 у асноўным на схілах і лініях).
- Гістарычная дакладнасць і правы не правяраліся і не падмяняюцца перамалёўкай.
- Прыладавая прыёмка, Showboat і design-QA не патрабуюцца: інтэрфейс аплікацыі і runtime-код не змяняліся.
