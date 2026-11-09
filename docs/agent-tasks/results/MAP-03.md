# MAP-03 — геаметрыя фрагментаў галоўнага меню

Задача [#78](https://github.com/kudy-vk/KUDY/issues/78). База `b808e03`.

| Крытэрый | Доказ |
|---|---|
| 1. Адзіная геаметрыя | [Маніфест](../../design/brand/outputs/menu-map-city-only/manifest.json) задае ID, контуры, каардынаты, апорныя пункты і суседства. [Экспарт](../../design/brand/outputs/MAP-03/geometry.py) чытае яго і маскі без паўторнага апісання контураў. |
| 2. Пяць фрагментаў і месца пад элементы меню | Квадраты ўнутры масак ля апорных пунктаў: `nearby` 113 px, `guides` 173 px, `discovery` 127 px, `reserve-1` 101 px, `kudy` 161 px. Подпісы вынесеныя над фрагментамі. [Існы візуальны ўзор](../../design/brand/outputs/menu-map-city-only/proof.png). |
| 3. Зборка і стыкі | `verify.py` аднавіў 1 143 233 бачныя пікселі стылізаванай карты. Тэсты экспарту адхілілі перакрыццё, адсутны фрагмент, адсутны і старонні стыкі ды кропку стыку па-за прамежкам. [Каардынаты і допускі](../../design/brand/outputs/MAP-03/README.md#каардынаты-і-стыкі). |
| 4. Рэзерв і версія | Валідатар пацвердзіў, што зоны `reserve-2` і `reserve-3` належаць сцэне і не перакрываюць дзейных фрагментаў. [Правілы версій](../../design/brand/outputs/MAP-03/README.md#рэзерв-і-версія). |
| 5. Экспарт | [Каманды праверкі і экспарту](../../design/brand/outputs/MAP-03/README.md#праверка-і-экспарт). |

## Праверкі на Windows

- `python docs/design/brand/outputs/menu-map-city-only/verify.py` — піксельная зборка пацверджаная.
- `python docs/design/brand/outputs/MAP-03/test_geometry.py` — 14 тэстаў прайшлі.
- `node --test --test-concurrency=1 docs/design/brand/outputs/menu-map-city-only/magnet.test.mjs docs/design/brand/outputs/menu-map-city-only/native/model.test.mjs` — 10 тэстаў прайшлі.
- `build.py` да і пасля вынясення агульных функцый стварыў 26 байт-ідэнтычных файлаў у асобных часовых каталогах на адным наборы ўваходных файлаў.
- `uvx --offline showboat==0.6.1 verify docs/demos/2026-11-09-map-03-geometry.md` — два аднолькавыя прагоны. На Windows `MAP03_PYTHON` паказваў на Python з OpenCV і NumPy.
- `npm run arch:check` — 725 модуляў, 0 парушэнняў. `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .` — 0 дубляў.
- `node --max-old-space-size=700 node_modules/typescript/bin/tsc --noEmit` — паспяхова.
- NOT-VERIFIED — чытэльнасць подпісаў і доступнасць на прыладзе. Вынік вымярае геаметрыю зыходнай карты. [Вынік праверкі публікацыі ілюстрацыі](MAP-02-RIGHTS.md).
