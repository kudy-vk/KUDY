// Issue #303 — the ways into the map's zones: a pure data port of the
// mockup's about-content.mjs PLACE_WAYS (docs/design/production/), one row
// of a sign name and a dictionary key per way. The sign names resolve to
// glyphs through ABOUT_CITY_FACT_ICONS (about-city-content); the map card
// appends the nearest running stop itself. Pure data — no icon imports —
// so the node geometry suite (test/about-map.test.mjs) reads it beside the
// app bundle.
export const ABOUT_CITY_ZONE_WAYS = {
  glowne: [["footprints", "get.glowne"]],
  oliwa: [["tram-front", "get.oliwa.tram"], ["train-front", "get.oliwa.skm"]],
  wrzeszcz: [["train-front", "get.wrzeszcz"]],
  brzezno: [["tram-front", "get.brzezno"]],
  westerplatte: [["bus", "get.westerplatte"]],
} as const satisfies Record<string, readonly (readonly [string, string])[]>;

export type AboutCityZoneWaysKey = keyof typeof ABOUT_CITY_ZONE_WAYS;
