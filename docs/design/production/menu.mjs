// Main menu screen: five map pieces the visitor can tap or drag, the ad zone
// under them, and free space with an engraved panorama below. Geometry, art,
// the magnet rule and the amber light come from the accepted package
// brand/outputs/menu-map-city-only; gesture timings are read from its manifest.
import { findMagnet, joinGroups } from '../brand/outputs/menu-map-city-only/magnet.mjs';
import { amberMotion, amberPalette, lightThreads } from '../brand/outputs/menu-map-city-only/amber-light.mjs';
import { adZone, el, LOCALES, mountBoard, panorama, plainLabel, svg, walkButton } from './kit.mjs';

import { atlasLight, BASTION_CLIP_PATH, insideBastions } from '../brand/outputs/menu-map-city-only/atlas-art.mjs';
import { atlasMotifs, atlasScenery, atlasVignette, createRibbon } from './menu-atlas.mjs';

const PKG = new URL('../brand/outputs/menu-map-city-only/', import.meta.url);
// The whole scene (pieces plus water and fortifications), in source pixels.
const SCENE = { width: 1351, height: 1164, cx: 675, cy: 582 };
// Smallest drawing area, in source pixels, that holds five scattered pieces.
const MIN_VIEW = { width: 1500, height: 1250 };
// Where each piece starts, as a share of the drawing area (piece centre).
const SLOTS = { nearby: [0.22, 0.17], guides: [0.74, 0.2], discovery: [0.76, 0.66], 'reserve-1': [0.2, 0.55], kudy: [0.42, 0.88] };
// Fixed destinations match the production host in components/city-map-menu.tsx.
const ENTRIES = {
  nearby: { labelId: 'native.chrome.nearby', route: '/map' },
  guides: { labelId: 'native.chrome.guidesLink', route: '/city/gdansk/guides' },
  discovery: { labelId: 'native.chrome.whatToDo', route: '/discovery' },
  'reserve-1': { labelId: 'native.chrome.aboutCity', route: '/city/gdansk/about' },
  kudy: { labelId: 'native.chrome.kudyLink', route: '/my' },
};
const WALK = 'native.chrome.walk';
const HEADING = 'native.chrome.whereToToday';
const CITY = 'native.chrome.cityName';
const STRING_IDS = [...Object.values(ENTRIES).map((entry) => entry.labelId), WALK, HEADING, CITY];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function alphaPixels(item) {
  const bitmap = new Image();
  bitmap.src = new URL(item.png, PKG);
  await bitmap.decode();
  const surface = el('canvas', { width: item.width, height: item.height });
  const context = surface.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, item.width, item.height).data;
}

const response = await fetch(new URL('manifest.json', PKG));
if (!response.ok) throw new Error(`manifest.json: ${response.status}`);
const manifest = await response.json();
const alpha = new Map();
for (const item of [...manifest.pieces, ...manifest.layers]) alpha.set(item.id, await alphaPixels(item));
let serial = 0;

class MenuMap {
  constructor(stage, { strings, say, scale, rest }) {
    this.uid = `menu${(serial += 1)}`;
    this.stage = stage;
    this.strings = strings;
    this.say = say;
    this.fontScale = Math.min(scale, 1.25);
    this.restBox = rest;
    this.turn = 0;
    this.groups = new Set();
    this.actors = new Map();
    this.scenery = [];
    this.active = null;
    this.keyboard = null;
    this.complete = false;
    this.revealed = false;
    this.build();
    this.scatter();
    this.bind();
  }

  get reduced() { return reducedMotion.matches; }
  defer(fn, ms) { const turn = this.turn; setTimeout(() => { if (turn === this.turn) fn(); }, ms); }
  destroy() { this.turn += 1; this.active = null; }

  title(actor) { return plainLabel(this.strings[ENTRIES[actor.id].labelId]); }

