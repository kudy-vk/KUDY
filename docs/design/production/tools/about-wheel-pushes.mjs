// Prints how far the wheel of «Пра горад» turns after a push, from the rule in
// ../about-wheel.mjs (releaseSpeed, stopAfterPush). The table in
// docs/agent-tasks/results/202.md is this output, so it can be regenerated
// instead of retyped; the app's own stop-point test is asked for in #252.
// Run from the repository root: node docs/design/production/tools/about-wheel-pushes.mjs
import { releaseSpeed, stopAfterPush } from '../about-wheel.mjs';

const SLOT = 100; // px: the width of one item at the normal text size
const COUNT = 5; // items on the ring

// A drag as the browser reports it: one pointer sample every 10 ms, moving
// `distance` px to the left in `duration` ms, released 1 ms after the last move.
// `pause` is how long the hand then stood still before letting go.
function push(distance, duration, pause = 0) {
  const samples = [];
  for (let time = 0; time <= duration; time += 10) samples.push([time, 500 - (distance * time) / duration]);
  const speed = releaseSpeed(samples, duration + 1 + pause);
  const stop = stopAfterPush({ position: distance, speed, slot: SLOT, count: COUNT });
  return { speed, items: stop / SLOT + 0 };
}

const PUSHES = [
  [12, 150, 0], [60, 260, 0], [90, 120, 0], [180, 110, 0], [-90, 120, 0], [400, 20, 0], [180, 110, 150],
];
console.log('drag px | in ms | pause ms | speed px/ms | items moved');
for (const [distance, duration, pause] of PUSHES) {
  const { speed, items } = push(distance, duration, pause);
  console.log([distance, duration, pause, speed.toFixed(2), items].join(' | '));
}
