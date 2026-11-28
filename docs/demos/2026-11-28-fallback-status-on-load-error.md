# Fallback status after contract load error

*2026-11-28T00:34:44Z by Showboat 0.6.1*
<!-- showboat-id: 2ba1a001-8abd-480f-9624-d0a335038774 -->

Пасля HTTP 503 захоўваюцца старыя карткі і індыкатар англійскага fallback разам з бачнай памылкай. Паспяховы пераход на мову з лакальнымі радкамі ачышчае індыкатар.

```bash
node --test --experimental-strip-types --test-reporter=dot --test-name-pattern='issue #509' test/design-fallback-language-browser.test.mjs
```

```output
.
```
