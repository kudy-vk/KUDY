// Types of the pure geometry kit beside its .mjs implementation (the
// magnet.d.mts idiom): the app imports the module, the compiler reads this.
// Ground points are [longitude, latitude]; picture points are [x, y] px.

/** Ground → picture through matching points: a thin-plate spline. */
export function pictureFit(pairs: readonly (readonly [readonly [number, number], readonly [number, number]])[]): (at: readonly [number, number]) => [number, number];
/** Metres between two ground points (haversine). */
export function metres(a: readonly [number, number], b: readonly [number, number]): number;
/** The area-weighted centre and the area of a ring, in the ring's own units. */
export function centroid(ring: readonly (readonly [number, number])[]): { centre: [number, number]; area: number };
/** Whether a point lies inside a ring. */
export function inside(point: readonly [number, number], ring: readonly (readonly [number, number])[]): boolean;
/** The distance from a point to the edge of a ring. */
export function edgeDistance(point: readonly [number, number], ring: readonly (readonly [number, number])[]): number;
/** The box of a list of points: [x0, y0, x1, y1]. */
export function bounds(points: readonly (readonly [number, number])[]): [number, number, number, number];
/** A smooth closed shape through a few outline points: a Catmull-Rom curve. */
export function smooth(outline: readonly (readonly [number, number])[], steps?: number): [number, number][];
/** A hand-drawn edge for a ground ring, stable per seed. */
export function organic(ring: readonly (readonly [number, number])[], seed: string): [number, number][];
