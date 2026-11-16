# Праверка самастойных SVG і рэжыму рэндэру

*2026-11-16T10:15:51Z by Showboat 0.6.1*
<!-- showboat-id: 40491b82-9482-4096-b884-8757c7713a84 -->

```python
import subprocess, sys
result = subprocess.run(['node', 'docs/design/brand/outputs/MAP-04/verify-svg.mjs'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
sys.stdout.buffer.write(result.stdout.replace(b'\r\n', b'\n'))
sys.exit(result.returncode)

```

```output
SVG assembly: 6 fragments at 1x/2x/3x; mask alpha differences 0; perceptual colour differences 0
```

```python
import re, subprocess, sys
command = ['node', '--test', '--experimental-test-module-mocks', 'test/menu-map-export.test.mjs', 'test/menu-map-svg-render.test.mjs', 'test/map-vector-render-mode.test.mjs']
result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
text = result.stdout.decode('utf-8').replace('\r\n', '\n')
if result.returncode:
    sys.stdout.buffer.write(text.encode('utf-8'))
    sys.exit(result.returncode)
for key in ['tests', 'pass', 'fail']:
    match = re.search(r'^.*?\b' + key + r' (\d+)\s*$', text, re.M)
    if match is None:
        raise RuntimeError('Missing Node summary: ' + key)
    sys.stdout.buffer.write((key + ': ' + match.group(1) + '\n').encode('utf-8'))

```

```output
tests: 4
pass: 4
fail: 0
```
