import { useId } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { darkBackground } from "./design-tokens";
import { useThemeScheme, useThemeTokens } from "./theme";

// Themed full-screen background only; callers retain layout, insets and content.
export function ScreenSurface({ children, style, ...props }: ViewProps) {
  const palette = useThemeTokens();
  const theme = useThemeScheme();
  const gradientId = useId();
  return (
    <View {...props} style={[{ backgroundColor: palette.colorPaper }, style]}>
      {theme === "dark" ? (
        <Svg
          style={StyleSheet.absoluteFillObject}
          width="100%"
          height="100%"
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="screen-gradient"
        >
          <Defs>
            <RadialGradient id={gradientId} cx={darkBackground.cx} cy={darkBackground.cy} rx={darkBackground.rx} ry={darkBackground.ry}>
              {darkBackground.stops.map(({ offset, color }) => <Stop key={offset} offset={offset} stopColor={color} />)}
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
