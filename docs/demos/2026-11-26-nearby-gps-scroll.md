# Побач: GPS-watchdog і пракрутка карты (2026-11-26)

На экране «Побач» карта падтрымлівае дотыкі. Сапраўдны GPS-фікс паказвае
сінюю пазнаку месцазнаходжання. Калі фіксы перастаюць прыходзіць,
пазнака знікае без перамяшчэння камеры. Пасля новага фікса яна вяртаецца.
Падказкі пра гідаў, карта, паведамленне пра GPS і карткі знаходзяцца
ў адной вобласці пракруткі, каб на малым экране ці пры буйным шрыфце
карта не хавала спіс.

## Узнаўляльная праверка

Запускай з кораня рэпазіторыя пасля ўсталявання залежнасцяў. Jest
правярае сапраўдны кантролер Nearby і LocationService, падстаўляючы
тэставы OS-порт, кіраваны гадзіннік watchdog і MapLibre-макет.
Трэці тэст разбірае сапраўдны JSX экрана і правярае структуру пракруткі.
Праверка не пацвярджае жэсты і памеры шрыфту на фізічнай прыладзе.

```bash
node --no-warnings -e 'const cp=require("node:child_process");const files=["components/nearby-native-map.test.tsx","app/nearby-location-watch.test.tsx","components/nearby-scroll-layout.test.tsx"];const r=cp.spawnSync(process.execPath,["node_modules/jest/bin/jest.js","--runInBand","--config","jest.config.js",...files],{encoding:"utf8"});const lines=(r.stdout+"\n"+r.stderr).split(/\r?\n/);const passed=lines.filter(x=>/^PASS (?:app|components)\/nearby-/.test(x)).map(x=>x.replace(/\s+\([\d.]+ s\)$/,"")).sort();for(const line of passed)console.log(line);for(const key of ["Test Suites:","Tests:"]){const line=lines.find(x=>x.trim().startsWith(key));if(line)console.log(line.trim().replace(/\s+/g," "));}if(r.status!==0){console.error("Jest failed");process.exit(r.status||1);}'
```

```output
PASS app/nearby-location-watch.test.tsx
PASS components/nearby-native-map.test.tsx
PASS components/nearby-scroll-layout.test.tsx
Test Suites: 3 passed, 3 total
Tests: 7 passed, 7 total
```

## Выпраўленне #473 — паўторная загрузка тайлаў

Тэст `components/nearby-native-map.test.tsx` праходзіць паслядоўнасць:
першы паказ карты без каталога і GPS, прыход гіда пасля загрузкі,
пераход камеры да гіда, збой тайлаў, паўторнае стварэнне камеры і паспяховая
загрузка. Пры паўторнай загрузцы пачатковы цэнтр — `[18.65, 54.35]`,
а не `[18.6, 54.41]`. Другі тэст не дазваляе позняму гіду
перамешчаць карту пасля ручнога жэсту.

У лакальным ізаляваным worktree тэст да выпраўлення ўпаў з няправільным
цэнтрам, пасля выпраўлення прайшлі 3 Jest-наборы, 7 тэстаў.
Гэты вывад апісвае фактычны лакальны прагон; аддалены CI на новым
каміце і Showboat будуць правярацца асобна.

## Стан праверак

- Лакальны мэтавы прагон 2026-11-26 завяршыўся з кодам 0 (гл. вышэй). Каманда з актуальным шляхам `app/nearby-location-watch.test.tsx` на канчатковым аддаленым SHA яшчэ NOT-VERIFIED.
- **Showboat: NOT-VERIFIED.** Лакальны MCP адхіліў
  `uvx showboat==0.6.1` з паведамленнем
  `uvx is limited to the KUDY #835 worktree.`
  Каманда `uvx showboat==0.6.1 verify docs/demos/2026-11-26-nearby-gps-scroll.md`
  не выконвалася. Гэта ўзнаўляльны доказ, але не пацверджаны Showboat.
- Праверка жэстаў на Android/iOS, буйных шрыфтоў і здымкаў экрана
  застаецца NOT-VERIFIED. Лакальны `npm run typecheck` у старым worktree
  спыніўся праз адсутны файл `spikes/G00.03-sandbox-grant/server/device-auth.mjs`.
