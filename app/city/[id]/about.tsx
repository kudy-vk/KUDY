// Issue #200 — the «Пра горад» surface: the static practical guide opened by
// the map menu's reserve-1 fragment (the slot that rendered «Хутка»). The
// whole document renders offline — no catalog fetch, no service state, no
// map build (issue criterion 8); the four entry cards scroll to their
// sections, and every link row opens the official page that the sources
// table (docs/content/about-city-sources.md) cites with its check date.
// The [id] route of 19 §2.5 is display-shaped only in the MVP single-city
// catalog: the surface renders the active city and does not echo an
// unvalidated param (21 §3.2 — у MVP толькі актыўны Гданьск).
import { useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExternalLinkIcon from "lucide-react-native/icons/external-link";
import MapIcon from "lucide-react-native/icons/map";
import PlaneIcon from "lucide-react-native/icons/plane";
import TicketIcon from "lucide-react-native/icons/ticket";
import UtensilsIcon from "lucide-react-native/icons/utensils-crossed";

import {
  ABOUT_CITY_LINK_URLS,
  ABOUT_CITY_MAP_BOX_RATIO,
  ABOUT_CITY_MAP_ITEMS,
  ABOUT_CITY_SECTION_LINKS,
  ABOUT_CITY_VERIFIED_ON,
  type AboutCityLinkKey,
  type AboutCitySectionId,
} from "../../../components/about-city-content";
import { aboutCityStrings } from "../../../components/about-city-strings";
import { BackButton } from "../../../components/back-button";
import { CanonIcon, type CanonGlyph } from "../../../components/canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "../../../components/design-tokens";
import { PressableSurface } from "../../../components/pressable-surface";
import { ScaledText } from "../../../components/scaled-text";
import { useThemeStyles, useThemeTokens } from "../../../components/theme";
import { useUiLocale } from "../../_layout";
import { uiStrings } from "../../../components/ui-strings";

// The four visible entry cards (issue criterion 8) scroll to their sections;
// the karta and malbork blocks stay discoverable below them.
const ENTRIES = [
  { id: "airport", icon: PlaneIcon },
  { id: "transport", icon: TicketIcon },
  { id: "city", icon: MapIcon },
  { id: "food", icon: UtensilsIcon },
] as const satisfies readonly { id: AboutCitySectionId; icon: CanonGlyph }[];

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  screen: {
    backgroundColor: palette.colorPaper,
    flex: 1,
  },
  content: {
    paddingBottom: tokens.spaceL,
    paddingHorizontal: tokens.spaceL,
  },
  title: {
    color: palette.colorInk,
    fontFamily: tokens.fontFamilyDisplay,
    fontSize: tokens.fontTitleSize,
    marginBottom: tokens.spaceS,
  },
  verified: {
    color: palette.colorMuted,
    marginBottom: tokens.spaceM,
  },
  intro: {
    color: palette.colorInk,
    marginBottom: tokens.spaceM,
  },
  entriesHeading: {
    color: palette.colorInk,
    fontFamily: tokens.fontFamilyUiStrong,
    fontSize: tokens.fontBaseSize,
    marginBottom: tokens.spaceS,
  },
  entries: {
    rowGap: tokens.spaceS,
  },
  entry: {
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: tokens.spaceM,
    paddingVertical: tokens.spaceM,
  },
  entryRow: {
    alignItems: "center",
    columnGap: tokens.spaceS,
    flexDirection: "row",
  },
  entryLabel: {
    color: palette.colorAccent,
    fontFamily: tokens.fontFamilyUiStrong,
    fontSize: tokens.fontBaseSize,
  },
  section: {
    marginBottom: tokens.spaceL,
  },
  sectionTitle: {
    color: palette.colorInk,
    fontFamily: tokens.fontFamilyDisplay,
    fontSize: tokens.fontTitleSize,
    marginBottom: tokens.spaceS,
  },
  paragraph: {
    color: palette.colorInk,
    lineHeight: tokens.fontBaseSize * 1.45,
    marginBottom: tokens.spaceS,
  },
  // The orientation schematic is map-like imagery: per DT-4 it keeps the
  // light cartography tokens in BOTH themes (the darkTokens mirror carries
  // no colorMap override — the value stays the accepted light one), so its
  // labels ride the fixed light-ink tokens, not the theme's ink.
  schematic: {
    aspectRatio: 1 / ABOUT_CITY_MAP_BOX_RATIO,
    backgroundColor: tokens.colorMap,
    borderColor: tokens.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: tokens.spaceS,
  },
  schematicLine: {
    backgroundColor: tokens.colorLine,
    position: "absolute",
  },
  mapLabel: {
    color: tokens.colorInk,
    fontSize: tokens.fontBaseSize * 0.8,
    position: "absolute",
  },
  mapLabelStrong: {
    color: tokens.colorAccent,
    fontFamily: tokens.fontFamilyUiStrong,
  },
  mapCaption: {
    color: palette.colorMuted,
    marginBottom: tokens.spaceS,
  },
  linkRow: {
    alignItems: "center",
    columnGap: tokens.spaceS,
    flexDirection: "row",
    paddingHorizontal: tokens.spaceM,
    paddingVertical: tokens.spaceM,
  },
  linkLabel: {
    color: palette.colorAccent,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

function LinkRow({ linkKey, label }: { linkKey: AboutCityLinkKey; label: string }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  return (
    <PressableSurface
      accessibilityLabel={label}
      accessibilityRole="link"
      onPress={() => void Linking.openURL(ABOUT_CITY_LINK_URLS[linkKey]).catch(() => undefined)}
      style={styles.linkRow}
      testID={`link-about-${linkKey}`}
    >
      <CanonIcon glyph={ExternalLinkIcon} label={label} color={palette.colorAccent} />
      <ScaledText style={styles.linkLabel}>{label}</ScaledText>
    </PressableSurface>
  );
}

export default function AboutCity() {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  const insets = useSafeAreaInsets();
  const locale = useUiLocale();
  const strings = aboutCityStrings(locale);
  const chrome = uiStrings(locale);
  const scrollRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState<Partial<Record<AboutCitySectionId, number>>>({});
  const sectionLayout = (id: AboutCitySectionId): ((event: LayoutChangeEvent) => void) =>
    (event) => {
      // The y is read synchronously: the Fabric event object is freed after
      // dispatch, and a state updater that touches it later crashes with
      // "Cannot read property 'layout' of null" on device (render error
      // caught by the first Android capture; jest events never pooled).
      const y = event.nativeEvent.layout.y;
      setSectionY((prev) => ({ ...prev, [id]: y }));
    };
  const openEntry = (id: AboutCitySectionId) => {
    const y = sectionY[id];
    if (y !== undefined) scrollRef.current?.scrollTo({ animated: true, y });
  };
  const sectionLinks = (id: AboutCitySectionId) =>
    ABOUT_CITY_SECTION_LINKS[id].map((linkKey) => (
      <LinkRow key={linkKey} linkKey={linkKey} label={strings.links[linkKey]} />
    ));

  return (
    <View
      style={[styles.screen, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right, paddingTop: insets.top + tokens.spaceL }]}
      testID="screen-AboutCity"
    >
      <BackButton label={chrome.back} testID="btn-about-back" />
      <ScrollView contentContainerStyle={styles.content} ref={scrollRef} testID="scroll-about">
        <ScaledText accessibilityRole="header" style={styles.title}>{strings.title}</ScaledText>
        <ScaledText style={styles.verified}>{strings.verifiedLine(ABOUT_CITY_VERIFIED_ON)}</ScaledText>
        <ScaledText style={styles.intro}>{strings.intro}</ScaledText>
        <ScaledText accessibilityRole="header" style={styles.entriesHeading}>{strings.entriesHeading}</ScaledText>
        <View style={styles.entries}>
          {ENTRIES.map((entry) => (
            <PressableSurface
              accessibilityLabel={strings[entry.id].title}
              accessibilityRole="button"
              key={entry.id}
              onPress={() => openEntry(entry.id)}
              style={styles.entry}
              testID={`entry-about-${entry.id}`}
            >
              <View style={styles.entryRow}>
                <CanonIcon glyph={entry.icon} label={strings[entry.id].title} color={palette.colorAccent} />
                <ScaledText style={styles.entryLabel}>{strings[entry.id].title}</ScaledText>
              </View>
            </PressableSurface>
          ))}
        </View>

        <View onLayout={sectionLayout("airport")} style={styles.section} testID="section-about-airport">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.airport.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.intro}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.busDay}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.busSecond}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.nightBus}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.train}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.ticketNote}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.airport.scheduleNote}</ScaledText>
          {sectionLinks("airport")}
        </View>

        <View onLayout={sectionLayout("transport")} style={styles.section} testID="section-about-transport">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.transport.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.ztmWhen}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.skmWhen}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.otherRail}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.tickets}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.activation}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.transport.machinesApps}</ScaledText>
          {sectionLinks("transport")}
        </View>

        <View onLayout={sectionLayout("city")} style={styles.section} testID="section-about-city">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.city.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.city.glowneVsStare}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.city.station}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.city.wrzeszcz}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.city.oliwa}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.city.beaches}</ScaledText>
          <View testID="city-schematic" style={styles.schematic}>
            {ABOUT_CITY_MAP_ITEMS.map((item) => (
              <ScaledText
                key={item.id}
                style={[
                  styles.mapLabel,
                  item.id === "mapGlowne" ? styles.mapLabelStrong : null,
                  { left: `${item.x}%`, top: `${item.y}%`, transform: [{ translateX: item.dx }] },
                ]}
              >
                {strings.city[item.id]}
              </ScaledText>
            ))}
            <ScaledText style={[styles.mapLabel, { color: tokens.colorMuted, left: "2%", top: "2%" }]}>{strings.city.mapSea}</ScaledText>
            <View style={[styles.schematicLine, { height: StyleSheet.hairlineWidth, left: "34%", right: "34%", top: "7%" }]} />
            <View style={[styles.schematicLine, { bottom: "5%", top: "10%", width: StyleSheet.hairlineWidth * 2, left: "71%" }]} />
          </View>
          <ScaledText style={styles.mapCaption}>{strings.city.mapCaption}</ScaledText>
          {sectionLinks("city")}
        </View>

        <View onLayout={sectionLayout("food")} style={styles.section} testID="section-about-food">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.food.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.food.delivery}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.food.cards}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.food.blik}</ScaledText>
          {sectionLinks("food")}
        </View>

        <View onLayout={sectionLayout("karta")} style={styles.section} testID="section-about-karta">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.karta.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.karta.packages}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.karta.transportAddOn}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.karta.freeMuseums}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.karta.exceptionsNote}</ScaledText>
          {sectionLinks("karta")}
        </View>

        <View onLayout={sectionLayout("malbork")} style={styles.section} testID="section-about-malbork">
          <ScaledText accessibilityRole="header" style={styles.sectionTitle}>{strings.malbork.title}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.malbork.intro}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.malbork.train}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.malbork.walk}</ScaledText>
          <ScaledText style={styles.paragraph}>{strings.malbork.visitNote}</ScaledText>
          {sectionLinks("malbork")}
        </View>
      </ScrollView>
    </View>
  );
}
