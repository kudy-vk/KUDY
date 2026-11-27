// Art geometry taken from the owner-approved menu-polish prototype (2026-11-27).
export const BASTION_CLIP_PATH = 'M 91 151 L 84 186 L 76 200 L 83 224 L 82 249 L 92 272 L 90 289 L 84 300 L 41 340 L 40 364 L 57 399 L 54 426 L 37 448 L 13 462 L 0 464 L 0 522 L 13 524 L 30 537 L 58 596 L 51 625 L 15 667 L 14 675 L 34 695 L 74 720 L 89 740 L 90 760 L 69 809 L 70 821 L 141 847 L 153 861 L 163 884 L 165 919 L 230 944 L 260 965 L 293 1006 L 315 1047 L 321 1049 L 364 1035 L 387 1035 L 399 1041 L 450 1092 L 503 1066 L 527 1065 L 586 1111 L 635 1077 L 659 1076 L 728 1121 L 739 1114 L 784 1062 L 796 1056 L 816 1056 L 893 1078 L 903 1076 L 919 1062 L 925 1031 L 940 1011 L 958 1003 L 987 1002 L 1017 983 L 1016 925 L 1020 911 L 1033 896 L 1144 861 L 1151 855 L 1147 814 L 1135 779 L 1137 761 L 1143 750 L 1216 682 L 1214 667 L 1181 627 L 1173 607 L 1177 585 L 1210 540 L 1211 528 L 1173 489 L 1161 483 L 1134 451 L 1118 413 L 1119 390 L 1136 369 L 1154 364 L 1161 357 L 1176 358 L 1236 331 L 1280 325 L 1308 342 L 1337 325 L 1350 323 L 1350 284 L 1313 273 L 1279 269 L 1263 252 L 1254 229 L 1238 226 L 1220 212 L 1212 193 L 1203 132 L 1197 124 L 1165 120 L 1107 135 L 1093 133 L 1072 120 L 1017 124 L 1005 118 L 959 73 L 912 72 L 885 60 L 847 23 L 839 0 L 667 0 L 659 23 L 619 56 L 586 55 L 547 73 L 492 69 L 476 84 L 439 106 L 401 110 L 360 128 L 323 129 L 296 138 L 262 130 L 228 136 L 219 141 L 202 165 L 180 172 L 99 149 Z';

const bastionVertices = BASTION_CLIP_PATH.slice(2, -2).split(' L ').map(point => point.split(' ').map(Number));

