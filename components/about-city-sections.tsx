// Issue #252 — the four «Пра горад» section bodies, the typed port of the
// mockup's about.mjs builders (docs/design/production/, #202 approved
// 2026-11-12). Each section is facts, not paragraphs: steps, rides with
// their numbers, folds, switches. The visitor's choices inside
// the sections ride `ui` and survive a section switch; the fold groups keep
// one fold open (the mockup's folds() rule). The map section is the #303
// illustrated Tricity map (components/about-city-map.tsx).
import { Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import HouseIcon from "lucide-react-native/icons/house";
import { AirportDirection } from "./about-city-direction";
import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";
import BusIcon from "lucide-react-native/icons/bus";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";
import RouteIcon from "lucide-react-native/icons/route";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";

import {
  ABOUT_CITY_APPS,
  ABOUT_CITY_FACT_ICONS,
  ABOUT_CITY_RIDES,
  aboutCityHasText,
  ABOUT_CITY_LINK_URLS,
  type AboutCitySectionId,
  type AboutCityText,
} from "./about-city-content";
import { DetailRows, Facts, Fold, LineBadge, Remark, Steps, SubHeading } from "./about-city-parts";
import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import type { AboutCityStrings } from "../contracts/ui-message-types";
import { useThemeStyles, useThemeTokens } from "./theme";
import { ABOUT_CITY_ATLAS_INITIAL, AboutCityMap, type AboutCityAtlasState } from "./about-city-map";
import { AboutCityFood } from "./about-city-food";

// What the visitor chose and opened inside the sections; it outlives a
// section switch. The map's choices ride `atlas` (the mockup's ui.atlas).
export type AboutCityUiState = {
  direction: "from" | "to";
  folds: Record<string, boolean>;
  atlas: AboutCityAtlasState;
};

export const ABOUT_CITY_INITIAL_UI: AboutCityUiState = {
  direction: "from",
  // The first transport fold starts open, as the mockup says (open: true).
  folds: { "mode-ztm": true },
  atlas: ABOUT_CITY_ATLAS_INITIAL,
};

export type AboutCitySectionStyles = ReturnType<typeof createStyles>;

// What the section builders receive: the screen owns the words, the choices
// and the fold memory; the section resolver adds the themed styles (the
// builders are plain functions, not components — the one hook call lives in
// AboutCitySection). `setUi` also takes an updater over the previous state —
// the map's camera commits ride it, so a stale closure never wipes the
// visitor's newer pick. `onOpenSection` turns the wheel to a section (the
// map's airport card uses it, the mockup's openSection). `openLink` hands an
// address to the system (the transport section's app rows, the mockup's
// say-on-click) and keeps the failed-open notice on the screen.
export type AboutCitySectionContext = {
  strings: AboutCityStrings;
  t: AboutCityText;
  ui: AboutCityUiState;
  setUi: (patch: Partial<AboutCityUiState> | ((prev: AboutCityUiState) => Partial<AboutCityUiState>)) => void;
  toggleFold: (group: readonly string[], id: string, open: boolean) => void;
  onOpenSection: (id: AboutCitySectionId) => void;
  openLink: (url: string) => void;
  styles: AboutCitySectionStyles;
  palette: ThemeTokens;
};

const AIRPORT_RIDE_IDS = ABOUT_CITY_RIDES.map((ride) => `ride-${ride.id}`);
const TRANSPORT_MODE_IDS = ["mode-ztm", "mode-skm", "mode-rail"];

function airport(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, setUi, toggleFold, styles } = ctx;
  const way = ui.direction;
  const stepIds = [1, 2, 3].map((n) => `airport-${way}-step-${n}`);
  const rideIds = AIRPORT_RIDE_IDS.map((id) => `${way}-${id}`);
  const step = (n: number, title: string, meta: string, body: ReactNode) => [title, <Fold key={stepIds[n]} id={stepIds[n]} open={Boolean(ui.folds[stepIds[n]])} title={title} meta={meta} body={body} onToggle={(id, open) => toggleFold(stepIds, id, open)} />] as const;
  const rides = (
    <View style={styles.stack}>
      {ABOUT_CITY_RIDES.map((ride) => (
        <Fold
          key={ride.id}
          id={`${way}-ride-${ride.id}`}
          open={Boolean(ui.folds[`${way}-ride-${ride.id}`])}
          onToggle={(id, open) => toggleFold(rideIds, id, open)}
          lead={<LineBadge kind={ride.kind} line={ride.line} kindName={t(`sr.${ride.kind}`)} />}
          title={t(`ride.${ride.id}.${way}`)}
          meta={<Facts items={ride[way].facts.map(([sign, key, params]) => [ABOUT_CITY_FACT_ICONS[sign], t(key, params)])} />}
          body={<DetailRows rows={ride[way].rows.map(([label, value]) => [t(label), aboutCityHasText(ctx.strings, value) ? t(value) : value])} />}
        />
      ))}
    </View>
  );
  const ticket = (glyph: CanonGlyph, title: string, where: string) => (
    <View key={title} style={[styles.card, styles.ticket]}>
      <View style={styles.ticketHead}>
        <CanonIcon glyph={glyph} label={title} size={18} color={ctx.palette.colorAccent} />
        <ScaledText style={styles.ticketTitle}>{title}</ScaledText>
      </View>
      <ScaledText style={styles.note}>{where}</ScaledText>
    </View>
  );
  return (
    <>
      <AirportDirection value={way} onChange={(direction) => setUi({ direction })} t={t} />
      <Steps
        items={[
          step(0, t(`air.${way}.s1.title`),
            way === "from" ? "Port Lotniczy 01, 02 · PKM" : "Dworzec Główny 10 · Wrzeszcz",
            <Fragment key="s1">
              <ScaledText style={styles.text}>{t(`air.${way}.s1.text`)}</ScaledText>
              {way === "from" ? (
                <View style={styles.stack}>
                  <Facts items={[[ABOUT_CITY_FACT_ICONS["map-pin"], t("air.from.s1.stop01")]]} />
                  <Facts items={[[ABOUT_CITY_FACT_ICONS["map-pin"], t("air.from.s1.stop02")]]} />
                </View>
              ) : null}
            </Fragment>),
          step(1, t("air.s2.title"), ABOUT_CITY_RIDES.map((ride) => ride.line).join(" · "), rides),
          step(2, t("air.s3.title"), `${t("sr.bus")} ZTM · ${t("sr.train")} POLREGIO`,
            <View key="s3" style={styles.stack}>
              {ticket(BusIcon, t("air.ticket.bus.title"), t("air.ticket.bus.where"))}
              {ticket(TrainFrontIcon, t("air.ticket.train.title"), t("air.ticket.train.where"))}
            </View>),
        ]}
      />
    </>
  );
}

