# Run: контурныя Play/Pause (варыянт A #98) у native

*2026-11-21T23:49:13Z by Showboat 0.6.1*
<!-- showboat-id: 3fe0b7a6-54a7-49a4-b273-560cc2b7f1a2 -->

Змена #387: абедзве гукавыя кнопкі Run (btn-bar-playpause у ніжняй панэлі і btn-card-play у картцы кропкі) паказваюць зацверджаныя ўладальнікам кантурныя іконкі Lucide Play/Pause (варыянт A) без бачных подпісаў; слова жыве ў screen-reader лейбле (canon §9), паводзіны прайгравання не мяняюцца. Тэст-ахова падае пры вяртанні бачнага слова, тэст G06.03 пацвярджае асобнасць гуку ад сесіі.

```bash
npx jest --config jest.config.js app/run.test.tsx --runInBand --testNamePattern "UI-REVIEW-01: the sound buttons|G06.03: the bar's play/pause" 2>&1 | grep -E '^(PASS|FAIL) app|Tests:' | sed -E 's/ \([0-9.]+ s\)//'
```

```output
PASS app/run.test.tsx
Tests:       47 skipped, 2 passed, 49 total
```
