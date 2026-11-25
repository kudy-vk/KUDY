// #256 — the compact food/payment guide, separate from the other About City
// pages. Only useful permanent facts render offline; changing hours, rates and
// restaurant availability live behind the explicit links.
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import CreditCardIcon from "lucide-react-native/icons/credit-card";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";
import InfoIcon from "lucide-react-native/icons/info";
import LandmarkIcon from "lucide-react-native/icons/landmark";
import MapPinIcon from "lucide-react-native/icons/map-pin";
import MoonIcon from "lucide-react-native/icons/moon";
import SmartphoneIcon from "lucide-react-native/icons/smartphone";
import StoreIcon from "lucide-react-native/icons/store";
import Svg, { Path } from "react-native-svg";

import { ABOUT_CITY_FOOD_LINKS, type AboutCityText } from "./about-city-content";
import { Fold } from "./about-city-parts";
import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import { useThemeStyles } from "./theme";
// The food body needs only the shared fold state and link handler; keeping
// its contract narrow also lets it render/test without booting the app.
type FoodContext = {
  t: AboutCityText;
  ui: { folds: Record<string, boolean> };
  toggleFold: (group: readonly string[], id: string, open: boolean) => void;
  openLink: (url: string) => void;
};
import { FOOD_BRAND_PATHS } from "./about-city-food-brands";

type FoodLink = keyof typeof ABOUT_CITY_FOOD_LINKS;
type FoodStyles = ReturnType<typeof createStyles>;
const FOOD_FOLD_IDS = ["food-payment", "food-cash", "food-late", "food-delivery"] as const;

function BrandSign({ brand, title, styles }: {
  brand: string;
  title: string;
  styles: FoodStyles;
}) {
  const entry = FOOD_BRAND_PATHS[brand as keyof typeof FOOD_BRAND_PATHS];
  if (entry) {
    return (
      <Svg width={42} height={42} viewBox="0 0 24 24" accessible={false}>
        <Path d={entry.path} fill={entry.color} />
      </Svg>
    );
  }
  if (brand === "map") {
    return <CanonIcon glyph={MapPinIcon} label={title} size={30} color={tokens.colorAccent} />;
  }
  // An honest text mark is preferable to inventing a service's official logo.
  return <ScaledText style={[styles.wordmark, brand === "wolt" ? styles.wolt : brand === "pyszne" ? styles.pyszne : styles.bolt]}>{title}</ScaledText>;
}

function BrandTile({ id, title, logo, note, styles, open }: {
  id: FoodLink;
  title: string;
  logo: string;
  note?: string;
  styles: FoodStyles;
  open: (url: string) => void;
}) {
  const markOnly = logo === "pyszne" || logo === "wolt" || logo === "bolt";
  const accessibilityLabel = [title, note].filter(Boolean).join(", ");
  return (
    <PressableSurface
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      testID={`about-food-link-${id}`}
      style={styles.tile}
      onPress={() => open(ABOUT_CITY_FOOD_LINKS[id])}
    >
      <View style={styles.brandIcon}>
        <BrandSign brand={logo} title={title} styles={styles} />
      </View>
      {markOnly ? null : <ScaledText style={styles.tileName}>{title}</ScaledText>}
      {note ? <ScaledText style={styles.tileNote}>{note}</ScaledText> : null}
    </PressableSurface>
  );
}

function TileGrid({ children, styles }: { children: ReactNode; styles: FoodStyles }) {
  return <View style={styles.tileGrid}>{children}</View>;
}

function FoodHint({ label, children, styles, id }: {
  id: string;
  label: string;
  children: ReactNode;
  styles: FoodStyles;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.hint} testID={`about-food-hint-${id}`}>
      <PressableSurface
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        testID={`about-food-hint-trigger-${id}`}
        style={styles.hintButton}
        onPress={() => setOpen(!open)}
      >
        <CanonIcon glyph={InfoIcon} label={label} size={17} color={tokens.colorAccent} />
        <ScaledText style={styles.hintText}>{label}</ScaledText>
      </PressableSurface>
      {open ? <View style={styles.hintBody}>{children}</View> : null}
    </View>
  );
}

function ShortLink({ id, title, styles, open }: {
  id: FoodLink;
  title: string;
  styles: FoodStyles;
  open: (url: string) => void;
}) {
  return (
    <PressableSurface
      accessibilityRole="link"
      accessibilityLabel={title}
      testID={`about-food-link-${id}`}
      style={styles.shortLink}
      onPress={() => open(ABOUT_CITY_FOOD_LINKS[id])}
    >
      <ScaledText style={styles.actionText}>{title}</ScaledText>
      <CanonIcon glyph={ExternalLinkIcon} label={title} size={16} color={tokens.colorAccent} />
    </PressableSurface>
  );
}

function Fact({ label, glyph, styles }: { label: string; glyph: CanonGlyph; styles: FoodStyles }) {
  return (
    <View style={styles.fact}>
      <CanonIcon glyph={glyph} label={label} size={21} color={tokens.colorAccent} />
      <ScaledText style={styles.factText}>{label}</ScaledText>
    </View>
  );
}

