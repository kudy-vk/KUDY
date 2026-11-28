# Раскрыццё карты меню расце разам з радыусам

*2026-11-27T21:22:31Z by Showboat 0.6.1*
<!-- showboat-id: ef4ddd53-17b2-4be2-83e4-4bfb2ffc0e1b -->

Падчас зборкі кола раскрыцця мае радыус паміж нулём і поўнай картай, а зрух кола скідае кэш выразання на Android. Фон і малюнак горада застаюцца ў ранейшай карце. Гэты прагон не здымае экран тэлефона.

```python
import re, subprocess, sys
result = subprocess.run(['npx.cmd', 'jest', '--config', 'jest.config.js', '--runInBand', 'docs/design/brand/outputs/menu-map-city-only/native/CityMapMenu.test.tsx'], capture_output=True, text=True)
text = result.stdout + result.stderr
assert result.returncode == 0, text
match = re.search(r'Tests:\s+\d+\s+\w+,\s+\d+\s+total', text)
assert match, text
sys.stdout.buffer.write((match.group(0) + '\n').encode())

```

```output
Tests:       18 passed, 18 total
```
