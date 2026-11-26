// G07.05 (15_guide_decisions.md — R07) — the quiet guide-hint card of the open app (R07 in
// docs/15: «Побач ёсць гід…» without a session, the small quiet card during
// one; «Яна не запускае аўдыё, не пачынае сесію, не купляе кантэнт»). The
// rows are the public preview facts the hint controller projected — a tap
// opens the guide's preview the usual way (G01.04), nothing else; the paid
// marker rides the row (R07: «Платны гід пазначаецца як платны; адкрыццё
// апісання не дае доступу»). The visual language is the quiet-offer card's
// (G08.05): radius 10, the line border, the token rhythm, one quiet decline.
// Lives in components/, not app/: expo-router treats every app/ file as a
// route (docs/architecture/19_class_and_module_map.md — the components zone).
import { useSyncExternalStore } from "react";
import { StyleSheet, View } from "react-native";

// G21.09 (issue #542): the hint card's message shapes live in the shared
// pure contract zone. G21.25 (2026-10-03-single-source-translations.md — G21.25): the words are the generated
// projection of the canonical records plus the reviewed translations —
// the base text never lives in this component.
import type { GuideHintStrings } from "../contracts/ui-message-types";
import { GUIDE_HINT_STRINGS } from "./guide-hint-strings.generated";

import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { useThemeStyles } from "./theme";
import type { NearbyHintBinding, NearbyHintState } from "../controllers/useNearbyController";

