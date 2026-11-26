// G07.01 (issue #281) — the Nearby (Побач) surface: the city's discovery
// offers in the two canon views (G06.08 screens.md «Побач», P02 in 15) —
// proximity with an allowed position, the manual review list without one.
// State rendering only: every decision about what exists lives in the
// controllers (19 §4.2), no audio path exists here at all (R04 — a radius
// entry and a card tap start nothing, the render suite fails if one is
// wired). The live map uses the shared Run tile source. Only published
// guide preview coordinates become markers; no place coordinates are invented.
import { Link, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapPinIcon from "lucide-react-native/icons/map-pin";
import RouteIcon from "lucide-react-native/icons/route";

import {
  nearbyOrder,
  nearbyStrings,
  useNearbySurface,
  type NearbyLocationView,
  type NearbyOfferFacts,
} from "../controllers/nearby/nearbySurfaceController";
import { useServices, useUiLocale } from "./_layout";
import { BackButton } from "../components/back-button";
import { CanonIcon } from "../components/canon-icon";
import { AccessBadge, offerShownInTextLocale, StateBanner } from "../components/guide-card";
import { GuideHintMount } from "../components/GuideHintCard";
import { LoadingIndicator } from "../components/loading-indicator";
import { PressableSurface } from "../components/pressable-surface";
import { ScaledText } from "../components/scaled-text";
import { uiStrings } from "../components/ui-strings";
import { darkTokens, tokens, type ThemeTokens } from "../components/design-tokens";
import { useThemeStyles } from "../components/theme";
import { ScreenSurface } from "../components/screen-surface";
import { NearbyNativeMap } from "../components/nearby-native-map";

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  screen: { backgroundColor: palette.colorPaper },
  title: {
    color: palette.colorInk,
    fontSize: palette.fontTitleSize,
    fontWeight: palette.fontWeightStrong,
    marginBottom: palette.spaceS,
  },
  modeHeader: {
    color: palette.colorInk,
    fontSize: palette.fontBaseSize,
    fontWeight: palette.fontWeightStrong,
    marginBottom: palette.spaceS,
  },
  locationSlot: { minHeight: palette.fontBaseSize * 3, marginBottom: palette.spaceS },
  note: {
    color: palette.colorMuted,
    fontSize: palette.fontBaseSize,
  },
  card: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: palette.radiusBase,
    borderWidth: 1,
    padding: palette.spaceM,
    marginBottom: palette.spaceM,
  },
  cardTitle: {
    color: palette.colorInk,
    fontSize: palette.fontBaseSize,
    fontWeight: palette.fontWeightStrong,
    marginBottom: palette.spaceS,
  },
  cardSummary: {
    color: palette.colorMuted,
    fontSize: palette.fontBaseSize,
    marginBottom: palette.spaceS,
  },
  cardMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: palette.spaceS,
  },
  facts: {
    color: palette.colorMuted,
    fontSize: palette.fontBaseSize,
    marginTop: palette.spaceS,
  },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);

// The card's facts line: the availability split (L01: text without audio
// never promises audio) and the authored duration range — every figure
// copied from the published offer, nothing invented; an empty list renders
// the honest «—», never a dangling label.
function cardFacts(offer: NearbyOfferFacts, strings: ReturnType<typeof nearbyStrings>): string {
  const fmt = (label: string, locales: readonly string[]): string =>
    `${label}: ${locales.length > 0 ? locales.join(", ") : "—"}`;
  const locales = `${fmt(strings.textLabel, offer.text_locales)}; ${fmt(strings.audioLabel, offer.audio_locales)}`;
  if (offer.estimated_duration !== null) {
    return `${locales}\n~${offer.estimated_duration.min_minutes}—${offer.estimated_duration.max_minutes} ${strings.durationUnit}`;
  }
  return locales;
}