function transport(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, toggleFold, styles, openLink, palette } = ctx;
  const fold = (id: string, group: readonly string[], glyph: CanonGlyph, title: string, body: ReactNode, meta?: string) => (
    <Fold
      key={id}
      id={id}
      open={Boolean(ui.folds[id])}
      onToggle={(foldId, open) => toggleFold(group, foldId, open)}
      lead={<CanonIcon glyph={glyph} label={title} size={22} color={palette.colorAccent} />}
      title={title}
      meta={meta}
      body={body}
    />
  );
  // The ticket apps: the owner's verdict (issue #254, 2026-11-16) keeps the
  // fares, the ticket catalogue and the activation rules out of the guide —
  // they live in these apps and on their official pages. The section only
  // names what to ride and opens the three apps by their icons, in the
  // owner's order: jakdojade, FALA, KomPas.
  const appRow = (app: (typeof ABOUT_CITY_APPS)[number]) => {
    const title = t(`tr.buy.${app.key}.title`);
    const note = t(`tr.buy.${app.key}.text`);
    return (
      <PressableSurface
        accessibilityRole="link"
        accessibilityLabel={title}
        key={app.key}
        onPress={() => openLink(app.url)}
        style={[styles.card, styles.appRow]}
        testID={`about-app-${app.key}`}
      >
        <CanonIcon glyph={app.glyph} label={title} size={22} color={palette.colorAccent} />
        <View style={styles.appLabel}>
          <ScaledText style={styles.appTitle}>{title}</ScaledText>
          <ScaledText style={styles.appNote}>{note}</ScaledText>
        </View>
        <CanonIcon glyph={ExternalLinkIcon} label={title} color={palette.colorAccent} size={18} />
      </PressableSurface>
    );
  };
  return (
    <>
      <SubHeading>{t("tr.modes")}</SubHeading>
      <View style={styles.stack}>
        {fold("mode-ztm", TRANSPORT_MODE_IDS, TramFrontIcon, t("tr.ztm.title"), <ScaledText style={styles.text}>{t("tr.ztm.text")}</ScaledText>, t("tr.ztm.meta"))}
        {fold(
          "mode-skm",
          TRANSPORT_MODE_IDS,
          TrainFrontIcon,
          t("tr.skm.title"),
          <View style={styles.stack}>
            <ScaledText style={styles.text}>{t("tr.skm.text")}</ScaledText>
            <Remark tone="warn" text={t("tr.skm.warn")} />
          </View>,
          t("tr.skm.meta"),
        )}
        {fold("mode-rail", TRANSPORT_MODE_IDS, RouteIcon, t("tr.rail.title"), <ScaledText style={styles.text}>{t("tr.rail.text")}</ScaledText>, t("tr.rail.meta"))}
      </View>
      <SubHeading>{t("tr.residents")}</SubHeading>
      <ResidentCard ctx={ctx} />
      <SubHeading>{t("tr.buyLabel")}</SubHeading>
      <View style={styles.stack}>{ABOUT_CITY_APPS.map(appRow)}</View>
    </>
  );
}

