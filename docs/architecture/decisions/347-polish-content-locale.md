# 347 — польская кантэнтная хваля: allowlist локаль пашыраецца на pl

**Дата:** 2026-11-20. **Задача:** kudy-vk/KUDY #347. **Тып:** рэкорд рашэння.

| | |
|---|---|
| Статус рашэння | **прынята** — уладарскае рашэнне па эпіку аўдыё-фабрыкі Selfer (vokhandcrafts/Selfer #262, хваля AF6/#269): трэцяя аўдыё-хваля фабрыкі — pl. Картка #347 узнікла з voka Major-3 у Selfer PR #306: pl-аўдыё не праходзіў валідацыю кантэнт-бандла |
| Уваходы | эпік аўдыё-фабрыкі Selfer #262 з рашэннямі ўладара (#263); AF6 — Selfer #269; KUDY #347; прэцэдэнт пашырэння хвалі — [ADR G21.42](G21.42-chinese-language.md) (§4 — улада пашырэння, §11 — гейт бачнасці) |
| Абсяг | толькі кантэнтныя кантракты і іх люстэркі; вытворчы pl-кантэнт — па планах фабрыкі, не гэтай зменай |

## 1. Рашэнне

`pl` — дзясятая лакаля кантэнтнай хвалі (тэкст і аўдыё), побач з дзевяцю дзеючымі (be/en/uk/de/es/fr/cs/sv/zh). pl — мова турыстаў Труймястага, якую фабрыка аўдыёгідаў мусіць пакрываць; без запісу ў схемах pl-пакет не праходзіць валідацыю кантэнт-бандла.

| Файл (уладнік факту) | Змена |
|---|---|
| `contracts/schemas/media.schema.json` | enum `locale` + `pl` |
| `contracts/schemas/localized-text.schema.json` | `propertyNames.enum` + `pl`; `maxProperties` 9→10; апісанне |
| `contracts/schemas/catalog.schema.json` | route `locales`: enum + `pl`, `maxItems` 9→10 |
| `contracts/schemas/feedback-target.schema.json` | абедзве галіны: enum + `pl` |
| `contracts/schemas/discovery-index.schema.json` | `text_locales`/`audio_locales`: enum + `pl`, `maxItems` 9→10 |
| `contracts/schemas/voice.schema.json` | enum + `pl` — сторыя любога пласту патрабуюць галасоў сваёй мовы (`validate-package.mjs` `voice-locale-mismatch`), таму pl-сторыі немагчымыя без pl-запісу ў даведніку галасоў; прэцэдэнт — fr-голас у G21.16. zh у даведніку не з'яўляецца: чакае TTS-пілот G21.49 |
| `contracts/wire/wire-types.ts` | рэгенерацыя — генератар выводзіць пералік з `localized-text.schema.json` (кананічны ўладальнік) і fail-closed на люзр |
| `tools/validate/validate-package.mjs` | `MEDIA_LOCALES` — заяўленае люстэрка enum-у `media.schema.json`; адноўлена вербатыўная сінхранізацыя (zh дабаўлены як струмлены прапушчаны код) + `pl` |
| `contracts/README.md` | радок allowlist-у кантэнтных тыпаў |

## 2. Што не мяняецца

| Мяжа | Чаму |
|---|---|
| zh у `voice.schema.json` | zh-аўдыё адкладзена да вынікаў TTS-пілота (G21.42 §2, §6); pl-агучка прыходзіць з фабрыкі ўжо ў гэтай хвалі |
| UI-рэестр (`contracts/ui-locales.ts`, `COMPLETE_UI_LOCALES`), пераклады `ui-messages/`, вэб-маршруты | pl — не мова інтэрфейсу; пікер і каталогі слоў недакранутыя |
| `tools/build-bundle/build-bundle.mjs` `LOCALE_ALLOWLIST` | аўтарскі pipeline рэпо (у ім таксама няма zh — прэцэдэнт G21.42 §4); фабрычны pl-кантэнт ідзе пакетам праз `validate-package`, не праз аўтарскае дрэва рэпо |
| Гейт бачнасці [G21.42 §11](G21.42-chinese-language.md) | гэтая змена не робіць pl бачнай карыстальніку ні ў адной паверхні; бачнасьць наступіць толькі з фактычнай публікацыяй pl-кантэнту |

## 3. Праверы

- Схемныя тэсты (`contracts/contracts.test.mjs`): pl праходзіць media/voice/feedback-target/catalog/localized-text/discovery-availability; 11-я лакаля падае на `maxProperties`/`maxItems`; невядомы код (`ua`) падае — пін «reserved» перапісаны з pl (яна ўвайшла ў хвалю) на `ua`.
- Валідатар пакета (`tools/validate/validate-package.test.mjs`): pl-аўдыё-пласт (сторыі з pl-голасам, аўдыё-файл, медыязапіс, availability) праходзіць end-to-end; pl-файл пад чужой лакаляй запісу — `media-locale-mismatch` (revert-праверка люстэркі).
- Фікстура `index-invalid-unknown-locale.json` (`ua`) застаецца чырвонай.
