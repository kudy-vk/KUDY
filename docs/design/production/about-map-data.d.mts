// Types of the map's pure data beside its .mjs implementation (the
// magnet.d.mts idiom): the app imports the module, the compiler reads this.
// Everything with a place on the map carries [longitude, latitude].

export interface MapImageSpec {
  src: string;
  width: number;
  height: number;
  density: number;
}
export interface MapAnchor {
  ref?: string;
  what?: string;
  at?: readonly [number, number];
  px: readonly [number, number];
}
export interface MapStation {
  id: string;
  name: string;
  at: readonly [number, number];
  main?: boolean;
  change?: boolean;
  planned?: boolean;
}
export interface MapLine {
  id: string;
  layer: string;
  name: string;
  stops: readonly string[];
  beyond?: readonly [number, number];
}
export interface MapAirport {
  id: string;
  name: string;
  code: string;
  at: readonly [number, number];
  px: readonly [number, number];
}
export interface MapZone {
  id: string;
  kind: "visit" | "stay";
  name: string;
  text: string;
  ways?: string;
  outline: readonly (readonly [number, number])[];
}

export const MAP_IMAGE: MapImageSpec;
export const ANCHORS: readonly MapAnchor[];
export const STATIONS: readonly MapStation[];
export const LINES: readonly MapLine[];
export const AIRPORT: MapAirport;
export const ZONES: readonly MapZone[];
