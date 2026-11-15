// Shared map pieces of the production mockups: a picture map that zooms and
// pans, its round map buttons, names that never cover one another, and the
// layer switches under a map. «Пра горад» (about-map.mjs) is built from them;
// any screen with a drawn map can take them. Styles: kit.css («map view»).
//
// A map view shows one picture (`ground`) with an SVG `overlay` in the
// picture's own px. It zooms with two fingers, a double tap, the mouse wheel,
// the + and − buttons and the keys + − 0, and pans with one finger, the mouse
// or the arrow keys. At the whole-picture view a vertical swipe still scrolls
// the page. Signs placed with `marks` keep their screen size at any zoom.
// The map is light in both themes (DT-4): the box carries data-theme="light".
import { el, icon } from './kit.mjs';

const SLOP = 6; // px: a shorter move is a press, not a drag
const DOUBLE = 320; // ms between the presses of a double tap
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// A round map button: a sign with a name for the screen reader. A button
// with aria-disabled="true" does nothing.
export function mapButton(name, label, onPress, className = '') {
  const button = el('button', { type: 'button', className }, icon(name, 22));
  button.setAttribute('aria-label', label);
  button.addEventListener('click', () => { if (button.getAttribute('aria-disabled') !== 'true') onPress(); });
  return button;
}

// Hides the names that would cover a name before them. `labels` are SVG
// <text> nodes in order of importance; a name already hidden by its layer or
// its zoom level is skipped. Uses the class `hidden`.
export function settleLabels(labels) {
  const taken = [];
  for (const label of labels) {
    label.classList.remove('hidden');
    if (label.closest('.off') || getComputedStyle(label).display === 'none') continue;
    const r = label.getBoundingClientRect();
    if (taken.some((o) => r.left < o.right + 2 && o.left < r.right + 2 && r.top < o.bottom && o.top < r.bottom)) label.classList.add('hidden');
    else taken.push(r);
  }
}

