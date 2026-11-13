// Issue #252 — the «Пра горад» surface of the owner-approved final layout
// (docs/design/production/about.html, decisions L1 and M9 in
// docs/design/brand/decisions.md): behind the top bar turns the wheel of the
// five sections (decision M10 — «Побач з горадам» moved to the main menu),
// and below it the screen shows the section that stands in the middle. The
// guide needs no network: the whole document renders offline (issue
// criterion 7); only the official link rows at the end of a section open the
// browser, and when the device cannot open one, its address stays on the
// screen. The [id] route of 19 §2.5 is display-shaped only in the MVP
// single-city catalog: the surface renders the active city and does not echo
// an unvalidated param (21 §3.2 — у MVP толькі актыўны Гданьск).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CheckIcon from "lucide-react-native/icons/check";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";

import {
  ABOUT_CITY_LINK_URLS,
  ABOUT_CITY_SECTIONS,
  aboutCityText,
  type AboutCityLinkKey,
  type AboutCitySectionId,
} from "../../../components/about-city-content";
import { aboutCityStrings } from "../../../components/about-city-strings";
import { ABOUT_CITY_INITIAL_UI, AboutCitySection, type AboutCitySectionContext, type AboutCityUiState } from "../../../components/about-city-sections";
import { Remark, SubHeading } from "../../../components/about-city-parts";
import { BackButton } from "../../../components/back-button";
import { CanonIcon } from "../../../components/canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "../../../components/design-tokens";
import { PressableSurface } from "../../../components/pressable-surface";
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
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: tokens.spaceL,
  },
  head: {
    color: palette.colorInk,
    fontSize: 22,
    fontWeight: tokens.fontWeightStrong,
    lineHeight: 27,
  },
  verified: {
    color: palette.colorMuted,
    fontSize: 12,
    marginTop: -8,
  },
  checkedRow: {
    alignItems: "center",
    columnGap: 4,
    flexDirection: "row",
    marginTop: -8,
  },
  stack: { gap: 8 },
  card: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sources: { gap: 10 },
  linkRow: {
    alignItems: "center",
    columnGap: 12,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkLabel: {
    color: palette.colorAccent,
    flexShrink: 1,
    fontSize: 16,
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
  const scrollRef = useRef<ScrollView>(null);
  const [sectionId, setSectionId] = useState<AboutCitySectionId>(ABOUT_CITY_SECTIONS[0].id);
  const [ui, setUiState] = useState<AboutCityUiState>(ABOUT_CITY_INITIAL_UI);
  // The device could not open the page: its address stays on the screen
  // (issue criterion 7). Opening another row clears the notice.
  const [failedLink, setFailedLink] = useState<string | null>(null);

  const setUi = useCallback((patch: Partial<AboutCityUiState>) => {
    setUiState((prev) => ({ ...prev, ...patch }));
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
  const ctx: Omit<AboutCitySectionContext, "styles"> = useMemo(
    () => ({ strings, t, ui, setUi, toggleFold }),
    [strings, t, ui, setUi, toggleFold],
  );

  // The section slides in from the side the wheel turned to (the mockup's
  // from-left/from-right, 220 ms); the system «reduce motion» setting jumps
  // it into place.
  const slide = useRef(new Animated.Value(0)).current;
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setCalm).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setCalm);
    return () => subscription?.remove();
  }, []);

  const onSelect = useCallback((index: number, direction: number) => {
    const next = ABOUT_CITY_SECTIONS[index];
    if (!next || next.id === sectionId) return;
    setSectionId(next.id);
    // A change of section resets the scroll.
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
    slide.setValue(direction > 0 ? 18 : -18);
    if (calm) {
      slide.setValue(0);
      return;
    }
    Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [sectionId, calm, slide]);

  const openLink = useCallback((linkKey: AboutCityLinkKey) => {
    const url = ABOUT_CITY_LINK_URLS[linkKey];
    // Opening another row clears the notice of a failed open.
    setFailedLink(null);
    void Linking.openURL(url).catch(() => setFailedLink(url));
  }, []);

  const section = ABOUT_CITY_SECTIONS.find((item) => item.id === sectionId) ?? ABOUT_CITY_SECTIONS[0];

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
        index={ABOUT_CITY_SECTIONS.findIndex((item) => item.id === sectionId)}
        // Every item has the same width; three items always fit the screen
        // (the mockup's slot rule).
        slot={Math.min(100, Math.floor(device.width / 3))}
        label={t("wheel.label")}
        onSelect={onSelect}
      />
      <ScrollView contentContainerStyle={styles.content} ref={scrollRef} testID="scroll-about">
        <ScaledText accessibilityRole="header" style={styles.head}>{t(`head.${sectionId}`)}</ScaledText>
        <View style={styles.checkedRow}>
          <CanonIcon glyph={CheckIcon} label={t("verified")} size={14} color={tokens.colorAccent} />
          <ScaledText style={[styles.verified, { marginTop: 0 }]}>{t("verified")}</ScaledText>
        </View>
        <Animated.View style={{ transform: [{ translateX: slide }] }}>
          <AboutCitySection key={sectionId} id={sectionId} ctx={ctx} />
        </Animated.View>
        <View style={styles.sources}>
          <SubHeading>{t("sources.title")}</SubHeading>
          <ScaledText style={styles.verified}>{t("sources.note")}</ScaledText>
          <View style={styles.stack}>
            {section.links.map((linkKey) => {
              const label = t(`links.${linkKey}`);
              return (
                <PressableSurface
                  accessibilityRole="link"
                  accessibilityLabel={label}
                  key={linkKey}
                  onPress={() => openLink(linkKey)}
                  style={[styles.card, styles.linkRow]}
                  testID={`link-about-${linkKey}`}
                >
                  <ScaledText style={styles.linkLabel}>{label}</ScaledText>
                  <CanonIcon glyph={ExternalLinkIcon} label={label} color={tokens.colorAccent} size={18} />
                </PressableSurface>
              );
            })}
          </View>
          {failedLink ? <Remark tone="error" text={t("link.failed", { url: failedLink })} /> : null}
        </View>
      </ScrollView>
    </ScreenSurface>
  );
}
