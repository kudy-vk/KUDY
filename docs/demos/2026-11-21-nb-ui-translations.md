# nb, pl, da, nl, pt у UI і абнаўленне меню ды кароткіх подпісаў

*2026-11-21T21:22:16Z by Showboat 0.6.1*
<!-- showboat-id: a5479da4-9f86-430d-87ab-54764f0fef13 -->

Галіна codex/nb-ui-translations дадае нарвежскую (nb — Norsk bokmål), польскую (pl — Polski), дацкую (da — Dansk), нідэрландскую (nl — Nederlands) і партугальскую (pt — Português) мовы інтэрфейсу ў рэестр моваў, гласарый, наборы перакладаў (па 299 запісаў), генератар (23 выхадныя файлы) і ўсе 9 адаптараў селектараў, а таксама прымяняе ўхваленыя змены капірайтынгу: жывыя назвы пунктаў меню па мовах, скарачэнне доўгіх подпісаў і чыстку тэхніцызмаў ды памылак у source.json.

```bash
node --no-warnings --experimental-strip-types tools/i18n/generate-messages.mjs --check && node --no-warnings --experimental-strip-types tools/i18n/check-messages.mjs
```

```output
generated messages: 23 files fresh
check-messages: shipped locales complete, reviewed and fresh
```

```bash
node --no-warnings --experimental-strip-types --test --test-reporter=tap test/ui-locale-registry.test.mjs test/ui-messages-nb-render.test.mjs | grep -E '^(ok|not ok) [0-9]+ -'
```

```output
ok 1 - the registry defines the eight requested UI codes plus zh, nb, pl, da, nl and pt, with native names, once (criterion 1)
ok 2 - the complete set is be/en/uk/de/es/fr/cs/sv/zh/nb/pl/da/nl/pt — all fourteen registered UI codes (criterion 4)
ok 3 - every complete locale renders every registered native message family (criterion 5)
ok 4 - the store derives its vocabulary from the registry and keeps unknown-input semantics (criterion 4)
ok 5 - the release resolver keeps the frozen eight open when the flag is absent, empty or corrupt (criterion 1)
ok 6 - the release resolver opens a registered complete code only when the flag names it, additively (criterion 1)
ok 7 - the chrome adapter routes nb to the Norwegian Bokmål catalogue
ok 8 - the Norwegian discrete forms render over the selector arguments
ok 9 - the Norwegian preview detail renders the named kind forms
ok 10 - every Norwegian controller family routes and renders its words
ok 11 - the Norwegian web catalogue renders through getUiStrings with the same key shape
ok 12 - the GOT 2025 top locales (pl, da, nl, pt) route through native and web selectors with idiomatic menu names
```