// The map view.
//   size: [width, height] of the picture, px; ground: the <img>; overlay: an
//     <svg> with viewBox 0 0 width height
//   marks: SVG nodes, each with `place` = [x, y]; they keep their screen size
//   state: { zoom, centre } — kept by the caller, so it survives a repaint
//   maxZoom: the closest zoom (1 = the whole picture)
//   levels: [[zoom, name], …] from the closest; the box gets data-names=name
//     (or "none"), for showing names only from some zoom on
//   words: { label, role, zoomIn, zoomOut, fit } — the screen reader's names
//   tools: more map buttons under the zoom buttons
//   onTap(point, scale): a press at a picture point; scale = screen px per picture px
//   onPaint(): after every move of the picture (e.g. settleLabels)
//   onEscape(): the Escape key
// Returns { node, paint, fly, show, scale }.
export function zoomView({ size: [W, H], ground, overlay, marks = [], state, maxZoom = 3, levels = [], words, tools = [], onTap, onPaint, onEscape }) {
  const world = el('div', { className: 'zoomview-world' }, ground, overlay);
  const zoomBy = (factor) => fly(state.zoom * factor, state.centre);
  const zoomIn = mapButton('plus', words.zoomIn, () => zoomBy(1.8));
  const zoomOut = mapButton('minus', words.zoomOut, () => zoomBy(1 / 1.8));
  const whole = mapButton('scan', words.fit, () => fly(1, [W / 2, H / 2]));
  const box = el('div', { className: 'zoomview', tabIndex: 0 }, world, el('div', { className: 'zoomview-tools' }, zoomIn, zoomOut, whole, ...tools));
  box.dataset.theme = 'light';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', words.label);
  box.setAttribute('aria-roledescription', words.role);
  box.style.setProperty('--ratio', `${W} / ${H}`);

  // ---------- the camera ----------

  const scale = () => (box.clientWidth / W) * state.zoom;
  function clampCentre() {
    const s = scale();
    const half = [box.clientWidth / (2 * s), box.clientHeight / (2 * s)];
    state.centre = state.centre.map((value, k) => {
      const length = k ? H : W;
      return half[k] * 2 >= length ? length / 2 : Math.min(length - half[k], Math.max(half[k], value));
    });
  }
  function paint() {
    if (!box.clientWidth) return;
    state.zoom = Math.min(maxZoom, Math.max(1, state.zoom));
    clampCentre();
    const s = scale();
    world.style.transform = `translate(${box.clientWidth / 2 - state.centre[0] * s}px, ${box.clientHeight / 2 - state.centre[1] * s}px) scale(${s})`;
    for (const mark of marks) mark.setAttribute('transform', `translate(${mark.place[0]} ${mark.place[1]}) scale(${1 / s})`);
    box.dataset.names = levels.find(([zoom]) => state.zoom >= zoom)?.[1] ?? 'none';
    // At the whole-picture view a vertical swipe scrolls the page; zoomed in, the map takes the finger.
    box.style.touchAction = state.zoom > 1.01 ? 'none' : 'pan-y';
    zoomOut.setAttribute('aria-disabled', String(state.zoom <= 1.01));
    whole.setAttribute('aria-disabled', String(state.zoom <= 1.01));
    zoomIn.setAttribute('aria-disabled', String(state.zoom >= maxZoom - 0.01));
    onPaint?.();
  }
  // The picture point under a screen point.
  const toPicture = (clientX, clientY) => {
    const rect = box.getBoundingClientRect(), s = scale();
    return [state.centre[0] + (clientX - rect.left - box.clientWidth / 2) / s, state.centre[1] + (clientY - rect.top - box.clientHeight / 2) / s];
  };
  // The centre that keeps the picture point `at` under the box point (sx, sy) at `zoom`.
  const centreFor = (zoom, at, [sx, sy]) => {
    const s = (box.clientWidth / W) * zoom;
    return [at[0] - (sx - box.clientWidth / 2) / s, at[1] - (sy - box.clientHeight / 2) / s];
  };
  function zoomAround(zoom, at, point) {
    state.zoom = Math.min(maxZoom, Math.max(1, zoom));
    state.centre = centreFor(state.zoom, at, point);
    paint();
  }
  let flight = 0;
  function fly(zoom, centre) {
    cancelAnimationFrame(flight);
    const from = { zoom: state.zoom, centre: [...state.centre] };
    if (calm()) { Object.assign(state, { zoom, centre }); paint(); return; }
    const started = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - started) / 260), e = 1 - (1 - k) ** 3;
      state.zoom = from.zoom * (zoom / from.zoom) ** e;
      state.centre = from.centre.map((value, i) => value + (centre[i] - value) * e);
      paint();
      if (k < 1) flight = requestAnimationFrame(tick);
    };
    flight = requestAnimationFrame(tick);
  }
  // Shows a box of the picture [x0, y0, x1, y1] large, but never closer than `limit` and never farther than now.
  function show([x0, y0, x1, y1], limit = maxZoom) {
    const zoom = Math.min(limit, 0.6 * Math.min(W / Math.max(x1 - x0, 1), H / Math.max(y1 - y0, 1)));
    fly(Math.max(state.zoom, zoom), [(x0 + x1) / 2, (y0 + y1) / 2]);
  }

  // ---------- gestures ----------

  const pointers = new Map();
  let gesture = null, lastTap = null;
  const local = (clientX, clientY) => {
    const rect = box.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  };
  box.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.zoomview-tools') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    cancelAnimationFrame(flight);
    box.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.size === 1) {
      gesture = { kind: 'pan', start: [event.clientX, event.clientY], centre: [...state.centre], moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { kind: 'pinch', gap: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom: state.zoom, at: toPicture((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), moved: true };
    }
  });
  box.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (gesture.kind === 'pinch' && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoomAround(gesture.zoom * Math.hypot(a[0] - b[0], a[1] - b[1]) / gesture.gap, gesture.at, local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
    } else if (gesture.kind === 'pan') {
      const dx = event.clientX - gesture.start[0], dy = event.clientY - gesture.start[1];
      if (!gesture.moved && Math.hypot(dx, dy) < SLOP) return;
      gesture.moved = true;
      box.classList.add('dragging');
      const s = scale();
      state.centre = [gesture.centre[0] - dx / s, gesture.centre[1] - dy / s];
      paint();
    }
  });
  const release = (event, cancelled) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    box.classList.remove('dragging');
    const ended = gesture;
    gesture = null;
    if (pointers.size === 1) {
      // One finger stays after a pinch: it pans on from where it is.
      const [rest] = [...pointers.values()];
      gesture = { kind: 'pan', start: rest, centre: [...state.centre], moved: true };
    }
    if (cancelled || !ended || ended.moved || pointers.size > 0) return;
    const at = toPicture(event.clientX, event.clientY);
    if (lastTap && event.timeStamp - lastTap.time < DOUBLE && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 24) {
      lastTap = null;
      if (state.zoom < maxZoom - 0.01) {
        const target = Math.min(maxZoom, state.zoom * 2);
        fly(target, centreFor(target, at, local(event.clientX, event.clientY)));
      }
      return;
    }
    lastTap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
    onTap?.(at, scale());
  };
  box.addEventListener('pointerup', (event) => release(event, false));
  box.addEventListener('pointercancel', (event) => release(event, true));
  box.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomAround(state.zoom * Math.exp(-event.deltaY * 0.0015), toPicture(event.clientX, event.clientY), local(event.clientX, event.clientY));
  }, { passive: false });
  box.addEventListener('keydown', (event) => {
    if (event.target !== box) return;
    const step = 60 / scale();
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[event.key]) {
      state.centre = state.centre.map((value, k) => value + moves[event.key][k]);
      paint();
    } else if (event.key === '+' || event.key === '=') zoomBy(1.8);
    else if (event.key === '-') zoomBy(1 / 1.8);
    else if (event.key === '0') fly(1, [W / 2, H / 2]);
    else if (event.key === 'Escape' && onEscape) onEscape();
    else return;
    event.preventDefault();
  });

  // The box has its size only once it is on the page.
  requestAnimationFrame(paint);
  return { node: box, paint, fly, show, scale };
}

// A sample of what a layer shows, on a patch of the map's ground so the
// colours read in both themes. `kind` is a class the screen styles (.sw.kind).
export const swatch = (kind) => el('span', { className: 'sw-wrap' }, el('i', { className: `sw ${kind}` }));

// Layer switches under a map: one per layer, each with its sample, its name
// and, if given, how many things it holds. `show` is { id: on } kept by the
// caller; onChange(id) runs after a switch. Returns the group with sync(),
// which redraws the switches from `show`.
export function layerSwitches({ label, items, show, onChange }) {
  const buttons = items.map((item) => {
    const button = el('button', { className: 'lchip', type: 'button' }, swatch(item.id),
      el('span', { textContent: item.label }),
      item.count === undefined ? null : el('span', { className: 'lcount', textContent: String(item.count) }));
    button.dataset.key = `layer:${item.id}`;
    button.addEventListener('click', () => {
      show[item.id] = !show[item.id];
      group.sync();
      onChange(item.id);
    });
    return button;
  });
  const group = el('div', { className: 'layer-switches' }, ...buttons);
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);
  group.sync = () => buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(show[items[i].id])));
  group.sync();
  return group;
}
