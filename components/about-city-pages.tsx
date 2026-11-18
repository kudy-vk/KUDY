// Issue #252 — the section pages under the wheel, flipped by it. The
// owner's 2026-11-17 request: a drag or a push on the wheel turns the
// content with it, the way the image carousel of an Instagram post follows
// the hand. Every section is a full-width page on the same ring the medals
// ride (the one wrap math, slotOffset): the pages glide with the wheel and
// settle exactly on the open section — the middle page is the open one, so
// no entry nudge exists anymore (the old from-left/from-right 220 ms slide
// and its stuck-offset race are gone with it). Each page keeps its own
// scroll and resets it the moment it becomes the open one (the mockup's
// «a change of section resets the scroll»), and the map section lives on
// its page like the rest. A page that is not the open one takes no touches
// and stays out of the screen reader's way.
import { useEffect, useRef, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import CheckIcon from "lucide-react-native/icons/check";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";

import { ABOUT_CITY_LINK_URLS, type AboutCityLinkKey, type AboutCitySectionId } from "./about-city-content";
import { AboutCitySection, type AboutCitySectionContext } from "./about-city-sections";
import { Remark, SubHeading } from "./about-city-parts";
import { CanonIcon } from "./canon-icon";
import { slotOffset } from "./about-city-wheel";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { useThemeStyles } from "./theme";

export type AboutCityPagesContext = Omit<AboutCitySectionContext, "styles">;

// One section page: the body rides the wheel's position through `pos` (px
// along the ring), so the page sits where its medal stands — the open page
// exactly in the middle.
function AboutCityPage({ index, id, links, pos, slot, ring, width, active, ctx, failedLink }: {
  index: number;
  id: AboutCitySectionId;
  links: readonly AboutCityLinkKey[];
  pos: SharedValue<number>;
  slot: number;
  ring: number;
  width: number;
  active: boolean;
  ctx: AboutCityPagesContext;
  failedLink: string | null;
}): ReactNode {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const scrollRef = useRef<ScrollView>(null);
  // A change of section resets the scroll (the mockup's rule): the page
  // resets itself the moment it becomes the open one.
  useEffect(() => {
    if (active) scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [active]);
  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (slotOffset(index, pos.value, slot, ring) / slot) * width }],
  }), [index, pos, slot, ring, width]);
  const t = ctx.t;
  // The failed-open notice stays with the row that failed: the page shows
  // the address while its own link is the one the device could not open.
  const failedHere = failedLink !== null && links.some((key) => ABOUT_CITY_LINK_URLS[key] === failedLink)
    ? failedLink
    : null;

  return (
    <Animated.View
      style={[styles.page, { width }, pageStyle]}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      pointerEvents={active ? "auto" : "none"}
      testID={`about-page-${id}`}
    >
      <ScrollView contentContainerStyle={styles.content} ref={scrollRef} style={styles.scroll} testID={`scroll-about-${id}`}>
        <ScaledText accessibilityRole="header" style={styles.head}>{t(`head.${id}`)}</ScaledText>
        <View style={styles.checkedRow}>
          <CanonIcon glyph={CheckIcon} label={t("verified")} size={14} color={tokens.colorAccent} />
          <ScaledText style={[styles.verified, { marginTop: 0 }]}>{t("verified")}</ScaledText>
        </View>
        <AboutCitySection id={id} ctx={ctx} />
        {links.length > 0 ? (
          <View style={styles.sources}>
            <SubHeading>{t("sources.title")}</SubHeading>
            <ScaledText style={styles.verified}>{t("sources.note")}</ScaledText>
            <View style={styles.stack}>
              {links.map((linkKey) => {
                const label = t(`links.${linkKey}`);
                return (
                  <PressableSurface
                    accessibilityRole="link"
                    accessibilityLabel={label}
                    key={linkKey}
                    onPress={() => ctx.openLink(ABOUT_CITY_LINK_URLS[linkKey])}
                    style={[styles.card, styles.linkRow]}
                    testID={`link-about-${linkKey}`}
                  >
                    <ScaledText style={styles.linkLabel}>{label}</ScaledText>
                    <CanonIcon glyph={ExternalLinkIcon} label={label} color={tokens.colorAccent} size={18} />
                  </PressableSurface>
                );
              })}
            </View>
            {failedHere ? <Remark tone="error" text={t("link.failed", { url: failedHere })} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

// The strip of the five section pages behind the wheel. The open section
// (`activeId`) is the page the reader sees; the others ride hidden along
// the ring and take the stage as the wheel turns.
export function AboutCityPages({ sections, pos, slot, ring, width, activeId, ctx, failedLink }: {
  sections: readonly { id: AboutCitySectionId; links: readonly AboutCityLinkKey[] }[];
  pos: SharedValue<number>;
  slot: number;
  ring: number;
  width: number;
  activeId: AboutCitySectionId;
  ctx: AboutCityPagesContext;
  failedLink: string | null;
}): ReactNode {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return (
    <View style={styles.strip}>
      {sections.map((section, index) => (
        <AboutCityPage
          key={section.id}
          index={index}
          id={section.id}
          links={section.links}
          pos={pos}
          slot={slot}
          ring={ring}
          width={width}
          active={section.id === activeId}
          ctx={ctx}
          failedLink={failedLink}
        />
      ))}
    </View>
  );
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  strip: {
    flex: 1,
    overflow: "hidden",
  },
  page: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  scroll: { flex: 1 },
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
