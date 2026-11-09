# Геаметрыя фрагментаў меню

*2026-11-09T19:13:55Z by Showboat 0.6.1*
<!-- showboat-id: b581e423-50ba-4ab5-b6a4-2ea0e191dd08 -->

```bash
set -eo pipefail
python_bin="${MAP03_PYTHON:-python}"
(
  "$python_bin" docs/design/brand/outputs/menu-map-city-only/verify.py
  "$python_bin" docs/design/brand/outputs/MAP-03/geometry.py | "$python_bin" -c "import json, sys; m = json.load(sys.stdin); print('mapVersion:', m['mapVersion']); print('Anchor squares:', [(p['id'], p['anchorSquarePx']) for p in m['pieces']]); print('Joints:', len(m['joints'])); print('Reserved:', [z['id'] for z in m['reservedZones']])"
) | tr -d '\r'
```

```output
PASS: owner regions 1-5; 11,390 ink pixels warmed; original geometry unchanged; all 1,143,233 styled pixels restored exactly.
mapVersion: 2
Anchor squares: [('nearby', 113), ('guides', 173), ('discovery', 127), ('reserve-1', 101), ('kudy', 161)]
Joints: 7
Reserved: ['reserve-2', 'reserve-3']
```
