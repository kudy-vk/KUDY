// Issue #216 (M5/M11) — the engraved Gdańsk panorama under the map-parts
// block of the main screen: the original code-drawn line prospect, rendered
// from the same pure builder the browser mockups use (docs/design/production/
// panorama-paths.mjs, consumed by kit.mjs `panorama()`), so the app and the
// mockups draw identical shapes. Decoration only (kit.css `.panorama`
// roles): it carries no information a screen reader needs, so the layer is
// hidden from accessibility. The stroke color follows the theme
// (color.engrave); the ground fill occludes the sky strokes behind buildings.
// Lives in components/, not app/: expo-router treats every app/ file as a
// route (docs/architecture/19_class_and_module_map.md — the components zone).
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { panoramaPaths, PANORAMA_VIEWBOX } from "../docs/design/production/panorama-paths.mjs";
import { useThemeStyles, useThemeTokens } from "./theme";

// kit.css `.panorama`: the viewbox aspect (540 × 162) sizes the drawing;
// `vector-effect: non-scaling-stroke` keeps the engraved line weight stable.
const createStyles = (palette: ThemeTokens) =>
  StyleSheet.create({
    root: {
      aspectRatio: 540 / 162,
      color: palette.colorEngrave,
      width: "100%",
    },
  });
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

const paths = panoramaPaths();

export function CityPanorama({ testID }: { testID?: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  return (
    <View style={styles.root} testID={testID}>
      <Svg
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
        viewBox={PANORAMA_VIEWBOX}
      >
        {paths.map(({ cls, d }, index) => (
          <Path
            key={index}
            d={d}
            fill={cls === "mass" ? palette.colorPanoramaGround : "none"}
            opacity={cls === "fine" ? 0.55 : 1}
            stroke={palette.colorEngrave}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={cls === "fine" ? 0.6 : 0.9}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </Svg>
    </View>
  );
}