// The illustrated Tricity map (issue #303, decisions M12–M13): the camera,
// the pick and the layers ride ui.atlas; the airport card turns the wheel
// back to the airport section. The map is light in both themes (DT-4).
const ATLAS_FOLD_IDS = ["atlas-list"] as const;

function city(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, setUi, toggleFold, onOpenSection } = ctx;
  return (
    <AboutCityMap
      t={t}
      lang={ctx.strings === ABOUT_CITY_STRINGS.be ? "be" : "en"}
      atlas={ui.atlas}
      // The patch merges into the previous atlas on the screen side: the
      // camera commits and the picks land from the live state, never from a
      // captured copy.
      setAtlas={(patch) => setUi((prev) => ({ atlas: { ...prev.atlas, ...patch } }))}
      foldOpen={Boolean(ui.folds["atlas-list"])}
      onToggleFold={(id, open) => toggleFold(ATLAS_FOLD_IDS, id, open)}
      onOpenSection={onOpenSection}
    />
  );
}

function food(ctx: AboutCitySectionContext): ReactNode {
  return <AboutCityFood ctx={ctx} />;
}

function OfficialCardLink({ ctx, kind, url }: {
  ctx: AboutCitySectionContext;
  kind: "card" | "resident";
  url: string;
}) {
  const { t, openLink, styles, palette } = ctx;
  const label = t(`${kind}.openOfficial`, { name: t(`${kind}.title`) });
  return (
    <PressableSurface accessibilityRole="link" accessibilityLabel={label} onPress={() => openLink(url)}
      style={styles.officialButton} testID={`official-${kind}`}>
      <CanonIcon glyph={ExternalLinkIcon} label={label} size={20} color={palette.colorAccent} />
    </PressableSurface>
  );
}

