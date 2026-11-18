# «Пра горад»: транспартныя пліткі адкрываюцца з клавіятуры (#333)

*2026-11-18T23:31:25Z by Showboat 0.6.1*
<!-- showboat-id: 7e2cdf59-8312-41e9-b09e-385c6bf5bdff -->

Тры пліткі білетаў (Jakdojade, FALA, SKM KomPas) у раздзеле «Транспарт» былі `div` з `role="link"` і `tabindex="0"`: фокус клавіятурай іх трымаў, але Enter і Space не рабілі нічога — толькі пстрыка мышшу адкрываў аплікацыю (знаходка voka у PR #332, issue #333). Цяпер `tile()` будзе native `button` — Enter, Space і пстрык даюць адно і тое ж дзеянне на абодвух прадакшн-экранах (`about.html` і `about-257.html`). Браўзерны тэст ніжэй фокусуе плітку, націскае Enter/Space і правярае паведамленне дошкі; на адкат змены (`button` → `div`) тэст адказвае 0 pass / 3 fail (праверана ў гэтай сесіі).

```bash
set -o pipefail
node --test --experimental-strip-types --experimental-test-module-mocks --test-reporter=spec --test-timeout=60000 test/about-tiles-browser.test.mjs 2>&1 | sed -E 's/ \([0-9.]+ms\)//g' | grep -vE '^ℹ duration_ms'
```

```output
▶ the transport tiles of «Пра горад» answer the keyboard as well as the pointer
  ✔ about.html: a tile activates from the keyboard and by pointer
  ✔ about-257.html: a tile activates from the keyboard and by pointer
✔ the transport tiles of «Пра горад» answer the keyboard as well as the pointer
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
