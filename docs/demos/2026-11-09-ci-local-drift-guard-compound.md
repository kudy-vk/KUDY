# Drift guard бачыць складаныя каманды workflows (#155)

Да змянення `significantCommands` у tools/ci/ci-local.mjs трымаў толькі радкі, што пачынаюцца з npm/npx/node: складаная каманда (`cd web && npm test`) і env-прэфіксавая (`ENV=val npm ci`) маўкліва выпадалі з coverage-праверкі, і будучы крок CI магоў адысці ад ci:local без чырвонай гвардыі (voka finding drift-guard-compound-blind-spot). Цяпер npm/npx/node супадзенне шукаецца па ўсім радку — уся радок становіцца істотнай камандай і мусіць быць пакрытай цалкам.

Складаная каманда дасягае гвардыі:

```bash
node --input-type=module -e "const {significantCommands} = await import('./tools/ci/ci-local.mjs'); console.log(JSON.stringify(significantCommands('cd web && npm test\n')));"
```

```output
["cd web && npm test"]
```

env-прэфіксавая — гэтак сама, а plumbing (`export …`, `sudo` без npm/npx/node) не пакрыццёвы:

```bash
node --input-type=module -e "const {significantCommands} = await import('./tools/ci/ci-local.mjs'); console.log(JSON.stringify(significantCommands('ENV=val npm ci\n')), JSON.stringify(significantCommands('export KUDY_CHROMIUM=\"\$(node -e x)\"\n')));"
```

```output
["ENV=val npm ci"] []
```

Праз вытворчы шлях (parseWorkflowJobs → coverageFailures) нескрытая складаная каманда валіць гвардыю з імем кроку — праверка вяртаецца пры адкате фільтра:

```bash
node --input-type=module -e "const {parseWorkflowJobs, coverageFailures, buildSteps} = await import('./tools/ci/ci-local.mjs'); const src = ['jobs:', '  guard:', '    runs-on: ubuntu-latest', '    steps:', '      - run: |', '          set -euo pipefail', '          cd web && npm test'].join('\n'); console.log(JSON.stringify(coverageFailures([['guard-required-checks.yml', parseWorkflowJobs(src)]], buildSteps())));"
```

```output
["guard-required-checks.yml/guard: workflow command missing from ci:local: cd web && npm test"]
```

На рэальных чатырох fast-workflows набор істотных каманд не змяніўся (усе іх сёння simple-prefix), пакрыццё зеленае:

```bash
node --input-type=module -e "const {FAST_WORKFLOWS, parseWorkflowJobs, coverageFailures, buildSteps} = await import('./tools/ci/ci-local.mjs'); const fs = await import('node:fs'); const parsed = FAST_WORKFLOWS.map((n) => [n, parseWorkflowJobs(fs.readFileSync('.github/workflows/' + n, 'utf8'))]); console.log(coverageFailures(parsed, buildSteps()).length === 0 ? 'real-workflow coverage: PASS' : 'real-workflow coverage: FAIL');"
```

```output
real-workflow coverage: PASS
```
