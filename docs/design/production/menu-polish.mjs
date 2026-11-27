// Main menu polish proposal (`menu-polish.html`):
// Explores 5 ways to present the 5 map-piece menu sections without modern rectangular strips:
// 1. `ribbon` («Атласная стужка без іконкі»): pure curved 17th-century scroll banner with swallowtail ends & diamond ornaments (no left icon!).
// 2. `marginalia` («Вынаскі Гевелія за межамі мапы»): ZERO labels on the map pieces; each quarter has a glowing amber astrolabe node connected by a live golden leader line to a marginalia callout around the perimeter.
// 3. `diorama` («Архітэктурныя фігуркі + дугавы надпіс»): 3D engraved Gdańsk miniature landmark standing on each quarter + curved `<textPath>` lettering directly on the map surface.
// 4. `dock` («Чыстая мапа + Компас-док унізе»): Roman numeral wax tokens (`I`–`V`) on clean map pieces + an arched 5-item Compass Legend Dock along the bottom that highlights & triggers the corresponding quarter.
// 5. `crest` («Цэхавы герб-шыльда»): compact baroque guild shield with top crown arch.
import { findMagnet, joinGroups } from '../brand/outputs/menu-map-city-only/magnet.mjs';
import { amberMotion, amberPalette, lightThreads } from '../brand/outputs/menu-map-city-only/amber-light.mjs';
import { adZone, el, iconShapes, mountBoard, panorama, penStroke, plainLabel, svg, walkButton } from './kit.mjs';

const ASSET_BASE = new URL('../brand/outputs/menu-map-city-only/', import.meta.url);
const STAGE_BOUNDS = { w: 1351, h: 1164, cx: 675, cy: 582, minW: 1500, minH: 1250 };
const PIECE_SLOTS = {
  nearby: [0.22, 0.17],
  guides: [0.74, 0.2],
  discovery: [0.76, 0.66],
  'reserve-1': [0.2, 0.55],
  kudy: [0.44, 0.86],
};

// Exact outer perimeter of the star bastion walls (trims the protruding water & islands on the right).
import { BASTION_CLIP_PATH } from '../brand/outputs/menu-map-city-only/atlas-art.mjs';
import { atlasMotifs, atlasVignette, createRibbon } from './menu-atlas.mjs';

const SECTIONS = [
  { id: 'nearby', roman: 'I', icon: 'map-pin', key: 'native.chrome.nearby', href: '/map' },
  { id: 'guides', roman: 'II', icon: 'route', key: 'native.chrome.guidesLink', href: '/city/gdansk/guides' },
  { id: 'discovery', roman: 'III', icon: 'lightbulb', key: 'native.chrome.whatToDo', href: '/discovery' },
  { id: 'reserve-1', roman: 'IV', icon: 'landmark', key: 'native.chrome.aboutCity', href: '/city/gdansk/about' },
  { id: 'kudy', roman: 'V', icon: 'bookmark', key: 'native.chrome.kudyLink', href: '/my' },
];
const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((item) => [item.id, item]));
const WALK_KEY = 'native.chrome.walk';

const PROMPT_BY_LOCALE = {
  be: 'Куды сёння?', en: 'Where to today?', uk: 'Куди сьогодні?', de: 'Wohin heute?', es: '¿Adónde hoy?',
  fr: 'Où aller aujourd’hui ?', cs: 'Kam dnes?', sv: 'Vart i dag?',
  nb: 'Hvor vil du i dag?', pl: 'Dokąd dzisiaj?', da: 'Hvorhen i dag?', nl: 'Waarheen vandaag?', pt: 'Para onde hoje?',
};
const CITY_BY_LOCALE = {
  be: 'Гданьск', en: 'Gdańsk', uk: 'Гданськ', de: 'Danzig', es: 'Gdansk',
  fr: 'Gdańsk', cs: 'Gdaňsk', sv: 'Gdańsk',
  nb: 'Gdańsk', pl: 'Gdańsk', da: 'Gdańsk', nl: 'Gdańsk', pt: 'Gdańsk',
};

const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const manifestRes = await fetch(new URL('manifest.json', ASSET_BASE));
if (!manifestRes.ok) throw new Error(`manifest.json: ${manifestRes.status}`);
const mapManifest = await manifestRes.json();

const hitMasks = new Map();
await Promise.all([...mapManifest.pieces, ...mapManifest.layers].map(async (entry) => {
  const img = new Image();
  img.src = new URL(entry.png, ASSET_BASE);
  await img.decode();
  const canvas = el('canvas', { width: entry.width, height: entry.height });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  hitMasks.set(entry.id, ctx.getImageData(0, 0, entry.width, entry.height).data);
}));

let instanceCounter = 0;

// Builds the background engravings: Gdańsk maritime + cosmos symbols (`cosmos`)
// or extended outer cartographic terrain (`extended`), masked by a soft radial vignette.
function buildBackgroundMotifs(mode, ox, oy, ratio, maskAttr) {
  const sw = (px) => px / ratio;
  if (mode === 'extended') {
    const terrain = svg('g', { 'stroke-width': sw(1.5) },
      svg('path', { d: 'M 680 0 C 700 -140, 780 -220, 890 -260 M 740 0 C 770 -120, 850 -190, 960 -230', 'stroke-width': sw(2.4) }),
      svg('path', { d: 'M 1210 340 C 1340 310, 1460 240, 1560 120 M 1220 410 C 1360 380, 1490 310, 1600 190', 'stroke-width': sw(2.2) }),
      svg('path', { d: 'M 730 1115 C 745 1230, 790 1320, 860 1410 M 795 1065 C 815 1190, 865 1290, 940 1380', 'stroke-width': sw(2.2) }),
      svg('path', { d: 'M 40 460 C -90 450, -190 410, -280 350 M 40 520 C -80 515, -180 480, -270 430', 'stroke-width': sw(2) }),
      svg('path', { d: 'M 140 80 L 40 -70 L 240 -120 L 340 60 Z M 340 60 L 240 -120 L 480 -140 L 520 50 Z' }),
      svg('path', { d: 'M 880 40 L 960 -110 L 1180 -60 L 1090 110 Z M 1090 110 L 1180 -60 L 1360 40 L 1230 190 Z' }),
      svg('path', { d: 'M 1180 560 L 1420 520 L 1460 720 L 1160 740 Z M 1160 740 L 1460 720 L 1390 920 L 1080 880 Z' }),
      svg('path', { d: 'M 120 860 L -110 920 L -40 1120 L 240 990 Z M 280 1030 L 180 1240 L 460 1290 L 520 1080 Z' }),
    );
    return atlasMotifs(ox, oy, ratio, maskAttr, terrain);
  }
  return atlasMotifs(ox, oy, ratio, maskAttr);
}

