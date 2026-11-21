// Shared geometry of the production mockups, without the DOM: tying a picture
// map to the ground, distances on the ground, and shapes of areas. A screen
// that lays ground data over a drawn picture uses it (about-map-geo.mjs); the
// app port can take it as it is.
//
// Ground points are [longitude, latitude]; picture points are [x, y] px.

// km per degree near the middle of the Tricity: both ground axes in one unit.
const KM_LON = 111.32 * Math.cos((54.4 * Math.PI) / 180);
const KM_LAT = 110.57;
const toKm = ([lon, lat], [lon0, lat0]) => [(lon - lon0) * KM_LON, (lat - lat0) * KM_LAT];
const kernel = (r2) => (r2 === 0 ? 0 : r2 * Math.log(r2));

// Solves m·x = b (Gaussian elimination with partial pivoting); m and b are changed.
function gauss(m, b) {
  const n = b.length;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    for (let row = col + 1; row < n; row += 1) {
      const f = m[row][col] / m[col][col];
      for (let k = col; k < n; k += 1) m[row][k] -= f * m[col][k];
      b[row] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    x[row] = (b[row] - m[row].slice(row + 1).reduce((sum, value, k) => sum + value * x[row + 1 + k], 0)) / m[row][row];
  }
  return x;
}

// Ground → picture through matching points: a thin-plate spline. `pairs` are
// [[lon, lat], [x, y]]; at least three, not on one line. Every pair lands
// exactly on its picture point; between them the ground bends smoothly, far
// from them it follows the best straight fit. This is what ties a drawn map
// that is not to scale (one part stretched, another moved) to real
// coordinates. Returns ([lon, lat]) → [x, y].
export function pictureFit(pairs) {
  const origin = [0, 1].map((k) => pairs.reduce((sum, [at]) => sum + at[k], 0) / pairs.length);
  const from = pairs.map(([at]) => toKm(at, origin));
  const n = from.length;
  const system = Array.from({ length: n + 3 }, () => new Array(n + 3).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) system[i][j] = kernel((from[i][0] - from[j][0]) ** 2 + (from[i][1] - from[j][1]) ** 2);
    system[i][n] = 1; system[i][n + 1] = from[i][0]; system[i][n + 2] = from[i][1];
    system[n][i] = 1; system[n + 1][i] = from[i][0]; system[n + 2][i] = from[i][1];
  }
  const weights = [0, 1].map((k) => gauss(system.map((row) => [...row]), [...pairs.map(([, px]) => px[k]), 0, 0, 0]));
  return (at) => {
    const [u, v] = toKm(at, origin);
    return weights.map((w) => {
      let value = w[n] + w[n + 1] * u + w[n + 2] * v;
      for (let i = 0; i < n; i += 1) value += w[i] * kernel((u - from[i][0]) ** 2 + (v - from[i][1]) ** 2);
      return value;
    });
  };
}

// Metres between two ground points (haversine).
export function metres([lon1, lat1], [lon2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// The area-weighted centre and the area of a ring, in the ring's own units.
export function centroid(ring) {
  let area = 0, cx = 0, cy = 0;
  ring.forEach(([x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  });
  return { centre: [cx / (3 * area), cy / (3 * area)], area: Math.abs(area / 2) };
}

// Whether a point lies inside a ring.
export function inside([x, y], ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// The distance from a point to the edge of a ring.
export function edgeDistance([x, y], ring) {
  let best = Infinity;
  ring.forEach(([x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
  });
  return best;
}

// The box of a list of points: [x0, y0, x1, y1].
export function bounds(points) {
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// A smooth closed shape through a few outline points: a Catmull-Rom curve,
// `steps` points per side. It passes through every outline point.
export function smooth(outline, steps = 6) {
  const n = outline.length;
  const ring = [];
  for (let i = 0; i < n; i += 1) {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((k) => outline[(i + k + n) % n]);
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      ring.push([0, 1].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t
        + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return ring;
}

// A hand-drawn edge for a ground ring: the shape breathes in and out a little
// around its centre (two slow waves, up to ±8 % of the reach), so an area
// reads as freely drawn, not as an oval. The waves come from `seed` (the
// area's id), so an area keeps its shape on every draw.
export function organic(ring, seed) {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  const random = () => ((state = (state * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const [a, b] = [random() * 2 * Math.PI, random() * 2 * Math.PI];
  const centre = [0, 1].map((k) => ring.reduce((sum, point) => sum + point[k], 0) / ring.length);
  return ring.map(([lon, lat]) => {
    const dx = (lon - centre[0]) * KM_LON, dy = (lat - centre[1]) * KM_LAT;
    const angle = Math.atan2(dy, dx);
    const k = 1 + 0.08 * (0.6 * Math.sin(3 * angle + a) + 0.4 * Math.sin(5 * angle + b));
    return [centre[0] + (dx * k) / KM_LON, centre[1] + (dy * k) / KM_LAT];
  });
}