export function guideHintStrings(locale: string): GuideHintStrings {
  // The words are the generated projection of the canonical records plus the
  // reviewed translations (G21.25 — 2026-10-03-single-source-translations.md).
  // Under decision L1 (#261), uk uses en while its own words are not authored;
  // every explicitly translated locale keeps its own catalogue.
  return locale === "nn" ? GUIDE_HINT_STRINGS.nn : locale === "rm" ? GUIDE_HINT_STRINGS.rm : locale === "ka" ? GUIDE_HINT_STRINGS.ka : locale === "hy" ? GUIDE_HINT_STRINGS.hy : locale === "az" ? GUIDE_HINT_STRINGS.az : locale === "ru" ? GUIDE_HINT_STRINGS.ru : locale === "lb" ? GUIDE_HINT_STRINGS.lb : locale === "cnr" ? GUIDE_HINT_STRINGS.cnr : locale === "is" ? GUIDE_HINT_STRINGS.is : locale === "ga" ? GUIDE_HINT_STRINGS.ga : locale === "mt" ? GUIDE_HINT_STRINGS.mt : locale === "ca" ? GUIDE_HINT_STRINGS.ca : locale === "tr" ? GUIDE_HINT_STRINGS.tr : locale === "hr" ? GUIDE_HINT_STRINGS.hr : locale === "ro" ? GUIDE_HINT_STRINGS.ro : locale === "bg" ? GUIDE_HINT_STRINGS.bg : locale === "el" ? GUIDE_HINT_STRINGS.el : locale === "sr" ? GUIDE_HINT_STRINGS.sr : locale === "bs" ? GUIDE_HINT_STRINGS.bs : locale === "mk" ? GUIDE_HINT_STRINGS.mk : locale === "sq" ? GUIDE_HINT_STRINGS.sq : locale === "et" ? GUIDE_HINT_STRINGS.et : locale === "lv" ? GUIDE_HINT_STRINGS.lv : locale === "sk" ? GUIDE_HINT_STRINGS.sk : locale === "hu" ? GUIDE_HINT_STRINGS.hu : locale === "sl" ? GUIDE_HINT_STRINGS.sl : locale === "it" ? GUIDE_HINT_STRINGS.it : locale === "fi" ? GUIDE_HINT_STRINGS.fi : locale === "lt" ? GUIDE_HINT_STRINGS.lt : locale === "pt" ? GUIDE_HINT_STRINGS.pt : locale === "nl" ? GUIDE_HINT_STRINGS.nl : locale === "da" ? GUIDE_HINT_STRINGS.da : locale === "pl" ? GUIDE_HINT_STRINGS.pl : locale === "nb" ? GUIDE_HINT_STRINGS.nb : locale === "zh" ? GUIDE_HINT_STRINGS.zh : locale === "sv" ? GUIDE_HINT_STRINGS.sv : locale === "cs" ? GUIDE_HINT_STRINGS.cs : locale === "es" ? GUIDE_HINT_STRINGS.es : locale === "fr" ? GUIDE_HINT_STRINGS.fr : locale === "en" ? GUIDE_HINT_STRINGS.en : locale === "de" ? GUIDE_HINT_STRINGS.de : locale === "be" ? GUIDE_HINT_STRINGS.be : GUIDE_HINT_STRINGS.en;
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  card: {
    backgroundColor: palette.colorHintBg,
    borderColor: palette.colorHintBorder,
    borderRadius: palette.radiusBase,
    borderWidth: 1,
    marginBottom: palette.spaceM,
    marginTop: palette.spaceM,
    padding: palette.spaceM,
  },
  heading: {
    color: palette.colorInk,
    fontSize: palette.fontBaseSize,
    fontWeight: palette.fontWeightStrong,
  },
  row: {
    marginTop: palette.spaceS,
    padding: palette.spaceS,
  },
  rowTitle: {
    color: palette.colorInk,
    fontSize: palette.fontBaseSize,
  },
  paidMark: {
    color: palette.colorMuted,
    fontSize: palette.fontBaseSize,
  },
  dismiss: {
    alignItems: "center",
    marginTop: palette.spaceS,
    padding: palette.spaceS,
  },
  dismissLabel: {
    color: palette.colorMuted,
    fontSize: palette.fontBaseSize,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

// The screens' one mount line (map, run): reads the app-wide hint binding's
// store and renders the card only from a ready state. The store hook is the
// react-native useSyncExternalStore over the zustand store the binding
// carries — the component keeps the components-zone rule (no runtime imports
// from controllers; the binding arrives as a prop, only its type is
// imported). The tap opens the preview through the binding's own open
// action, then hands the navigation to the screen.
const passSubscribe = (): (() => void) => () => {};
const passGetState = (): NearbyHintState | null => null;

export function GuideHintMount({
  binding,
  locale,
  onOpen,
}: {
  binding: NearbyHintBinding | null | undefined;
  locale: string;
  onOpen: (routeId: string) => void;
}) {
  const state = useSyncExternalStore(binding?.store.subscribe ?? passSubscribe, binding?.store.getState ?? passGetState);
  if (!binding || state === null || state.kind !== "ready") return null;
  const strings = guideHintStrings(locale);
  return (
    <GuideHintCard
      heading={strings.heading}
      paidLabel={strings.paid}
      openHint={strings.openHint}
      dismissLabel={strings.dismiss}
      guides={state.guides}
      onOpen={(routeId) => {
        binding.openPreview();
        onOpen(routeId);
      }}
      onDismiss={binding.dismiss}
    />
  );
}

export function GuideHintCard({
  heading,
  paidLabel,
  openHint,
  dismissLabel,
  guides,
  onOpen,
  onDismiss,
}: {
  heading: string;
  paidLabel: string;
  openHint: string;
  dismissLabel: string;
  guides: readonly { readonly routeId: string; readonly title: string; readonly paid: boolean }[];
  onOpen: (routeId: string) => void;
  onDismiss: () => void;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.card} testID="guide-hint-card">
      <ScaledText style={styles.heading}>{heading}</ScaledText>
      {guides.map((guide) => (
        <PressableSurface
          key={guide.routeId}
          accessibilityRole="button"
          accessibilityLabel={`${guide.title}${guide.paid ? ` (${paidLabel})` : ""}`}
          accessibilityHint={openHint}
          onPress={() => onOpen(guide.routeId)}
          style={styles.row}
          testID={`guide-hint-row-${guide.routeId}`}
        >
          <ScaledText style={styles.rowTitle}>{guide.title}</ScaledText>
          {guide.paid ? <ScaledText style={styles.paidMark}>{paidLabel}</ScaledText> : null}
        </PressableSurface>
      ))}
      <PressableSurface
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
        style={styles.dismiss}
        testID="btn-hint-dismiss"
      >
        <ScaledText style={styles.dismissLabel}>{dismissLabel}</ScaledText>
      </PressableSurface>
    </View>
  );
}
