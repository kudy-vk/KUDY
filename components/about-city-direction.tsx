// #334, M14 — the airport route cards reuse the accepted HTML paths.
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { OLD_TOWN, PLANE_PATH } from "../docs/design/production/route-art-paths.mjs";
import { PressableSurface } from "./pressable-surface";
import { useThemeTokens } from "./theme";
import { tokens } from "./design-tokens";
import type { AboutCityText } from "./about-city-content";

type Direction = "from" | "to";

export function AirportDirection({ value, onChange, t }: {
  value: Direction;
  onChange: (direction: Direction) => void;
  t: AboutCityText;
}) {
  const palette = useThemeTokens();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t("air.dirLabel")} style={styles.row}>
      {(["from", "to"] as const).map((direction) => {
        const checked = direction === value;
        const ground = checked ? palette.colorMedalPaper : palette.colorCard;
        const ink = checked ? palette.colorMedalInk : palette.colorEngrave;
        const townX = direction === "from" ? 88 : 14;
        const planeX = direction === "from" ? 14 : 104;
        const arrowX = direction === "from" ? 58 : 74;
        return (
          <PressableSurface
            key={direction}
            accessibilityRole="radio"
            accessibilityLabel={t(direction === "from" ? "air.dirFrom" : "air.dirTo")}
            accessibilityState={{ checked }}
            onPress={() => onChange(direction)}
            testID={`seg-direction-${direction}`}
            style={[styles.button, {
              backgroundColor: ground,
              borderColor: checked ? palette.colorAccent : palette.colorLine,
              borderWidth: checked ? 2 : 1,
              boxShadow: checked ? [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 3, color: palette.colorMedalGlow }] : undefined,
            }]}
          >
            <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox="0 0 156 50" width="100%" height={54}>
              <Svg x={townX} y={0} width={54} height={54} viewBox="0 6 100 90">
                {OLD_TOWN.map(([kind, d], index) => (
                  <Path key={index} d={d} stroke={ink} fill={kind === "mass" ? ground : "none"}
                    strokeWidth={kind === "fine" ? 0.7 : 1.1} strokeLinecap="round" strokeLinejoin="round"
                    opacity={kind === "fine" ? 0.6 : 1} vectorEffect="non-scaling-stroke" />
                ))}
              </Svg>
              <Svg x={planeX} y={7} width={36} height={36} viewBox="0 0 24 24">
                <Path d={PLANE_PATH} stroke={ink} fill={ground} strokeWidth={1.1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </Svg>
              <Path d={`M${arrowX} 25h16m-6-6 6 6-6 6`} fill="none" stroke={ink} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </PressableSurface>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  button: { flex: 1, minHeight: 72, padding: 8, borderRadius: tokens.radiusBase, alignItems: "center", justifyContent: "center" },
});
