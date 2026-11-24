# MAP-10 — вынікі рэалізацыі #83

Галіна: `chatgpt/83-accessibility`. База: `4ccde425`.

## Рэалізацыя

- Чатыры кірункі руху, яўнае злучэнне і скасаванне руху з клавіятуры і праз дзеянні даступнасці. Няўдалае злучэнне не губляе магчымасць скасавання; пераход да іншай групы скасоўвае незавершаны рух.
- Дзеянні падключаныя ў асноўным меню; сем радкоў у кананічным каталогу і ўсіх 42 перакладах. Пераклады правераны аўтарам з пазнакай пра адсутнасць незалежнага рэв'ю.
- Стан злучэння абвяшчаецца праз AccessibilityInfo. Звычайная актывацыя адкрывае ранейшы маршрут; рух сам па сабе не адкрывае экран. Існыя выявы, геаметрыя, маршруты, анімацыя і рэжым pointer drag не змененыя.
- Падрыхтаваны тэст вяртання з маршруту ў меню і скіду пазіцый.

## Матрыца праверкі

| Крытэрый | Вынік |
| --- | --- |
| Клавіятура, дзеянні screen reader, рух, злучэнне, скасаванне | Мадэльныя і кампанентныя тэсты прайшлі; фізічная клавіятура і TalkBack/VoiceOver не правераныя |
| Парадак, назвы, disabled, joined, актывацыя | Кампанентныя тэсты прайшлі; незалежнае рэв'ю перакладаў не праведзена |
| 320, 360, 390, 430 dp | Кампанентныя тэсты парадку і абвешчаных мінімальных памераў 48 dp прайшлі; фактычныя hit areas, вялікі шрыфт, кантраст, safe areas, паварот і тэмы на прыладах не правераныя |
| Reduced motion, вяртанне і скід | Кампанентны тэст reduced motion і скіду пры remount прайшоў; тэст поўнага маршруту не запусціўся; фізічныя back/edge gesture/scroll не правераныя |
| Скрыншоты і прыладная матрыца | Адсутнічаюць; патрабуецца прыладная праверка |

## Каманды і вынікі

- `node --test docs/design/brand/outputs/menu-map-city-only/native/model.test.mjs docs/design/brand/outputs/menu-map-city-only/magnet.test.mjs docs/design/brand/outputs/menu-map-city-only/amber-light.test.mjs test/agent-preflight.test.mjs` — 28 прайшлі, 1 прапушчаны (cv2).
- `node node_modules/jest/bin/jest.js --runInBand --runTestsByPath docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx` — 13 прайшлі.
- Мэтавы TypeScript для CityMapMenu, тэсту і асноўнага кампанента — прайшоў.
- `node --experimental-strip-types tools/i18n/generate-messages.mjs` — прайшоў. `check-messages.mjs` — не прайшоў: недаступны `controllers/run/runMap-strings.generated.ts` у пясочніцы. Поўная праверка кантрактаў лакалізацыі не пацверджаная.
- `app/menu.test.tsx` — запуск заблакіраваны недаступным `controllers/run/runSurfaceController.ts`.
- Поўны TypeScript — TS6053: недаступны `spikes/G00.03-sandbox-grant/server/device-auth.mjs`.
- `npm test` і `jscpd` — тайм-аўт. Showboat — запуск забаронены для гэтага worktree.

## Статус

Рэалізацыя падключаная ў асноўным меню; PR не гатовы да зліцця без поўных CI і прыладных доказаў, якія патрабуе #83. Праверкі, якія не запускаліся або не прайшлі, не лічацца паспяховымі. Праблема Android host E2E адсочваецца ў #451.
