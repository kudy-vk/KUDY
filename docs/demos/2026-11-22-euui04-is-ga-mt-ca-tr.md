# is, ga, mt, ca, tr у UI — EU-UI-04 (#380)

Галіна `zcode/380` дадае ісландскую (is — Íslenska), ірландскую (ga — Gaeilge), мальтыйскую (mt — Malti), каталонскую (ca — Català) і турэцкую (tr — Türkçe) мовы інтэрфейсу ў рэестр моваў (35 кодаў), глосарыюс (35 новых блокаў), наборы перакладаў (па 299 запісаў са статусам approved і правераным reviewedSourceHash), генератар (44 выхады) і ўсе 9 адаптараў селектараў з аўтарскай транскрэацыяй меню і сціснутымі подпісамі кнопак у межах бюджэтаў спецыфікацыі.

```bash
node --no-warnings --experimental-strip-types tools/i18n/generate-messages.mjs --check && node --no-warnings --experimental-strip-types tools/i18n/check-messages.mjs
```

```output
generated messages: 47 files fresh
check-messages: shipped locales complete, reviewed and fresh
```

```bash
node --no-warnings --experimental-strip-types --test --test-reporter=tap test/ui-locale-registry.test.mjs test/ui-messages-is-ga-mt-ca-tr-render.test.mjs | grep -E '^(ok|not ok) [0-9]+ -'
```

```output
ok 1 - the registry defines the eight requested UI codes plus zh, nb, pl, da, nl, pt, it, fi, lt, et, lv, sk, hu, sl, hr, ro, bg, el, sr, bs, mk, sq, is, ga, mt, ca, tr, ru, lb and cnr, with native names, once (criterion 1)
ok 2 - the complete set is be/en/uk/de/es/fr/cs/sv/zh/nb/pl/da/nl/pt/it/fi/lt/et/lv/sk/hu/sl/hr/ro/bg/el/sr/bs/mk/sq/is/ga/mt/ca/tr/ru/lb/cnr — all thirty-eight registered UI codes (criterion 4)
ok 3 - every complete locale renders every registered native message family (criterion 5)
ok 4 - the store derives its vocabulary from the registry and keeps unknown-input semantics (criterion 4)
ok 5 - the release resolver keeps the frozen eight open when the flag is absent, empty or corrupt (criterion 1)
ok 6 - the release resolver opens a registered complete code only when the flag names it, additively (criterion 1)
ok 7 - the EU-UI-04 locales (is, ga, mt, ca, tr) route through native and web selectors with idiomatic menu names
ok 8 - the is/ga/mt/ca/tr discrete time-cap forms switch at 60/120/240 and interpolate the base
ok 9 - the is/ga/mt/ca/tr web catalogues render through getUiStrings with the be key shape
```

```bash
node --no-warnings --experimental-strip-types --test tools/i18n/privacy-disclosure.test.mjs test/ui-messages-number-render.test.mjs contracts/ui-messages/glossary.test.mjs contracts/ui-messages/translations.test.mjs | grep -E '^ℹ (tests|pass|fail)'
```

```output
ℹ tests 457
ℹ pass 457
ℹ fail 0
```