export function AboutCityFood({ ctx }: { ctx: FoodContext }) {
  const { t, ui, toggleFold, openLink } = ctx;
  const styles = useThemeStyles(lightStyles, darkStyles);
  const fold = (id: string, glyph: CanonGlyph, title: string, meta: string, body: ReactNode) => (
    <Fold
      key={id}
      id={id}
      open={Boolean(ui.folds[id])}
      onToggle={(key, open) => toggleFold(FOOD_FOLD_IDS, key, open)}
      lead={<CanonIcon glyph={glyph} label={title} size={22} color={tokens.colorAccent} />}
      title={title}
      meta={meta}
      body={body}
    />
  );
  const label = (key: string) => t(`food.v2.${key}`);
  const tile = (id: FoodLink, title: string, logo: string, note?: string) =>
    <BrandTile key={id} id={id} title={title} logo={logo} note={note} styles={styles} open={openLink} />;
  const link = (id: FoodLink, key: string) =>
    <ShortLink key={id} id={id} title={label(key)} styles={styles} open={openLink} />;
  const hint = (id: string, key: string, body: ReactNode) =>
    <FoodHint id={id} key={id} label={label(key)} styles={styles}>{body}</FoodHint>;
  return (
    <View style={styles.section} testID="about-food-v2">
      {fold("food-payment", CreditCardIcon, label("payTitle"), label("payMeta"),
        <View style={styles.body}>
          <View style={styles.facts}>
            <Fact label={label("pln")} glyph={LandmarkIcon} styles={styles} />
            <Fact label={label("card")} glyph={CreditCardIcon} styles={styles} />
            <Fact label={t("food.blik.title")} glyph={SmartphoneIcon} styles={styles} />
          </View>
          {hint("dcc", "dccTitle", <View style={styles.body}>
            <ScaledText style={styles.detailText}>{label("dccText")}</ScaledText>
            {link("visaDcc", "dccSource")}
          </View>)}
        </View>)}
      {fold("food-cash", LandmarkIcon, label("cashTitle"), label("cashMeta"),
        <View style={styles.body}>
          <ScaledText style={styles.detailText}>{label("cashTip")}</ScaledText>
          <View style={styles.linkRow}>
            {link("ratesEur", "rateCompare")}
            {link("nbpRates", "nbpRate")}
          </View>
          {hint("offices", "offices", <TileGrid styles={styles}>
            {tile("mapPromes", "Forum · Promes", "map")}
            {tile("mapManhattan", "Wrzeszcz · Manhattan", "map")}
            {tile("mapExchange", label("centreExchange"), "map")}
          </TileGrid>)}
          {hint("atm", "atmTitle", <ScaledText style={styles.detailText}>{label("atmText")}</ScaledText>)}
        </View>)}
      {fold("food-late", MoonIcon, label("lateTitle"), label("lateMeta"),
        <View style={styles.body}>
          <TileGrid styles={styles}>
            {tile("mapMcd", "McDonald’s", "mcdonalds", `${label("station")}\n${label("mcdHours")}`)}
            {tile("mapKfc", "KFC", "kfc", `${label("station")}\n${label("kfcHours")}`)}
            {tile("mapLate", label("otherPlaces"), "map")}
          </TileGrid>
          {hint("kitchen", "kitchenTitle", <ScaledText style={styles.detailText}>{label("kitchenText")}</ScaledText>)}
        </View>)}
      {fold("food-delivery", StoreIcon, label("deliveryTitle"), label("deliveryMeta"),
        <TileGrid styles={styles}>
          {tile("pyszne", "Pyszne.pl", "pyszne")}
          {tile("wolt", "Wolt", "wolt")}
          {tile("glovo", "Glovo", "glovo")}
          {tile("uber", "Uber Eats", "ubereats")}
          {tile("bolt", "Bolt Food", "bolt")}
        </TileGrid>)}
    </View>
  );
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  section: { gap: 8 },
  body: { gap: 9 },
  facts: { flexDirection: "row", justifyContent: "space-around", gap: 5 },
  fact: { alignItems: "center", flex: 1, gap: 6, minWidth: 0, paddingVertical: 6 },
  factText: { color: palette.colorInk, fontSize: 12, lineHeight: 16, textAlign: "center" },
  detailText: { color: palette.colorInk, fontSize: 14, lineHeight: 20 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 14 },
  shortLink: { flexDirection: "row", alignItems: "center", minHeight: 48, gap: 4 },
  actionText: { color: palette.colorAccent, fontSize: 13, fontWeight: "600" },
  hint: { gap: 3 },
  hintButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 48, gap: 8 },
  hintText: { color: palette.colorAccent, fontSize: 13 },
  hintBody: { gap: 8, paddingBottom: 6, paddingHorizontal: 6 },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  tile: {
    width: "31.6%",
    minHeight: 106,
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radiusBase,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    paddingVertical: 9,
    gap: 5,
  },
  brandIcon: { height: 44, alignItems: "center", justifyContent: "center", width: "100%" },
  wordmark: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  wolt: { color: "#0099c7" },
  pyszne: { color: "#FF8000", fontSize: 15 },
  bolt: { color: "#20a85b" },
  tileName: { color: palette.colorInk, fontSize: 12, fontWeight: "600", textAlign: "center" },
  tileNote: { color: palette.colorMuted, fontSize: 11, lineHeight: 15, textAlign: "center" },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