// Builds the 5 architectural/cartographic miniature figurines for `diorama` mode
function buildDioramaMonument(pieceId, fs) {
  const s = fs;
  const g = svg('g', { transform: `scale(${s})` });
  g.append(svg('ellipse', { class: 'd-pedestal', cx: 0, cy: 2, rx: 14, ry: 5.5 }));

  if (pieceId === 'nearby') {
    g.append(
      svg('path', { class: 'd-monument', d: 'M -7 1 L -5 -16 L 5 -16 L 7 1 Z' }),
      svg('path', { class: 'd-accent', d: 'M -7 -16 L 0 -25 L 7 -16 Z' }),
      svg('line', { class: 'd-monument', x1: 0, y1: -25, x2: 0, y2: -32 }),
      svg('path', { class: 'd-gold', d: 'M 0 -31 L 8 -28 L 0 -25 Z' }),
      svg('rect', { class: 'd-gold', x: -2, y: -11, width: 4, height: 6, rx: 2 }),
    );
  } else if (pieceId === 'guides') {
    g.append(
      svg('path', { class: 'd-monument', d: 'M -10 1 L -10 -15 L -4 -20 L 4 -20 L 10 -15 L 10 1 L 4 1 L 4 -9 A 4 4 0 0 0 -4 -9 L -4 1 Z' }),
      svg('path', { class: 'd-accent', d: 'M -11 -15 L 0 -24 L 11 -15 Z' }),
      svg('line', { class: 'd-monument', x1: 10, y1: -14, x2: 16, y2: -14 }),
      svg('circle', { class: 'd-gold', cx: 16, cy: -10, r: 3.5 }),
    );
  } else if (pieceId === 'discovery') {
    g.append(
      svg('path', { class: 'd-monument', d: 'M -9 1 L -7 -18 L 3 -18 L 5 1 Z' }),
      svg('path', { class: 'd-accent', d: 'M -8 -18 L -2 -26 L 6 -16 L -8 -16 Z' }),
      svg('line', { class: 'd-monument', x1: 3, y1: -20, x2: 14, y2: -25 }),
      svg('line', { class: 'd-monument', x1: 13, y1: -24, x2: 13, y2: -11 }),
      svg('circle', { class: 'd-gold', cx: 13, cy: -9, r: 3 }),
    );
  } else if (pieceId === 'reserve-1') {
    g.append(
      svg('path', { class: 'd-monument', d: 'M -8 1 L -8 -14 L 8 -14 L 8 1 Z' }),
      svg('path', { class: 'd-accent', d: 'M -9 -14 L -5 -21 L 5 -21 L 9 -14 Z' }),
      svg('path', { class: 'd-monument', d: 'M -3 -21 L 0 -31 L 3 -21 Z' }),
      svg('circle', { class: 'd-gold', cx: 0, cy: -32, r: 2.3 }),
      svg('circle', { class: 'd-gold', cx: 0, cy: -8, r: 3.2 }),
    );
  } else {
    g.append(
      svg('rect', { class: 'd-monument', x: -10, y: -11, width: 20, height: 12, rx: 2 }),
      svg('path', { class: 'd-accent', d: 'M -10 -11 C -10 -17, 10 -17, 10 -11 Z' }),
      svg('circle', { class: 'd-gold', cx: 0, cy: -11, r: 5.5 }),
      svg('path', { class: 'd-accent', d: 'M -2 -3 L 0 4 L 3 -3 Z' }),
    );
  }
  return g;
}

