# Даведнік «Пра горад» з рэзервовага фрагмента меню

*2026-11-10 by Showboat 0.6.1*

Навігацыя: `reserve-1` адкрывае `screen-AboutCity` і вяртаецца назад, даведнік рэндэрыцца цалкам без сеткі. Слоўная база і брамы i18n.

```bash
set -eo pipefail
cd "$KUDY_CHECKOUT"
npx jest --config jest.config.js app/menu.test.tsx app/city/about-city.test.tsx 2>&1 | grep -E "^(Tests|Test Suites):" | tr -d '\r'
```

```output
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

```bash
set -eo pipefail
cd "$KUDY_CHECKOUT"
npm run messages:generate:check 2>&1 | grep "generated messages" | tr -d '\r'
```

```output
generated messages: 18 files fresh
```
