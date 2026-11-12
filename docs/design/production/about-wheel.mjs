// «Пра горад»: the carousel of sections — a wheel with inertia.
//
// The items stand on a ring, all the same size; the one in the middle is the
// open section. A drag turns the wheel, and on release it keeps turning with
// the speed of the hand: a light push moves it by one item, a strong one by
// several. It always stops with an item exactly in the middle. A press on a
// side item brings that item to the middle. Arrow keys and a horizontal
// scroll turn it by one item. With the system setting «reduce motion» the
// wheel jumps to its place without animation.
import { el, iconShapes, svg } from './kit.mjs';

const COAST_TIME = 300; // ms: the time constant of the coast after a push
const STEP_TIME = 110; // ms: the time constant of a move by a press or a key
const SPEED_WINDOW = 100; // ms: the end of the drag the speed is measured over
const TAP_SLOP = 6; // px: a shorter move is a press, not a drag
const MAX_TURN = 1.5; // rings: the longest coast after one push

let drawn = 0;

// The round sign of an item: the medallion of the home screen pieces (owner's
// choice, decision M9) — a hand-drawn sand-gold rim round a disc with a Lucide
// sign. The item in the middle gets an accent ring and the amber light.
function medallion(iconName) {
  const hand = `wheel-hand-${(drawn += 1)}`;
  return svg('svg', { class: 'medal', viewBox: '-36 -36 72 72', 'aria-hidden': 'true' },
    // A slow, shallow displacement: the rim wavers like a pen stroke (menu.mjs).
    svg('filter', { id: hand, x: '-20%', y: '-20%', width: '140%', height: '140%' },
      svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.07, numOctaves: 2, seed: 7, result: 'noise' }),
      svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: 2.4, xChannelSelector: 'R', yChannelSelector: 'G' })),
    svg('circle', { class: 'glow', r: 32 }),
    svg('circle', { class: 'pick', r: 31.5 }),
    svg('g', { filter: `url(#${hand})` },
      svg('circle', { class: 'disc', r: 28 }),
      svg('circle', { class: 'inner', r: 24.4 })),
    svg('g', { class: 'glyph', transform: 'translate(-13 -13) scale(1.0833)' }, ...iconShapes(iconName)));
}

// items: [{ id, icon, label }]. `slot` is the width of one item in px,
// `controls` the id of the panel the wheel opens.
// onSelect(index, direction) fires as soon as the wheel knows where it stops.
// Returns the node with `go(index)`.
export function wheel({ items, index = 0, slot, label, controls, onSelect }) {
  const count = items.length;
  const ring = count * slot;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = el('div', { className: 'wheel' });
  root.setAttribute('role', 'tablist');
  root.setAttribute('aria-label', label);
  root.style.setProperty('--slot', `${slot}px`);

  const nodes = items.map((item) => {
    const node = el('button', { className: 'slot', type: 'button' }, medallion(item.icon), el('span', { className: 'label', textContent: item.label }));
    node.setAttribute('role', 'tab');
    node.setAttribute('aria-controls', controls);
    return node;
  });
  root.append(...nodes);

  let position = index * slot; // px along the ring; the item at position / slot is in the middle
  let goal = position; // where the wheel is heading
  let chosen = index;
  let frame = 0;

  const wrap = (value) => ((value % count) + count) % count;
  // Signed distance of item i from the middle, along the shorter way round.
  const offset = (i) => {
    let distance = (((i * slot - position) % ring) + ring) % ring;
    if (distance > ring / 2) distance -= ring;
    return distance;
  };
  function paint() {
    nodes.forEach((node, i) => {
      const distance = offset(i);
      const near = Math.max(0, 1 - Math.abs(distance) / slot);
      node.style.transform = `translate3d(${distance.toFixed(2)}px, 0, 0)`;
      node.style.setProperty('--near', near.toFixed(3));
    });
  }
  function choose(next, direction) {
    if (next === chosen) return;
    chosen = next;
    nodes.forEach((node, i) => {
      node.setAttribute('aria-selected', String(i === chosen));
      node.tabIndex = i === chosen ? 0 : -1;
    });
    onSelect(chosen, direction);
  }
  // Moves to `target` (px), slowing down the way a flicked list does: with the
  // time constant `time` the wheel starts at the speed (target − position) / time.
  function coast(target, time) {
    cancelAnimationFrame(frame);
    goal = target;
    choose(wrap(Math.round(target / slot)), Math.sign(target - position) || 1);
    if (calm) { position = target; paint(); return; }
    const from = position, started = performance.now();
    const tick = (now) => {
      position = target - (target - from) * Math.exp(-(now - started) / time);
      if (Math.abs(target - position) < 0.4) position = target;
      paint();
      if (position !== target) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  // A step counts from where the wheel is heading, so quick presses add up.
  const step = (by) => coast(goal + by * slot, STEP_TIME);

  // ---- drag with inertia ----
  let drag = null;
  root.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    cancelAnimationFrame(frame);
    drag = { x: event.clientX, from: position, moved: false, samples: [[event.timeStamp, event.clientX]], target: event.target.closest('.slot') };
    root.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (Math.abs(delta) > TAP_SLOP) { drag.moved = true; root.classList.add('dragging'); }
    position = drag.from - delta;
    drag.samples.push([event.timeStamp, event.clientX]);
    if (drag.samples.length > 24) drag.samples.shift();
    paint();
  });
  const release = (event) => {
    if (!drag) return;
    const { moved, samples, target } = drag;
    drag = null;
    root.classList.remove('dragging');
    if (!moved) {
      // A press: the pressed item comes to the middle.
      const i = nodes.indexOf(target);
      coast(i < 0 ? Math.round(position / slot) * slot : position + offset(i), STEP_TIME);
      return;
    }
    // The speed of the hand over the last moments of the drag, px per ms. The
    // wheel goes on at that speed: the harder the push, the farther it turns.
    // A hand that stopped before letting go gives no push.
    const [t1, x1] = samples[samples.length - 1];
    const recent = samples.filter(([time]) => t1 - time <= SPEED_WINDOW);
    const [t0, x0] = recent[0];
    const speed = event.timeStamp - t1 < SPEED_WINDOW && t1 > t0 ? (x0 - x1) / (t1 - t0) : 0;
    const reach = Math.max(-MAX_TURN * ring, Math.min(MAX_TURN * ring, speed * COAST_TIME));
    const stop = Math.round((position + reach) / slot) * slot;
    coast(stop, Math.abs(stop - position) > slot ? COAST_TIME : STEP_TIME);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  // A pointer press is handled on release above; this is the keyboard press
  // (Enter or Space on a focused item), which arrives as a click without a pointer.
  root.addEventListener('click', (event) => {
    if (event.detail !== 0) return;
    const i = nodes.indexOf(event.target.closest('.slot'));
    if (i >= 0) coast(position + offset(i), STEP_TIME);
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else return;
    event.preventDefault();
    nodes[chosen].focus();
  });
  let scrolled = 0;
  root.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (!delta) return;
    event.preventDefault();
    scrolled += delta;
    if (Math.abs(scrolled) > 40) { step(Math.sign(scrolled)); scrolled = 0; }
  }, { passive: false });

  nodes.forEach((node, i) => {
    node.setAttribute('aria-selected', String(i === chosen));
    node.tabIndex = i === chosen ? 0 : -1;
  });
  paint();
  root.go = (next) => coast(position + offset(next), STEP_TIME);
  return root;
}
