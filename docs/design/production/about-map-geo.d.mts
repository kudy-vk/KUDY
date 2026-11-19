// Types of the map's pure geometry beside its .mjs implementation (the
// magnet.d.mts idiom): the app imports the module, the compiler reads this.
// The shapes are in px of the picture; the ground points are [lon, lat].

import type { MapAirport, MapLine, MapStation, MapZone } from "./about-map-data.d.mts";

export interface MapShapeZone extends MapZone {
  ring: [number, number][];
  px: [number, number][];
  centre: readonly [number, number];
  area: number;
  ground: readonly [number, number];
}
export interface MapShapeStation extends MapStation {
  px: readonly [number, number];
  lines: readonly string[];
}
export interface MapShapeLine extends MapLine {
  px: [number, number][];
}

export const SHAPES: {
  readonly zones: readonly MapShapeZone[];
  readonly stations: readonly MapShapeStation[];
  readonly lines: readonly MapShapeLine[];
  readonly airport: MapAirport;
  readonly size: readonly [number, number];
};

export { inside, metres } from "./kit-geo.d.mts";
export function formatMapKilometres(distance: number, lang: "be" | "en"): string;

/** The stop of a running line nearest to a [lon, lat] point. */
export function nearestStop(at: readonly [number, number]): { station: MapStation | null; distance: number };
/** Which lines stop at a station: in LINES order. */
export function linesAt(id: string): readonly MapLine[];
/** [lon, lat] → [x, y] in px of the picture, through the anchors. */
export function project(at: readonly [number, number]): [number, number];
/** How far each anchor ends up from where the picture drew it. */
export function anchorMisses(): readonly { ref: string; miss: number }[];
/** What a press at `point` (px) picks; `scale` is screen px per picture px. */
export function pickAt(point: readonly [number, number], scale: number, show: { visit: boolean; stay: boolean; rail: boolean; plan: boolean }, current?: { kind: "station" | "airport" | "zone"; id: string } | null): { kind: "station" | "airport" | "zone"; id: string } | null;
