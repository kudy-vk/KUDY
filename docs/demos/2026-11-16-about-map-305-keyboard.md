# Клавіятура і аэрапорт/станцыі на карце макета (#305)

*2026-11-16T18:54:26Z by Showboat 0.6.1*
<!-- showboat-id: e7dc88f4-df85-4537-accd-22f9f7d0c648 -->

Без паказальніка пазнакі станцый і аэрапорт — названыя кнопкі на карце макета: Tab даходзіць да іх, Enter/Space выбіраюць праз той самы choose(), што і націск пальцам, Escape чыніць выбар; сфакусаваная пазнака мае каноннае 3px акцэнтнае кальцо. Рэгрэсійны тэст ідзе ў рэальным Chromium; праверка на адкат — выбіранне фікса робіць тэст чырвоным (правіла 1 implementation-rules).

```bash
set -o pipefail
node --test test/about-map-browser.test.mjs 2>&1 | sed -E 's/ \([0-9.]+m?s\)//g' | grep -E '✔ without a pointer|ℹ (tests|pass|fail)' | LC_ALL=C sort | tr -d '\r'
```

```output
  ✔ without a pointer, Tab reaches the airport and a station and Enter or Space picks them
ℹ fail 0
ℹ pass 9
ℹ tests 9
```
