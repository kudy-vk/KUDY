# Запасны радок і новая перамалёўка

*2026-11-27T02:30:38Z by Showboat 0.6.1*
<!-- showboat-id: 3e766912-5331-4499-ad42-d46e9c09cadb -->

Пакуль новы лакаль загружаецца, старыя падзеі не павінны вяртаць пазнаку англійскага тэксту пасля скіду стану. Тэст затрымлівае загрузку, выклікае састарэлы маркер і правярае, што статус застаецца схаваным.

```bash
node --test --test-reporter=dot --test-name-pattern='obsolete draw' test/design-fallback-language-browser.test.mjs
```

```output
.
```
