# nn, rm, ka, hy, az у UI — EU-UI-06 (#395)

Галіна `zcode/395` дадае нюнорск (nn — Nynorsk), ретароманскую (rm — Rumantsch Grischun), грузінскую (ka — ქართული), армянскую (hy — Հայերեն) і азербайджанскую (az — Azərbaycan dili) мовы інтэрфейсу — астатнія афіцыйныя мовы еўрапейскіх дзяржаваў з аўдіту §5 — у рэестр моваў (43 коды), глосарыюс (35 новых блокаў), наборы перакладаў (па 299 запісаў са статусам approved і правераным reviewedSourceHash), генератар (52 выхады) і ўсе 9 адаптараў селектараў. Гэта фінальная хваля эпіку EU-UI (#376).

```bash
node --no-warnings --experimental-strip-types tools/i18n/generate-messages.mjs --check && node --no-warnings --experimental-strip-types tools/i18n/check-messages.mjs
```

```output
generated messages: 52 files fresh
check-messages: shipped locales complete, reviewed and fresh
```

```bash
node --no-warnings --experimental-strip-types --test --test-reporter=tap test/ui-locale-registry.test.mjs test/ui-messages-nn-rm-ka-hy-az-render.test.mjs | grep -E '^(ok|not ok) [0-9]+ -'
```

```output
ok 1 - the registry defines the eight requested UI codes plus zh, nb, pl, da, nl, pt, it, fi, lt, et, lv, sk, hu, sl, hr, ro, bg, el, sr, bs, mk, sq, is, ga, mt, ca, tr, ru, lb, cnr, nn, rm, ka, hy and az, with native names, once (criterion 1)
ok 2 - the complete set is be/en/uk/de/es/fr/cs/sv/zh/nb/pl/da/nl/pt/it/fi/lt/et/lv/sk/hu/sl/hr/ro/bg/el/sr/bs/mk/sq/is/ga/mt/ca/tr/ru/lb/cnr/nn/rm/ka/hy/az — all forty-three registered UI codes (criterion 4)
ok 3 - every complete locale renders every registered native message family (criterion 5)
ok 4 - the store derives its vocabulary from the registry and keeps unknown-input semantics (criterion 4)
ok 5 - the release resolver keeps the frozen eight open when the flag is absent, empty or corrupt (criterion 1)
ok 6 - the release resolver opens a registered complete code only when the flag names it, additively (criterion 1)
ok 7 - the EU-UI-06 locales (nn, rm, ka, hy, az) route through native and web selectors with idiomatic menu names
ok 8 - the nn/rm/ka/hy/az discrete time-cap forms switch at 60/120/240 and interpolate the base
ok 9 - the nn/rm/ka/hy/az web catalogues render through getUiStrings with the be key shape
```

```bash
node --no-warnings --experimental-strip-types --test tools/i18n/privacy-disclosure.test.mjs test/ui-messages-number-render.test.mjs contracts/ui-messages/glossary.test.mjs contracts/ui-messages/translations.test.mjs | grep -E '^ℹ (tests|pass|fail)'
```

```output
ℹ tests 512
ℹ pass 512
ℹ fail 0
```
