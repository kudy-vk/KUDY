# Мова подпісаў груп у запасным лакалі

*2026-11-27T01:42:51Z by Showboat 0.6.1*
<!-- showboat-id: 24fe638c-1baa-47a8-924f-f386d306b647 -->

Калі подпіс групы выкарыстоўвае англійскі запасны радок, спасылка aria-labelledby захоўвае яго мову асобна, а лакальныя дзеянні і назвы катэгорый успадкоўваюць выбраны лакаль.

```bash
node --test --test-reporter=dot --test-name-pattern='fallback accessible names' test/design-fallback-language-browser.test.mjs
```

```output
.
```
