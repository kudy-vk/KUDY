// Issue #303 — the Tricity illustrated map of the «Гданьск з аднаго погляду»
// section, the typed port of the owner-approved mockup (decisions M12–M13 in
// docs/design/brand/decisions.md; mockup docs/design/production/about-map.mjs
// over the kit-map pieces). The picture, the zones, the lines and the
// under-the-finger pick are the mockup's own pure modules, reused without
// copying (the menu-map rule, docs/design/brand/outputs/menu-map-city-only/
// native/README.md): about-map-data.mjs ties the drawn picture to the ground
// through its anchors; about-map-geo.mjs over kit-geo.mjs keeps the shapes,
// the nearest-stop search and pickAt. This file adds what the app adds: the
// camera — react-native-gesture-handler with .runOnJS(true) callbacks over
// plain React state, the mockup's zoom limit ×3 and its rule that at the
// whole-picture view a vertical swipe scrolls the screen; the flight is the
// mockup's own rAF tween. Strokes and dashes counter-scale by the camera
// scale, so they keep their screen width at any zoom (the mockup's
// vector-effect: non-scaling-stroke); the signs and names are plain views,
// screen-sized at any zoom. The map is light in both themes (DT-4); the
// switches, the card and the zone list under it follow the screen's
// palette. The visitor's choices ride the atlas state and survive a section
// switch. (The camera runs on the JS thread deliberately: the Reanimated
// worklet layer fought the Fabric mount race and hung the main thread; the
// plain-state camera is the menu map's own pattern.)
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Image, Linking, Pressable, StyleSheet, View, type ImageRequireSource } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Svg, { Circle, G, Path } from "react-native-svg";
import BusIcon from "lucide-react-native/icons/bus";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";
import FootprintsIcon from "lucide-react-native/icons/footprints";
import ListIcon from "lucide-react-native/icons/list";
import MapPinIcon from "lucide-react-native/icons/map-pin";
import MinusIcon from "lucide-react-native/icons/minus";
import PlaneIcon from "lucide-react-native/icons/plane";
import PlusIcon from "lucide-react-native/icons/plus";
import ScanIcon from "lucide-react-native/icons/scan";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";

import { ABOUT_CITY_FACT_ICONS, type AboutCityFactName, type AboutCityText } from "./about-city-content";
import { ABOUT_CITY_ZONE_WAYS } from "./about-city-zone-ways";
import { Fold, Remark } from "./about-city-parts";
import { CanonIcon } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { ScaledText } from "./scaled-text";
import { useThemeStyles } from "./theme";

import { bounds } from "../docs/design/production/kit-geo.mjs";
import { SHAPES, nearestStop, pickAt, formatMapKilometres } from "../docs/design/production/about-map-geo.mjs";

const [MAP_W, MAP_H] = SHAPES.size;
// The picture has 3 px per unit (MAP_IMAGE.density): at ×3 it is still about
// sharp on a 3× phone screen.
const MAX_ZOOM = 3;
// From which zoom the main stops are named, and from which every stop and
// the visit-zone names appear (the mockup's LEVELS).
const LEVELS = [
  [2.3, "all"],
  [1.5, "main"],
] as const;
type NamesLevel = "none" | "main" | "all";
const namesLevel = (zoom: number): NamesLevel => (LEVELS.find(([from]) => zoom >= from)?.[1] ?? "none");
// Where nothing is picked, Google Maps opens on the middle of the Tricity.
const TRICITY = [18.6, 54.41] as const;
// A farther stop is not offered as «the nearest» (the mockup's NEAR_STOP).
const NEAR_STOP = 1500;
// The mockup's flight: 260 ms, ease-out cubic; the zoom step of the buttons.
const FLIGHT_MS = 260;
const ZOOM_STEP = 1.8;
// A move longer than this is a drag, not a press; the same margin decides
// the pan against the screen scroll (the mockup's SLOP).
const GESTURE_SLOP = 10;
// The zoom past which the map takes the vertical finger (the mockup's 1.01).
const ZOOMED_AT = 1.01;

// The base picture of the map: the owner's target screen for #248 with its
// painted patches removed (docs/design/production/about-map-data.mjs).
const MAP_PICTURE = require("../docs/design/production/about-map.webp") as ImageRequireSource;

// What the visitor picked under the finger; the pick stays until another
// press (the mockup's pick rule).
export type AboutCityPick = { readonly kind: "zone" | "station" | "airport"; readonly id: string };
// What the visitor chose on the map: the camera, the pick and the layers —
// the mockup's ui.atlas, kept by the section state so it survives a section
// switch.
export type AboutCityAtlasShow = Record<"visit" | "stay" | "rail" | "plan", boolean>;
export type AboutCityAtlasState = {
  zoom: number;
  centre: readonly [number, number];
  pick: AboutCityPick | null;
  show: AboutCityAtlasShow;
};

export const ABOUT_CITY_ATLAS_INITIAL: AboutCityAtlasState = {
  zoom: 1,
  centre: [MAP_W / 2, MAP_H / 2],
  pick: null,
  show: { visit: true, stay: true, rail: true, plan: true },
};

// The map zone and line colours are the canon's map tokens
// (components/design-tokens.ts, docs/design/visual-language.md color.map.*,
// decisions M12). The map is light in both themes (DT-4), like every map of
// the app: the surface, the drawing and the signs ride the fixed light
// values, not the theme's palette.
const ZONE_VISIT = tokens.colorMapZoneVisit;
const ZONE_STAY = tokens.colorMapZoneStay;
const ZONE_PICKED = tokens.colorMapZonePicked;
const LINE_SKM = tokens.colorMapLineSkm;
const LINE_PKM = tokens.colorMapLinePkm;
const LINE_PLAN = tokens.colorMapLinePlan;
const PICKED_HALO = "rgba(154, 93, 36, 0.22)";
const ZONE_NAME_INK = "#6b3a12";
// The visit and stay swatch rings of the switches and the list (about.html).
const SWATCH_RING: Record<"visit" | "stay", string> = { visit: "#f2cfa7", stay: "#b5d6c0" };
const zoneInk: Record<"visit" | "stay", string> = { visit: ZONE_VISIT, stay: ZONE_STAY };