function NearbyCard({
  offer,
  strings,
  locale,
}: {
  offer: NearbyOfferFacts;
  strings: ReturnType<typeof nearbyStrings>;
  locale: string;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const title = offer.title ?? offer.route_id ?? offer.place_id ?? offer.offer_id;
  // G07.01 #809 device pass: the spoken label localizes the access word —
  // the raw access token ('free') leaked into the screen-reader label while
  // the visible badge said «Бясплатна».
  const label = `${title}, ${uiStrings(locale).access[offer.access]}`;
  // UX 09 (issue #434): the offer kind is readable at a glance — a route
  // marker names the guide (a multi-stop walk), map-pin names the one place.
  // The type word rides the marker element for the screen reader (canon §9);
  // the glyph itself stays decoration.
  const TypeGlyph = offer.kind === "guide" ? RouteIcon : MapPinIcon;
  const typeLabel = offer.kind === "guide" ? strings.guideLabel : strings.placeLabel;
  const inner = (
    <>
      <ScaledText style={styles.cardTitle}>{title}</ScaledText>
      {offer.summary ? <ScaledText style={styles.cardSummary}>{offer.summary}</ScaledText> : null}
      <View style={styles.cardMeta}>
        <AccessBadge access={offer.access} locale={locale} />
        <CanonIcon glyph={TypeGlyph} label={typeLabel} testID={`nearby-type-${offer.kind}`} />
      </View>
      <ScaledText style={styles.facts}>{cardFacts(offer, strings)}</ScaledText>
    </>
  );
  // Guide offers lead to the guide preview, place offers to the place detail
  // (G07.02 — Journey 3: «месца або Moment → прэв'ю»); the tap starts no
  // audio in either case (criterion 3 of G07.01, R04 — the teaser sounds
  // only through the detail's explicit Play).
  if (offer.kind === "guide" && offer.route_id !== null) {
    return (
      <Link href={`/route/${offer.route_id}`} asChild>
        <PressableSurface
          style={styles.card}
          testID={`nearby-card-${offer.offer_id}`}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={strings.cardHint}
        >
          {inner}
        </PressableSurface>
      </Link>
    );
  }
  if (offer.kind === "place" && offer.place_id !== null) {
    return (
      <Link href={`/place/${offer.place_id}`} asChild>
        <PressableSurface
          style={styles.card}
          testID={`nearby-card-${offer.offer_id}`}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={strings.cardHint}
        >
          {inner}
        </PressableSurface>
      </Link>
    );
  }
  return (
    // G06.05 (AC1): an offer without a published target is text, not a
    // button — no tappable-looking hint on a card that does nothing.
    <View style={styles.card} testID={`nearby-card-${offer.offer_id}`} accessibilityLabel={label}>
      {inner}
    </View>
  );
}

// The location note under the mode header: the named state of the one
// subscription (11 §7 honest degradation — never mascot-only).
function locationNote(view: NearbyLocationView, strings: ReturnType<typeof nearbyStrings>): string | null {
  if (view.state === "absent") return null;
  if (view.state === "denied") return strings.noteDenied;
  if (view.state === "held-by-walk") return strings.noteHeldByWalk;
  if (view.note === null) return null;
  return view.note === "acquiring" ? strings.noteAcquiring : strings.noteUnstable;
}

export default function Map() {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const services = useServices();
  // One binding per open: the factory resolves the offers store and the
  // location guard (the composition root owns both — 19 §4.2).
  const binding = useMemo(() => services.nearby?.create(), [services.nearby]);
  const { surface, locationView, position } = useNearbySurface(binding);
  // The chrome words read the UI-locale switch (the G14.04.d store,
  // the same useUiLocale subscription the catalog row and My KUDY hold) — the
  // binding's locale is the content-display preference (be first), so without
  // the catalog service the chrome stuck to Belarusian. The switch re-renders
  // the open surface in place; the binding is not recreated, so no second
  // GPS subscription is armed.
  const uiLocale = useUiLocale();
  const strings = nearbyStrings(uiLocale);
  // G07.05 — the R07 hint card of the open city surface: the one app-wide
  // hint controller's state, scrollable below the back button; the tap opens
  // the preview the usual way (no Start, no audio).
  const router = useRouter();
  const offers =
    surface && (surface.kind === "ready" || surface.kind === "offline") ? surface.offers : [];
  // G21.17 (issue #551): the Nearby list shows only the offers whose
  // published text covers the selected UI language (the one projection rule
  // of components/guide-card).
  const list = nearbyOrder(
    offers.filter((offer) => offerShownInTextLocale(offer.text_locales, uiLocale)),
    locationView,
  );
  const note = locationNote(locationView, strings);
  // UX 02 (screens-and-transitions.md — Агульныя правілы пераходаў): the top inset clears the status bar and notch with
  // the native header off (AC4). APR-05 (android-play-readiness/README.md — APR-05): the bottom inset clears the navigation bar.
  const insets = useSafeAreaInsets();
  return (
    <ScreenSurface
      style={[styles.screen, {
        flex: 1,
        padding: tokens.spaceL,
        paddingTop: insets.top + tokens.spaceL,
        paddingBottom: insets.bottom + tokens.spaceL,
      }]}
      testID="screen-Map"
    >
      {/* UX 02 (screens-and-transitions.md — Агульныя правілы пераходаў): the Nearby surface gains its one back element —
          it never had one (AC2); the label is hosted by the shared
          component's <Text> (the bare-string Pressable class guard). */}
      <BackButton label={uiStrings(uiLocale).back} testID="btn-map-back" />
      {/* Hints, map and offers scroll together. Large text and small screens
          cannot leave the offer list below fixed map/hint content. */}
      <ScrollView style={{ flex: 1 }} testID="scroll-nearby">
        <GuideHintMount
          binding={services.hints}
          locale={uiLocale}
          onOpen={(routeId) => router.push("/route/" + routeId)}
        />
        <ScaledText style={styles.title}>{strings.title}</ScaledText>
        <NearbyNativeMap
          offers={list}
          position={locationView.state === "proximity" && locationView.note === null ? position : null}
          onOpenGuide={(routeId) => router.push("/route/" + routeId)}
          guideLabel={strings.guideLabel}
          recenterLabel={strings.proximityHeader}
          retryLabel={uiStrings(uiLocale).retry}
        />
        {surface === null ? (
          <View testID="nearby-error">
            <StateBanner tone="notice" reason={strings.unavailable} testID="nearby-unavailable-notice" />
          </View>
        ) : surface.kind === "loading" ? (
          <LoadingIndicator testID="nearby-message" text={strings.loading} />
        ) : surface.kind === "error" ? (
          <View testID="nearby-error">
            <StateBanner tone="error" reason={strings.unavailable} detail={surface.reason} testID="nearby-unavailable-notice" />
          </View>
        ) : (
          <>
            <ScaledText style={styles.modeHeader} testID="nearby-mode">
              {locationView.state === "proximity" ? strings.proximityHeader : strings.reviewHeader}
            </ScaledText>
            <View style={styles.locationSlot} testID="nearby-location-slot">
              {note ? (
                <ScaledText style={styles.note} testID="nearby-location-note">
                  {note}
                </ScaledText>
              ) : null}
            </View>
            {surface.kind === "ready" && surface.degraded !== null ? (
              <StateBanner tone="notice" reason={strings.indexDegraded} testID="nearby-degraded" />
            ) : null}
            {list.length === 0 ? (
              <StateBanner
                tone="notice"
                reason={offers.length === 0 ? strings.empty : uiStrings(uiLocale).textLocaleEmpty}
                testID="nearby-message"
              />
            ) : (
              list.map((offer) => (
                <NearbyCard key={offer.offer_id} offer={offer} strings={strings} locale={uiLocale} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenSurface>
  );
}
