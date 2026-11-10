# UI-STAR-01 — пяць зорак для ацэнкі гіда — вынік

Задача: [kudy-vk/KUDY#102](https://github.com/kudy-vk/KUDY/issues/102) · выканаўца: ZCode GLM-5.3 · галіна `zcode/102` · кодавы HEAD `f5565e4` · 2026-11-10

## Што зроблена

Уладарскае рашэнне B (2026-11-02, фікс у issue): ацэнка гіда на мабільнай feedback-форме — **пяць зорак без бачных лічбаў**, з даступнымі назвамі для скрынрыдара.

- `app/feedback.tsx` — выбар ацэнкі: пяць зорак праз `CanonIcon` з глыбокім імпартам `lucide-react-native/icons/star` (новай бібліятэкі няма). Запаўненне адзначае дыяпазон 1…N (форма, не колер як адзіны сігнал); колеры — толькі кананічныя токены (`colorAccent` выбраныя, `colorMuted` астатнія). Бачны лічбавы тэкст з кнопак прыбраны; радок-падказка `scaleHint` і сэкцыя прычын не кранутыя.
- `components/canon-icon.tsx` — зваротна-сумяшчальны пастак `fill` у адзіны іконкавы пласт; усе папярэднія выкарыстанні захоўваюць lucide-аўтлайн (дэфолт `fill: "none"` паводле `defaultAttributes`).
- Кантракт без зменаў: той самы `setScore(1..5)`, паўторны выбар, тая ж схема payload, аналітыка, persistence, submit/skip, добраахвольнасць. Вэб-версія формы не кранутая (межы issue).
- Цэлі дотыку: `PressableSurface` накладвае ўласны `touchTarget` мінімум 48×48 dp паверх стылю выкліка (`pressable-surface.tsx`, APR-04) — перавышае патрабаваныя ≥44×44.

## Па крытэрах issue #102

1. **Толькі 5 бачных зорак, без лічбаў** — `app/feedback.tsx` (блок зорак); тэст: `queryByText(starLabel)` пуста для ўсіх 1–5, у дрэве 5 зорак-кнопак.
2. **Значэнне 1–5 без змены схемы, паўторны выбар** — шлях `setScore`/`send` ідэнтычны папярэдняму; існы ахоўны тэст «choosing a star enables the Send; the acked round renders «адпраўлена»» праходзіць без змен; новы тэст фіксуе рэсэлект (4 → 2).
3. **A11y і таргеты** — назва кожнай зоркі = лакалізаваны `native.feedback.starLabel` («N з 5», усе 9 лакаляў у generated каталозе), стан `selected` агучваецца праз `accessibilityState`; таргет 48×48 dp; фокус/кантраст — праз кананічныя токены і `PressableSurface`.
4. **Станы і тэмы** — pressed (dim ≥10% + ripple), selected/unselected (fill+токены), disabled (busy — `accessibilityState.disabled` + прыглушэнне wrapper'ам), light/dark — `useThemeStyles(lightStyles, darkStyles)`; буйны шрыфт — `ScaledText` захаваны для астатніх тэкстаў, зорка — гліф. Прыладны доказ светлай тэмы: [light-theme-stars-device.png](../../design-qa/evidence/UI-STAR-RATING/light-theme-stars-device.png) (копія кадру з E2E-артефактаў `tools/e2e-android/artifacts/2026-11-10T19-48-44-729Z/discovery-feedback/failure.png`) — эмульятар API 35, be-лакаль: 4 зоркі запоўненыя акцэнтам, 5-я аўтлайн, бачных лічбаў няма (кадр з моманту флейку #173, калі E2E-кейс паспяхова тыкнуў star-4). Цёмная тэма на прыладзе — NOT-VERIFIED (гл. Design-QA).
5. **Тэсты і proof** — `app/feedback.test.tsx`: без бачных лічбаў, a11y-назва кожнага значэння, fill дыяпазону, рэсэлект; пакрокавыя аховы ў `canon-icon.test.tsx` (17/17). Дэма: [docs/demos/2026-11-10-ui-star-rating.md](../../demos/2026-11-10-ui-star-rating.md) — `uvx showboat==0.6.1 verify` exit 0.
6. **PR** — адзін PR у `main` па `docs/agent-rules/issue-workflow.md`; паралельныя сесіі ўлічаны (клейм-трансфер зафіксаваны ў issue, галіна з клону).

## Гейты (кодавы HEAD `f5565e4`)

- `npx jest --config jest.config.js app/feedback.test.tsx components/canon-icon.test.tsx --maxWorkers=2` — **17/17 pass** ✅ (revert-аховы: зняццё `fill`-пастака ў `CanonIcon` чырваніць тэст дыяпазону; вяртанне лічбавых кнопак чырваніць тэст адсутнасці лічбаў).
- `npm run ci:local` — **23 крокі зялёныя** (skipped on Linux: windows-portable), `jscpd` — «Found 0 clones.», `guard-required-checks: OK` ✅; прагон на працоўным дрэве, байт-ідэнтычным `f5565e4`.
- `npm test` (поўны, на `f5565e4`): node --test — **3017 тэстаў: 2989 pass, 0 fail, 0 cancelled, 28 skipped**; jest — **42 сюіты / 329 тэстаў pass**, exit 0 ✅.
- Android E2E: `Android E2E: failed (discovery) on f5565e4` — smoke і walk 100% зялёныя (15/15), discovery **2 passed, 2 failed**; гэта тыя ж самыя два кейсы (`nearby-card-offer-place-e2e-1`, `btn-feedback-send`) з тымі ж сэлектарамі і 30-сэкунднымі чыканямі, што і задакументаваны флейк-клас [#173](https://github.com/kudy-vk/KUDY/issues/173). Кантрольны прагон па працэдуры §3 на чыстым `origin/main` (`06e1024`) у той жа дзень на тым жа хасце падае ідэнтычна: `Android E2E: failed (discovery) on 06e1024`, discovery 2/4, smoke+walk зялёныя — падзенне не гэтага дыфа (артэфакты: `tools/e2e-android/artifacts/2026-11-10T19-48-44-729Z` дыф і `2026-11-10T20-08-05-671Z` кантроль; поздні удалы dump у маю гэтую хвіліну паказвае `screen-Feedback`, усе 5 зорак і адсутнасць `btn-feedback-send` з бачнага дрэва — ніжэй згорткі). Сённяшнія дзве кропкі дададзеныя ў #173.
- Mimosa deep audit (паўтор пасля каміт-гукавога ENOBUFS): скан `scan-2026-11-10T20-17-56.135Z-3a1eeefe93c4` (seal `sha256:6330…`), 14 findings — усе ў файлах па-за гэтым дыфам (вядомы трыйяж-клас: postgres.js `unsafe` як назва API, dev-only SSRF guard; параўн. sealed-скан 2026-11-09 на `ecad44d`); у трох змененых файлах — 0 findings; gitleaks (у складзе ci:local) — зялёны ✅.

## Design-QA рэпарт (DQ-05)

**Verdict: NO_VERIFIED_RULE** · RULE 0 · DIFF 0 · OPINION 1 · NOT-VERIFIED 3 · прыладны кадр светлай тэмы: [light-theme-stars-device.png](../../design-qa/evidence/UI-STAR-RATING/light-theme-stars-device.png) (эмульятар API 35, be; запаўненне 1…4 акцэнтам, 5-я аўтлайн — візуальнае пацверджанне формы і дыяпазону; кадр з моманту флейку #173)
**Scope:** PR гэтай задачы, base `06e1024` / head `f5565e4`; змененыя паверхні: feedback-форма (блок ацэнкі), іконкавы пласт (пастак `fill`).
**Sources:** `docs/design/visual-language.md` (машынны блок токенаў + табліца кантрасту); `docs/design-qa/exceptions.md` (каміт `c9fdf54`); issue #102 — уладарскае рашэнне B (2026-11-02) як прыняты крытэр гэтай змены.
**Environment:** праверкі на ўзроўні токенаў і зыходнікаў + render-тэсты jest; прыладныя вымярэнні — гл. NOT-VERIFIED.

Токен-праверкі (зыходнікі + тэсты):
- Колеры зорак — толькі кананічныя токены (`colorAccent`, `colorMuted`; светлая і цёмная пары праз `useThemeStyles`); новых колераў і значэнняў не ўводзілася (канон §10).
- Кантраст: выбраная зорка — `color.accent` на `color.paper`, патрабаваная планка графікі ≥3:1 паводле табліцы канону; тэкставыя подпісы формы не кранутыя. Піксельнае вымярэнне на прыладзе не праводзілася (NOT-VERIFIED).
- Дот-таргет: 48×48 dp — `starTarget` + уласны `touchTarget` `PressableSurface` (APR-04, наносіцца пасля стылю выкліка); `hitSlop` не выкарыстоўваецца (выключэнне рэестру непрыдатнае). 48 dp як канон — па-за рашэннем уладара; тут 48 ≥ 44 з прынятага крытэра issue #102.
- Icon-only подпісы (§9): кожная зорка мае лакалізаваную a11y-назву `native.feedback.starLabel` («N з 5») і агучаны `selected` праз `accessibilityState`; `CanonIcon` выкідвае памылку на пустым подпісе (тэст існуе).
- Станы: pressed (dim ≥10% + ripple), selected/unselected (fill дыяпазону + токены колеру — сігнал формай, не колерам адзіна), disabled (busy праз `accessibilityState.disabled` + прыглушэнне wrapper'ам).
- Paper-grain, DT-4, DT-6 — не дакранаюцца (мапы і splash у дыфе няма).

[OPINION] Памер гліфа зоркі 24 фікаваны літаралам (не токен) — санкцыянаваны шлях explicit-override `CanonIcon`; прычына: дэфолт 16px чытаецца як тэкст, не як кантрола. Не ў каноне; не блакіруе.
[NOT-VERIFIED] Піксельны кантраст і рэндэр цёмнай тэмы на прыладзе: светлая тэма маецы кадр (гл. scope вышэй), цёмнай — патрэбны асобны захоп; у visual:check няма baseline для feedback-формы.
[NOT-VERIFIED] TalkBack/скрынрыдар: агучванне «N з 5» і selected на рэальнай прыладзе.
[NOT-VERIFIED] Буйны шрыфт 1,25×, маленькія экраны і ўсе падтрыманыя лакалі на прыладзе.

Second pass: RULE-кандыдатаў не вылучалася (адпраўныя кандыдаты «48dp без канона» і «літарал 24» адкінутыя як OPINION — першая крыніца: exceptions.md «Мэта 48 dp да рашэння ўладальніка — толькі OPINION»; другая: тэст `canon-icon.test.tsx` санкцыануе explicit override). Табліца DIFF пустая: зацверджанага baseline для feedback-формы няма (гл. NOT-VERIFIED).

## Межы захаваныя

- Вэб-версія feedback-формы, картка Run, сістэма водгуку па-за выбарам рэйтынгу, новыя механікі ацэнкі, публічныя рэйтынгі, API/analytics/DB — не кранутыя.
- Токены і канон дызайну не змяняліся: новыя колеры/памеры не ўводзіліся (fill выкарыстоўвае `colorAccent`).
