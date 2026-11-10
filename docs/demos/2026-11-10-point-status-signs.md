# Адзіныя знакі станаў кропак (#213)

*2026-11-10T22:34:22Z by Showboat 0.6.1*
<!-- showboat-id: 3b44124b-4077-4335-9f16-90101fec997b -->

Пяць розных знакаў M7 адлюстроўваюцца адным кампанентам на карце, у картцы і ў спісе. Тэсты правяраюць таксама кананічныя колеры і подпісы. Здымкі на Android яшчэ не пацверджаныя.

```bash
set -o pipefail
npx jest --config jest.config.js --runInBand --silent --runTestsByPath components/point-status-sign.test.tsx components/run-native-map.test.tsx app/run.test.tsx 2>&1 | sed -E 's/ \([0-9.]+ s\)//g' | grep -E '^(PASS|FAIL|Test Suites:|Tests:)' | LC_ALL=C sort | tr -d '\r'

```

```output
PASS app/run.test.tsx
PASS components/point-status-sign.test.tsx
PASS components/run-native-map.test.tsx
Test Suites: 3 passed, 3 total
Tests:       59 passed, 59 total
```
