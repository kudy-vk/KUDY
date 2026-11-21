// The engraved panorama of Gdańsk: the pure path builder shared by the
// browser mockups (kit.mjs `panorama()`) and the app (components/city-panorama.tsx,
// issue #216). An original line drawing in the manner of old city prospects:
// sea and masts on the horizon, a row of gabled houses, the great church, the
// town hall spire, the harbour crane, bastions and a moat in front. It is
// drawn by this code, is not a copy of any print, and does not claim
// historical accuracy. The classes map to the kit.css `.panorama` roles and
// carry the same meaning in the app: `ink` the foreground bank, `mass` the
// ground-filled shapes, `fine` the thin detail strokes.
export const PANORAMA_VIEWBOX = '190 28 540 162';

function seeded(seed) {
  // xorshift32: a fixed seed gives the same drawing on every load.
  let state = seed >>> 0 || 1;
  return () => {
    state = (state ^ (state << 13)) >>> 0;
    state = (state ^ (state >>> 17)) >>> 0;
    state = (state ^ (state << 5)) >>> 0;
    return state / 4294967296;
  };
}

// The full drawing as [{cls, d}] in paint order. Deterministic: the same
// list on every call, so the browser and the app draw identical shapes.
export function panoramaPaths() {
  const paths = [];
  const add = (cls, d) => paths.push({ cls, d });
  const r = seeded(1687);
  const n = (value) => Math.round(value * 10) / 10;

  // Sky: broken horizontal strokes, thinner towards the top, with gaps for clouds.
  let sky = '';
  for (let y = 12; y < 94; y += 5.5) {
    let x = r() * 40;
    while (x < 800) {
      const len = 26 + r() * 110;
      const cloud = Math.sin(x / 90 + y / 14) + Math.sin(x / 37 - y / 9) * 0.6;
      if (cloud < 0.5 && r() < 0.35 + y / 150) sky += `M${n(x)} ${n(y + r() - 0.5)}h${n(len)}`;
      x += len + 10 + r() * 46;
    }
  }
  add('fine', sky);

  // Horizon and the masts of ships at anchor.
  let far = 'M0 99H800';
  for (const x of [22, 47, 66, 96, 131, 158, 742, 768, 787]) {
    const h = 7 + r() * 7;
    far += `M${x} 99v${n(-h)}M${n(x - 3)} ${n(99 - h * 0.55)}h6M${n(x - 2)} ${n(99 - h * 0.85)}h4`;
  }
  add('fine', far);

  const house = (x, base, w, h, kind) => {
    const top = base - h, mid = x + w / 2;
    if (kind === 0) return `M${n(x)} ${base}V${n(top)}L${n(mid)} ${n(top - w * 0.75)}L${n(x + w)} ${n(top)}V${base}Z`;
    if (kind === 1) {
      const s = w / 6;
      return `M${n(x)} ${base}V${n(top)}h${n(s)}v${n(-s)}h${n(s)}v${n(-s)}h${n(s)}v${n(-s)}h${n(s)}v${n(s)}h${n(s)}v${n(s)}h${n(s)}v${n(s)}V${base}Z`;
    }
    if (kind === 2) return `M${n(x)} ${base}V${n(top)}Q${n(x + w * 0.1)} ${n(top - w * 0.45)} ${n(mid)} ${n(top - w * 0.85)}Q${n(x + w * 0.9)} ${n(top - w * 0.45)} ${n(x + w)} ${n(top)}V${base}Z`;
    return `M${n(x)} ${base}V${n(top)}L${n(x + w * 0.14)} ${n(top - 5)}H${n(x + w * 0.86)}L${n(x + w)} ${n(top)}V${base}Z`;
  };
  const row = (from, to, base, minH, maxH) => {
    let d = '', windows = '';
    for (let x = from; x < to;) {
      const w = 7 + r() * 8, h = minH + r() * (maxH - minH), kind = Math.floor(r() * 4);
      d += house(x, base, w, h, kind);
      if (r() < 0.7) windows += `M${n(x + w * 0.3)} ${n(base - h * 0.55)}v2M${n(x + w * 0.7)} ${n(base - h * 0.55)}v2`;
      x += w;
    }
    add('mass', d);
    add('fine', windows);
  };
  const needle = (x, y, w, h) => `M${n(x - w / 2)} ${n(y)}L${n(x)} ${n(y - h)}L${n(x + w / 2)} ${n(y)}Z`;
  const box = (x, y, w, h) => `M${n(x - w / 2)} ${n(y)}V${n(y - h)}H${n(x + w / 2)}V${n(y)}Z`;

  row(74, 736, 131, 15, 30);

  // Church with a bulbous baroque helmet.
  add('mass', box(214, 131, 18, 40) + `M205 91Q205 81 210 78Q208 68 214 56Q220 68 218 78Q223 81 223 91Z` + needle(214, 56, 2, 9) + needle(205, 91, 4, 9) + needle(223, 91, 4, 9));
  // Lesser towers.
  add('mass', box(150, 131, 12, 30) + needle(150, 101, 12, 20) + box(304, 131, 11, 34) + box(304, 97, 7, 7) + needle(304, 90, 7, 22));
  // Town hall: a slender tower rising in tiers to a long spire.
  add('mass', box(396, 131, 13, 50) + box(396, 81, 10, 9) + box(396, 72, 7, 8) + box(396, 64, 5, 6) + needle(396, 58, 5, 30));
  add('fine', 'M391 100v10M396 100v10M401 100v10M389 81h14M392 72h8');
  // The great brick church: a massive blunt tower and a long nave with turrets.
  add('mass', `M487 131V97L494 86H552L559 97V131Z` + box(470, 131, 30, 60) + `M455 71L461 63H479L485 71Z` + needle(456, 71, 3, 10) + needle(484, 71, 3, 10) + needle(470, 63, 3, 12));
  add('mass', needle(496, 86, 4, 17) + needle(516, 86, 4, 15) + needle(536, 86, 4, 15) + needle(554, 88, 4, 17));
  add('fine', 'M462 80v34M470 80v34M478 80v34M500 100v20M512 100v20M524 100v20M536 100v20M548 100v20');
  // A square tower with a saddle roof, and a small spire further on.
  add('mass', box(612, 131, 17, 44) + needle(612, 87, 17, 15) + box(706, 131, 9, 26) + needle(706, 105, 9, 18));

  row(88, 724, 139, 9, 19);

  // Harbour crane: two round towers and the timber housing hanging between them.
  add('mass', box(662, 141, 12, 25) + needle(662, 116, 14, 10) + box(690, 141, 12, 25) + needle(690, 116, 14, 10) + `M668 128V104L676 95L684 104V128Z`);
  add('fine', 'M671 104v22M676 98v28M681 104v22');

  // Bastions: the angular trace of the walls, with a ditch in front.
  let wall = 'M30 151', foot = '';
  const points = [];
  for (let x = 30; x < 770; x += 92) points.push([x + 22, 160], [x + 46, 148], [x + 70, 160], [x + 92, 151]);
  for (const [x, y] of points) wall += `L${n(x)} ${y}`;
  for (const [x, y] of [...points].reverse()) foot += `L${n(x)} ${y + 6}`;
  add('mass', `${wall}L770 157${foot}L30 157Z`);
  let hatch = '';
  for (let x = 34; x < 768; x += 4.5) hatch += `M${n(x)} ${n(153 + Math.abs(((x - 30) % 92) - 46) * 0.14)}v3`;
  add('fine', hatch);

  let water = '';
  for (let y = 167; y < 177; y += 3.6) for (let x = r() * 30; x < 800; x += 26 + r() * 40) water += `M${n(x)} ${n(y)}h${n(8 + r() * 14)}`;
  add('fine', water);

  // Foreground: a low bank and trees at the edges.
  add('ink', 'M0 183Q90 174 190 181T400 180T610 182T800 177');
  let trees = '';
  for (const [cx, cy, s] of [[16, 158, 13], [34, 166, 10], [6, 172, 9], [782, 162, 11], [796, 171, 9]]) {
    trees += `M${n(cx - s)} ${n(cy + s * 0.6)}Q${n(cx - s * 1.2)} ${n(cy - s * 0.4)} ${n(cx - s * 0.4)} ${n(cy - s * 0.8)}Q${n(cx)} ${n(cy - s * 1.5)} ${n(cx + s * 0.5)} ${n(cy - s * 0.8)}Q${n(cx + s * 1.3)} ${n(cy - s * 0.3)} ${n(cx + s)} ${n(cy + s * 0.6)}Z`;
  }
  add('mass', trees);
  let grass = '';
  for (let x = 6; x < 800; x += 9 + r() * 16) grass += `M${n(x)} ${n(186 - r() * 3)}l1.5 -3.5`;
  add('fine', grass);
  return paths;
}
