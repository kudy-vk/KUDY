// #215 — the section heading of the mockups (kit.css `.sec`): the small
// muted line that groups a screen's list («Паблизу», «Чым заняцца»), one
// component so the screens never restyle it. The text arrives from the
// caller — the words ride the catalogs (G14.04.d), this component owns
// only the look. Lives in components/, not app/: expo-router treats every
// app/ file as a route (docs/architecture/19_class_and_module_map.md — the components zone).
import { StyleSheet } from "react-native";

import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { ScaledText } from "./scaled-text";
import { useThemeStyles } from "./theme";

// kit.css `.sec`: 13px muted regular, 16 above / 8 below.
const SEC_FONT_SIZE = 13;

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  sec: {
    color: palette.colorMuted,
    fontSize: SEC_FONT_SIZE,
    marginBottom: palette.spaceS,
    marginTop: palette.spaceL,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

export function SectionHeader({ text, testID }: { text: string; testID?: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <ScaledText style={styles.sec} testID={testID}>
      {text}
    </ScaledText>
  );
}
