// #215 — the one round action of a screen (the kit vocabulary: kit.mjs
// `fab()`, kit.css `.fab` — download, start a walk, play, pause). One
// component, so screens never redraw it: the round accent button with the
// CanonIcon glyph and the screen-reader name, the reason line to the LEFT
// of the button (the production preview's pv-foot arrangement: the text
// takes the remaining width, the round action sits at the end), and the
// disabled state of canon §5 — the ghost pair after the owner's variant А
// (owner decision 2026-10-03: transparent fill, color.disabled-ink glyph, color.disabled-line
// frame, no shelf) — never an opacity dim. The reason is info the screen
// supplies (why the action waits, or what it costs), shown whenever passed,
// not only when disabled. Lives in components/, not app/: expo-router
// treats every app/ file as a route (docs/architecture/19_class_and_module_map.md — the components zone).
import { StyleSheet, View } from "react-native";

import type { CanonGlyph } from "./canon-icon";
import { CanonIcon } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { useThemeStyles, useThemeTokens } from "./theme";

// kit.css `.fab`: 56×56 round, the icon at 26.
const FAB_SIZE = 56;
const FAB_ICON_SIZE = 26;

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  foot: {
    alignItems: "center",
    flexDirection: "row",
    gap: palette.spaceM,
    minHeight: FAB_SIZE,
  },
  reason: {
    color: palette.colorInk,
    flex: 1,
    fontSize: palette.fontBaseSize,
  },
  button: {
    alignItems: "center",
    backgroundColor: palette.colorAccent,
    borderRadius: FAB_SIZE / 2,
    height: FAB_SIZE,
    justifyContent: "center",
    width: FAB_SIZE,
  },
  // Canon §5 ghost pair, no opacity: the fill drops out, the frame and the
  // glyph take the disabled pair; the shelf stays off (see shelf prop below).
  buttonDisabled: {
    backgroundColor: "transparent",
    borderColor: palette.colorDisabledLine,
    borderWidth: 1,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

export function Fab({ glyph, label, reason, disabled = false, onPress, testID }: {
  glyph: CanonGlyph;
  // Canon §9: the screen-reader word on every icon-only button.
  label: string;
  reason?: string;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  return (
    <View style={styles.foot}>
      {reason ? <ScaledText style={styles.reason}>{reason}</ScaledText> : null}
      <PressableSurface
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        // The enabled clay shelf (canon §2); a disabled button never dips and
        // reads through the ghost pair, so the shelf is not on it at all.
        shelf={disabled ? undefined : "accent"}
        style={[styles.button, disabled && styles.buttonDisabled]}
        testID={testID}
      >
        <CanonIcon
          glyph={glyph}
          label={label}
          color={disabled ? palette.colorDisabledInk : palette.colorAccentInk}
          size={FAB_ICON_SIZE}
        />
      </PressableSurface>
    </View>
  );
}
