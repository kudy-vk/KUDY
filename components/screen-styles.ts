// UX 02 (screens-and-transitions.md — Агульныя правілы пераходаў) — the shared screen-frame styles of the detail
// surfaces (route preview, place detail): the paper container and the
// section title. One copy — sibling StyleSheets are jscpd clones
// (implementation-rules 3).
import { StyleSheet } from "react-native";

import { darkTokens, tokens } from "./design-tokens";
import { useThemeStyles } from "./theme";

// Issue #435: canon §3 gives Alegreya the guide and story names only —
// every other screen title (rubrics, place names, collections) stays on
// the UI family. The display role is the separate style below; the guard
// in test/design-tokens.test.mjs tracks who consumes it.
const titleBase = {
  color: tokens.colorInk,
  fontSize: tokens.fontTitleSize,
  fontWeight: tokens.fontWeightStrong,
  marginBottom: tokens.spaceS,
};

export const screenStyles = StyleSheet.create({
  screen: {
    backgroundColor: tokens.colorPaper,
    flex: 1,
    padding: tokens.spaceL,
  },
  title: {
    ...titleBase,
    fontFamily: tokens.fontFamilyUi,
  },
  displayTitle: {
    ...titleBase,
    // G06.10.b: while the face loads (and in tests) the unknown family
    // name falls back to the system font, weight and size hold.
    fontFamily: tokens.fontFamilyDisplay,
  },
  // M11 (issue #216): «Куды сёння?» of the main screen — the second Alegreya
  // role the canon allows (visual-language §3 as amended by M11). The regular
  // face renders the mockup's weight-400 display line at its own 32 size.
  menuDisplayTitle: {
    color: tokens.colorInk,
    fontFamily: tokens.fontFamilyDisplayRegular,
    fontSize: tokens.fontMenuTitleSize,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.fontMenuTitleSize * 1.2,
    marginHorizontal: tokens.spaceL,
    marginTop: tokens.spaceS,
  },
});

// docs/design/dark-theme.md — preserve the existing light screenStyles export and its typography
// contract; detail screens select a dark equivalent at render time.
const { displayTitle } = screenStyles;
const darkScreenStyles = StyleSheet.create({
  screen: { ...screenStyles.screen, backgroundColor: darkTokens.colorPaper },
  title: { ...screenStyles.title, color: darkTokens.colorInk },
  displayTitle: { ...displayTitle, color: darkTokens.colorInk },
  menuDisplayTitle: { ...screenStyles.menuDisplayTitle, color: darkTokens.colorInk },
});

export function useScreenStyles() {
  return useThemeStyles(screenStyles, darkScreenStyles);
}