// The stroke widths of the drawing, in screen px at any zoom (about.html):
// a zone rim, a line casing, a line ink, the planned line's ink and dashes.
const ZONE_RIM = 6;
const CASING_W = 7;
const PLAN_CASING_W = 6;
const INK_W = 3.5;
const PLAN_INK_W = 3;
const PLAN_DASH: readonly [number, number] = [6, 5];
// The screen-sized signs: the drawn stop dot (4.5 px), its smaller whole-map
// form (2.6 px), the change outer ring, the picked halo and the airport
// disc — the mockup's mark geometry, px of the screen.
const DOT_MAIN_R = 4.5;
const DOT_SMALL_R = 2.6;
const HALO_R = 11;
const OUTER_R = 7;
const AIRPORT_HALO_R = 19;
const NAME_SIZE = 12;
const ZONE_NAME_SIZE = 13;

function pathOf(points: readonly (readonly [number, number])[], close: boolean): string {
  const body = points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
  return close ? `M${body}Z` : `M${body}`;
}

const countZones = (kind: "visit" | "stay") => SHAPES.zones.filter((zone) => zone.kind === kind).length;

// The look-up the card needs for a pick: the shape, its layer and its ground
// point (the mockup's lookUp).
function lookUp(pick: AboutCityPick) {
  if (pick.kind === "zone") {
    const zone = SHAPES.zones.find((item) => item.id === pick.id);
    if (!zone) throw new Error(`no zone ${pick.id}`);
    return { zone, station: null, layer: zone.kind, at: zone.ground };
  }
  if (pick.kind === "station") {
    const station = SHAPES.stations.find((item) => item.id === pick.id);
    if (!station) throw new Error(`no station ${pick.id}`);
    return { zone: null, station, layer: station.planned ? ("plan" as const) : ("rail" as const), at: station.at };
  }
  return { zone: null, station: null, layer: null, at: SHAPES.airport.at };
}

// A zone's way rows: the mockup appends the nearest running stop within
// 1.5 km unless the ways already name a train.
function zoneWayRows(zone: (typeof SHAPES.zones)[number], t: AboutCityText, lang: "be" | "en") {
  const rows: { glyph: (typeof ABOUT_CITY_FACT_ICONS)[AboutCityFactName]; text: string }[] = [];
  const ways: readonly (readonly [AboutCityFactName, string])[] = zone.ways ? (ABOUT_CITY_ZONE_WAYS[zone.ways as keyof typeof ABOUT_CITY_ZONE_WAYS] ?? []) : [];
  for (const [sign, key] of ways) rows.push({ glyph: ABOUT_CITY_FACT_ICONS[sign], text: t(key) });
  if (!ways.some(([sign]) => sign === "train-front")) {
    const near = nearestStop(zone.ground);
    if (near.distance <= NEAR_STOP && near.station) {
      rows.push({ glyph: ABOUT_CITY_FACT_ICONS["train-front"], text: t("zone.stop", { name: near.station.name, km: formatMapKilometres(near.distance, lang) }) });
    }
  }
  return rows;
}

// The zone card body (the mockup's pickCard, zone branch).
function ZoneCardBody({ zone, t, lang }: { zone: (typeof SHAPES.zones)[number]; t: AboutCityText; lang: "be" | "en" }) {
  const styles = useThemeStyles(pickCardLight, pickCardDark);
  const rows = zoneWayRows(zone, t, lang);
  return (
    <>
      <ScaledText style={styles.text}>{t(zone.text)}</ScaledText>
      {rows.length > 0 ? (
        <View style={styles.stack}>
          <ScaledText style={styles.note}>{`${t("city.get")}:`}</ScaledText>
          {rows.map(({ glyph, text }, index) => (
            <View key={`${index}-${text}`} style={styles.wayRow}>
              <CanonIcon glyph={glyph} label={text} size={16} color={tokens.colorMuted} />
              <ScaledText style={styles.wayText}>{text}</ScaledText>
            </View>
          ))}
        </View>
      ) : null}
      {zone.id === "brzezno" ? <ScaledText style={styles.note}>{t("city.summer")}</ScaledText> : null}
    </>
  );
}

// The station card body: the lines that stop, the change note, the planned
// line's warning and the future-start note.
function StationCardBody({ station, t }: { station: (typeof SHAPES.stations)[number]; t: AboutCityText }) {
  const styles = useThemeStyles(pickCardLight, pickCardDark);
  const lineName = (id: string) => SHAPES.lines.find((line) => line.id === id)?.name ?? id;
  return (
    <>
      <View style={styles.badgeRow}>
        {station.lines.map((id) => (
          <ScaledText key={id} style={[styles.lbadge, id === "skm" ? styles.lbadgeSkm : id === "pkm" ? styles.lbadgePkm : styles.lbadgePlan]}>
            {lineName(id)}
          </ScaledText>
        ))}
      </View>
      {station.lines.filter((id) => id !== "plan").map((id) => (
        <ScaledText key={id} style={styles.text}>{t(`stop.${id}`)}</ScaledText>
      ))}
      {station.change ? <ScaledText style={styles.text}>{t("stop.change")}</ScaledText> : null}
      {station.planned ? <Remark tone="warn" text={t("stop.plan")} /> : null}
      {!station.planned && station.lines.includes("plan") ? <ScaledText style={styles.note}>{t("stop.planFrom")}</ScaledText> : null}
    </>
  );
}

// The card of what is picked: the head with the Polish name and its tag,
// then the body (the mockup's pickCard).
function PickCard({ pick, t, lang, onOpenSection }: { pick: AboutCityPick; t: AboutCityText; lang: "be" | "en"; onOpenSection: (id: "airport") => void }) {
  const styles = useThemeStyles(pickCardLight, pickCardDark);
  const found = lookUp(pick);
  if (found.zone) {
    return (
      <View style={styles.stack}>
        <View style={styles.head}>
          <ScaledText style={styles.title}>{found.zone.name}</ScaledText>
          <ScaledText style={styles.tag}>{t(`layer.${found.zone.kind}`)}</ScaledText>
        </View>
        <ZoneCardBody zone={found.zone} t={t} lang={lang} />
      </View>
    );
  }
  if (found.station) {
    return (
      <View style={styles.stack}>
        <View style={styles.head}>
          <ScaledText style={styles.title}>{found.station.name}</ScaledText>
          <ScaledText style={[styles.tag, found.station.planned ? null : styles.tagFree]}>
            {t(found.station.planned ? "stop.planned" : "stop.tag")}
          </ScaledText>
        </View>
        <StationCardBody station={found.station} t={t} />
      </View>
    );
  }
  return (
    <View style={styles.stack}>
      <View style={styles.head}>
        <ScaledText style={styles.title}>{SHAPES.airport.name}</ScaledText>
        <ScaledText style={styles.tag}>{SHAPES.airport.code}</ScaledText>
      </View>
      <ScaledText style={styles.text}>{t("air.map")}</ScaledText>
      <Pressable accessibilityRole="button" onPress={() => onOpenSection("airport")} style={styles.go} testID="city-map-airport-go">
        <ScaledText style={styles.goText}>{t("air.mapGo")}</ScaledText>
        <CanonIcon glyph={ExternalLinkIcon} label={t("air.mapGo")} size={16} color={tokens.colorAccent} />
      </Pressable>
    </View>
  );
}

