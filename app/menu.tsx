import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useServices, useUiLocale } from "./_layout";
import { AdContainer } from "../components/ad-container";
import { CityPanorama } from "../components/city-panorama";
import { HomeMapMenu, cityMenuConfig } from "../components/city-map-menu";
import { tokens } from "../components/design-tokens";
import { ScaledText } from "../components/scaled-text";
import { useScreenStyles } from "../components/screen-styles";
import { useThemeTokens } from "../components/theme";
import { WalkButton } from "../components/walk-button";
import { uiStrings } from "../components/ui-strings";
import { ScreenSurface } from "../components/screen-surface";

// Issue #216 (M11) — the main screen per the approved mocket menu.html:
// the header (brand, city name on the right, the walk button), the «Куды
// сёння?» display heading, the map-parts block ending at 5/8 of the screen
// height (measured from the top edge together with the status bar, per the
// README verdict), the engraved panorama resting on the bottom edge of the
// free space, and the ad zone always last (M6). No scrolling: the map fits
// its block — the square 1600×1600 drawing area is sized to the smaller of
// the canvas sides, the letterbox stays transparent like the mockup's dark
// phone. The screen never makes network requests and renders no dragon.
// M1/README verdict, pinned by a test: the block height is 5/8 of the FULL
// screen height minus the status-bar inset.
export function menuTopBlockHeight(height: number, statusInset: number): number {
  return height * 5 / 8 - statusInset;
}

export default function Menu() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const palette = useThemeTokens();
  const themedStyles = useScreenStyles();
  const locale = useUiLocale();
  const services = useServices();
  const router = useRouter();
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => { setVisit(value => value + 1); }, []));
  // The mockup measures 5/8 from the top edge: block height = 5/8·h − status.
  const topBlockHeight = menuTopBlockHeight(height, insets.top);
  const canvasWidth = Math.max(1, Math.min(430, width - insets.left - insets.right));
  // Initial canvas estimate (header + heading extents), corrected by onLayout.
  const headExtent = tokens.fontTitleSize * 1.45;
  const titleExtent = tokens.fontMenuTitleSize * 1.2 + tokens.spaceS;
  const [canvasHeight, setCanvasHeight] = useState(() =>
    Math.max(120, topBlockHeight - headExtent - titleExtent));
  const mapWidth = Math.max(1, Math.floor(Math.min(canvasWidth, canvasHeight)));
  return (
    <ScreenSurface testID="screen-Menu" style={[styles.screen, { backgroundColor: palette.colorPaper, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={[styles.top, { height: topBlockHeight }]}>
        <View style={styles.header}>
          <ScaledText accessibilityRole="header" style={[styles.brand, { color: palette.colorAccent }]}>{uiStrings(locale).myKudy}</ScaledText>
          <View style={styles.headRight}>
            <ScaledText style={[styles.city, { color: palette.colorMuted }]}>{uiStrings(locale).cityName}</ScaledText>
            <WalkButton walk={services.walk} locale={locale} iconOnly />
          </View>
        </View>
        <ScaledText accessibilityRole="header" style={themedStyles.menuDisplayTitle}>{uiStrings(locale).whereToToday}</ScaledText>
        <View
          testID="menu-map-block"
          style={styles.canvas}
          onLayout={event => {
            const next = Math.floor(event.nativeEvent.layout.height);
            if (Math.abs(next - canvasHeight) > 1) setCanvasHeight(next);
          }}
        >
          <HomeMapMenu key={`${cityMenuConfig.mapVersion}:${visit}`} width={mapWidth} locale={locale} onSelect={id => {
            const entry = cityMenuConfig.items.find(item => item.id === id);
            if (entry?.destination) router.push(entry.destination);
          }} />
        </View>
      </View>
      <View style={styles.rest} testID="menu-rest">
        <CityPanorama testID="menu-panorama" />
      </View>
      <AdContainer loaded={false} testID="menu-ad" />
    </ScreenSurface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { minHeight: 0 },
  // Mockup .menu-head: min-height 48, 16/16 padding; .brand 22 semibold,
  // −0.02em; .city 13 muted on the right before the walk button.
  header: { flexDirection: "row", alignItems: "center", minHeight: 48, paddingLeft: tokens.spaceL, paddingRight: tokens.spaceM, gap: tokens.spaceS },
  headRight: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: tokens.spaceS },
  brand: { fontFamily: tokens.fontFamilyUiStrong, fontSize: 22, letterSpacing: -0.4 },
  city: { fontSize: 13 },
  canvas: { flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center" },
  rest: { flex: 1, minHeight: 0, justifyContent: "flex-end", overflow: "hidden" },
});