function createPolishMenu(svgRoot, options) {
  const uid = `mp${(instanceCounter += 1)}`;
  const { strings, say, styleMode, bgMode, initialState, restBox, scaleFactor } = options;
  const fs = Math.min(Number(scaleFactor) || 1, 1.22);
  let sessionToken = 1;
  let dragState = null;
  let keyState = null;
  let isAssembled = false;
  let isRevealed = false;
  const groups = new Set();
  const piecesById = new Map();
  const passiveLayers = [];

  const ratio = Math.min(svgRoot.clientWidth / STAGE_BOUNDS.minW, svgRoot.clientHeight / STAGE_BOUNDS.minH);
  const viewW = svgRoot.clientWidth / ratio;
  const viewH = svgRoot.clientHeight / ratio;
  const originX = (viewW - STAGE_BOUNDS.w) / 2;
  const originY = (viewH - STAGE_BOUNDS.h) / 2;
  svgRoot.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
  svgRoot.dataset.style = styleMode;

  const schedule = (cb, delayMs) => {
    const token = sessionToken;
    setTimeout(() => { if (token === sessionToken) cb(); }, delayMs);
  };

  const sectionLabel = (id) => plainLabel(strings[SECTION_BY_ID[id].key]);

  const radialGrad = svg('radialGradient', { id: `${uid}-light` },
    svg('stop', { offset: 0, 'stop-color': '#fff6cf', 'stop-opacity': 1 }),
    svg('stop', { offset: 0.28, 'stop-color': '#ffca57', 'stop-opacity': 0.95 }),
    svg('stop', { offset: 0.62, 'stop-color': amberPalette.glow, 'stop-opacity': 0.72 }),
    svg('stop', { offset: 1, 'stop-color': amberPalette.edge, 'stop-opacity': 0 }));

  const seamBlur = svg('filter', { id: `${uid}-seam-glow`, x: '-25%', y: '-25%', width: '150%', height: '150%' },
    svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 14, result: 'blur' }),
    svg('feMerge', {}, svg('feMergeNode', { in: 'blur' }), svg('feMergeNode', { in: 'SourceGraphic' })));

  const clipCircle = svg('circle', { cx: STAGE_BOUNDS.cx, cy: STAGE_BOUNDS.cy, r: 0 });
  const bastionClip = svg('clipPath', { id: `${uid}-bastion-wall` }, svg('path', { d: BASTION_CLIP_PATH }));
  const defs = svg('defs', {}, radialGrad, ...atlasVignette(uid, viewW, viewH), seamBlur, penStroke(`${uid}-hand`), svg('clipPath', { id: `${uid}-clip` }, clipCircle), bastionClip);

  function makeBadge(pieceId, labelText) {
    const meta = SECTION_BY_ID[pieceId];

    // 2. `marginalia`: Only a tiny glowing amber astrolabe beacon sits on the map piece;
    // the text callouts float around the outer perimeter connected by live golden rays!
    if (styleMode === 'marginalia') {
      const r = 6.5 * fs;
      const node = svg('g', { class: 'marginalia-beacon' },
        svg('circle', { cx: 0, cy: 0, r: r * 1.9, fill: 'rgba(240, 168, 48, 0.22)', stroke: '#e3a24a', 'stroke-width': 1 }),
        svg('circle', { cx: 0, cy: 0, r, fill: '#b85d28', stroke: '#fff6dc', 'stroke-width': 1.6 }),
        svg('circle', { cx: -1.8 * fs, cy: -1.8 * fs, r: 1.8 * fs, fill: '#fff8eb' }));
      return { badge: node, padW: 16 * fs, padH: 16 * fs };
    }

    // 3. `diorama`: 3D Engraved Architectural Monument + Curved `<textPath>` directly on the map!
    if (styleMode === 'diorama') {
      const arcId = `${uid}-arc-${pieceId}`;
      const arcRadius = 56 * fs;
      defs.append(svg('path', {
        id: arcId,
        d: `M ${-arcRadius} ${11 * fs} Q 0 ${24 * fs} ${arcRadius} ${11 * fs}`,
        fill: 'none',
      }));
      const monument = buildDioramaMonument(pieceId, fs);
      const textPathEl = svg('textPath', { href: `#${arcId}`, startOffset: '50%', 'text-anchor': 'middle' }, labelText);
      const txtEl = svg('text', { class: 'd-arc-text', 'font-size': Math.round(13.5 * fs) }, textPathEl);
      const group = svg('g', { class: 'diorama-badge' }, monument, txtEl);
      return { badge: group, padW: Math.max(34, (labelText.length * 7.2 * fs) / 2 + 8), padH: 28 * fs };
    }

    // 4. `dock`: Clean Roman Numeral Wax Seal (`I`–`V`) on the map piece; full menu sits in the bottom Compass Dock!
    if (styleMode === 'dock') {
      const r = 11.5 * fs;
      const tok = svg('g', { class: 'dock-token' },
        svg('circle', { class: 'dt-ring', cx: 0, cy: 0, r }),
        svg('circle', { cx: 0, cy: 0, r: r - 2.2 * fs, fill: 'none', stroke: 'rgba(196, 140, 50, 0.45)', 'stroke-width': 0.8, 'stroke-dasharray': '2 1.5' }),
        svg('text', { class: 'dt-num', x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(11.5 * fs) }, meta.roman));
      return { badge: tok, padW: r + 4, padH: r + 4 };
    }

    // 5. `crest`: Refined Baroque Guild Shield with top crown arch
    if (styleMode === 'crest') {
      const fontSize = Math.round(12.5 * fs);
      const ico = 12 * fs;
      const h = Math.round(23 * fs);
      const textW = Math.max(32, Math.round(labelText.length * 6.6 * fs));
      const w = Math.round(textW + 18 * fs);
      const crownR = Math.round(10 * fs);
      const plate = svg('path', { class: 'cr-plate' });
      const inner = svg('path', { class: 'cr-inner' });
      const rivetL = svg('circle', { class: 'cr-rivet', r: 1.4 * fs, cy: 2 * fs });
      const rivetR = svg('circle', { class: 'cr-rivet', r: 1.4 * fs, cy: 2 * fs });
      const icoGroup = svg('g', { class: 'cr-icon', transform: `translate(${-ico / 2} ${-h / 2 - crownR * 0.45 - ico / 2}) scale(${ico / 24})` }, ...iconShapes(meta.icon));
      const txtNode = svg('text', { class: 'cr-text', x: 0, y: 2.5 * fs, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': fontSize }, labelText);

      const chamferPath = (cw, ch, c, crown) => {
        const hw = cw / 2;
        const hh = ch / 2;
        return [
          `M ${-crown} ${-hh}`,
          `A ${crown} ${crown} 0 1 1 ${crown} ${-hh}`,
          `L ${hw - c} ${-hh}`,
          `Q ${hw - c} ${-hh + c} ${hw} ${-hh + c}`,
          `L ${hw} ${hh - c}`,
          `Q ${hw - c} ${hh - c} ${hw - c} ${hh}`,
          `L 0 ${hh + 3 * fs}`,
          `L ${-hw + c} ${hh}`,
          `Q ${-hw + c} ${hh - c} ${-hw} ${hh - c}`,
          `L ${-hw} ${-hh + c}`,
          `Q ${-hw + c} ${-hh + c} ${-hw + c} ${-hh}`,
          'Z',
        ].join(' ');
      };

      const layoutCrest = (cw) => {
        const c = Math.round(4.5 * fs);
        plate.setAttribute('d', chamferPath(cw, h, c, crownR));
        inner.setAttribute('d', chamferPath(cw - 4, h - 4, Math.max(2, c - 1), Math.max(4, crownR - 2)));
        rivetL.setAttribute('cx', -cw / 2 + 5 * fs);
        rivetR.setAttribute('cx', cw / 2 - 5 * fs);
      };
      layoutCrest(w);

      const crest = svg('g', { class: 'crest-badge' }, plate, inner, rivetL, rivetR, icoGroup, txtNode);
      requestAnimationFrame(() => {
        if (!txtNode.isConnected || typeof txtNode.getComputedTextLength !== 'function') return;
        const m = txtNode.getComputedTextLength();
        if (m > 0) layoutCrest(Math.round(Math.max(36, m + 18 * fs)));
      });
      return { badge: crest, padW: w / 2 + 4, padH: h / 2 + crownR };
    }

    // 1. Default (`ribbon`): Clean Atlas Ribbon Scroll WITHOUT left icon!
    const ribbon = createRibbon(labelText, fs);
    requestAnimationFrame(ribbon.layout);
    return ribbon;
  }

  const trimRightWater = bgMode !== 'extended';
  const wallClipAttr = trimRightWater ? `url(#${uid}-bastion-wall)` : null;

  const bgMotifs = buildBackgroundMotifs(bgMode, originX, originY, ratio, `url(#${uid}-vignette-mask)`);
  const bgLayers = svg('g', {
    class: 'bg-layers',
    'data-bg': bgMode,
    transform: `translate(${originX} ${originY})`,
    mask: `url(#${uid}-vignette-mask)`,
    'aria-hidden': 'true',
  },
    svg('g', trimRightWater ? { 'clip-path': wallClipAttr } : {},
      ...mapManifest.layers.map((layer) => svg('image', { href: new URL(layer.png, ASSET_BASE), x: layer.x, y: layer.y, width: layer.width, height: layer.height }))));

  const radiance = svg('ellipse', { class: 'radiance', cx: STAGE_BOUNDS.cx, cy: STAGE_BOUNDS.cy, rx: 940, ry: 840, fill: `url(#${uid}-light)` });
  const innerWave = svg('ellipse', { class: 'energy-ring', cx: STAGE_BOUNDS.cx, cy: STAGE_BOUNDS.cy, rx: 610, ry: 510 });
  const outerWave = svg('ellipse', { class: 'energy-ring-outer', cx: STAGE_BOUNDS.cx, cy: STAGE_BOUNDS.cy, rx: 740, ry: 630 });

  const seamGlow = svg('g', { class: 'seam-glow', filter: `url(#${uid}-seam-glow)` });
  for (const piece of mapManifest.pieces) {
    seamGlow.append(
      svg('path', { d: piece.path, transform: `translate(${piece.x} ${piece.y})`, stroke: '#ffae2b', 'stroke-width': 22, 'stroke-opacity': 0.75 }),
      svg('path', { d: piece.path, transform: `translate(${piece.x} ${piece.y})`, stroke: '#fff7d6', 'stroke-width': 7, 'stroke-opacity': 0.98 }));
  }

  const threadNodes = lightThreads(0, 0).map((thread) => {
    const wrapper = svg('g', { opacity: 0 });
    for (const [w, op, strokeColor] of [[32, 0.24, '#ffae2b'], [13, 0.65, '#ffd46b'], [thread.width * 1.35, 1, '#fff9e2']]) {
      wrapper.append(svg('path', { d: thread.d, fill: 'none', stroke: strokeColor, 'stroke-width': w, 'stroke-opacity': op, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1700 1500' }));
    }
    return wrapper;
  });

  const evolutionLayer = svg('g', { 'pointer-events': 'none' }, radiance, innerWave, outerWave, svg('g', {}, ...threadNodes));
  const sceneInner = svg('g', trimRightWater ? { 'clip-path': wallClipAttr } : {});
  const sceneLayer = svg('g', { 'clip-path': `url(#${uid}-clip)`, 'aria-hidden': 'true' }, sceneInner);
  const piecesLayer = svg('g');
  const overlayUiLayer = svg('g');
  const sparksLayer = svg('g', { 'pointer-events': 'none' });
  svgRoot.append(defs, bgMotifs, bgLayers, evolutionLayer, sceneLayer, piecesLayer, seamGlow, overlayUiLayer, sparksLayer);

  for (const item of mapManifest.pieces) {
    const pieceNode = svg('g', { class: 'piece', 'data-piece': item.id, tabindex: 0, role: 'button' });
    const p = item.padding;
    defs.append(svg('mask', { id: `${uid}-veil-${item.id}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: item.width, height: item.height },
      svg('image', { href: new URL(item.light, ASSET_BASE), width: item.width, height: item.height })));
    const veilRect = svg('rect', { x: 0, y: 0, width: item.width, height: item.height, fill: '#ffe596', mask: `url(#${uid}-veil-${item.id})`, opacity: 0 });

    const artGroup = svg('g', { class: 'art', 'pointer-events': 'none' },
      svg('path', { class: 'rim-outer', d: item.path, 'stroke-width': 6.5 / ratio }),
      svg('path', { class: 'rim-paper', d: item.path, 'stroke-width': 3.4 / ratio }),
      svg('image', { class: 'tone', href: new URL(item.png, ASSET_BASE), width: item.width, height: item.height }),
      svg('image', { class: 'tone ui-art', href: new URL(item.ui, ASSET_BASE), x: -p, y: -p, width: item.width + p * 2, height: item.height + p * 2 }),
      veilRect,
      svg('path', { class: 'ring', d: item.path, 'stroke-width': 3.5 / ratio }));

    const localAx = item.anchor[0] - item.x;
    const localAy = item.anchor[1] - item.y;
    const text = sectionLabel(item.id);
    const { badge, padW, padH } = makeBadge(item.id, text);
    pieceNode.append(artGroup, svg('g', { class: 'caption', transform: `translate(${localAx} ${localAy}) scale(${1 / ratio})` }, badge));
    piecesLayer.append(pieceNode);

    const actor = {
      ...item,
      localAx,
      localAy,
      node: pieceNode,
      veil: veilRect,
      alpha: hitMasks.get(item.id),
      ext: {
        l: Math.min(0, localAx - padW / ratio),
        r: Math.max(item.width, localAx + padW / ratio),
        t: Math.min(0, localAy - padH / ratio),
        b: Math.max(item.height, localAy + padH / ratio),
      },
    };
    pieceNode.setAttribute('aria-label', text);
    pieceNode.addEventListener('keydown', (ev) => onKeyDown(ev, actor));
    piecesById.set(item.id, actor);
  }

  for (const layer of mapManifest.layers) {
    const layerNode = svg('g', { class: 'scene-part' }, svg('image', { href: new URL(layer.png, ASSET_BASE), x: layer.x, y: layer.y, width: layer.width, height: layer.height }));
    sceneInner.append(layerNode);
    passiveLayers.push({ ...layer, node: layerNode, alpha: hitMasks.get(layer.id), passive: true });
  }

  // Marginalia Callouts (`marginalia` mode): 5 outer perimeter callouts + live golden leader lines
  const marginaliaNodes = new Map();
  if (styleMode === 'marginalia') {
    const mLayer = svg('g', { class: 'marginalia-layer' });
    const MARGIN_SLOTS = {
      nearby: { fx: 0.2, fy: 0.065, align: 'left' },
      guides: { fx: 0.8, fy: 0.065, align: 'right' },
      discovery: { fx: 0.82, fy: 0.48, align: 'right' },
      'reserve-1': { fx: 0.2, fy: 0.92, align: 'left' },
      kudy: { fx: 0.8, fy: 0.92, align: 'right' },
    };

    for (const sec of SECTIONS) {
      const slot = MARGIN_SLOTS[sec.id];
      const text = sectionLabel(sec.id);
      const tx = slot.fx * viewW;
      const ty = slot.fy * viewH;
      const line = svg('polyline', { class: 'm-line', 'stroke-width': 2 / ratio, 'stroke-dasharray': `${5 / ratio} ${3.5 / ratio}` });
      const pulse = svg('circle', { class: 'm-pulse', r: 9 / ratio, 'stroke-width': 1.5 / ratio });

      const ico = 11.5 * fs;
      const h = Math.round(22 * fs);
      const estW = Math.max(54, Math.round(text.length * 6.8 * fs + 28 * fs));
      const plate = svg('rect', { class: 'm-plate', x: -estW / 2, y: -h / 2, width: estW, height: h, rx: 4 * fs });
      const rule = svg('line', { class: 'm-rule', x1: -estW / 2 + 6, y1: h / 2 - 2.5, x2: estW / 2 - 6, y2: h / 2 - 2.5 });
      const icoEl = svg('g', { class: 'm-icon', transform: `translate(${-estW / 2 + 7 * fs} ${-ico / 2}) scale(${ico / 24})` }, ...iconShapes(sec.icon));
      const txtEl = svg('text', { class: 'm-text', x: -estW / 2 + 7 * fs + ico + 4 * fs, y: 0, 'dominant-baseline': 'central', 'font-size': Math.round(12 * fs) }, text);
      const arrEl = svg('path', { class: 'm-arrow', d: `M ${estW / 2 - 9 * fs} ${-3 * fs} L ${estW / 2 - 5.5 * fs} 0 L ${estW / 2 - 9 * fs} ${3 * fs}` });

      const itemGroup = svg('g', { class: 'marginalia-item', 'data-piece': sec.id, transform: `translate(${tx} ${ty}) scale(${1 / ratio})` },
        plate, rule, icoEl, txtEl, arrEl);

      requestAnimationFrame(() => {
        if (!txtEl.isConnected || typeof txtEl.getComputedTextLength !== 'function') return;
        const mw = txtEl.getComputedTextLength();
        if (mw <= 0) return;
        const fullW = Math.round(mw + ico + 23 * fs);
        plate.setAttribute('x', -fullW / 2);
        plate.setAttribute('width', fullW);
        rule.setAttribute('x1', -fullW / 2 + 6);
        rule.setAttribute('x2', fullW / 2 - 6);
        icoEl.setAttribute('transform', `translate(${-fullW / 2 + 7 * fs} ${-ico / 2}) scale(${ico / 24})`);
        txtEl.setAttribute('x', -fullW / 2 + 7 * fs + ico + 4 * fs);
        arrEl.setAttribute('d', `M ${fullW / 2 - 8.5 * fs} ${-3 * fs} L ${fullW / 2 - 5 * fs} 0 L ${fullW / 2 - 8.5 * fs} ${3 * fs}`);
      });

      itemGroup.addEventListener('pointerenter', () => {
        piecesById.get(sec.id)?.node.classList.add('dock-active');
        itemGroup.classList.add('active');
      });
      itemGroup.addEventListener('pointerleave', () => {
        piecesById.get(sec.id)?.node.classList.remove('dock-active');
        itemGroup.classList.remove('active');
      });
      itemGroup.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const actor = piecesById.get(sec.id);
        if (actor) activateSection(actor);
      });

      mLayer.append(line, pulse, itemGroup);
      marginaliaNodes.set(sec.id, { line, pulse, itemGroup, tx, ty, h });
    }
    overlayUiLayer.append(mLayer);
  }

  // Bottom Compass Legend Dock (`dock` mode)
  const dockItems = new Map();
  if (styleMode === 'dock') {
    const dockGroup = svg('g', { class: 'compass-dock' });
    const dockY = viewH * 0.925;
    dockGroup.append(svg('path', {
      class: 'cd-arc',
      d: `M ${viewW * 0.06} ${dockY + 14 / ratio} Q ${viewW * 0.5} ${dockY - 18 / ratio} ${viewW * 0.94} ${dockY + 14 / ratio}`,
      'stroke-width': 1.4 / ratio,
    }));

    const xPositions = [0.12, 0.30, 0.50, 0.71, 0.89];
    const yOffsets = [8, 2, -3, 2, 8];

    SECTIONS.forEach((sec, idx) => {
      const text = sectionLabel(sec.id);
      const dx = viewW * xPositions[idx];
      const dy = dockY + yOffsets[idx] / ratio;
      const h = Math.round(21 * fs);
      const estW = Math.max(46, Math.round(text.length * 6.2 * fs + 20 * fs));
      const r = 7.5 * fs;

      const pill = svg('rect', { class: 'cd-pill', x: -estW / 2, y: -h / 2, width: estW, height: h, rx: h / 2 });
      const badgeCircle = svg('circle', { class: 'cd-badge', cx: -estW / 2 + r + 2.5 * fs, cy: 0, r });
      const numTxt = svg('text', { class: 'cd-num', x: -estW / 2 + r + 2.5 * fs, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(9.5 * fs) }, sec.roman);
      const labelTxt = svg('text', { class: 'cd-text', x: -estW / 2 + r * 2 + 5.5 * fs, y: 0.5, 'dominant-baseline': 'central', 'font-size': Math.round(11 * fs) }, text);

      const itemNode = svg('g', { class: 'compass-dock-item', 'data-piece': sec.id, transform: `translate(${dx} ${dy}) scale(${1 / ratio})` },
        pill, badgeCircle, numTxt, labelTxt);

      requestAnimationFrame(() => {
        if (!labelTxt.isConnected || typeof labelTxt.getComputedTextLength !== 'function') return;
        const mw = labelTxt.getComputedTextLength();
        if (mw <= 0) return;
        const fullW = Math.round(mw + r * 2 + 12 * fs);
        pill.setAttribute('x', -fullW / 2);
        pill.setAttribute('width', fullW);
        const cx = -fullW / 2 + r + 2.5 * fs;
        badgeCircle.setAttribute('cx', cx);
        numTxt.setAttribute('x', cx);
        labelTxt.setAttribute('x', cx + r + 3.5 * fs);
      });

      itemNode.addEventListener('pointerenter', () => {
        piecesById.get(sec.id)?.node.classList.add('dock-active');
        itemNode.classList.add('active');
      });
      itemNode.addEventListener('pointerleave', () => {
        piecesById.get(sec.id)?.node.classList.remove('dock-active');
        itemNode.classList.remove('active');
      });
      itemNode.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const actor = piecesById.get(sec.id);
        if (actor) activateSection(actor);
      });

      dockGroup.append(itemNode);
      dockItems.set(sec.id, itemNode);
    });
    overlayUiLayer.append(dockGroup);
  }

  function syncPositions() {
    for (const actor of piecesById.values()) {
      const grp = actor.group;
      const px = originX + actor.x + grp.dx;
      const py = originY + actor.y + grp.dy;
      actor.node.style.transform = `translate(${px}px,${py}px)`;
      actor.node.classList.toggle('grouped', grp.members.size > 1);

      const mNode = marginaliaNodes.get(actor.id);
      if (mNode) {
        const ax = px + actor.localAx;
        const ay = py + actor.localAy;
        const elbowX = ax + (mNode.tx - ax) * 0.55;
        const elbowY = mNode.ty + (ay > mNode.ty ? (mNode.h * 0.52) / ratio : (-mNode.h * 0.52) / ratio);
        mNode.line.setAttribute('points', `${ax},${ay} ${elbowX},${elbowY} ${mNode.tx},${elbowY}`);
        mNode.pulse.setAttribute('cx', ax);
        mNode.pulse.setAttribute('cy', ay);
      }
    }
    const completeGroup = [...groups].find((g) => g.members.size === piecesById.size);
    const transformAttr = `translate(${originX + (completeGroup?.dx ?? 0)} ${originY + (completeGroup?.dy ?? 0)})`;
    sceneLayer.setAttribute('transform', transformAttr);
    evolutionLayer.setAttribute('transform', transformAttr);
    seamGlow.setAttribute('transform', transformAttr);
  }

  function applyRevealFrame(elapsedMs) {
    if (elapsedMs < 0) {
      radiance.style.opacity = 0;
      innerWave.style.opacity = 0;
      outerWave.style.opacity = 0;
      seamGlow.style.opacity = 0;
      for (const actor of piecesById.values()) actor.veil.setAttribute('opacity', 0);
      for (const node of threadNodes) node.setAttribute('opacity', 0);
      return amberMotion(elapsedMs, mapManifest.reveal);
    }
    const motion = amberMotion(elapsedMs, mapManifest.reveal);
    const boost = Math.min(1, motion.light * 1.25);
    radiance.style.opacity = boost;
    radiance.style.transform = `scale(${0.45 + boost * 0.7})`;
    innerWave.style.opacity = boost * 0.58;
    innerWave.style.transform = `scale(${0.5 + motion.progress * 0.65})`;
    outerWave.style.opacity = boost * 0.42;
    outerWave.style.transform = `scale(${0.4 + motion.progress * 0.85})`;
    seamGlow.style.opacity = Math.min(1, elapsedMs < 650 ? elapsedMs / 650 : Math.max(0.28, 1 - (elapsedMs - 650) / 1800));

    for (const actor of piecesById.values()) actor.veil.setAttribute('opacity', Math.min(1, motion.veil * 1.2));
    lightThreads(motion.progress, boost).forEach((t, idx) => {
      const node = threadNodes[idx];
      node.setAttribute('opacity', Math.min(1, t.opacity * 1.2));
      node.setAttribute('transform', `translate(${t.x} ${t.y})`);
      for (const pathEl of node.children) pathEl.setAttribute('stroke-dashoffset', t.offset);
    });
    return motion;
  }

  function finalizeReveal() {
    applyRevealFrame(Object.values(mapManifest.reveal).reduce((acc, ms) => acc + ms, 0));
    isRevealed = true;
    clipCircle.setAttribute('r', 1050);
    svgRoot.classList.remove('settling');
    sceneLayer.setAttribute('aria-hidden', 'false');
    radiance.style.opacity = 0.42;
    radiance.style.transform = 'scale(1.02)';
    innerWave.style.opacity = 0.22;
    outerWave.style.opacity = 0.14;
    seamGlow.style.opacity = 0.28;
    if (restBox) restBox.classList.add('panorama-lit');
    say('Карта сабраная: вонкавыя бастыёны раскрытыя, усе 5 кварталаў працуюць як кнопкі.');
  }

  function burstJointSparks(joint, grp) {
    if (motionQuery.matches) return;
    const cx = originX + grp.dx + joint.port[0];
    const cy = originY + grp.dy + joint.port[1];
    for (let i = 0; i < 10; i += 1) {
      const rad = (i * Math.PI) / 5;
      const sparkLine = svg('line', {
        class: 'spark',
        x1: cx + Math.cos(rad) * 12,
        y1: cy + Math.sin(rad) * 12,
        x2: cx + Math.cos(rad) * 58,
        y2: cy + Math.sin(rad) * 58,
      });
      sparksLayer.append(sparkLine);
      setTimeout(() => sparkLine.remove(), 450);
    }
  }

  function triggerFullAssembly(grp) {
    isAssembled = true;
    svgRoot.classList.add('complete');
    if (!motionQuery.matches) svgRoot.classList.add('settling');
    grp.dx = 0;
    grp.dy = 0;
    syncPositions();
    schedule(() => {
      svgRoot.classList.remove('settling');
      if (motionQuery.matches) { finalizeReveal(); return; }
      for (const joint of mapManifest.joints) burstJointSparks(joint, grp);
      const startTs = performance.now();
      const token = sessionToken;
      const step = (now) => {
        if (token !== sessionToken) return;
        const m = applyRevealFrame(now - startTs);
        clipCircle.setAttribute('r', m.radius);
        if (m.phase !== 'complete') requestAnimationFrame(step);
        else finalizeReveal();
      };
      requestAnimationFrame(step);
    }, motionQuery.matches ? 0 : 380);
  }

  function clearTouchState() {
    for (const actor of piecesById.values()) {
      actor.node.dataset.touch = 'idle';
      actor.node.classList.remove('near', 'dock-active');
    }
    for (const m of marginaliaNodes.values()) m.itemGroup.classList.remove('active');
    for (const d of dockItems.values()) d.classList.remove('active');
  }

  function findCandidateSnap(grp) {
    return findMagnet(grp, piecesById, mapManifest.joints, mapManifest.gesture.snapDistanceDp / ratio);
  }

  function moveGroupBy(grp, deltaX, deltaY) {
    const list = [...grp.members].map((id) => piecesById.get(id));
    const minX = isAssembled ? 0 : Math.min(...list.map((a) => a.x + a.ext.l));
    const maxX = isAssembled ? STAGE_BOUNDS.w : Math.max(...list.map((a) => a.x + a.ext.r));
    const minY = isAssembled ? 0 : Math.min(...list.map((a) => a.y + a.ext.t));
    const maxY = isAssembled ? STAGE_BOUNDS.h : Math.max(...list.map((a) => a.y + a.ext.b));
    grp.dx = Math.max(-originX - minX, Math.min(viewW - originX - maxX, grp.dx + deltaX));
    grp.dy = Math.max(-originY - minY, Math.min(viewH - originY - maxY, grp.dy + deltaY));
    syncPositions();
  }

  function updateDragFeedback(grp) {
    clearTouchState();
    for (const id of grp.members) {
      piecesById.get(id).node.dataset.touch = 'dragging';
      marginaliaNodes.get(id)?.itemGroup.classList.add('active');
      dockItems.get(id)?.classList.add('active');
    }
    const snapTarget = findCandidateSnap(grp);
    if (snapTarget) for (const id of snapTarget.other.members) piecesById.get(id).node.classList.add('near');
  }

  function trySnapGroup(grp) {
    const snapTarget = findCandidateSnap(grp);
    if (!snapTarget) return false;
    const movingActors = [...grp.members].map((id) => piecesById.get(id));
    const priorTransforms = movingActors.map((a) => a.node.style.transform);
    joinGroups(grp, snapTarget.other, piecesById, groups);
    syncPositions();
    if (!motionQuery.matches && grp.members.size < piecesById.size) {
      movingActors.forEach((a, idx) => a.node.animate([{ transform: priorTransforms[idx] }, { transform: a.node.style.transform }], { duration: 220, easing: 'cubic-bezier(.2,1.25,.4,1)' }));
    }
    burstJointSparks(snapTarget.joint, grp);
    say(`Злучана ${grp.members.size} з ${piecesById.size}. Часткі рухаюцца разам.`);
    if (grp.members.size === piecesById.size) triggerFullAssembly(grp);
    return true;
  }

  function abortMovement() {
    const active = dragState ?? keyState;
    if (!active) return;
    clearTimeout(active.holdTimer);
    active.group.dx = active.startOffset[0];
    active.group.dy = active.startOffset[1];
    dragState = null;
    keyState = null;
    clearTouchState();
    syncPositions();
  }

  function activateSection(actor) {
    const entry = SECTION_BY_ID[actor.id];
    say(`Адкрываецца раздзел «${sectionLabel(actor.id)}» → ${entry.href}`);
  }

  function onKeyDown(ev, actor) {
    if (isAssembled && !isRevealed && ev.key.startsWith('Arrow')) return;
    const step = 8 / ratio;
    const deltaByKey = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (deltaByKey[ev.key]) {
      ev.preventDefault();
      if (keyState?.group !== actor.group) keyState = { group: actor.group, startOffset: [actor.group.dx, actor.group.dy] };
      moveGroupBy(actor.group, ...deltaByKey[ev.key]);
      updateDragFeedback(actor.group);
    } else if (ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      keyState = null;
      clearTouchState();
      if (!isAssembled) trySnapGroup(actor.group);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      keyState = null;
      activateSection(actor);
    } else if (ev.key === 'Escape') {
      abortMovement();
    }
  }

  function hitTestPointer(ev) {
    const mItem = ev.target.closest?.('.marginalia-item, .compass-dock-item');
    if (mItem && svgRoot.contains(mItem)) return undefined;
    const captionEl = ev.target.closest?.('.caption');
    if (captionEl && svgRoot.contains(captionEl)) return piecesById.get(captionEl.parentNode.dataset.piece);
    for (const actor of [...piecesById.values()].reverse()) {
      const ctm = actor.node.getScreenCTM();
      if (!ctm) continue;
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
      const px = Math.floor(pt.x), py = Math.floor(pt.y);
      if (px >= 0 && py >= 0 && px < actor.width && py < actor.height && actor.alpha[(py * actor.width + px) * 4 + 3] > 32) return actor;
    }
    const radius = Number(clipCircle.getAttribute('r'));
    if (radius > 0) {
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(sceneLayer.getScreenCTM().inverse());
      if (Math.hypot(pt.x - STAGE_BOUNDS.cx, pt.y - STAGE_BOUNDS.cy) <= radius) {
        for (const layer of passiveLayers) {
          const px = Math.floor(pt.x - layer.x), py = Math.floor(pt.y - layer.y);
          if (px >= 0 && py >= 0 && px < layer.width && py < layer.height && layer.alpha[(py * layer.width + px) * 4 + 3] > 32) return layer;
        }
      }
    }
    return undefined;
  }

  const slotTable = styleMode === 'dock'
    ? { nearby: [0.22, 0.16], guides: [0.74, 0.18], discovery: [0.76, 0.56], 'reserve-1': [0.2, 0.48], kudy: [0.45, 0.72] }
    : styleMode === 'marginalia'
      ? { nearby: [0.26, 0.24], guides: [0.72, 0.24], discovery: [0.72, 0.62], 'reserve-1': [0.24, 0.58], kudy: [0.46, 0.78] }
      : PIECE_SLOTS;

  for (const actor of piecesById.values()) {
    const [fx, fy] = slotTable[actor.id];
    const clampedX = Math.max(-actor.ext.l, Math.min(viewW - actor.ext.r, fx * viewW - actor.width / 2));
    const clampedY = Math.max(-actor.ext.t, Math.min(viewH - actor.ext.b, fy * viewH - actor.height / 2));
    actor.group = { members: new Set([actor.id]), dx: clampedX - originX - actor.x, dy: clampedY - originY - actor.y, id: actor.id };
    groups.add(actor.group);
  }
  applyRevealFrame(-1);
  syncPositions();

  svgRoot.addEventListener('pointerdown', (ev) => {
    if (dragState || ev.button !== 0 || !ev.isPrimary) return;
    const hit = hitTestPointer(ev);
    if (!hit) return;
    if (hit.passive) {
      if (!motionQuery.matches) {
        const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svgRoot.getScreenCTM().inverse());
        const rip = svg('circle', { class: 'ripple', cx: pt.x, cy: pt.y, r: 38 });
        sparksLayer.append(rip);
        setTimeout(() => rip.remove(), 500);
      }
      return;
    }
    if (isAssembled && !isRevealed) { activateSection(hit); return; }
    keyState = null;
    svgRoot.setPointerCapture(ev.pointerId);
    hit.node.dataset.touch = 'pressed';
    marginaliaNodes.get(hit.id)?.itemGroup.classList.add('active');
    dockItems.get(hit.id)?.classList.add('active');
    const current = {
      actor: hit,
      group: hit.group,
      pointerId: ev.pointerId,
      startOffset: [hit.group.dx, hit.group.dy],
      startX: ev.clientX,
      startY: ev.clientY,
      prevX: ev.clientX,
      prevY: ev.clientY,
      isDragging: false,
    };
    current.holdTimer = setTimeout(() => {
      if (dragState !== current || current.isDragging) return;
      current.isDragging = true;
      for (const id of current.group.members) piecesById.get(id).node.dataset.touch = 'held';
    }, mapManifest.gesture.holdMs);
    dragState = current;
  });

  svgRoot.addEventListener('pointermove', (ev) => {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    if (!dragState.isDragging) {
      if (Math.hypot(ev.clientX - dragState.startX, ev.clientY - dragState.startY) <= 6) return;
      dragState.isDragging = true;
      clearTimeout(dragState.holdTimer);
    }
    if (ev.clientX === dragState.prevX && ev.clientY === dragState.prevY) return;
    moveGroupBy(dragState.group, (ev.clientX - dragState.prevX) / ratio, (ev.clientY - dragState.prevY) / ratio);
    dragState.prevX = ev.clientX;
    dragState.prevY = ev.clientY;
    updateDragFeedback(dragState.group);
    if (!isAssembled && findCandidateSnap(dragState.group)) {
      const done = dragState;
      dragState = null;
      clearTimeout(done.holdTimer);
      clearTouchState();
      trySnapGroup(done.group);
      if (svgRoot.hasPointerCapture(ev.pointerId)) svgRoot.releasePointerCapture(ev.pointerId);
    }
  });

  svgRoot.addEventListener('pointerup', (ev) => {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    const finished = dragState;
    clearTimeout(finished.holdTimer);
    dragState = null;
    clearTouchState();
    if (!finished.isDragging) activateSection(finished.actor);
  });

  svgRoot.addEventListener('pointercancel', abortMovement);
  svgRoot.addEventListener('lostpointercapture', abortMovement);

  if (initialState === 'assembled' || initialState === 'replay') {
    const merged = { members: new Set(piecesById.keys()), dx: 0, dy: 0, id: 'nearby' };
    groups.clear();
    groups.add(merged);
    for (const actor of piecesById.values()) actor.group = merged;
    if (initialState === 'assembled') {
      isAssembled = true;
      svgRoot.classList.add('complete');
      syncPositions();
      finalizeReveal();
    } else {
      schedule(() => triggerFullAssembly(merged), 260);
    }
  }

  return () => {
    sessionToken += 1;
    dragState = null;
  };
}

await mountBoard({
  controls: [
    {
      id: 'style',
      label: 'Канцэпцыя меню',
      options: [
        ['ribbon', '1. Прынята: Атласная стужка БЕЗ іконкі (чысты світак)'],
        ['marginalia', '2. Архіў: Вынаскі Гевелія за межамі мапы'],
        ['diorama', '3. Архіў: Архітэктурныя фігуркі Гданьска + дугавы надпіс'],
        ['dock', '4. Архіў: Чыстая мапа з клеймамі I–V + Компас-док унізе'],
        ['crest', '5. Архіў: Цэхавы герб-шыльда з каронай'],
      ],
    },
    {
      id: 'bg',
      label: 'Фон і вада',
      options: [
        ['cosmos', 'Прынята: Сімвалы Гданьска (мора і космас) + вада ў мурах'],
        ['extended', 'Архіў: Поўная карта за мурамі з віньеткай'],
      ],
    },
    {
      id: 'mapState',
      label: 'Стан мапы',
      options: [
        ['scattered', 'Раз’яднаныя (можна цягаць)'],
        ['assembled', 'Сабраная мапа (фінал)'],
        ['replay', 'Сакрэтная анімацыя зборкі'],
      ],
    },
    { id: 'ad', label: 'Банер', options: [['loaded', 'Загрузіўся'], ['none', 'Не загрузіўся']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: [...SECTIONS.map((s) => s.key), WALK_KEY],
  build({ body, state, strings, say }) {
    const loc = state.locale;
    const head = el('div', { className: 'menu-head' },
      el('span', { className: 'brand', textContent: 'KUDY' }),
      el('span', { className: 'city', textContent: CITY_BY_LOCALE[loc] ?? CITY_BY_LOCALE.en }),
      state.walk === 'yes' && walkButton(strings[WALK_KEY], () => say(`Вяртанне да бягучай прагулкі («${strings[WALK_KEY]}»).`)));
    const heading = el('h2', { className: 'menu-title t-display', textContent: PROMPT_BY_LOCALE[loc] ?? PROMPT_BY_LOCALE.en });
    const stageSvg = svg('svg', { role: 'group', 'aria-label': PROMPT_BY_LOCALE[loc] ?? PROMPT_BY_LOCALE.en });
    const restBox = el('div', { className: 'menu-rest' }, panorama());
    body.append(
      el('div', { className: 'menu-top' }, head, heading, el('div', { className: 'menu-canvas' }, stageSvg)),
      restBox,
      adZone(state.ad === 'loaded'));
    return createPolishMenu(stageSvg, {
      strings,
      say,
      styleMode: state.style,
      bgMode: state.bg,
      initialState: state.mapState,
      restBox,
      scaleFactor: state.scale,
    });
  },
});
