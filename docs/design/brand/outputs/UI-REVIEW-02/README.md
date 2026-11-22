# UI-REVIEW-02 — два элементы шапкі (выбраны A)

Параўнанне для [#99](https://github.com/kudy-vk/KUDY/issues/99). Уладальнік выбраў **A** 2026-11-22; запіс у [UI99-1](../../decisions.md#ui99-1). B і C захаваныя толькі для параўнання. Гэта асобная дызайн-дошка, не production-кампанент.

Адкрыць праз існы сервер з кораня гэтага клона: `python3 docs/design/production/tools/serve.py`, затым `http://127.0.0.1:4400/docs/design/brand/outputs/UI-REVIEW-02/index.html`. Макет выкарыстоўвае `docs/design/production/kit.css`, іконкі `kit-icons.mjs` і радкі `contracts/ui-messages`.

## Што ёсць у кодзе цяпер

- `app/_layout.tsx`: уласныя загалоўкі экранаў, натыўны Stack header адключаны.
- `components/back-button.tsx` і `app/{route/[id],feedback,map,...}.tsx`: у production Back — стрэлка `arrow-left` **з бачным тэкстам** на кожнай паверхні, з `router.back()`, мінімальнай зонай 48×48 dp і дадатковым `hitSlop`. Варыянты A/B/C тут прапануюць новы icon-only выгляд, а не паўтараюць production.
- `components/walk-button.tsx`: у production кнопка ўжо правярае `walk.liveSession()`, знікае без жывой сесіі, вяртае ў `/run/${live.routeId}`; у рэжыме `iconOnly` мае гліф `route`, а не `footprints`. Пераход не змяняе сесію і не запускае аўдыё; панэль захоўвае стан у наяўным кантролеры.
- `docs/design/production/kit.mjs` (`topbar()`/`walkButton()`): у макеце Back = `arrow-left`, shortcut = `footprints`; гэта **не** сведчанне змержанай агульнай production-шапкі.
- `docs/design/screens-and-transitions.md`, агульныя правілы: Back вяртае на паверхню-крыніцу без завяршэння прагулкі; shortcut вяртае ў Run у ранейшым стане панэлі, не запускае аўдыё.
- Прыклад маршрутных паверхняў: `/route/[id]`, `/run/[id]`, `/feedback`, `/map`. Выяўленне актыўнай/прыпыненай сесіі і пераходы трэба падключыць да production-кантрактаў у #214, не з гэтага дэма.

## Варыянты і станы

- A: стрэлка Back без фону, заліты круг `footprints`; адпавядае кірунку наяўнага макета.
- B: дзве сіметрычныя контурныя круглыя кнопкі, `arrow-left` і `footprints`.
- C: сціплая падкладка Back і скруглены квадрат `navigation` для Run; можа блытацца з GPS.
- Станы: Run active/paused/none × іншы экран/Run × 320/360/390/430 dp × light/dark × нармальны/1,5× тэкст. Пры none і на Run shortcut няма.
- Touch targets: CSS задае 48×48 px у мадэлі, як 48 dp пры 1:1 макеце. Загаловак выкарыстоўвае `min-width:0` і `text-overflow:ellipsis`; поўная назва ў атрыбуце `title`.
- 320 dp + 1,5×: дадатковае дзеянне info ў гэтым дэма схавана; перад вытворчасцю трэба ўхваліць, куды яго перанесці. Гэта не гатовая UX-палітыка.

## Выбранае і што яшчэ чакае

Уладальнік прыняў выгляд **A** для абедзвюх кнопак; навігацыйныя станы active/paused/none і выключэнне Run застаюцца з існага кантракту. Толькі пра дадатковыя дзеянні на 320 dp з буйным тэкстам няма вердыкту: у дэма info схавана, але гэта не ўзгоднена. Перанос у дадатак будзе ў [#214](https://github.com/kudy-vk/KUDY/issues/214), пасля рашэння па гэтым краявым выпадку.

## Праверкі і межы

- `node --check docs/design/brand/outputs/UI-REVIEW-02/board.mjs` — сінтаксіс.
- Device screenshot, даступнасць экранным чытальнікам, сапраўдныя 44 dp, адсутнасць перакрыцця пры маштабе, сістэмны Back у Android/iOS: **NOT-VERIFIED**, макет не з'яўляецца такой праверкай.
- У гэтым наборы файлаў няма змен у `app/`, `components/` або production-макетах; асобны запіс пра прыняты A дададзены ў `docs/design/brand/decisions.md`.
