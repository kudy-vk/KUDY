# Агульныя кампаненты кіта (#215)

*2026-11-11T15:07:24Z by Showboat 0.6.1*
<!-- showboat-id: 0bdf7378-f31f-496b-964f-66c3340e17d7 -->

Тры агульныя кампаненты макетаў — круглая кнопка дзеяння, кантэйнер рэкламы і загаловак секцыі — плюс фота-месца карткі гіда. Тэсты правяраюць выключаны стан кнопкі паводле канона §5 (прывід-пара без празрыстасці), знікненне кантэйнера рэкламы без рэкламы (M6) і рамку фота 64×64. Здымкі на прыладзе яшчэ не пацверджаныя.

```bash
set -o pipefail
npx jest --config jest.config.js --runInBand --silent --runTestsByPath components/fab.test.tsx components/ad-container.test.tsx components/section-header.test.tsx components/guide-card.test.tsx 2>&1 | sed -E 's/ \([0-9.]+ s\)//g' | grep -E '^(PASS|FAIL|Test Suites:|Tests:)' | LC_ALL=C sort | tr -d '\r'
```

```output
PASS components/ad-container.test.tsx
PASS components/fab.test.tsx
PASS components/guide-card.test.tsx
PASS components/section-header.test.tsx
Test Suites: 4 passed, 4 total
Tests:       15 passed, 15 total
```
