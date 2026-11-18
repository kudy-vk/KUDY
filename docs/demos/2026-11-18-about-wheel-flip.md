# «Пра горад»: кантэнт перагортваецца разам з колам (#252)

*2026-11-18T00:20:00Z by Showboat 0.6.1*
<!-- showboat-id: 8f4d2b1c-5e9a-4f77-b2a3-1c6d0e8a9f41 -->

Раздзелы «Пра горад» больш не слайдзяцца з боку павароту кола (стары слайд 220 мс на агульным `Animated.Value` мог заліпнуць на зруху ±18 px пры хуткім гарце — зрух кантэнту ўлева на скрынках уладальніка). Кантэнт — паласа з пяці старонак-раздзелаў на тым жа кальцы, што і медалі кола: гарт ці націск на кола перагортвае кантэнт, як карусель відарысаў у пасце Instagram (просьба ўладальніка 2026-11-17). Прыведзеныя каманды паведамляюць пра геаметрыю кальца і актыўную старонку, пра праверкі экрана з колам і картай (42 праверкі) і пра месцы архітэктуры.

```bash
set -o pipefail
npx jest --config jest.config.js --runInBand --silent --runTestsByPath components/about-city-wheel.test.tsx components/about-city-pages.test.tsx app/city/about-city.test.tsx components/about-city-map.test.tsx 2>&1 | sed -E 's/ \([0-9.]+ s\)//g' | grep -E '^(PASS|FAIL|Test Suites:|Tests:)' | LC_ALL=C sort | tr -d '\r'
```

```output
PASS app/city/about-city.test.tsx
PASS components/about-city-map.test.tsx
PASS components/about-city-pages.test.tsx
PASS components/about-city-wheel.test.tsx
Test Suites: 4 passed, 4 total
Tests:       42 passed, 42 total
```

```bash
set -o pipefail
npm run arch:check 2>&1 | tail -1
```

```output
arch:check: OK — 793 modules cruised, 0 violation(s) pass via the baseline dated 2026-10-02
```