export function TouristCard({ context }: { context: Omit<AboutCitySectionContext, "styles" | "palette"> }) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  const ctx = { ...context, styles, palette };
  const { t, ui, toggleFold } = ctx;
  return (
    <View testID="about-tourist-card">
      <Fold id="tourist-card" open={Boolean(ui.folds["tourist-card"])}
        lead={<View style={styles.brandSymbol}><ScaledText style={styles.brandText} accessibilityLabel={t("card.brandAlt")}>{t("card.brandMark")}</ScaledText></View>}
        title={t("card.title")} body={<ScaledText style={styles.note}>{t("card.lead")}</ScaledText>}
        onToggle={(id, open) => toggleFold([id], id, open)}
        trailingAction={<OfficialCardLink ctx={ctx} kind="card" url={ABOUT_CITY_LINK_URLS.kartaTurysty} />} />
    </View>
  );
}

function ResidentCard({ ctx }: { ctx: AboutCitySectionContext }) {
  const { t, styles, palette } = ctx;
  return (
    <View style={[styles.card, styles.stack]} testID="about-resident-card">
      <View style={styles.briefRow}>
        <View style={[styles.ticketHead, styles.briefContent]}>
          <View style={styles.residentSymbol}><CanonIcon glyph={HouseIcon} label={t("resident.title")} size={24} color={palette.colorAccent} /></View>
          <ScaledText style={[styles.ticketTitle, styles.briefContent]}>{t("resident.title")}</ScaledText>
        </View>
        <OfficialCardLink ctx={ctx} kind="resident" url={ABOUT_CITY_LINK_URLS.jestemZGdanska} />
      </View>
      <ScaledText style={styles.note}>{t("resident.lead")}</ScaledText>
    </View>
  );
}

const BUILD: Record<AboutCitySectionId, (ctx: AboutCitySectionContext) => ReactNode> = { airport, transport, city, food };

// The open section under the wheel. `ui` keeps what the visitor chose.
export function AboutCitySection({ id, ctx }: {
  id: AboutCitySectionId;
  ctx: Omit<AboutCitySectionContext, "styles" | "palette">;
}): ReactNode {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const palette = useThemeTokens();
  return <>{BUILD[id]({ ...ctx, styles, palette })}</>;
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  stack: { gap: 8 },
  text: { color: palette.colorInk, fontSize: 16, lineHeight: 23 },
  note: { color: palette.colorMuted, fontSize: 13, lineHeight: 18 },
  // The transport section's app rows (#254): an icon, the app's name and a
  // one-line note; the row opens the app's page.
  appRow: { alignItems: "center", columnGap: 12, flexDirection: "row", minHeight: 56 },
  appLabel: { flex: 1, flexShrink: 1, gap: 2 },
  appTitle: { color: palette.colorInk, fontSize: 16, fontWeight: tokens.fontWeightStrong },
  appNote: { color: palette.colorMuted, fontSize: 12 },
  card: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  briefRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  briefContent: { flex: 1, minWidth: 0 },
  officialButton: { alignItems: "center", justifyContent: "center", marginTop: 8 },
  brandSymbol: { width: 46, height: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: palette.colorBadgePaid, borderColor: tokens.colorMedalRim, borderWidth: 1 },
  brandText: { color: palette.colorMedalInk, fontWeight: tokens.fontWeightStrong, fontSize: 15 },
  residentSymbol: { width: 46, height: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: palette.colorBadgeFree },
  ticket: { gap: 10 },
  ticketHead: { alignItems: "center", columnGap: 8, flexDirection: "row" },
  ticketTitle: { color: palette.colorInk, fontSize: 16, fontWeight: tokens.fontWeightStrong },
  tag: {
    backgroundColor: palette.colorBadgeMixed,
    borderRadius: tokens.radiusPill,
    color: palette.colorInk,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagFree: { backgroundColor: palette.colorBadgeFree, alignSelf: "flex-start" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    alignItems: "center",
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusPill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  chipSelected: { backgroundColor: palette.colorAccent, borderColor: palette.colorAccent },
  chipText: { color: palette.colorInk, fontSize: 13 },
  chipSelectedText: { color: palette.colorAccentInk },
  service: { gap: 6 },
  serviceName: { color: palette.colorInk, fontSize: 16, fontWeight: tokens.fontWeightStrong },
  serviceNameOff: { color: palette.colorMuted },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
