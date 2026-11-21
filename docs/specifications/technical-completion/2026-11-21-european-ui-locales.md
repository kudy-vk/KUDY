# Еўрапейскія мовы інтэрфейсу KUDY і натуральная адаптацыя меню

*Дата: 2026-11-21 · Галіна: `codex/nb-ui-translations`*

## 1. Мэта і кантэкст

Паводле справаздачы Gdańska Organizacja Turystyczna (GOT, *Ruch turystyczny w Gdańsku w 2025 roku*, гл. `docs/content/about-city-knowledge.md` §9) і патрабавання ўласніка праекта:

1. Усе краіны з топу турыстычнага патоку Гданьска павінны мець уласны моўны інтэрфейс.
2. Пункты меню і кароткія элементы кіравання не перакладаюцца даслоўна, а маюць натуральны ідыяматычны адпаведнік у кожнай мове (транскрэацыя назваў меню, кароткія кнопкі да 12–16 знакаў для вузкіх экранаў `320×640` і павялічанага шрыфту `×1.5–2.0`).
3. Паدтрымка пашыраецца на ўсе афіцыйныя дзяржаўныя мовы краін Еўропы.

## 2. Зроблена ў `codex/nb-ui-translations` (хваля 1 — 14 моваў)

У галіне `codex/nb-ui-translations` завершаныя:

- Абноўленыя 22 запісы ў `contracts/ui-messages/source.json` (`be`): выпраўленыя памылкі (`праслухана`, `у каталогу`), прыбраныя тэхніцызмы ў паведамленнях пра памылкі, прымененыя рашэнні ўласніка з [#37](https://github.com/kudy-vk/KUDY/issues/37) (`Гісторыя прагулак`, `гід` замест `гайд`), скарочаныя подпісы кнопак (`Дзе я`, `Да гіда`) і ўкладак кола «Пра горад».
- Выкананая сэнсавая адаптацыя (транскрэацыя) меню і скарачэнне доўгіх подпісаў у 8 існуючых мовах (`en`, `uk`, `de`, `es`, `fr`, `cs`, `sv`, `zh`).
- Дададзеныя 5 новых поўных моўных набораў інтэрфейсу (па 299 запісаў кожны, 7 тэрмінаў у `glossary.json`, рэестр `contracts/ui-locales.ts`, генератар `tools/i18n/generate-messages.mjs` і 9 адаптараў селектараў):
  - `nb` (`Norsk bokmål`) — Нарвегія (Скандынавія, топ-2 замежнага патоку GOT 2025, 22%)
  - `pl` (`Polski`) — Польшча (краіна прыёму, 67% усіх гасцей Гданьска)
  - `da` (`Dansk`) — Данія (Скандынавія, топ-2 замежнага патоку GOT 2025, 22%)
  - `nl` (`Nederlands`) — Нідэрланды (топ-9 замежнага патоку GOT 2025, 2%)
  - `pt` (`Português`) — Партугалія

## 3. Наступныя задачы (хвалі 2–5 — астатнія мовы са справаздачы GOT і дзяржаўныя мовы Еўропы)

Кожная задача дадае поўны набор `contracts/ui-messages/translations/<code>.json` (299 запісаў), 7 тэрмінаў у `contracts/ui-messages/glossary.json`, запіс у `contracts/ui-locales.ts`, выхады ў `tools/i18n/generate-messages.mjs`, галіны ў 9 адаптарах селектараў і тэсты рэндэрынгу ды `privacy-disclosure.test.mjs`.

| Задача | Мовы | Склад і абгрунтаванне | Issue |
|---|---|---|---|
| **EU-UI-01** | `it`, `fi`, `lt` | Астатнія краіны з топу замежных турыстаў GOT 2025: Італія (`Italiano`, 4%), Фінляндыя (`Suomi`, 3%), Літва (`Lietuvių`, 2%) | [#377](https://github.com/kudy-vk/KUDY/issues/377) |
| **EU-UI-02** | `et`, `lv`, `sk`, `hu`, `sl` | Балтыйскія і цэнтральнаеўрапейскія дзяржаўныя мовы ЕС: Эстонія (`Eesti`), Латвія (`Latviešu`), Славакія (`Slovenčina`), Венгрыя (`Magyar`), Славенія (`Slovenščina`) | [#378](https://github.com/kudy-vk/KUDY/issues/378) |
| **EU-UI-03** | `hr`, `ro`, `bg`, `el`, `sr`, `bs`, `mk`, `sq` | Паўднёва-ўсходняя Еўропа і Балканы: Харватыя (`Hrvatski`), Румынія (`Română`), Балгарыя (`Български`), Грэцыя (`Ελληνικά`), Сербія (`Српски`), Боснія і Герцагавіна (`Bosanski`), Паўночная Македонія (`Македонски`), Албанія (`Shqip`) | [#379](https://github.com/kudy-vk/KUDY/issues/379) |
| **EU-UI-04** | `is`, `ga`, `mt`, `ca`, `tr` | Астраўныя, малыя і сумежныя дзяржаўныя мовы Еўропы: Ісландыя (`Íslenska`), Ірландыя (`Gaeilge`), Мальта (`Malti`), Андора (`Català`), Турцыя (`Türkçe`) | [#380](https://github.com/kudy-vk/KUDY/issues/380) |

Эпік у GitHub Issues: [#376](https://github.com/kudy-vk/KUDY/issues/376).

## 4. Правілы капірайтынгу і абмежаванні даўжыні для ўсіх хваляў

1. **Меню — сэнсавыя адпаведнікі, не калькі**:
   - `discoveryTitle` / `whatToDo`: жывы мясцовы выраз для «Чым заняцца / Адкрывай / Планы» (не даслоўны пераклад «Што паглядзець»).
   - `aboutCity`: «Практычны гід / Карысна ведаць / Пра горад» (да 16 знакаў).
   - `whereToToday` / `kudyLink`: жывое запрашэнне да прагулкі («Куды сёння? / Куды ідзём?»).
   - `pastWalks`: «Гісторыя прагулак» (рашэнне ўласніка ў [#37](https://github.com/kudy-vk/KUDY/issues/37)).
2. **Бюджэт даўжыні**:
   - `native.run.recenter` ≤ 14 знакаў (`Gdzie jestem`, `Find mig`, `Waar ben ik`, `Onde estou`).
   - `native.place.guideLink` ≤ 16 знакаў (`Do przewodnika`, `Til guiden`, `Naar gids`, `Ver guia`).
   - `native.chrome.access.paid` ≤ 10 знакаў (`Płatny`, `Betalt`, `Betaald`, `Pago`).
3. **Кантракт і праверка**:
   - `npm run messages:generate:check && npm run messages:check`
   - `node --experimental-strip-types --test test/ui-locale-registry.test.mjs tools/i18n/privacy-disclosure.test.mjs contracts/ui-messages/glossary.test.mjs contracts/ui-messages/translations.test.mjs`
