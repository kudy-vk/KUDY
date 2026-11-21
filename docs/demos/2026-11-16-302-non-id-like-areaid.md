# 302: дыягностыка non-id-like areaId у пераліку тэрыторый

*2026-11-16T16:10:56Z by Showboat 0.6.1*
<!-- showboat-id: d76a61df-b35b-408c-92af-d6a66636890a -->

```python
import subprocess, sys
node_script = '''import { parseRegistry } from './tools/content/tricity-areas.mjs';
const md = `## Пералік тэрыторый

| areaId | горад | тып | афіцыйная назва | мапа #248 | уваходзіць у |
|---|---|---|---|---|---|
| oliwa | gdansk | district | Oliwa | — | — |
| Oliwa | gdansk | district | Oliwa | — | — |

## Карткі
`;
console.log(JSON.stringify(parseRegistry(md).defects));
'''
result = subprocess.run(['node', '--input-type=module', '-e', node_script], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
sys.stdout.buffer.write(result.stdout.replace(bytes((13, 10)), bytes((10,))))
sys.exit(result.returncode)
```

```output
["registry row skipped: non-id-like areaId \"Oliwa\" with known city \"gdansk\""]
```

Дзве рабочыя перадумовы правіла: шапка табліцы і разлучальнік застаюцца маўклівымі (рэальныя дакументы `docs/content/tricity-area-cards.md` парсяцца без дэфектаў — тэст «real repo docs parse clean»), а радок з вядомым горадам і сломаным areaId больш не знікае бяз слова.
