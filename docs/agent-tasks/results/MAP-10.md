# MAP-10 / #83 — даступнасць карты-меню

Стан: **часткова рэалізавана, NOT-VERIFIED для рэлізу**.
База: `origin/main` `4ccde4257ad06c73c1b4deb60cfc54c41e96401b`.
Галіна: `chatgpt/83-accessibility`. Ізаляваны worktree: `/home/viktar/Projects/KUDY-chat-20261125`.

## Вынік па крытэрыях

1. Мадэль падтрымлівае перасоўванне на 8 dp, яўнае злучэнне суседніх груп і скасаванне. Кампанент апрацоўвае стрэлкі, S і Escape, не перахоплівае Tab і мадыфікаваныя камбінацыі. Дзеянні чытача экрана прымаюць лакалізаваныя назвы, але яшчэ не падключаныя ў `components/city-map-menu.tsx`: патрэбныя кананічныя пераклады. Фізічная клавіятура і чытачы экрана — NOT-VERIFIED.
2. Застаюцца кнопка, назва, disabled і непасрэдная актывацыя. Дададзены лакалізаваны стан злучанай групы ў кампаненце. Парадак і абвяшчэнні на прыладах — NOT-VERIFIED.
3. Не змененыя геаметрыя, дызайн, медальёны, рэсурсы, існыя вобласці націску і safe areas. 320/360 dp — мадэльныя тэсты; буйны шрыфт, паварот, кантраст і зоны націску на прыладах — NOT-VERIFIED.
4. Паўторна выкарыстаныя межы, magnet/snap і існая апрацоўка reduced motion. Змена памеру скасоўвае незавершаны рух. Back, сістэмныя жэсты і пракрутка на прыладах — NOT-VERIFIED.
5. Дададзены 4 тэсты мадэлі і 2 тэсты кампанента. Здымкі экрана і прыладавая матрыца не атрыманыя.

## Праверкі

- `node --test docs/design/brand/outputs/menu-map-city-only/native/model.test.mjs docs/design/brand/outputs/menu-map-city-only/magnet.test.mjs docs/design/brand/outputs/menu-map-city-only/amber-light.test.mjs test/agent-preflight.test.mjs` — 27 passed, 1 skipped (няма Python OpenCV).
- `node node_modules/jest/bin/jest.js --runInBand --runTestsByPath docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx` — 8 passed.
- Мэтавы TypeScript: `node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --strict --skipLibCheck --resolveJsonModule --allowJs --allowImportingTsExtensions docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.tsx docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx` — PASS.
- Поўны `tsc --noEmit` — TS6053: у рабочай копіі адсутнічае `spikes/G00.03-sandbox-grant/server/device-auth.mjs`.
- Поўны CI, Showboat і прыладавыя праверкі — NOT-VERIFIED. PR не адкрыты.

## Што засталося

Кананічныя радкі дзеянняў і стану ў каталогу UI з праверанымі перакладамі ўсіх патрабаваных моў; падключэнне ў production host; праверка рэальных клавіятуры, TalkBack/VoiceOver, адаптыўнасці і сістэмных жэстаў. Не мяняць ілюстрацыі і анімацыю і не аднаўляць адхілены PR #453.