const createPickCardStyles = (palette: ThemeTokens) =>
  StyleSheet.create({
    head: { alignItems: "center", columnGap: 10, flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
    title: { color: palette.colorInk, fontSize: tokens.fontTitleSize, fontWeight: tokens.fontWeightStrong },
    tag: {
      backgroundColor: palette.colorBadgeMixed,
      borderRadius: tokens.radiusPill,
      color: palette.colorInk,
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    tagFree: { backgroundColor: palette.colorBadgeFree, alignSelf: "flex-start" },
    text: { color: palette.colorInk, fontSize: 15, lineHeight: 21 },
    note: { color: palette.colorMuted, fontSize: 13, lineHeight: 18 },
    stack: { gap: 8 },
    wayRow: { alignItems: "center", columnGap: 6, flexDirection: "row" },
    wayText: { color: palette.colorInk, flexShrink: 1, fontSize: 14, lineHeight: 19 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    lbadge: {
      borderRadius: 8,
      color: "#ffffff",
      fontSize: 13,
      fontWeight: tokens.fontWeightStrong,
      minHeight: 28,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    lbadgeSkm: { backgroundColor: LINE_SKM },
    lbadgePkm: { backgroundColor: LINE_PKM },
    lbadgePlan: { backgroundColor: "transparent", borderColor: LINE_PLAN, borderWidth: 2, borderStyle: "dashed", color: palette.colorInk },
    go: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderColor: palette.colorLine,
      borderRadius: tokens.radiusBase,
      borderWidth: StyleSheet.hairlineWidth,
      columnGap: 6,
      flexDirection: "row",
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: 14,
    },
    goText: { color: palette.colorAccent, fontSize: 15 },
  });
const pickCardLight = createPickCardStyles(tokens);
const pickCardDark = createPickCardStyles(darkTokens);

// The one swatch of what a layer shows, on a patch of the map's ground so
// the colours read in both themes (the mockup's swatch).
function LayerSwatch({ kind }: { kind: keyof AboutCityAtlasShow }) {
  if (kind === "visit" || kind === "stay") {
    return (
      <View style={swatchStyles.round}>
        <View style={[swatchStyles.dot, { backgroundColor: zoneInk[kind], borderColor: SWATCH_RING[kind] }]} />
      </View>
    );
  }
  if (kind === "rail") {
    return (
      <View style={swatchStyles.rail}>
        <View style={swatchStyles.railLine}>
          <View style={[swatchStyles.railHalf, { backgroundColor: LINE_SKM }]} />
          <View style={[swatchStyles.railHalf, { backgroundColor: LINE_PKM }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={swatchStyles.plan}>
      <View style={swatchStyles.dash} />
      <View style={swatchStyles.dash} />
      <View style={swatchStyles.dash} />
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  round: { alignItems: "center", backgroundColor: tokens.colorMap, borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  dot: { borderRadius: 8, borderWidth: 3, height: 16, width: 16 },
  rail: { alignItems: "center", backgroundColor: tokens.colorMap, borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  railLine: { borderRadius: 2, flexDirection: "row", height: 4, overflow: "hidden", width: 20 },
  railHalf: { flex: 1 },
  plan: { alignItems: "center", backgroundColor: tokens.colorMap, borderRadius: 15, flexDirection: "row", gap: 2, height: 30, justifyContent: "center", width: 30 },
  dash: { backgroundColor: LINE_PLAN, height: 3, width: 4 },
});

// The round map buttons: a sign with a name for the screen reader; a
// disabled button keeps its readable ink (canon §5).
function ToolButton({ glyph, label, onPress, disabled, small, testID }: {
  glyph: typeof PlusIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[toolStyles.button, small ? toolStyles.small : null, disabled ? toolStyles.disabled : null]}
      testID={testID}
    >
      <CanonIcon glyph={glyph} label={label} size={small ? 18 : 22} color={disabled ? tokens.colorDisabledInk : tokens.colorAccent} />
    </Pressable>
  );
}

const toolStyles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: tokens.colorCard,
    borderColor: tokens.colorLine,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    height: 44,
    justifyContent: "center",
    shadowColor: tokens.colorInk,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    width: 44,
  },
  small: { backgroundColor: "transparent", borderColor: "transparent", elevation: 0, shadowOpacity: 0 },
  disabled: { borderColor: tokens.colorDisabledLine },
});

// One axis of the camera clamp (the mockup's clampCentre): at the
// whole-picture view the centre is the middle; zoomed in it keeps the
// picture edge inside the box.
function clampAxis(value: number, length: number, half: number): number {
  return half * 2 >= length ? length / 2 : Math.min(length - half, Math.max(half, value));
}

export type AboutCityMapProps = {
  t: AboutCityText;
  lang: "be" | "en";
  atlas: AboutCityAtlasState;
  setAtlas: (patch: Partial<AboutCityAtlasState>) => void;
  foldOpen: boolean;
  onToggleFold: (id: string, open: boolean) => void;
  onOpenSection: (id: "airport") => void;
};

export function AboutCityMap({ t, lang, atlas, setAtlas, foldOpen, onToggleFold, onOpenSection }: AboutCityMapProps): ReactNode {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const [boxW, setBoxW] = useState(0);
  const [zoomed, setZoomed] = useState(atlas.zoom > ZOOMED_AT);
  // The live camera (the local copy of the atlas camera; the atlas copy
  // lands on every gesture end and every button move, so the choices
  // survive a section switch).
  const [cam, setCam] = useState({ centre: atlas.centre, zoom: atlas.zoom });
  // The names shown at the current zoom level (the mockup's data-names) and
  // the names the settling hid because a more important one covers them.
  const [level, setLevel] = useState<NamesLevel>(namesLevel(atlas.zoom));
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  const [calm, setCalm] = useState(false);
  // The measured label boxes of the names for the settling (the mockup reads
  // getBoundingClientRect; the app keeps the onTextLayout boxes).
  const labelSizes = useRef(new Map<string, { height: number; width: number }>());

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setCalm).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setCalm);
    return () => subscription?.remove();
  }, []);

  const scaleOf = useCallback((zoomValue: number) => ((boxW / MAP_W) * zoomValue) || 1, [boxW]);
  const boxH = useCallback(() => (boxW * MAP_H) / MAP_W, [boxW]);
  const clampCamera = useCallback(
    (nextZoom: number, cx: number, cy: number): { centre: [number, number]; zoom: number } => {
      const bounded = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
      const s = ((boxW / MAP_W) * bounded) || 1;
      const noBox = boxW === 0;
      return {
        centre: [
          noBox ? MAP_W / 2 : clampAxis(cx, MAP_W, boxW / (2 * s)),
          noBox ? MAP_H / 2 : clampAxis(cy, MAP_H, (boxW * MAP_H) / MAP_W / (2 * s)),
        ],
        zoom: bounded,
      };
    },
    [boxW],
  );

  // The name settling (the mockup's settleLabels): the visible names in
  // order of importance — the picked one, the main stops, the visit zones,
  // the other stops — keep their boxes; a name that would cover a kept one
  // waits for a closer zoom.
  const settle = useCallback(() => {
    if (boxW === 0) return;
    const s = scaleOf(cam.zoom);
    const anchor = (px: number, py: number): [number, number] => [boxW / 2 + (px - cam.centre[0]) * s, boxH() / 2 + (py - cam.centre[1]) * s];
    const pickedStop = atlas.pick?.kind === "station" ? atlas.pick.id : null;
    const pickedZone = atlas.pick?.kind === "zone" ? atlas.pick.id : null;
    const visible: { box: { bottom: number; left: number; right: number; top: number } | null; id: string; rank: number }[] = [];
    for (const station of SHAPES.stations) {
      if (!atlas.show[station.planned ? "plan" : "rail"]) continue;
      const isPicked = pickedStop === station.id;
      // Names show from the level on (main stops from «main», every stop
      // from «all»); a picked name always shows.
      const shown = level === "all" || (level === "main" && station.main) || isPicked;
      if (!shown) continue;
      const size = labelSizes.current.get(`stop:${station.id}`);
      const [ax, ay] = anchor(station.px[0], station.px[1]);
      visible.push({
        box: size ? { bottom: ay - 7 + size.height, left: ax + 7, right: ax + 7 + size.width, top: ay - 7 } : null,
        id: `stop:${station.id}`,
        rank: isPicked ? 0 : station.main ? 1 : 3,
      });
    }
    for (const zone of SHAPES.zones) {
      if (zone.kind !== "visit" || !atlas.show.visit) continue;
      const isPicked = pickedZone === zone.id;
      if (level !== "all" && !isPicked) continue;
      const size = labelSizes.current.get(`zone:${zone.id}`);
      const [ax, ay] = anchor(zone.centre[0], zone.centre[1]);
      visible.push({
        box: size ? { bottom: ay + size.height / 2, left: ax - size.width / 2, right: ax + size.width / 2, top: ay - size.height / 2 } : null,
        id: `zone:${zone.id}`,
        rank: isPicked ? 0 : 2,
      });
    }
    visible.sort((a, b) => a.rank - b.rank);
    const taken: { bottom: number; left: number; right: number; top: number }[] = [];
    const next = new Set<string>();
    for (const entry of visible) {
      const box = entry.box;
      if (!box) continue;
      if (taken.some((o) => box.left < o.right + 2 && o.left < box.right + 2 && box.top < o.bottom && o.top < box.bottom)) next.add(entry.id);
      else taken.push(box);
    }
    // The settle runs on every camera frame: a fresh Set identity would
    // re-render the whole map twice per frame, so the state write happens
    // only when the membership really changed.
    const prev = settledRef.current;
    const same = prev.size === next.size && [...next].every((id) => prev.has(id));
    if (!same) {
      settledRef.current = next;
      setSettled(next);
    }
  }, [atlas.pick, atlas.show, boxH, boxW, cam.centre, cam.zoom, level, scaleOf]);
  const settleRef = useRef(settle);
  settleRef.current = settle;
  const settledRef = useRef<ReadonlySet<string>>(new Set());
  // The one-shot measure rAFs and the flight tween stop with the map.
  const rafs = useRef<number[]>([]);
  useEffect(
    () => () => {
      for (const id of rafs.current) cancelAnimationFrame(id);
      rafs.current = [];
      if (flight.current !== null) cancelAnimationFrame(flight.current);
    },
    [],
  );

  // A fresh name measurement re-settles once; the same box does not (the
  // guard keeps the loop away). The rAF id rides the unmount cleanup.
  const measureLabel = useCallback((id: string) => (event: { nativeEvent: { lines: { height: number; width: number }[] } }) => {
    const line = event.nativeEvent.lines[0];
    if (!line) return;
    const prev = labelSizes.current.get(id);
    if (prev && prev.width === line.width && prev.height === line.height) return;
    labelSizes.current.set(id, { height: line.height, width: line.width });
    const timer = requestAnimationFrame(() => settleRef.current());
    rafs.current.push(timer);
  }, []);

  // Every settle-worthy change (the camera, the pick, the layers, the label
  // level, the layout) settles the names once, after the state landed.
  useEffect(() => {
    const timer = requestAnimationFrame(() => settleRef.current());
    return () => cancelAnimationFrame(timer);
  }, [atlas.pick, atlas.show, level, cam, boxW]);

  // The camera moves land in the live copy and the atlas copy together.
  const moveCamera = useCallback(
    (nextZoom: number, cx: number, cy: number) => {
      const next = clampCamera(nextZoom, cx, cy);
      setCam(next);
      setZoomed(next.zoom > ZOOMED_AT);
      setLevel(namesLevel(next.zoom));
      setAtlas({ zoom: next.zoom, centre: next.centre });
    },
    [clampCamera, setAtlas],
  );

  // The mockup's flight: the rAF tween, 260 ms ease-out cubic; «reduce
  // motion» jumps into place. The target lands in the atlas at once (the
  // buttons and the label level read the resting state); the local camera
  // tweens to it for the eye.
  const flight = useRef<number | null>(null);
  const camRef = useRef(cam);
  camRef.current = cam;
  const fly = useCallback(
    (nextZoom: number, nextCentre: readonly [number, number]) => {
      if (flight.current !== null) cancelAnimationFrame(flight.current);
      const target = clampCamera(nextZoom, nextCentre[0], nextCentre[1]);
      setZoomed(target.zoom > ZOOMED_AT);
      setLevel(namesLevel(target.zoom));
      setAtlas({ zoom: target.zoom, centre: target.centre });
      if (calm || boxW === 0) {
        setCam(target);
        return;
      }
      const from = { centre: [...camRef.current.centre] as [number, number], zoom: camRef.current.zoom };
      const started = Date.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - started) / FLIGHT_MS);
        const e = 1 - (1 - k) ** 3;
        setCam({
          centre: [from.centre[0] + (target.centre[0] - from.centre[0]) * e, from.centre[1] + (target.centre[1] - from.centre[1]) * e],
          zoom: from.zoom * (target.zoom / from.zoom) ** e,
        });
        if (k < 1) flight.current = requestAnimationFrame(tick);
        else flight.current = null;
      };
      flight.current = requestAnimationFrame(tick);
    },
    [boxW, calm, clampCamera, setAtlas],
  );

  // The centre that keeps the picture point `at` under the box point (sx, sy)
  // at `zoom` (the mockup's centreFor).
  const centreFor = useCallback(
    (nextZoom: number, at: readonly [number, number], sx: number, sy: number): [number, number] => {
      const s = ((boxW / MAP_W) * nextZoom) || 1;
      return [at[0] - (sx - boxW / 2) / s, at[1] - (sy - (boxW * MAP_H) / MAP_W / 2) / s];
    },
    [boxW],
  );

  // The picture point under a local screen point.
  const toPicture = useCallback(
    (x: number, y: number): [number, number] => {
      const s = scaleOf(cam.zoom);
      return [cam.centre[0] + (x - boxW / 2) / s, cam.centre[1] + (y - boxH() / 2) / s];
    },
    [boxH, boxW, cam.centre, cam.zoom, scaleOf],
  );

  // The pick (the mockup's onTap): the picture point under the finger, the
  // finger's reach in screen px. The pick stays until another press.
  const onTapAt = useCallback(
    (x: number, y: number) => {
      const s = scaleOf(cam.zoom);
      const point = toPicture(x, y);
      const next = pickAt(point, s, atlas.show, atlas.pick);
      setAtlas({ pick: next ? { kind: next.kind, id: next.id } : null });
    },
    [atlas.pick, atlas.show, scaleOf, setAtlas, toPicture],
  );
  const onDoubleTapAt = useCallback(
    (x: number, y: number) => {
      if (flight.current !== null) cancelAnimationFrame(flight.current);
      if (cam.zoom >= MAX_ZOOM - 0.01) return;
      const at = toPicture(x, y);
      const target = Math.min(MAX_ZOOM, cam.zoom * 2);
      const [cx, cy] = centreFor(target, at, x, y);
      fly(target, [cx, cy]);
    },
    [cam.zoom, centreFor, fly, toPicture],
  );
  const onTapRef = useRef(onTapAt);
  onTapRef.current = onTapAt;
  const onDoubleTapRef = useRef(onDoubleTapAt);
  onDoubleTapRef.current = onDoubleTapAt;
  const tapBridge = useCallback((x: number, y: number) => onTapRef.current(x, y), []);
  const doubleTapBridge = useCallback((x: number, y: number) => onDoubleTapRef.current(x, y), []);

  // The gestures run their callbacks on the JS thread (.runOnJS(true)): the
  // camera is plain state, the pick logic is the mockup's pure module. The
  // pan deltas ride the translation since the gesture began (the previous
  // translation lives in the ref; every pan resets it on begin). At the
  // whole-picture view the horizontal pan fails on a vertical move and the
  // vertical pan does not exist, so the swipe scrolls the screen; zoomed in
  // the map takes both.
  const panPrev = useRef({ x: 0, y: 0 });
  // The pinch reads its start zoom on begin (event.scale is cumulative since
  // the gesture began).
  const pinchStartRef = useRef(1);
  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => {
        pinchStartRef.current = camRef.current.zoom;
      })
      .onUpdate((event) => {
        const start = pinchStartRef.current;
        const s0 = scaleOf(camRef.current.zoom);
        const next = Math.min(MAX_ZOOM, Math.max(1, start * event.scale));
        const s1 = scaleOf(next);
        setCam((prev) => ({
          centre: [
            prev.centre[0] + (event.focalX - boxW / 2) * (1 / s0 - 1 / s1),
            prev.centre[1] + (event.focalY - (boxW * MAP_H) / MAP_W / 2) * (1 / s0 - 1 / s1),
          ],
          zoom: next,
        }));
      })
      .onEnd(() => {
        moveCamera(camRef.current.zoom, camRef.current.centre[0], camRef.current.centre[1]);
      });
    const panUpdate = (event: { translationX: number; translationY: number }) => {
      const dx = event.translationX - panPrev.current.x;
      const dy = event.translationY - panPrev.current.y;
      panPrev.current = { x: event.translationX, y: event.translationY };
      setCam((prev) => {
        const s = ((boxW / MAP_W) * prev.zoom) || 1;
        return { centre: [prev.centre[0] - dx / s, prev.centre[1] - dy / s], zoom: prev.zoom };
      });
    };
    const panBegin = () => {
      panPrev.current = { x: 0, y: 0 };
    };
    const panCommit = () => {
      moveCamera(camRef.current.zoom, camRef.current.centre[0], camRef.current.centre[1]);
    };
    const panX = zoomed
      ? Gesture.Pan().runOnJS(true).activeOffsetX([-GESTURE_SLOP, GESTURE_SLOP])
      : Gesture.Pan().runOnJS(true).activeOffsetX([-GESTURE_SLOP, GESTURE_SLOP]).failOffsetY([-GESTURE_SLOP, GESTURE_SLOP]);
    const panXGesture = panX
      .onBegin(panBegin)
      .onUpdate(panUpdate)
      .onEnd(panCommit);
    const panMove = zoomed
      ? Gesture.Pan().runOnJS(true).activeOffsetY([-GESTURE_SLOP, GESTURE_SLOP]).onBegin(panBegin).onUpdate(panUpdate).onEnd(panCommit)
      : null;
    const doubleTap = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .onEnd((event, success) => {
        if (!success) return;
        doubleTapBridge(event.x, event.y);
      });
    const singleTap = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(1)
      .requireExternalGestureToFail(doubleTap)
      .onEnd((event, success) => {
        if (!success) return;
        tapBridge(event.x, event.y);
      });
    return panMove
      ? Gesture.Simultaneous(pinch, panXGesture, panMove, doubleTap, singleTap)
      : Gesture.Simultaneous(pinch, panXGesture, doubleTap, singleTap);
  }, [boxW, doubleTapBridge, moveCamera, scaleOf, tapBridge, zoomed]);

  // ---- under the map ----

  // Google Maps at the picked place, or at the middle of the Tricity (M13).
  // A failed open leaves the address on the screen (the screen's own rule
  // for the official rows).
  const googleUrl = useMemo(() => {
    const [lon, lat] = atlas.pick ? lookUp(atlas.pick).at : TRICITY;
    return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`;
  }, [atlas.pick]);
  const [googleFailed, setGoogleFailed] = useState<string | null>(null);
  const openGoogle = useCallback(() => {
    setGoogleFailed(null);
    void Linking.openURL(googleUrl).catch(() => setGoogleFailed(googleUrl));
  }, [googleUrl]);

  const zoomIn = useCallback(() => fly(cam.zoom * ZOOM_STEP, cam.centre), [cam.centre, cam.zoom, fly]);
  const zoomOut = useCallback(() => fly(cam.zoom / ZOOM_STEP, cam.centre), [cam.centre, cam.zoom, fly]);
  const fit = useCallback(() => fly(1, [MAP_W / 2, MAP_H / 2]), [fly]);

  // The layers: a switch hides its drawing and its names; a pick on a hidden
  // layer goes away with it (the mockup's layersChanged).
  const toggleLayer = useCallback(
    (id: keyof AboutCityAtlasShow) => {
      const show = { ...atlas.show, [id]: !atlas.show[id] };
      const layer = atlas.pick ? lookUp(atlas.pick).layer : null;
      setAtlas({ show, pick: layer && !show[layer] ? null : atlas.pick });
    },
    [atlas, setAtlas],
  );

  // The atlas list: a press picks the shape and brings it into view (the
  // mockup's row rule); a hidden layer turns back on. A zone fits its
  // bounds; a station or the airport is a point — it centres on itself at
  // the zoom from which every stop is named (LEVELS).
  const pickShape = useCallback(
    (pick: AboutCityPick) => {
      const found = lookUp(pick);
      const show = found.layer && !atlas.show[found.layer] ? { ...atlas.show, [found.layer]: true } : atlas.show;
      setAtlas({ show, pick });
      if (found.zone) {
        const [x0, y0, x1, y1] = bounds(found.zone.px);
        const zoomFit = Math.min(MAX_ZOOM, 0.6 * Math.min(MAP_W / Math.max(x1 - x0, 1), MAP_H / Math.max(y1 - y0, 1)));
        fly(Math.max(cam.zoom, zoomFit), [(x0 + x1) / 2, (y0 + y1) / 2]);
      } else {
        const [x, y] = found.station ? found.station.px : SHAPES.airport.px;
        fly(Math.max(cam.zoom, LEVELS[0][0]), [x, y]);
      }
    },
    [atlas.show, cam.zoom, fly, setAtlas],
  );

  // One named row of the atlas list: a button over the one pick path, so
  // the screen reader reaches every selectable sign the pointer does (#312).
  const atlasRow = (pick: AboutCityPick, key: string, name: string, lead: ReactNode, testID: string) => (
    <Pressable
      key={key}
      accessibilityLabel={name}
      accessibilityRole="button"
      onPress={() => pickShape(pick)}
      style={styles.zoneRow}
      testID={testID}
    >
      {lead}
      <ScaledText style={styles.zoneRowName}>{name}</ScaledText>
    </Pressable>
  );

  const picked = atlas.pick;
  // The committed camera draws the map: every render — a gesture update, a
  // flight frame or a button move — recomputes the drawing from the state.
  const s = scaleOf(cam.zoom);
  const worldTransform = {
    transform: [
      { translateX: boxW / 2 - cam.centre[0] * s },
      { translateY: boxH() / 2 - cam.centre[1] * s },
      { scale: s },
    ],
  } as const;
  const screenPoint = (px: number, py: number): [number, number] => [boxW / 2 + (px - cam.centre[0]) * s, boxH() / 2 + (py - cam.centre[1]) * s];

  return (
    <>
      <View style={styles.orientation}>
        {/* The gesture root is the map box itself: the app carries no global
            GestureHandlerRootView, and this section is the only gesture
            surface (the menu map uses the pressable pieces, not RNGH). */}
        <GestureHandlerRootView
          accessibilityLabel={t("map.label")}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setBoxW(width);
          }}
          style={mapStyles.box}
          testID="city-map"
        >
          <GestureDetector gesture={gesture}>
            <View style={mapStyles.fill}>
            {/* The world scales with the camera; the signs above do not. */}
            <View style={[mapStyles.world, worldTransform]}>
              <Image fadeDuration={0} resizeMode="cover" source={MAP_PICTURE} style={mapStyles.picture} />
              <Svg style={mapStyles.drawing} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
                {/* Places to stay lie under places to visit where they
                    overlap (the mockup's drawing order). */}
                {SHAPES.zones.filter((zone) => zone.kind === "stay" && atlas.show.stay).map((zone) => {
                  const isPicked = picked?.kind === "zone" && picked.id === zone.id;
                  return (
                    <Path
                      key={zone.id}
                      d={pathOf(zone.px, true)}
                      fill={isPicked ? ZONE_PICKED : ZONE_STAY}
                      fillOpacity={0.42}
                      stroke={isPicked ? ZONE_PICKED : ZONE_STAY}
                      strokeOpacity={0.42}
                      strokeLinejoin="round"
                      strokeWidth={ZONE_RIM / s}
                    />
                  );
                })}
                {SHAPES.zones.filter((zone) => zone.kind === "visit" && atlas.show.visit).map((zone) => {
                  const isPicked = picked?.kind === "zone" && picked.id === zone.id;
                  return (
                    <Path
                      key={zone.id}
                      d={pathOf(zone.px, true)}
                      fill={isPicked ? ZONE_PICKED : ZONE_VISIT}
                      fillOpacity={0.62}
                      stroke={isPicked ? ZONE_PICKED : ZONE_VISIT}
                      strokeOpacity={0.62}
                      strokeLinejoin="round"
                      strokeWidth={ZONE_RIM / s}
                    />
                  );
                })}
                {SHAPES.lines.filter((line) => atlas.show[line.layer as keyof AboutCityAtlasShow]).map((line) => {
                  const ink = line.id === "skm" ? LINE_SKM : line.id === "pkm" ? LINE_PKM : LINE_PLAN;
                  const body = line.px.slice(0, line.px.length - (line.beyond ? 1 : 0));
                  return (
                    <G key={line.id}>
                      <Path
                        d={pathOf(body, false)}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={0.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={(line.id === "plan" ? PLAN_CASING_W : CASING_W) / s}
                      />
                      <Path
                        d={pathOf(body, false)}
                        fill="none"
                        stroke={ink}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={line.id === "plan" ? PLAN_DASH.map((dash) => dash / s).join(" ") : undefined}
                        strokeWidth={(line.id === "plan" ? PLAN_INK_W : INK_W) / s}
                      />
                      {line.beyond ? (
                        <Path
                          d={pathOf(line.px.slice(line.px.length - 2), false)}
                          fill="none"
                          stroke={ink}
                          strokeOpacity={0.45}
                          strokeLinecap="round"
                          strokeWidth={INK_W / s}
                        />
                      ) : null}
                    </G>
                  );
                })}
                {/* The airport sign is part of the picture; the map draws the
                    ring around it only while it is picked. */}
                {picked?.kind === "airport" ? (
                  <Circle cx={SHAPES.airport.px[0]} cy={SHAPES.airport.px[1]} fill={PICKED_HALO} r={AIRPORT_HALO_R} stroke={ZONE_PICKED} strokeWidth={2.5} />
                ) : null}
              </Svg>
            </View>
            {/* The signs and names: screen-sized at any zoom, over the scaled
                drawing, taking no presses — the map handles the taps. The
                layer is decorative for the screen reader; the card and the
                list carry the words. */}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={mapStyles.marks}>
              {SHAPES.zones.filter((zone) => zone.kind === "visit" && atlas.show.visit).map((zone) => {
                const isPicked = picked?.kind === "zone" && picked.id === zone.id;
                const named = level === "all" || isPicked;
                const [ax, ay] = screenPoint(zone.centre[0], zone.centre[1]);
                return (
                  <View key={`zone:${zone.id}`} pointerEvents="none" style={[mapStyles.mark, { transform: [{ translateX: ax }, { translateY: ay }] }]}>
                    {named && !settled.has(`zone:${zone.id}`) ? (
                      <View style={mapStyles.zoneNameWrap}>
                        <ScaledText onTextLayout={measureLabel(`zone:${zone.id}`)} style={mapStyles.zoneName}>
                          {zone.name}
                        </ScaledText>
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {SHAPES.stations.filter((station) => atlas.show[station.planned ? "plan" : "rail"]).map((station) => {
                const isPicked = picked?.kind === "station" && picked.id === station.id;
                const small = level === "none" && !station.main && !isPicked;
                const named = level === "all" || (level === "main" && station.main) || isPicked;
                const dotR = small ? DOT_SMALL_R : DOT_MAIN_R;
                const ink = station.change ? LINE_PKM : station.planned ? LINE_PLAN : station.lines.includes("skm") ? LINE_SKM : LINE_PKM;
                const [ax, ay] = screenPoint(station.px[0], station.px[1]);
                return (
                  <View key={`stop:${station.id}`} pointerEvents="none" style={[mapStyles.mark, { transform: [{ translateX: ax }, { translateY: ay }] }]}>
                    {isPicked ? <View style={[mapStyles.halo, { borderRadius: HALO_R, height: HALO_R * 2, marginLeft: -HALO_R, marginTop: -HALO_R, width: HALO_R * 2 }]} /> : null}
                    {station.change ? <View style={[mapStyles.outer, { borderRadius: OUTER_R, height: OUTER_R * 2, marginLeft: -OUTER_R, marginTop: -OUTER_R, width: OUTER_R * 2 }]} /> : null}
                    <View
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: isPicked ? ZONE_PICKED : ink,
                        borderRadius: dotR,
                        borderWidth: small ? 1.8 : 2.4,
                        height: dotR * 2,
                        marginLeft: -dotR,
                        marginTop: -dotR,
                        position: "absolute",
                        width: dotR * 2,
                      }}
                    />
                    {named && !settled.has(`stop:${station.id}`) ? (
                      <ScaledText onTextLayout={measureLabel(`stop:${station.id}`)} style={mapStyles.name}>
                        {station.name}
                      </ScaledText>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <View pointerEvents="box-none" style={mapStyles.tools}>
              <ToolButton disabled={atlas.zoom >= MAX_ZOOM - 0.01} glyph={PlusIcon} label={t("map.zoomIn")} onPress={zoomIn} testID="city-map-zoom-in" />
              <ToolButton disabled={atlas.zoom <= ZOOMED_AT} glyph={MinusIcon} label={t("map.zoomOut")} onPress={zoomOut} testID="city-map-zoom-out" />
              <ToolButton disabled={atlas.zoom <= ZOOMED_AT} glyph={ScanIcon} label={t("map.fit")} onPress={fit} testID="city-map-fit" />
              <ToolButton glyph={ExternalLinkIcon} label={t("map.google")} onPress={openGoogle} small testID="city-map-google" />
            </View>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
        <ScaledText style={styles.note}>{t("city.caption")}</ScaledText>
      </View>

      {/* The layer switches: the zone kinds with how many zones each holds,
          the running trains, the planned line. */}
      <View accessibilityLabel={t("map.layers")} style={styles.chips} testID="city-map-layers">
        {([
          ["visit", t("layer.visit"), countZones("visit")],
          ["stay", t("layer.stay"), countZones("stay")],
          ["rail", t("layer.rail"), undefined],
          ["plan", t("layer.plan"), undefined],
        ] as const).map(([id, name, count]) => (
          <Pressable
            key={id}
            accessibilityLabel={name}
            accessibilityRole="button"
            accessibilityState={{ selected: atlas.show[id] }}
            onPress={() => toggleLayer(id)}
            style={[styles.chip, atlas.show[id] ? styles.chipOn : null]}
            testID={`city-map-layer-${id}`}
          >
            <View style={atlas.show[id] ? null : styles.chipSwatchOff}>
              <LayerSwatch kind={id} />
            </View>
            <ScaledText style={[styles.chipText, atlas.show[id] ? styles.chipTextOn : null]}>{name}</ScaledText>
            {count === undefined ? null : <ScaledText style={styles.chipCount}>{count}</ScaledText>}
          </Pressable>
        ))}
      </View>

      {/* The card of what is picked: a hint, or the zone, the station or
          the airport (the mockup's pickCard). */}
      <View accessibilityLiveRegion="polite" style={[styles.card, styles.placeCard]} testID="city-map-card">
        {picked === null ? (
          <View style={styles.hintRow}>
            <CanonIcon glyph={MapPinIcon} label={t("map.hint")} size={18} color={tokens.colorAccent} />
            <ScaledText style={styles.hintText}>{t("map.hint")}</ScaledText>
          </View>
        ) : (
          <PickCard onOpenSection={onOpenSection} pick={picked} t={t} lang={lang} />
        )}
      </View>
      {googleFailed ? <Remark tone="error" text={t("link.failed", { url: googleFailed })} /> : null}

      {/* The zones, the stations and the airport as a list: a press picks
          the shape and brings it into view (the mockup's atlas-list fold).
          This list is the screen reader's path to every selectable sign on
          the map — the signs layer itself stays decorative (#312). */}
      <Fold
        id="atlas-list"
        open={foldOpen}
        onToggle={onToggleFold}
        lead={<CanonIcon glyph={ListIcon} label={t("map.list")} size={22} color={tokens.colorAccent} />}
        title={t("map.list")}
        meta={t("map.listMeta", { visit: countZones("visit"), stay: countZones("stay") })}
        body={
          <View style={styles.stack}>
            {(["visit", "stay"] as const).map((kind) => (
              <Fragment key={kind}>
                <ScaledText style={styles.groupSub}>{t(`layer.${kind}`)}</ScaledText>
                <View style={styles.card}>
                  {SHAPES.zones.filter((zone) => zone.kind === kind).map((zone) =>
                    atlasRow({ kind: "zone", id: zone.id }, zone.id, zone.name, <LayerSwatch kind={kind} />, `city-map-zone-${zone.id}`),
                  )}
                </View>
              </Fragment>
            ))}
            {([
              ["rail", SHAPES.stations.filter((station) => !station.planned)],
              ["plan", SHAPES.stations.filter((station) => station.planned)],
            ] as const).map(([kind, stops]) => (
              <Fragment key={kind}>
                <ScaledText style={styles.groupSub}>{t(`layer.${kind}`)}</ScaledText>
                <View style={styles.card}>
                  {stops.map((station) =>
                    atlasRow({ kind: "station", id: station.id }, station.id, station.name, <LayerSwatch kind={kind} />, `city-map-station-${station.id}`),
                  )}
                </View>
              </Fragment>
            ))}
            <ScaledText style={styles.groupSub}>{t("tab.airport")}</ScaledText>
            <View style={styles.card}>
              {atlasRow(
                { kind: "airport", id: "airport" },
                "airport",
                SHAPES.airport.name,
                <CanonIcon glyph={PlaneIcon} label={SHAPES.airport.name} size={18} color={tokens.colorAccent} />,
                "city-map-airport",
              )}
            </View>
          </View>
        }
      />
    </>
  );
}

// The map's own light styles: the surface, the signs — fixed values in both
// themes (DT-4).
const mapStyles = StyleSheet.create({
  box: {
    aspectRatio: MAP_W / MAP_H,
    backgroundColor: tokens.colorMap,
    borderColor: tokens.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  // transformOrigin pins the camera math to the top-left corner: the mockup
  // drives the same translate+scale about the picture origin (the browser's
  // transform-origin: 0 0); the RN default origin is the element's centre.
  world: { height: MAP_H, left: 0, position: "absolute", top: 0, transformOrigin: "0px 0px", width: MAP_W },
  picture: { height: MAP_H, width: MAP_W },
  drawing: { height: MAP_H, left: 0, position: "absolute", top: 0, width: MAP_W },
  fill: { ...StyleSheet.absoluteFill },
  marks: { ...StyleSheet.absoluteFill },
  mark: { left: 0, position: "absolute", top: 0 },
  tools: { gap: 8, position: "absolute", right: 8, top: 8 },
  halo: { backgroundColor: PICKED_HALO, borderColor: ZONE_PICKED, borderWidth: 2.5, position: "absolute" },
  outer: { backgroundColor: "#ffffff", borderColor: LINE_SKM, borderWidth: 1.6, position: "absolute" },
  name: {
    color: tokens.colorInk,
    fontSize: NAME_SIZE,
    fontWeight: tokens.fontWeightStrong,
    left: 7,
    position: "absolute",
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    top: -7,
  },
  zoneNameWrap: { left: 0, position: "absolute", top: 0, transform: [{ translateX: "-50%" }, { translateY: "-50%" }] },
  zoneName: {
    color: ZONE_NAME_INK,
    fontSize: ZONE_NAME_SIZE,
    fontWeight: tokens.fontWeightStrong,
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

// The switches, the card and the zone list follow the screen's palette.
const createStyles = (palette: ThemeTokens) =>
  StyleSheet.create({
    orientation: { gap: 6 },
    note: { color: palette.colorMuted, fontSize: 13, lineHeight: 18 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      alignItems: "center",
      borderColor: palette.colorLine,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      columnGap: 8,
      flexDirection: "row",
      flexGrow: 1,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    chipOn: { backgroundColor: palette.colorCard, borderColor: palette.colorAccent },
    chipSwatchOff: { opacity: 0.5 },
    chipText: { color: palette.colorMuted, flexShrink: 1, fontSize: 14 },
    chipTextOn: { color: palette.colorInk },
    chipCount: { color: palette.colorMuted, fontSize: 12 },
    card: {
      backgroundColor: palette.colorCard,
      borderColor: palette.colorLine,
      borderRadius: tokens.radiusBase,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 12,
    },
    placeCard: { gap: 10 },
    stack: { gap: 8 },
    hintRow: { alignItems: "center", columnGap: 8, flexDirection: "row" },
    hintText: { color: palette.colorInk, flexShrink: 1, fontSize: 14, lineHeight: 19 },
    groupSub: { color: palette.colorMuted, fontSize: 13, marginTop: 4 },
    zoneRow: { alignItems: "center", columnGap: 8, flexDirection: "row", minHeight: 44, paddingHorizontal: 4 },
    zoneRowName: { color: palette.colorInk, fontSize: 15 },
  });
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
