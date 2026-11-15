// «Пра горад», раздзел city: what the map of the Tricity draws and what a
// press on it picks, without the DOM. The general geometry (tying the picture
// to the ground, shapes, distances) is the shared kit-geo.mjs; this module
// applies it to the data of about-map-data.mjs. about-map.mjs draws with it;
// the app port can use it as it is.
import { AIRPORT, ANCHORS, LINES, MAP_IMAGE, STATIONS, ZONES } from './about-map-data.mjs';
import { centroid, edgeDistance, inside, metres, organic, pictureFit, smooth } from './kit-geo.mjs';

export { inside, metres };

const stationById = new Map(STATIONS.map((station) => [station.id, station]));
const placeOf = (ref) => (ref === AIRPORT.id ? AIRPORT : stationById.get(ref));

// The ground point of an anchor: its own `at`, or the stop or airport it names.
const anchorGround = (anchor) => anchor.at ?? placeOf(anchor.ref).at;

// [lon, lat] → [x, y] in px of the picture. The picture is not to scale, so
// it is tied to the ground through all the anchors (kit-geo pictureFit).
export const project = pictureFit(ANCHORS.map((anchor) => [anchorGround(anchor), anchor.px]));

// How far, px of the picture, each anchor ends up from where the picture drew it.
export const anchorMisses = () => ANCHORS.map((anchor) => {
  const [x, y] = project(anchorGround(anchor));
  return { ref: anchor.ref ?? anchor.what, miss: Math.hypot(x - anchor.px[0], y - anchor.px[1]) };
});

// Operational stops a visitor can take a train from today.
const RUNNING = STATIONS.filter((station) => !station.planned);

// The stop of a running line nearest to a [lon, lat] point, with the straight-line distance.
export function nearestStop(at) {
  return RUNNING.reduce((best, station) => {
    const distance = metres(at, station.at);
    return distance < best.distance ? { station, distance } : best;
  }, { station: null, distance: Infinity });
}

// Which lines stop at a station: [line, …] in LINES order.
export const linesAt = (id) => LINES.filter((line) => line.stops.includes(id));

// Everything the map draws, in px of the picture. A zone's free shape is a
// smooth curve through its outline with a hand-drawn edge (kit-geo).
export const SHAPES = {
  zones: ZONES.map((zone) => {
    const ring = organic(smooth(zone.outline), zone.id);
    const px = ring.map(project);
    const { centre, area } = centroid(px);
    return { ...zone, ring, px, centre, area, ground: centroid(ring).centre };
  }),
  stations: STATIONS.map((station) => ({ ...station, px: project(station.at), lines: linesAt(station.id).map((line) => line.id) })),
  lines: LINES.map((line) => ({
    ...line,
    px: [...line.stops.map((id) => project(stationById.get(id).at)), ...(line.beyond ? [project(line.beyond)] : [])],
  })),
  airport: { ...AIRPORT },
  size: [MAP_IMAGE.width, MAP_IMAGE.height],
};

// What a press at `point` (px of the picture) picks. `scale` is screen px per
// picture px, so the reach of a finger stays the same at any zoom. `show`
// says which layers are on: { visit, stay, rail, plan }. `current` is the
// pick before, so pressing again where zones overlap steps to the next one.
// Returns { kind: 'station' | 'airport' | 'zone', id } or null.
const FINGER = 22; // screen px: how far from a sign a press still hits it
const ZONE_SLOP = 12; // screen px: a press just outside a small zone still hits it
export function pickAt(point, scale, show, current = null) {
  const reach = FINGER / scale;
  let best = null;
  const consider = (kind, id, [x, y]) => {
    const distance = Math.hypot(point[0] - x, point[1] - y);
    if (distance <= reach && (!best || distance < best.distance)) best = { kind, id, distance };
  };
  consider('airport', SHAPES.airport.id, SHAPES.airport.px);
  for (const station of SHAPES.stations) if (show[station.planned ? 'plan' : 'rail']) consider('station', station.id, station.px);
  if (best) return { kind: best.kind, id: best.id };

  const zones = SHAPES.zones.filter((zone) => show[zone.kind]);
  // Where zones overlap, a place to visit comes first, then the smaller zone.
  const under = zones.filter((zone) => inside(point, zone.px))
    .sort((a, b) => Number(b.kind === 'visit') - Number(a.kind === 'visit') || a.area - b.area);
  if (under.length > 0) {
    const was = current?.kind === 'zone' ? under.findIndex((zone) => zone.id === current.id) : -1;
    return { kind: 'zone', id: under[(was + 1) % under.length].id };
  }
  const near = zones
    .map((zone) => ({ zone, distance: edgeDistance(point, zone.px) }))
    .filter(({ distance }) => distance <= ZONE_SLOP / scale)
    .sort((a, b) => a.distance - b.distance)[0];
  return near ? { kind: 'zone', id: near.zone.id } : null;
}