export function insideBastions(x, y) {
  let inside = false;
  for (let i = 0, j = bastionVertices.length - 1; i < bastionVertices.length; j = i++) {
    const [ax, ay] = bastionVertices[i], [bx, by] = bastionVertices[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside;
}

export function bearingMarks(svg, cx, cy, ratio) {
  const sw = px => px / ratio;
  const marks = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = (i * Math.PI) / 8;
    const r1 = 440;
    const r2 = i % 2 === 0 ? 960 : 820;
    marks.push(svg('line', {
      x1: cx + Math.cos(angle) * r1,
      y1: cy + Math.sin(angle) * r1,
      x2: cx + Math.cos(angle) * r2,
      y2: cy + Math.sin(angle) * r2,
      'stroke-width': sw(i % 4 === 0 ? 1.5 : 0.9),
      'stroke-dasharray': i % 2 === 0 ? 'none' : `${sw(8)} ${sw(8)}`,
    }));
  }
  marks.push(
    svg('circle', { cx, cy, r: 585, 'stroke-width': sw(1.4) }),
    svg('circle', { cx, cy, r: 610, 'stroke-width': sw(1), 'stroke-dasharray': `${sw(4)} ${sw(6)}` }),
    svg('circle', { cx, cy, r: 730, 'stroke-width': sw(1.2) }),
    svg('circle', { cx, cy, r: 748, 'stroke-width': sw(0.9), 'stroke-dasharray': `${sw(12)} ${sw(8)}` }),
  );
  return marks;
}

export function cosmosEngravings(svg, ratio) {
  const sw = px => px / ratio;
  return svg('g', { 'stroke-width': sw(1.8), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    // 1. Top-Left: Jan Hevelius Astronomical Sextant & Constellation
    svg('g', { transform: 'translate(95, 75)' },
      svg('path', { d: 'M 0 0 L -75 115 A 135 135 0 0 0 85 110 Z', 'stroke-width': sw(2) }),
      svg('path', { d: 'M -62 96 A 112 112 0 0 0 70 92', 'stroke-width': sw(1.1), 'stroke-dasharray': `${sw(3)} ${sw(4)}` }),
      svg('line', { x1: 0, y1: 0, x2: 18, y2: 128, 'stroke-width': sw(1.6) }),
      svg('circle', { cx: 0, cy: 0, r: 8, 'stroke-width': sw(1.8) }),
      svg('path', { d: 'M -95 -20 L -45 -45 L 25 -35 L 75 -65 L 115 -25', 'stroke-width': sw(1), 'stroke-dasharray': `${sw(4)} ${sw(4)}` }),
      svg('path', { d: 'M -45 -57 L -45 -33 M -57 -45 L -33 -45 M 75 -79 L 75 -51 M 61 -65 L 89 -65', 'stroke-width': sw(1.5) }),
    ),
    // 2. Top-Right: Armillary Sphere & Crescent Moon
    svg('g', { transform: 'translate(1225, 105)' },
      svg('circle', { cx: 0, cy: 0, r: 68, 'stroke-width': sw(2) }),
      svg('circle', { cx: 0, cy: 0, r: 54, 'stroke-width': sw(1.1) }),
      svg('ellipse', { cx: 0, cy: 0, rx: 68, ry: 24, transform: 'rotate(-24)', 'stroke-width': sw(1.6) }),
      svg('ellipse', { cx: 0, cy: 0, rx: 26, ry: 68, transform: 'rotate(18)', 'stroke-width': sw(1.4) }),
      svg('line', { x1: -76, y1: -32, x2: 76, y2: 32, 'stroke-width': sw(1.8) }),
      svg('path', { d: 'M -28 68 L 0 96 L 28 68 M -42 96 L 42 96', 'stroke-width': sw(2) }),
      svg('path', { d: 'M 95 -45 A 28 28 0 1 0 95 15 A 20 24 0 1 1 95 -45 Z', 'stroke-width': sw(1.5) }),
    ),
    // 3. Right Side: Hanseatic Cog Ship under sail
    svg('g', { transform: 'translate(1255, 595)' },
      svg('path', { d: 'M -75 28 L 75 28 L 54 68 L -54 68 Z', 'stroke-width': sw(2.1) }),
      svg('path', { d: 'M -82 14 L -48 28 M 82 10 L 52 28', 'stroke-width': sw(2) }),
      svg('line', { x1: 0, y1: -78, x2: 0, y2: 28, 'stroke-width': sw(2.2) }),
      svg('path', { d: 'M -52 -52 Q 0 -64 52 -52 Q 62 -12 44 12 Q 0 2 -44 12 Q -62 -12 -52 -52 Z', 'stroke-width': sw(1.8) }),
      svg('path', { d: 'M 0 -78 L 36 -70 L 22 -62 L 36 -54 L 0 -58', 'stroke-width': sw(1.4) }),
      svg('path', { d: 'M -92 82 Q -60 70 -30 82 T 30 82 T 92 82 M -65 98 Q -30 86 0 98 T 65 98', 'stroke-width': sw(1.5) }),
    ),
    // 4. Bottom-Right: Neptune's Trident & Merchant Scales
    svg('g', { transform: 'translate(1155, 985)' },
      svg('line', { x1: 0, y1: -65, x2: 0, y2: 75, 'stroke-width': sw(2.2) }),
      svg('path', { d: 'M -34 -35 L -34 -5 C -34 15, 34 15, 34 -5 L 34 -35', 'stroke-width': sw(2) }),
      svg('path', { d: 'M -42 -24 L -34 -40 L -26 -24 M -8 -52 L 0 -70 L 8 -52 M 26 -24 L 34 -40 L 42 -24', 'stroke-width': sw(1.8) }),
      svg('line', { x1: -115, y1: 15, x2: -45, y2: 15, 'stroke-width': sw(1.6) }),
      svg('path', { d: 'M -115 15 L -128 45 L -102 45 Z M -45 15 L -58 45 L -32 45 Z', 'stroke-width': sw(1.3) }),
    ),
    // 5. Bottom-Left: Mariner's Compass Rose
    svg('g', { transform: 'translate(135, 995)' },
      svg('circle', { cx: 0, cy: 0, r: 52, 'stroke-width': sw(1.6) }),
      svg('circle', { cx: 0, cy: 0, r: 12, 'stroke-width': sw(1.4) }),
      svg('path', { d: 'M 0 -72 L 12 -14 L 72 0 L 12 14 L 0 72 L -12 14 L -72 0 L -12 -14 Z', 'stroke-width': sw(1.8) }),
      svg('path', { d: 'M -42 -42 L -6 -12 L 42 -42 L 12 -6 L 42 42 L 6 12 L -42 42 L -12 6 Z', 'stroke-width': sw(1.1) }),
    ),
  );

}

export const ribbonFontSize = 13;
export const ribbonPadding = 18;
export const ribbonTail = 8.5;

export function ribbonPaths(width, height, scale) {
  const hw = width / 2, hh = height / 2;
  const tw = ribbonTail * scale, drop = 3 * scale, dot = 2.2 * scale;
  const diamond = x => `M ${x} ${-dot} L ${x + dot} 0 L ${x} ${dot} L ${x - dot} 0 Z`;
  return {
    tail: `M ${-hw - tw} ${-hh + drop} L ${-hw + 2} ${-hh + drop} L ${-hw + 2} ${hh + drop} L ${-hw - tw} ${hh + drop} L ${-hw - tw * 0.42} ${drop} Z
           M ${hw - 2} ${-hh + drop} L ${hw + tw} ${-hh + drop} L ${hw + tw * 0.42} ${drop} L ${hw + tw} ${hh + drop} L ${hw - 2} ${hh + drop} Z`,
    fold: `M ${-hw} ${hh - 1} L ${-hw + 4 * scale} ${hh + drop} L ${-hw} ${hh + drop} Z
           M ${hw} ${hh - 1} L ${hw - 4 * scale} ${hh + drop} L ${hw} ${hh + drop} Z`,
    body: `M ${-hw} ${-hh} Q 0 ${-hh - 3 * scale} ${hw} ${-hh} L ${hw} ${hh} Q 0 ${hh - 3 * scale} ${-hw} ${hh} Z`,
    inner: `M ${-hw + 2.5} ${-hh + 2.2} Q 0 ${-hh - 3 * scale + 2.2} ${hw - 2.5} ${-hh + 2.2}
            M ${-hw + 2.5} ${hh - 2.2} Q 0 ${hh - 3 * scale - 2.2} ${hw - 2.5} ${hh - 2.2}`,
    leftDot: diamond(-hw + 5 * scale),
    rightDot: diamond(hw - 5 * scale),
  };
}

export function atlasLight(elapsed, motion, finished = false) {
  const boost = Math.min(1, motion.light * 1.25);
  return {
    glow: finished ? 0.42 : boost,
    inner: finished ? 0.22 : boost * 0.58,
    outer: finished ? 0.14 : boost * 0.42,
    innerScale: finished ? 1 : 0.5 + motion.progress * 0.65,
    outerScale: finished ? 1 : 0.4 + motion.progress * 0.85,
    seam: finished ? 0.28 : Math.max(0, Math.min(1, elapsed < 650 ? elapsed / 650 : Math.max(0.28, 1 - (elapsed - 650) / 1800))),
  };
}

export const atlasColors = {
  light: { paper: '#faf5ea', brass: '#b8832e', fill: '#fdf8ee', tail: '#efe2c6', rim: '#c48c32', inner: '#c48c326b', ink: '#2b2118', engrave: '#8c6a3d', engraving: 0.14, watermark: 0.11 },
  dark: { paper: '#492c21', brass: '#d89b3c', fill: '#382219', tail: '#28160f', rim: '#d89b3c', inner: '#ebb35661', ink: '#f4eadb', engrave: '#deb068', engraving: 0.17, watermark: 0.15 },
};
