import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useServices, useUiLocale } from "./_layout";
import { HomeMapMenu, cityMenuConfig } from "../components/city-map-menu";
import { tokens } from "../components/design-tokens";
import { ScaledText } from "../components/scaled-text";
import { useThemeTokens } from "../components/theme";
import { WalkButton } from "../components/walk-button";
import { uiStrings } from "../components/ui-strings";

export default function Menu() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const palette = useThemeTokens();
  const locale = useUiLocale();
  const services = useServices();
  const router = useRouter();
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => { setVisit(value => value + 1); }, []));
  const mapWidth = Math.max(1, Math.min(430, width - insets.left - insets.right - tokens.spaceL * 2));
  return (
    <View testID="screen-Menu" style={[styles.screen, { backgroundColor: palette.colorPaper, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={styles.header}>
        <ScaledText accessibilityRole="header" style={[styles.brand, { color: palette.colorAccent }]}>{uiStrings(locale).myKudy}</ScaledText>
        <WalkButton walk={services.walk} locale={locale} iconOnly />
      </View>
      <ScrollView contentContainerStyle={styles.content} testID="scroll-menu">
        <HomeMapMenu key={`${cityMenuConfig.mapVersion}:${visit}`} width={mapWidth} locale={locale} onSelect={id => {
          const entry = cityMenuConfig.items.find(item => item.id === id);
          if (entry?.destination) router.push(entry.destination);
        }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: tokens.spaceL, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontFamily: tokens.fontFamilyUiStrong, fontSize: tokens.fontTitleSize },
  content: { alignItems: "center", paddingHorizontal: tokens.spaceL, paddingBottom: tokens.spaceL },
});
