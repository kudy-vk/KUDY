// Issue #252, decision M9 — the medallion of the «Пра горад» section wheel:
// the map-piece medallion language of the home screen (decision M4 extended
// to this wheel) — a hand-drawn sand-gold rim round a cream disc with a
// Lucide sign, the accent ring and the amber light growing in on the chosen
// item, the dark disc in the dark theme. The web mockup displaces the rim
// with an SVG turbulence filter (kit.mjs penStroke); react-native-svg has no
// filter primitives, so the rim is a seeded wobbly path instead — the same
// hand-drawn reading, the same values on every load (the panorama's seeded
// drawing idiom, kit.mjs). Values ride the canon medal tokens (visual-language
// machine block, added with this screen).
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { darkTokens, tokens } from "./design-tokens";
import { useThemeScheme, useThemeTokens } from "./theme";

// xorshift32 with a fixed seed: the same rim on every load (kit.mjs idiom).
function seededRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state ^ (state << 13)) >>> 0;
    state = (state ^ (state >>> 17)) >>> 0;
    state = (state ^ (state << 5)) >>> 0;
    return state / 4294967296;
  };
}

// The penStroke displacement reads ±2.4 px around the true radius; the wobbly
// path walks the same amplitude over 24 points and smooths them with
// Catmull-Rom → cubic Bézier control points.
const RIM_JITTER = 2.4;
const RIM_POINTS = 24;

export function wobblyCirclePath(radius: number, jitter: number, seed: number): string {
  const rng = seededRng(seed);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < RIM_POINTS; i += 1) {
    const angle = (i / RIM_POINTS) * 2 * Math.PI;
    const r = radius + (rng() - 0.5) * 2 * jitter;
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  const at = (i: number): [number, number] => points[(i + RIM_POINTS) % RIM_POINTS];
  const segments: string[] = [];
  for (let i = 0; i < RIM_POINTS; i += 1) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    segments.push(`C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }
  return `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} ${segments.join(" ")} Z`;
}

// The disc edge, one drawing per load: a module-level path keeps every
// medallion on the screen and every render identical without a per-frame
// reseed (the web penStroke's fixed seed 7 carries over).
const DISC_PATH = wobblyCirclePath(28, RIM_JITTER, 7);

export const AboutCityMedal = memo(function AboutCityMedal({
  glyph,
  label,
  near,
}: {
  glyph: CanonGlyph;
  // Canon §9: the sign's word for the screen reader, required like on every
  // icon rendering.
  label: string;
  // 0 — a side item, 1 — the item in the middle: the accent ring and the
  // amber light grow in as the wheel turns.
  near: number;
}) {
  const palette = useThemeTokens();
  const theme = useThemeScheme();
  return (
    <View style={styles.box} pointerEvents="none">
      <Svg viewBox="-36 -36 72 72" style={styles.svg}>
        <Circle cx={0} cy={0} r={32} fill="none" stroke={palette.colorMedalGlow} strokeWidth={6} opacity={near} />
        <Circle cx={0} cy={0} r={31.5} fill="none" stroke={palette.colorAccent} strokeWidth={3} opacity={near} />
        <Path d={DISC_PATH} fill={theme === "dark" ? darkTokens.colorCard : tokens.colorMedalPaper} stroke={tokens.colorMedalRim} strokeWidth={2} />
        <Circle cx={0} cy={0} r={24.4} fill="none" stroke={tokens.colorMedalRim} strokeWidth={0.7} opacity={0.45} />
      </Svg>
      <View style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <CanonIcon glyph={glyph} label={label} color={theme === "dark" ? palette.colorInk : tokens.colorMedalInk} size={28} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    height: 80,
    width: 80,
  },
  svg: StyleSheet.absoluteFillObject,
  glyph: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
