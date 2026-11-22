# hr, ro, bg, el, sr, bs, mk, sq у UI — EU-UI-03 (#379)

Галіна `zcode/379` дадае харвацкую (hr — Hrvatski), румынскую (ro — Română), балгарскую (bg — Български), грэчаскую (el — Ελληνικά), сербскую (sr — Српски, кірыліца), баснійскую (bs — Bosanski), македонскую (mk — Македонски) і албанскую (sq — Shqip) мовы інтэрфейсу ў рэестр моваў (30 кодаў), глосарыюс (56 новых блокаў), наборы перакладаў (па 299 запісаў са статусам approved і правераным reviewedSourceHash), генератар (39 выхадаў) і ўсе 9 адаптараў селектараў з аўтарскай транскрэацыяй меню і сціснутымі подпісамі кнопак у межах бюджэтаў спецыфікацыі.

```bash
node --no-warnings --experimental-strip-types tools/i18n/generate-messages.mjs --check && node --no-warnings --experimental-strip-types tools/i18n/check-messages.mjs
```

```output
generated messages: 44 files fresh
check-messages: shipped locales complete, reviewed and fresh
```

```bash
node --no-warnings --experimental-strip-types --test --test-reporter=tap test/ui-locale-registry.test.mjs test/ui-messages-hr-ro-bg-el-sr-bs-mk-sq-render.test.mjs | grep -E '^(ok|not ok) [0-9]+ -'
```

```output
ok 1 - the registry defines the eight requested UI codes plus zh, nb, pl, da, nl, pt, it, fi, lt, et, lv, sk, hu, sl, hr, ro, bg, el, sr, bs, mk, sq, is, ga, mt, ca and tr, with native names, once (criterion 1)
ok 2 - the complete set is be/en/uk/de/es/fr/cs/sv/zh/nb/pl/da/nl/pt/it/fi/lt/et/lv/sk/hu/sl/hr/ro/bg/el/sr/bs/mk/sq/is/ga/mt/ca/tr — all thirty-five registered UI codes (criterion 4)
ok 3 - every complete locale renders every registered native message family (criterion 5)
ok 4 - the store derives its vocabulary from the registry and keeps unknown-input semantics (criterion 4)
ok 5 - the release resolver keeps the frozen eight open when the flag is absent, empty or corrupt (criterion 1)
ok 6 - the release resolver opens a registered complete code only when the flag names it, additively (criterion 1)
ok 7 - the EU-UI-03 locales (hr, ro, bg, el, sr, bs, mk, sq) route through native and web selectors with idiomatic menu names
ok 8 - the hr/ro/bg/el/sr/bs/mk/sq discrete time-cap forms switch at 60/120/240 and interpolate the base
ok 9 - the hr/ro/bg/el/sr/bs/mk/sq web catalogues render through getUiStrings with the be key shape
```

```bash
node --no-warnings --experimental-strip-types --test tools/i18n/privacy-disclosure.test.mjs test/ui-messages-number-render.test.mjs contracts/ui-messages/glossary.test.mjs contracts/ui-messages/translations.test.mjs | grep -E '^ℹ (tests|pass|fail)'
```

```output
ℹ tests 423
ℹ pass 423
ℹ fail 0
```
