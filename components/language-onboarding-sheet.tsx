// First-run language carousel sheet over the main menu (language-onboarding.html):
// When `uiLocale.needsOnboarding()` is true (first launch on device, or after
// clearing app data/cache so `settings.ui_locale` is absent), renders a bottom
// sheet over the map menu with an infinite inertia wheel of medallions for all
// open UI locales (reusing AboutCityWheel and AboutCityMedal). Confirming writes
// `settings.ui_locale` through `uiLocale.confirm()` and dismisses the sheet;
// subsequent launches skip straight to the menu until cache is cleared.
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import CheckIcon from "lucide-react-native/icons/check";
import ChevronLeftIcon from "lucide-react-native/icons/chevron-left";
import ChevronRightIcon from "lucide-react-native/icons/chevron-right";

import { OPEN_UI_LOCALES, uiLocaleNativeName, type CompleteUiLocaleCode } from "../contracts/ui-locales";
import type { UiLocaleSwitch } from "../controllers/uiLocaleStore";
import { AboutCityWheel } from "./about-city-wheel";
import { CanonIcon } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { useThemeStyles, useThemeTokens } from "./theme";
import { uiStrings } from "./ui-strings";

const MOTTO: Partial<Record<CompleteUiLocaleCode, string>> = {
  be: "Хадзем, паглядзім · у сваім тэмпе",
  en: "Let’s go and see · at your own pace",
  pl: "Chodźmy zobaczyć · we własnym tempie",
  uk: "Ходімо подивимось · у своєму темпі",
  de: "Komm, schauen wir · in deinem Tempo",
  es: "Vamos a ver · a tu propio ritmo",
  fr: "Allons voir · à votre propre rythme",
  cs: "Pojďme se podívat · vlastním tempem",
  sv: "Kom, vi tittar · i din egen takt",
  nb: "Kom, la oss se · i ditt eget tempo",
  da: "Kom, lad os se · i dit eget tempo",
  nl: "Kom, laten we kijken · in je eigen tempo",
  pt: "Vamos ver · ao seu próprio ritmo",
  it: "Andiamo a vedere · al tuo ritmo",
};

