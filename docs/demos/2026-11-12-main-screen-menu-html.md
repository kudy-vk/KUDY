# Галоўны экран паводле фінальнага макету menu.html (#216)

*2026-11-12T20:05:00Z by Showboat 0.6.1*
<!-- showboat-id: 216-main-screen-menu-html -->

Экран «Меню» пераносіць ухвалены макет (рашэнні M2/M4/M5/M6/M11): шапка KUDY
+ назва горада + загаловак «Куды сёння?» праз кантракт на дзевяці мовах,
часткі карты без бачных подпісаў — іконкі ў медальёнах (лямпачка замест
кампаса, пясочны гадзіннік на неактыўных), бляклая частка аддае колер на
націск, пад блокам — гравюрная панарама з адзінай чыстай крыніцы малюнка,
зона рэкламы апошняя і знікае без банэра. Дэма: тэсты экрана і рэндэрэра
мапы, гарды цёмнай тэмы з новымі токенамі, вызначанасць панарамы і варта
перакладаў. Здымкі прылады — асобна ў design-QA (NOT-VERIFIED да прагону
эмулятара).

```bash
set -o pipefail
npx jest --config jest.config.js --runInBand --silent --runTestsByPath app/menu.test.tsx docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx 2>&1 | sed -E 's/ \([0-9.]+ s\)//g' | grep -E '^(PASS|FAIL|Test Suites:|Tests:)' | LC_ALL=C sort | tr -d '\r'
```

```output
PASS app/menu.test.tsx
PASS docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

```bash
set -o pipefail
node --test --experimental-strip-types --test-reporter=spec test/panorama-paths.test.mjs test/design-dark-theme.test.mjs 2>&1 | sed -E 's/ \([0-9.]+m?s\)//g' | grep -E '^(✔|✖)' | tr -d '\r'
npm run messages:check 2>&1 | grep 'check-messages:'
```

```output
✔ the approved spec mirrors the canon and cites the owner decision
✔ the readable token table agrees with both canon themes
✔ the measured contrast table agrees with the approved values
✔ dark tokens plus the cartography zone cover every canon color token exactly once
✔ every dark token value is a hex color different from its light value
✔ surface pairs hold in both themes at the canon thresholds
✔ cartography pairs keep the light values in both themes (MVP zone rule)
✔ the zone rule exists because partial theming breaks the marker letter
✔ tier-2 dark cartography candidates hold the thresholds
✔ behavior fixes the three choices and records the confirmed system default
✔ guard is wired into npm test (implementation-rules 1 and 7)
✔ the panorama drawing is deterministic and shared by the mockups and the app
check-messages: shipped locales complete, reviewed and fresh
```