  build() {
    const stage = this.stage, uid = this.uid;
    const wc = stage.clientWidth, hc = stage.clientHeight;
    this.scale = Math.min(wc / MIN_VIEW.width, hc / MIN_VIEW.height);
    this.vw = wc / this.scale;
    this.vh = hc / this.scale;
    this.ox = (this.vw - SCENE.width) / 2;
    this.oy = (this.vh - SCENE.height) / 2;
    stage.setAttribute('viewBox', `0 0 ${this.vw} ${this.vh}`);

    const gradient = svg('radialGradient', { id: `${uid}-light` },
      ...[[0, '#fff6cf', 1], [0.28, '#ffca57', 0.95], [0.62, amberPalette.glow, 0.72], [1, amberPalette.edge, 0]]
        .map(([offset, color, opacity]) => svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity })));
    this.sceneRadius = svg('circle', { cx: SCENE.cx, cy: SCENE.cy, r: 0 });
    const wall = `url(#${uid}-wall)`, vignette = `url(#${uid}-vignette-mask)`;
    this.defs = svg('defs', {}, gradient, ...atlasVignette(uid, this.vw, this.vh),
      svg('clipPath', { id: `${uid}-clip` }, this.sceneRadius),
      svg('clipPath', { id: `${uid}-wall` }, svg('path', { d: BASTION_CLIP_PATH })),
      svg('filter', { id: `${uid}-seam`, x: '-15%', y: '-15%', width: '130%', height: '130%' },
        svg('feGaussianBlur', { stdDeviation: 14 })));
    const motifs = atlasMotifs(this.ox, this.oy, this.scale, vignette);
    const watermark = svg('g', { class: 'bg-layers', 'data-bg': 'cosmos', mask: vignette, 'aria-hidden': 'true' },
      svg('g', { transform: `translate(${this.ox} ${this.oy})` }, atlasScenery(manifest.layers, PKG, wall)));
    this.radiance = svg('ellipse', { class: 'radiance', cx: SCENE.cx, cy: SCENE.cy, rx: 940, ry: 840, fill: `url(#${uid}-light)` });
    this.innerWave = svg('ellipse', { class: 'energy-ring', cx: SCENE.cx, cy: SCENE.cy, rx: 610, ry: 510 });
    this.outerWave = svg('ellipse', { class: 'energy-ring-outer', cx: SCENE.cx, cy: SCENE.cy, rx: 740, ry: 630 });
    this.seams = svg('g', { class: 'seam-glow', filter: `url(#${uid}-seam)` },
      ...manifest.pieces.map(({ path, x, y }) => svg('path', { d: path, transform: `translate(${x} ${y})`, stroke: '#ffae2b', 'stroke-width': 22 })));
    this.threads = lightThreads(0, 0).map((thread) => {
      const group = svg('g', { opacity: 0 });
      for (const [width, opacity, color] of [[18, 0.1, amberPalette.glow], [7, 0.4, amberPalette.edge], [thread.width, 0.95, thread.core]]) {
        group.append(svg('path', { d: thread.d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-opacity': opacity, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1700 1500' }));
      }
      return group;
    });
    this.evolution = svg('g', { 'pointer-events': 'none' }, this.radiance, this.innerWave, this.outerWave, svg('g', {}, ...this.threads));
    this.pieces = svg('g');
    this.scene = svg('g', { 'clip-path': `url(#${uid}-clip)`, 'aria-hidden': 'true' }, atlasScenery(manifest.layers, PKG, wall));
    this.sparks = svg('g', { 'pointer-events': 'none' });
    stage.append(this.defs, motifs, watermark, this.evolution, this.scene, this.pieces, this.seams, this.sparks);

    for (const item of manifest.pieces) {
      const node = svg('g', { class: 'piece', 'data-piece': item.id, tabindex: 0, role: 'button' });
      const pad = item.padding;
      this.defs.append(svg('mask', { id: `${uid}-veil-${item.id}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: item.width, height: item.height },
        svg('image', { href: new URL(item.light, PKG), width: item.width, height: item.height })));
      const veil = svg('rect', { x: 0, y: 0, width: item.width, height: item.height, fill: amberPalette.veil, mask: `url(#${uid}-veil-${item.id})`, opacity: 0 });
      const art = svg('g', { class: 'art', 'pointer-events': 'none' },
        svg('path', { class: 'rim-outer', d: item.path, 'stroke-width': 6.5 / this.scale }),
        svg('path', { class: 'rim-paper', d: item.path, 'stroke-width': 3.4 / this.scale }),
        svg('image', { class: 'tone', href: new URL(item.png, PKG), width: item.width, height: item.height }),
        svg('image', { class: 'tone ui-art', href: new URL(item.ui, PKG), x: -pad, y: -pad, width: item.width + pad * 2, height: item.height + pad * 2 }),
        veil,
        svg('path', { class: 'ring', d: item.path, 'stroke-width': 3 / this.scale }));

      const [ax, ay] = [item.anchor[0] - item.x, item.anchor[1] - item.y];
      const ribbon = createRibbon(this.title(item), this.fontScale);
      const caption = svg('g', { class: 'caption', transform: `translate(${ax} ${ay}) scale(${1 / this.scale})` }, ribbon.badge);
      node.append(art, caption);
      this.pieces.append(node);

      const { padW, padH } = ribbon.layout();
      const halfW = padW / this.scale, halfH = padH / this.scale;
      const actor = {
        ...item, node, veil, alpha: alpha.get(item.id),
        ext: { l: Math.min(0, ax - halfW), r: Math.max(item.width, ax + halfW), t: Math.min(0, ay - halfH), b: Math.max(item.height, ay + halfH) },
      };
      node.setAttribute('aria-label', this.title(actor));
      node.addEventListener('keydown', (event) => this.key(event, actor));
      this.actors.set(item.id, actor);
    }
    for (const layer of manifest.layers) {
      this.scenery.push({ ...layer, alpha: alpha.get(layer.id), passive: true });
    }
  }

  scatter() {
    const flip = Math.random() < 0.5;
    for (const actor of this.actors.values()) {
      const [fx, fy] = SLOTS[actor.id];
      const cx = (flip ? 1 - fx : fx) * this.vw + (Math.random() - 0.5) * 30;
      const cy = fy * this.vh + (Math.random() - 0.5) * 24;
      const x = Math.max(-actor.ext.l, Math.min(this.vw - actor.ext.r, cx - actor.width / 2));
      const y = Math.max(-actor.ext.t, Math.min(this.vh - actor.ext.b, cy - actor.height / 2));
      actor.group = { members: new Set([actor.id]), dx: x - this.ox - actor.x, dy: y - this.oy - actor.y, id: actor.id };
      this.groups.add(actor.group);
    }
    this.paintLight(-1);
    this.render();
  }

  render() {
    for (const actor of this.actors.values()) {
      const group = actor.group;
      actor.node.style.transform = `translate(${this.ox + actor.x + group.dx}px,${this.oy + actor.y + group.dy}px)`;
      actor.node.classList.toggle('grouped', group.members.size > 1);
    }
    const full = [...this.groups].find((group) => group.members.size === this.actors.size);
    const place = `translate(${this.ox + (full?.dx ?? 0)} ${this.oy + (full?.dy ?? 0)})`;
    this.scene.setAttribute('transform', place);
    this.evolution.setAttribute('transform', place);
    this.seams.setAttribute('transform', place);
  }

  open(actor) {
    const entry = ENTRIES[actor.id];
    this.say(`Адкрываецца раздзел «${this.title(actor)}» → ${entry.route}`);
  }

  feedback(event) {
    if (this.reduced) return;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.stage.getScreenCTM().inverse());
    const ripple = svg('circle', { class: 'ripple', cx: local.x, cy: local.y, r: 36 });
    this.sparks.append(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  at(event) {
    const caption = event.target.closest?.('.caption');
    if (caption && this.stage.contains(caption)) return this.actors.get(caption.parentNode.dataset.piece);
    for (const actor of [...this.actors.values()].reverse()) {
      const matrix = actor.node.getScreenCTM();
      if (!matrix) continue;
      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const x = Math.floor(local.x), y = Math.floor(local.y);
      if (x >= 0 && y >= 0 && x < actor.width && y < actor.height && actor.alpha[(y * actor.width + x) * 4 + 3] > 32) return actor;
    }
    const visible = Number(this.sceneRadius.getAttribute('r'));
    if (visible > 0) {
      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(this.scene.getScreenCTM().inverse());
      if (Math.hypot(local.x - SCENE.cx, local.y - SCENE.cy) > visible || !insideBastions(local.x, local.y)) return undefined;
      for (const part of this.scenery) {
        const x = Math.floor(local.x - part.x), y = Math.floor(local.y - part.y);
        if (x >= 0 && y >= 0 && x < part.width && y < part.height && part.alpha[(y * part.width + x) * 4 + 3] > 32) return part;
      }
    }
    return undefined;
  }

  nearest(group) { return findMagnet(group, this.actors, manifest.joints, manifest.gesture.snapDistanceDp / this.scale); }

  glow(joint, group) {
    if (this.reduced) return;
    const [px, py] = joint.port, x = this.ox + group.dx + px, y = this.oy + group.dy + py;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i * Math.PI) / 4;
      const ray = svg('line', { class: 'spark', x1: x + Math.cos(angle) * 14, y1: y + Math.sin(angle) * 14, x2: x + Math.cos(angle) * 48, y2: y + Math.sin(angle) * 48 });
      this.sparks.append(ray);
      setTimeout(() => ray.remove(), 420);
    }
  }

  dock(group) {
    const target = this.nearest(group);
    if (!target) return false;
    const { other, joint } = target;
    const moving = [...group.members].map((id) => this.actors.get(id)), before = moving.map((actor) => actor.node.style.transform);
    joinGroups(group, other, this.actors, this.groups);
    this.render();
    if (!this.reduced && group.members.size < this.actors.size) {
      moving.forEach((actor, index) => actor.node.animate([{ transform: before[index] }, { transform: actor.node.style.transform }], { duration: 220, easing: 'cubic-bezier(.2,1.25,.4,1)' }));
    }
    this.glow(joint, group);
    this.say(`Злучана ${group.members.size} з ${this.actors.size}. Часткі рухаюцца разам.`);
    if (group.members.size === this.actors.size) this.finish(group);
    return true;
  }

  // Pieces, with their ribbons, never leave the drawing area: nothing slides under the ad.
  shift(group, dx, dy) {
    const members = [...group.members].map((id) => this.actors.get(id));
    const minX = this.complete ? 0 : Math.min(...members.map((actor) => actor.x + actor.ext.l));
    const maxX = this.complete ? SCENE.width : Math.max(...members.map((actor) => actor.x + actor.ext.r));
    const minY = this.complete ? 0 : Math.min(...members.map((actor) => actor.y + actor.ext.t));
    const maxY = this.complete ? SCENE.height : Math.max(...members.map((actor) => actor.y + actor.ext.b));
    group.dx = Math.max(-this.ox - minX, Math.min(this.vw - this.ox - maxX, group.dx + dx));
    group.dy = Math.max(-this.oy - minY, Math.min(this.vh - this.oy - maxY, group.dy + dy));
    this.render();
  }

  rest() { for (const actor of this.actors.values()) { actor.node.dataset.touch = 'idle'; actor.node.classList.remove('near'); } }

  moveHint(group) {
    this.rest();
    for (const id of group.members) this.actors.get(id).node.dataset.touch = 'dragging';
    const target = this.nearest(group);
    if (target) for (const id of target.other.members) this.actors.get(id).node.classList.add('near');
  }

  cancel() {
    const movement = this.active ?? this.keyboard;
    if (!movement) return;
    clearTimeout(movement.hold);
    movement.group.dx = movement.original[0];
    movement.group.dy = movement.original[1];
    this.active = null;
    this.keyboard = null;
    this.rest();
    this.render();
  }

  key(event, actor) {
    if (this.complete && event.key.startsWith('Arrow')) return;
    const step = 8 / this.scale, arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[event.key]) {
      event.preventDefault();
      if (this.keyboard?.group !== actor.group) this.keyboard = { group: actor.group, original: [actor.group.dx, actor.group.dy] };
      this.shift(actor.group, ...arrows[event.key]);
      this.moveHint(actor.group);
    } else if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.keyboard = null;
      this.rest();
      if (!this.complete) this.dock(actor.group);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.keyboard = null;
      this.open(actor);
    } else if (event.key === 'Escape') {
      this.cancel();
    }
  }

  finish(group) {
    this.complete = true;
    this.stage.classList.add('complete');
    if (!this.reduced) this.stage.classList.add('settling');
    group.dx = 0;
    group.dy = 0;
    this.render();
    this.defer(() => {
      this.stage.classList.remove('settling');
      if (this.reduced) { this.showComplete(); return; }
      for (const joint of manifest.joints) this.glow(joint, group);
      this.reveal();
    }, this.reduced ? 0 : 400);
  }

  reveal() {
    const begin = performance.now(), turn = this.turn;
    const frame = (now) => {
      if (turn !== this.turn) return;
      const effect = this.paintLight(now - begin);
      this.sceneRadius.setAttribute('r', effect.radius);
      if (effect.phase !== 'complete') requestAnimationFrame(frame);
      else this.showComplete();
    };
    requestAnimationFrame(frame);
  }

  paintLight(elapsed) {
    const effect = amberMotion(elapsed, manifest.reveal);
    const light = atlasLight(elapsed, effect, effect.phase === 'complete');
    this.radiance.style.opacity = light.glow;
    this.radiance.style.transform = `scale(${0.45 + light.glow * 0.7})`;
    this.innerWave.style.opacity = light.inner;
    this.innerWave.style.transform = `scale(${light.innerScale})`;
    this.outerWave.style.opacity = light.outer;
    this.outerWave.style.transform = `scale(${light.outerScale})`;
    this.seams.style.opacity = light.seam;
    this.seams.classList.toggle('surge', light.seam > 0.5);
    for (const actor of this.actors.values()) actor.veil.setAttribute('opacity', effect.veil);
    lightThreads(effect.progress, effect.light).forEach((thread, index) => {
      const group = this.threads[index];
      group.setAttribute('opacity', thread.opacity);
      group.setAttribute('transform', `translate(${thread.x} ${thread.y})`);
      for (const path of group.children) path.setAttribute('stroke-dashoffset', thread.offset);
    });
    return effect;
  }

  showComplete() {
    this.paintLight(Object.values(manifest.reveal).reduce((sum, ms) => sum + ms, 0));
    this.revealed = true;
    this.sceneRadius.setAttribute('r', 1000);
    this.stage.classList.remove('settling');
    this.stage.classList.add('revealed');
    this.restBox.classList.add('panorama-lit');
    this.scene.setAttribute('aria-hidden', 'false');
    this.say('Карта сабраная. Раздзелы па-ранейшаму адкрываюцца націскам.');
  }

  bind() {
    const stage = this.stage, gesture = manifest.gesture;
    stage.addEventListener('pointerdown', (event) => {
      if (this.active || event.button !== 0 || !event.isPrimary) return;
      const actor = this.at(event);
      if (!actor) return;
      if (actor.passive) { this.feedback(event); return; }
      if (this.complete && !this.revealed) { this.open(actor); return; }
      const group = actor.group;
      this.keyboard = null;
      stage.setPointerCapture(event.pointerId);
      actor.node.dataset.touch = 'pressed';
      const active = { actor, group, id: event.pointerId, original: [group.dx, group.dy], x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, held: false, cancelled: false };
      active.hold = setTimeout(() => {
        if (this.active !== active || active.cancelled) return;
        active.held = true;
        for (const id of group.members) this.actors.get(id).node.dataset.touch = 'held';
      }, gesture.holdMs);
      this.active = active;
    });
    stage.addEventListener('pointermove', (event) => {
      const active = this.active;
      if (!active || event.pointerId !== active.id) return;
      if (!active.held) {
        if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > gesture.tapSlopDp) { active.cancelled = true; clearTimeout(active.hold); this.rest(); }
        return;
      }
      if (event.clientX === active.lastX && event.clientY === active.lastY) return;
      this.shift(active.group, (event.clientX - active.lastX) / this.scale, (event.clientY - active.lastY) / this.scale);
      active.lastX = event.clientX;
      active.lastY = event.clientY;
      this.moveHint(active.group);
      if (!this.complete && this.nearest(active.group)) {
        this.active = null;
        clearTimeout(active.hold);
        this.rest();
        this.dock(active.group);
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      }
    });
    stage.addEventListener('pointerup', (event) => {
      const active = this.active;
      if (!active || event.pointerId !== active.id) return;
      clearTimeout(active.hold);
      this.active = null;
      this.rest();
      if (!active.held && !active.cancelled) this.open(active.actor);
    });
    stage.addEventListener('pointercancel', () => this.cancel());
    stage.addEventListener('lostpointercapture', () => this.cancel());
  }
}

await mountBoard({
  controls: [
    { id: 'ad', label: 'Банер', options: [['loaded', 'Загрузіўся'], ['none', 'Не загрузіўся']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: STRING_IDS,
  locales: { ...LOCALES, it: 'Italiano' },
  build({ body, state, strings, say }) {
    const head = el('div', { className: 'menu-head' },
      el('span', { className: 'brand', textContent: 'KUDY' }),
      el('span', { className: 'city', textContent: strings[CITY] }),
      state.walk === 'yes' && walkButton(strings[WALK], () => say(`Вяртанне да бягучай прагулкі («${strings[WALK]}»).`)));
    const title = el('h2', { className: 'menu-title t-display', textContent: strings[HEADING] });
    const stage = svg('svg', { role: 'group', 'aria-label': strings[HEADING] });
    const rest = el('div', { className: 'menu-rest' }, panorama());
    body.append(
      el('div', { className: 'menu-top' }, head, title, el('div', { className: 'menu-canvas' }, stage)),
      // Free space with the panorama; the ad is the last thing on every screen that has one.
      rest,
      adZone(state.ad === 'loaded'));
    const map = new MenuMap(stage, { strings, say, scale: state.scale, rest });
    return () => map.destroy();
  },
});
