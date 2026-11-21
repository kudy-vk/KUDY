# 347: pl — дзясятая кантэнтная лакаля (AF6)

*2026-11-20 by Showboat 0.6.1*

Задача #347 пашырае кантэнтную хвалю моваў на `pl` (трэцяя аўдыё-хваля фабрыкі Selfer, AF6): кантэнтныя схемы (media, localized-text, catalog, feedback-target, discovery-index, voice) цяпер прымаюць pl, люстэрка валідатара пакета сінхроннае са схемай, wire-праекцыя перагенераваная. Першы блок — прамыя схемныя прабы: pl праходзіць media і voice, невядомы код ua падае. Другі — аховыя тэсты пашырэння: лімітная пара 9→10 і сканцавы pl-пакет end-to-end, які падае на адкате media.schema + люстэрка валідатара. Трэці — fail-closed праверка wire-праекцыі.

```bash
node -e "import('./contracts/reader.mjs').then(({ validateSchemaFile }) => { const fs = require('node:fs'); const media = JSON.parse(fs.readFileSync('contracts/examples/media-demo.json', 'utf8')); const voice = JSON.parse(fs.readFileSync('fixtures/content/demo-route/voices.json', 'utf8'))[0]; const checks = [['media pl passes', validateSchemaFile('schemas/media.schema.json', { ...media, locale: 'pl' }).ok], ['voice pl passes', validateSchemaFile('schemas/voice.schema.json', [{ ...voice, locale: 'pl' }]).ok], ['media ua rejected', validateSchemaFile('schemas/media.schema.json', { ...media, locale: 'ua' }).ok === false], ['voice ua rejected', validateSchemaFile('schemas/voice.schema.json', [{ ...voice, locale: 'ua' }]).ok === false]]; console.log(checks.map(([name, ok]) => (ok ? '✔ ' : '✖ ') + name).join('\n')); })"
```

```output
✔ media pl passes
✔ voice pl passes
✔ media ua rejected
✔ voice ua rejected
```

```bash
node --test --experimental-strip-types --experimental-test-module-mocks --test-reporter=tap contracts/contracts.test.mjs tools/validate/validate-package.test.mjs tools/contracts/wire-types.test.mjs 2>&1 | grep -E '^(ok|not ok) [0-9]+ - (AF6|G21\.45)' | sed 's/\\#/#/'
```

```output
ok 7 - AF6 #347: pl passes the content schemas with limits 9→10; unknown codes still fail
ok 28 - G21.45+#347: localized-text (the allowlist owner) accepts zh and pl and holds the 10-locale ceiling
ok 29 - G21.45+#347: discovery availability accepts zh and pl in both locale lists under the 10-item ceilings
ok 30 - G21.45: media locale and both feedback-target branches accept zh
ok 31 - G21.45+#347: the 9→10 move is the only count-limit change; the residual mirrors stay at eight
ok 72 - AF6 #347: a shipped pl audio layer passes with its media record; a pl file under a foreign record fails
```

```bash
node tools/contracts/generate-wire-types.mjs --check
```

```output
wire-types: OK (fresh)
```
