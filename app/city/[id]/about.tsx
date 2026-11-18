// Issue #252 — the «Пра горад» surface of the owner-approved final layout
// (docs/design/production/about.html, decisions L1 and M9 in
// docs/design/brand/decisions.md): behind the top bar turns the wheel of the
// five sections (decision M10 — «Побач з горадам» moved to the main menu),
// and below it the screen shows the section that stands in the middle.
// The owner's 2026-11-17 request turns the content into the wheel's shadow:
// the five sections are the pages of components/about-city-pages.tsx, each
// riding the wheel's live position, so a drag or a push on the wheel flips
// the content with it like the image carousel of an Instagram post — and
// the old from-side slide (its shared Animated.Value could stick at the
// side offset when a fast turn interrupted a running timing) is gone as a
// mechanism. The screen owns the open section's id and echoes it back into
// the wheel through `index`, so a section change made outside the wheel
// (the map's airport card, the mockup's openSection) turns the wheel too.
// The guide needs no network: the whole document renders offline (issue
// criterion 7); only the official link rows at the end of a section open
// the browser, and when the device cannot open one, its address stays on
// the screen. The [id] route of 19 §2.5 is display-shaped only in the MVP
// single-city catalog: the surface renders the active city and does not echo
// an unvalidated param (21 §3.2 — у MVP толькі актыўны Гданьск).
import { useCallback, useMemo, useState } from "react";
import { Linking, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";

import { ABOUT_CITY_SECTIONS, aboutCityText, type AboutCitySectionId } from "../../../components/about-city-content";
import { aboutCityStrings } from "../../../components/about-city-strings";
import { ABOUT_CITY_INITIAL_UI, type AboutCityUiState } from "../../../components/about-city-sections";
import { BackButton } from "../../../components/back-button";
import { AboutCityPages } from "../../../components/about-city-pages";
import { darkTokens, tokens, type ThemeTokens } from "../../../components/design-tokens";
import { ScaledText } from "../../../components/scaled-text";
import { ScreenSurface } from "../../../components/screen-surface";
import { useThemeStyles } from "../../../components/theme";
import { AboutCityWheel } from "../../../components/about-city-wheel";
import { useServices, useUiLocale } from "../../_layout";
import { WalkButton } from "../../../components/walk-button";
import { uiStrings } from "../../../components/ui-strings";

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  screen: {
    backgroundColor: palette.colorPaper,
    flex: 1,
  },
  header: {
    alignItems: "center",
    columnGap: tokens.spaceM,
    flexDirection: "row",
    paddingHorizontal: tokens.spaceL,
  },
  title: {
    color: palette.colorInk,
    flex: 1,
    flexShrink: 1,
    fontSize: tokens.fontTitleSize,
    fontWeight: tokens.fontWeightStrong,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

export default function AboutCity() {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const services = useServices();
  const insets = useSafeAreaInsets();
  const device = useWindowDimensions();
  const locale = useUiLocale();
  const strings = aboutCityStrings(locale);
  const chrome = uiStrings(locale);
  const [sectionId, setSectionId] = useState<AboutCitySectionId>(ABOUT_CITY_SECTIONS[0].id);
  const [ui, setUiState] = useState<AboutCityUiState>(ABOUT_CITY_INITIAL_UI);
  // The device could not open the page: its address stays on the screen
  // (issue criterion 7). Opening another row clears the notice.
  const [failedLink, setFailedLink] = useState<string | null>(null);

  const setUi = useCallback((patch: Partial<AboutCityUiState> | ((prev: AboutCityUiState) => Partial<AboutCityUiState>)) => {
    setUiState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);
  // The fold groups keep one fold open: opening one closes the others of
  // its group (the mockup's folds() rule).
  const toggleFold = useCallback((group: readonly string[], id: string, open: boolean) => {
    setUiState((prev) => {
      const folds = { ...prev.folds, [id]: open };
      if (open) for (const other of group) if (other !== id) folds[other] = false;
      return { ...prev, folds };
    });
  }, []);

  const t = useMemo(() => aboutCityText(strings), [strings]);

  // The wheel turns, the pages ride it: the select only names the section —
  // the flip itself is the pages following the wheel's position (the
  // owner's 2026-11-17 request). A change of section resets the scroll on
  // the page that becomes the open one (about-city-pages.tsx).
  const onSelect = useCallback((index: number) => {
    const next = ABOUT_CITY_SECTIONS[index];
    if (!next || next.id === sectionId) return;
    setSectionId(next.id);
  }, [sectionId]);

  // The map's airport card turns the wheel back to the airport section
  // (the mockup's openSection('airport')): the screen's `index` echo turns
  // the wheel; the pages follow it the same way.
  const onOpenSection = useCallback((id: AboutCitySectionId) => {
    const index = ABOUT_CITY_SECTIONS.findIndex((item) => item.id === id);
    if (index === -1) return;
    onSelect(index);
  }, [onSelect]);

  // Hands an address to the system; the link rows and the transport app
  // tiles resolve their addresses first and hand the raw URL in.
  const openUrl = useCallback((url: string) => {
    setFailedLink(null);
    void Linking.openURL(url).catch(() => setFailedLink(url));
  }, []);

  const ctx = useMemo(
    () => ({ strings, t, ui, setUi, toggleFold, onOpenSection, openLink: openUrl }),
    [strings, t, ui, setUi, toggleFold, onOpenSection, openUrl],
  );

  const index = ABOUT_CITY_SECTIONS.findIndex((item) => item.id === sectionId);
  // Every item has the same width; three items always fit the screen
  // (the mockup's slot rule).
  const slot = Math.min(100, Math.floor(device.width / 3));
  const ring = ABOUT_CITY_SECTIONS.length * slot;
  // The wheel's own initial position: the first section stands in the
  // middle, the pages start aligned with it.
  const pos = useSharedValue(0);

  return (
    <ScreenSurface
      style={[styles.screen, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right, paddingTop: insets.top }]}
      testID="screen-AboutCity"
    >
      <View style={styles.header}>
        <BackButton label={chrome.back} testID="btn-about-back" />
        {/* The screen title rides the chrome word the menu piece carries —
            the mockup's topbar title. */}
        <ScaledText style={styles.title} accessibilityRole="header">{chrome.aboutCity}</ScaledText>
        {/* The walk return shows only with a live walk and renders nowhere
            otherwise — the WalkButton contract. */}
        <WalkButton walk={services.walk} locale={locale} iconOnly />
      </View>
      <AboutCityWheel
        items={ABOUT_CITY_SECTIONS.map(({ id, icon }) => ({ id, icon, label: t(`tab.${id}`) }))}
        index={index}
        slot={slot}
        label={t("wheel.label")}
        onSelect={onSelect}
        positionShared={pos}
      />
      <AboutCityPages
        sections={ABOUT_CITY_SECTIONS}
        pos={pos}
        slot={slot}
        ring={ring}
        width={device.width}
        activeId={sectionId}
        ctx={ctx}
        failedLink={failedLink}
      />
    </ScreenSurface>
  );
}
