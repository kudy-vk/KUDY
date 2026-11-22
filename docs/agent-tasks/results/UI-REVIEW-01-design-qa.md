# Дызайн-QA — UI-REVIEW-01

- Verdict: **INSUFFICIENT_EVIDENCE**
- Counts: **RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 3**
- Scope: issue [#98](https://github.com/kudy-vk/KUDY/issues/98), PR [#388](https://github.com/kudy-vk/KUDY/pull/388) (база `87b9d416cabddec6885dbe590869ab1440167b12`, разглядзены head `4dfe783da78c92dc530fd762c4a26a7e8d8ffc66`), галіна `codex/98`; дакументальны пакет. База чытання канону `ecad44d1eaa48ec5f136c16e02d2b0bf0f9f8c29` і апошні каміт макетаў `bf73bc56e91da3d693a97abdd2cd914d72ce9d6e` — абодва ўваходзяць у разглядзены head (`git merge-base --is-ancestor`), артыфакты праверкі (дошка макетаў і здымкі `docs/design/brand/outputs/UI-REVIEW-01/`, замеры Playwright) адпавядаюць гэтаму head: пасля `bf73bc56` не змянялася тэчка артыфактаў `docs/design/brand/outputs/UI-REVIEW-01/` (пусты `git diff bf73bc56..4dfe783d` на гэтую тэчку); кананічны каталог (`docs/design/catalog.md`) на разглядзеным head — вынік main-камітаў па-за гэтай праверкай. Зменены толькі дакумент і макеты Play/Pause для Run, production UI не змяняўся.
- Sources: на базе `ecad44d1` прачытаныя [візуальны канон](../../design/visual-language.md) §2, §4–5, §9, [пераходы Run](../../design/screens-and-transitions.md) §Run, [рэестр прынятых рашэнняў](../../design/brand/decisions.md) DT-2/DT-4 і [выключэнні](../../design-qa/exceptions.md). Прапанаваныя макеты не лічацца канонам.
- Environment: Chromium/Playwright на Linux, макет 320/360/390 CSS px, светлая і цёмная тэмы, візуальная мадэль высокага кантрасту, тэкст 1×/1,25×; у Full на 320 px доўгі тэкст пракручаны да канца над ніжнім плэерам. Прылада, API, TalkBack/VoiceOver, рэальны forced-colors і production fixture — **NOT-VERIFIED**.

## DIFF

| Паверхня / стан | Ухваленая база | Бягучы PNG | Розніца PNG | Рэгіён / парог | Вердыкт уладальніка |
|---|---|---|---|---|---|

Эквівалентнай ухваленай базы для гуку ў Run няма. [Сапраўдны здымак Run](../../../testing/evidence/2026-10-11-g727/run-active.png) не мае актыўнага гуку; [здымкі макетаў](../../design/brand/outputs/UI-REVIEW-01/board.html) выкарыстоўваюць яго як падкладку і перамалёўваюць элементы. Таму DIFF не прысвойваецца.

## Знаходкі

[NOT-VERIFIED] Run / Play і Pause / native / абедзве тэмы. Няма актуальных эквівалентных здымкаў зборкі з актыўным гукам, ухваленай базы і PNG-розніцы. Для параўнання патрэбныя здымкі з аднолькавымі fixture, прыладай, маштабам, мовай і commit SHA.

[NOT-VERIFIED] Run / кнопкі і фокус / прылада. Playwright замерыў 48×48 CSS px і паказаў `aria-label` у макеце; TalkBack/VoiceOver, парадак фокусу, фактычны touch target, сістэмны высокі кантраст і піксельны кантраст production не правераныя. Патрэбныя прыладавыя здымкі, accessibility tree і замер паверхні.

[NOT-VERIFIED] Run / Half і Full / фота і дарожка. У макеце фота — [раней згенераваная ілюстрацыя-запаўняльнік](../../design/brand/outputs/mobile-welcome-2026-10-19/art/08-night-harbor.jpg), не фота гісторыі; дарожка ў Half/Full — прапанова. Фактычны медыяасэт і прыладавая праверка выявы паводле [DQ-11](../../design-qa/image-checklist.md) адсутнічаюць.

## Другі праход: адхіленыя кандыдаты RULE

- 48 dp не аформлены як RULE: [палітыка QA](../../agent-rules/design-qa.md) называе гэтую мэту меркаваннем да рашэння ўладальніка. Памер у макеце правераны, але прылада не праверана.
- Адсутнасць пастаяннай дарожкі ў Half/Full не аформлена як RULE: [кантракт Run](../../11_run_interaction.md) апісвае фота і тэкст раскрытай панэлі, але не зацвярджае такую дарожку. Гэта адкрытая UX-прапанова.
- Светлая мапа ў цёмнай тэме адпавядае прынятаму DT-4 і [рэестру выключэнняў](../../design-qa/exceptions.md).

21.11.2026 уладальнік [ухваліў варыянт A](https://github.com/kudy-vk/KUDY/issues/98#issuecomment-7070333301) для пары Play/Pause. Гэта рашэнне выбірае форму іконак, але не змяняе вердыкт **INSUFFICIENT_EVIDENCE**: эквівалентная production-база, прылада, TalkBack/VoiceOver і фактычны кантраст застаюцца NOT-VERIFIED. Агульны выгляд Run не зацверджаны.
