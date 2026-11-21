# #215 — агульныя кампаненты з макетаў

Задача: [#215](https://github.com/kudy-vk/KUDY/issues/215).
Галіна: `zcode/215` (клон `~/Projects/KUDY-fix-215`, base `ddff623`).

## Што зроблена

Усе крытэрыі задачы выкананыя. Кампаненты бяруць колеры выключна з люстэрка
токенаў (`components/design-tokens.ts`); шакаладная цёмная палітра з
`kit.css` (M3) у кампаненты не трапіла — у рэестры рашэнняў M3 пакуль
прапанова, не правіла.

1. **Круглая кнопка галоўнага дзеяння** — `components/fab.tsx`: адзін
   кампанент. Іконка праз `CanonIcon` з абавязковай подпісам для экраннага
   чытальніка (канон §9), акцэнтная заліўка 56×56 з полкай `shelf-accent`
   праз агульны `PressableSurface`. Выключаны стан паводле канона §5 і
   рашэння ўладара 2026-10-03: празрысты фон, межа `color.disabled-line`, гліф
   `color.disabled-ink`, без полкі і без празрыстасці (тэст правярае
   адсутнасць `opacity` ва ўсіх пластах і адсутнасць полкі). Тэкст прычыны —
   злева ад кнопкі ў агульным радку (кампазіцыя `.pv-foot` прэв'ю); прычына
   рэндэрыцца заўсёды, калі экран яе перадае; без прычыны тэкставага вузла няма.
2. **Картка гіда** — `components/guide-card.tsx` пашыраны фота-месцам:
   рамка 64×64 (значэнні `.photo` кіта: межа `color.line`, радыус 8) у
   шапцы радка побач з назвай (анатомія `.offer-head`). Гэта той жа адзіны
   `GuideCard` для «Гідаў», «Побач», «Чым заняцца» і падборкі; слот
   рэндэрыцца толькі з фота, таму дзейныя экраны захоўваюць цяперашні
   выгляд да сваіх задач (#216–#227). Назва, апісанне, мовы тэксту і аўдыё
   (`LocalesLine`), пазнака доступу (`AccessBadge`) — без зменаў.
3. **Кантэйнер рэкламы** — `components/ad-container.tsx`: пакінутае месца
   паводле рашэння M6 (заўсёды апошні блок над сістэмнай навігацыяй —
   размяшчэнне на экране); слот 90dp з межай `color.line` на фоне
   `color.card` і падшэўкай зоны 8/16 (значэнні `.ad-zone`/`.ad-slot`
   кіта). Калі рэкламы няма, кампанент не рэндэрыць нічога — тэст правярае
   адсутнасць вузла ў дрэве. Сапраўдная рэклама — #101; подпіс «Рэклама»
   з макета не ўваходзіць у кампанент (гэта замена крэатыва на дошцы
   агляду, а не UI).
4. **Узорнік** — сторы ў `components/fab.stories.tsx` (enabled,
   enabled-reason, disabled-reason, disabled), `components/ad-container.stories.tsx`
   (loaded, not-loaded), `components/section-header.stories.tsx` (section)
   і `components/guide-card-photo.stories.tsx` (photo). Фармат — чыстыя
   CSF-аб'екты без пакетаў Storybook (ідыёма `guide-card.stories.tsx`);
   сінтэтычныя фікстуры толькі. Станы рэндэрацца ў абедзвюх тэмах праз
   люстэрка токенаў (`useThemeStyles`). Фота-сторы ідуць у асобным файле
   наўмысна: мацрыца баз DQ-03 чытае `guide-card.stories.tsx`
   (`tools/e2e-android/visual-check.mjs`), новы слот патрабаваў бы
   здымка-базы з прылады — фота-стан далучаецца да зорніка без далучэння
   да мацрыцы. Вартаўнік `tools/metro-config/storybook-gate.test.mjs`
   абагульнены свядома: адзін спіс станаў НА кампанент (унікальны
   `components/…` title), усе сторы-файлы пад `components/`.
5. **Тэсты** — `components/fab.test.tsx` (выключаны стан: прывід-пара,
   адсутнасць полкі і `opacity`, бясполы націск, колер гліфа; прычына злева),
   `components/ad-container.test.tsx` (без рэкламы — нічога ў дрэве; з
   рэкламай — слот 90dp), фота-месца ў `components/guide-card.test.tsx`
   (рамка 64×64 з фота; без фота месца няма — экраны захоўваюць свой
   цяперашні выгляд), `components/section-header.test.tsx` (тэкст + стыль).

## Па-за маштабам (выканана)

- Экраны не пераведзеныя на кампаненты — свае задачы #216–#227.
- Сапраўдны рэкламны SDK — #101.
- Пазнакі тэм як асобны кампанент — не ствараны: у макетах выкарыстоўваюцца
  толькі пазнакі доступу (`AccessBadge` існуе), нейтральны `.tag` кіта ніводным
  экранам не ўжыты.
- Рэгістр `dev-specimen` не пашыраны — ён застаецца мэтай DQ-03 здымкаў для
  чатырох базавых стораў гайда; новыя кампаненты бачныя ў зорніку
  (`kudy:///storybook`) праз glob `components/**/*.stories.tsx`.

## Праверка

Усе каманды запушчаныя на фінальным HEAD галіны ў гэтай сесіі
(`.scratch/ci-local-215.log`):

- `npm run ci:local` — OK, 23 крокі зялёныя: npm test = node --test (3023
  тэсты: 2990 pass, 0 fail, 33 visible skips, 0 cancelled) + jest (46 сьютаў,
  346 тэстаў, 0 fail); `arch:check` — 0 парушэнняў; jscpd — 0 clones;
  gitleaks — OK; web-e2e — OK.
- `npx tsc --noEmit` (app, services, core) — чыста.
- Дэма: `docs/demos/2026-11-11-kit-components.md`
  (`uvx showboat==0.6.1 verify` — exit 0).
- Design-QA рэпарт: `docs/design-qa/reports/2026-11-11-kit-components.md`
  (verdict INSUFFICIENT_EVIDENCE: RULE 0 · DIFF 0 · OPINION 0 ·
  NOT-VERIFIED 3 — здымкі на прыладзе, TalkBack, базы станаў).

## Android E2E

Scope: run=true (кампаненты — не docs-only). На галінцы `1cff6dd`
(APK sha256 `d62aa517…8ae2`): smoke 12/12, walk 5/5, discovery 2 passed /
2 failed — «published teaser is silent until explicit Play» (таймаўт
чакання testID) і «feedback queues offline…» (uiautomator dump failed
within ~300 ms) — клас флейка [#173](https://github.com/kudy-vk/KUDY/issues/173).
Кантроль на чыстым `origin/main` `ddff623` (асобны прогон, свой Metro з
чэкаўту main): discovery падае таксама 2/4, тыя ж два кейсы, тыя ж
dump-таймаўты (`Android E2E: failed (discovery) on ddff623…`). Правал не
ад гэтай змены; smoke і walk зялёныя на абодвух HEAD.
