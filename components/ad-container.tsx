// #215 — the reserved ad place at the bottom of a screen (decision M6):
// always the last block, right above the system navigation; the real
// creative is wired in #101 and draws itself inside the slot. One component,
// so screens never redraw the zone: the kit values (kit.mjs `adZone()`,
// kit.css `.ad-zone`/`.ad-slot`) — a 90dp framed slot with the zone's
// 8/16 padding. When no ad is loaded the whole component renders nothing —
// the zone vanishes and leaves no empty space (the kit's `hidden`).
// The mockup's «Рэклама» corner label is the review board's stand-in for a
// creative, not app UI — the empty slot is the honest reserved place.
// Lives in components/, not app/: expo-router treats every app/ file as a
// route (issue #339).
import { StyleSheet, View } from "react-native";

import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { useThemeStyles } from "./theme";

// kit.css `.ad-zone` padding and `.ad-slot` height.
const ZONE_PADDING_VERTICAL = 8;
const ZONE_PADDING_HORIZONTAL = 16;
const SLOT_HEIGHT = 90;

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  zone: {
    paddingBottom: ZONE_PADDING_VERTICAL,
    paddingHorizontal: ZONE_PADDING_HORIZONTAL,
    paddingTop: ZONE_PADDING_VERTICAL,
  },
  slot: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderWidth: 1,
    height: SLOT_HEIGHT,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

export function AdContainer({ loaded, testID }: { loaded: boolean; testID?: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  if (!loaded) return null;
  return (
    <View style={styles.zone} testID={testID}>
      <View style={styles.slot} />
    </View>
  );
}