export function LanguageOnboardingSheet({ uiLocale }: { uiLocale: UiLocaleSwitch }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  const { width } = useWindowDimensions();

  const items = useMemo(
    () =>
      OPEN_UI_LOCALES.map((code) => ({
        id: code,
        code: code.toUpperCase(),
        label: uiLocaleNativeName(code),
      })),
    [],
  );

  const initialIndex = Math.max(0, OPEN_UI_LOCALES.indexOf(uiLocale.current()));
  const [index, setIndex] = useState(initialIndex);
  const pickedCode = OPEN_UI_LOCALES[index] ?? OPEN_UI_LOCALES[0];
  const pickedName = uiLocaleNativeName(pickedCode);
  const strings = uiStrings(pickedCode);
  const motto = MOTTO[pickedCode] ?? MOTTO.en ?? "";
  const slot = Math.min(96, Math.max(76, Math.floor(width / 3.4)));

  const onSelect = useCallback((nextIndex: number) => {
    const clamped = ((nextIndex % OPEN_UI_LOCALES.length) + OPEN_UI_LOCALES.length) % OPEN_UI_LOCALES.length;
    setIndex(clamped);
  }, []);

  const stepBy = useCallback((delta: number) => {
    setIndex((prev) => ((prev + delta) % OPEN_UI_LOCALES.length + OPEN_UI_LOCALES.length) % OPEN_UI_LOCALES.length);
  }, []);

  const onConfirm = useCallback(() => {
    if (uiLocale.confirm) {
      uiLocale.confirm(pickedCode);
    } else {
      uiLocale.set(pickedCode);
    }
  }, [pickedCode, uiLocale]);

  return (
    <View style={styles.scrim} testID="language-onboarding-sheet">
      <View
        accessibilityRole="none"
        accessibilityLabel={strings.languageLabel}
        style={styles.sheet}
      >
        <View style={styles.grip} />
        <ScaledText accessibilityRole="header" style={styles.title}>
          {strings.languageLabel}
        </ScaledText>
        <AboutCityWheel
          items={items}
          index={index}
          slot={slot}
          label={strings.languageLabel}
          onSelect={onSelect}
        />
        <View style={styles.stageRow}>
          <PressableSurface
            accessibilityRole="button"
            accessibilityLabel={strings.mapAccessibility.moveLeft}
            onPress={() => stepBy(-1)}
            style={styles.stepButton}
            testID="btn-language-prev"
          >
            <CanonIcon glyph={ChevronLeftIcon} label={strings.mapAccessibility.moveLeft} color={palette.colorAccent} size={20} />
          </PressableSurface>
          <View style={styles.spotlight}>
            <ScaledText style={styles.pickedName} testID="language-onboarding-picked">
              {pickedName}
            </ScaledText>
            <ScaledText style={styles.motto}>{motto}</ScaledText>
          </View>
          <PressableSurface
            accessibilityRole="button"
            accessibilityLabel={strings.mapAccessibility.moveRight}
            onPress={() => stepBy(1)}
            style={styles.stepButton}
            testID="btn-language-next"
          >
            <CanonIcon glyph={ChevronRightIcon} label={strings.mapAccessibility.moveRight} color={palette.colorAccent} size={20} />
          </PressableSurface>
        </View>
        <PressableSurface
          accessibilityRole="button"
          accessibilityLabel={`${strings.languageLabel}: ${pickedName}`}
          onPress={onConfirm}
          shelf="accent"
          style={styles.confirmButton}
          testID="btn-language-onboarding-confirm"
        >
          <CanonIcon glyph={CheckIcon} label={pickedName} color={palette.colorAccentInk} size={20} />
          <ScaledText style={styles.confirmLabel}>{pickedName}</ScaledText>
        </PressableSurface>
      </View>
    </View>
  );
}

const createStyles = (palette: ThemeTokens) =>
  StyleSheet.create({
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(20, 12, 8, 0.48)",
      justifyContent: "flex-end",
      zIndex: 10,
    },
    sheet: {
      backgroundColor: palette.colorPaper,
      borderColor: tokens.colorMedalRim,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderTopWidth: 1,
      gap: 10,
      paddingBottom: 20,
      paddingHorizontal: tokens.spaceL,
      paddingTop: 10,
    },
    grip: {
      alignSelf: "center",
      backgroundColor: palette.colorLine,
      borderRadius: 4,
      height: 4,
      width: 42,
    },
    title: {
      color: palette.colorInk,
      fontFamily: tokens.fontFamilyUiStrong,
      fontSize: tokens.fontTitleSize,
      fontWeight: tokens.fontWeightStrong,
      textAlign: "center",
    },
    stageRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    stepButton: {
      alignItems: "center",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    spotlight: {
      alignItems: "center",
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    pickedName: {
      color: palette.colorInk,
      fontFamily: tokens.fontFamilyUiStrong,
      fontSize: 22,
      fontWeight: tokens.fontWeightStrong,
      lineHeight: 27,
      textAlign: "center",
    },
    motto: {
      color: palette.colorAccent,
      fontFamily: tokens.fontFamilyUiStrong,
      fontSize: 13,
      fontWeight: tokens.fontWeightStrong,
      textAlign: "center",
    },
    confirmButton: {
      alignItems: "center",
      backgroundColor: palette.colorAccent,
      borderRadius: tokens.radiusBase,
      columnGap: 8,
      flexDirection: "row",
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: tokens.spaceL,
      paddingVertical: 12,
    },
    confirmLabel: {
      color: palette.colorAccentInk,
      fontFamily: tokens.fontFamilyUiStrong,
      fontSize: 16,
      fontWeight: tokens.fontWeightStrong,
    },
  });

const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
