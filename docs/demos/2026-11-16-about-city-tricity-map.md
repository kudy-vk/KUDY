# Карта Труймяста ў «Пра горад» (#303)

*2026-11-16T16:41:56Z by Showboat 0.6.1*
<!-- showboat-id: 225883f7-16ef-4152-bb1a-27e933c410d0 -->

Раздзел «Дзе што ў горадзе» нясёць зацверджаную карту Труймяста з макета
#248: геаметрыя і даныя — тыя самыя чыстыя модулі макета (без капіявання),
камер — RNGH над чыстым станам, стрыжні і штрыхі трымаюць шырыню экрана.
Прыклады паведамляюць пра геаметрыю прывязкі, выбар пад пальцам і слоўнік
дадатку (17 праверак), і пра паводзіны кампанента: перамыкачы слаёў, карткі
зоны/станцыі/аэрапорта, кнопка Google Maps, спіс зон (20 праверак).

```bash
set -o pipefail
node --test --experimental-strip-types --experimental-test-module-mocks test/about-map.test.mjs test/design-kit-geo.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)' | LC_ALL=C sort | tr -d '\r'
```

```output
ℹ fail 0
ℹ pass 17
ℹ tests 17
```

```bash
set -o pipefail
npx jest --config jest.config.js --runInBand --silent --runTestsByPath components/about-city-map.test.tsx app/city/about-city.test.tsx 2>&1 | sed -E 's/ \([0-9.]+ s\)//g' | grep -E '^(PASS|FAIL|Test Suites:|Tests:)' | LC_ALL=C sort | tr -d '\r'
```

```output
PASS app/city/about-city.test.tsx
PASS components/about-city-map.test.tsx
Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```
