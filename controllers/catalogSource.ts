// One source selection for the Expo root and its native composition.
// The sandbox APK is usable offline without silently turning production
// into demo mode; a configured sandbox origin still tests the real catalog.
export function resolveCatalogSource(config: {
  origin?: string;
  demo?: string;
  sandbox?: string;
}): { origin: string; embedded: boolean } | null {
  if (config.demo === "1") return { origin: "demo://embedded", embedded: true };
  if (config.origin) return { origin: config.origin, embedded: false };
  if (config.sandbox === "1") return { origin: "demo://embedded", embedded: true };
  return null;
}
