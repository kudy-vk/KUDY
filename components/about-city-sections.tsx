// Issue #252 — the five «Пра горад» section bodies, the typed port of the
// mockup's about.mjs builders (docs/design/production/, #202 approved
// 2026-11-12). Each section is facts, not paragraphs: steps, rides with
// their numbers, price rows, folds, switches. The visitor's choices inside
// the sections ride `ui` and survive a section switch; the fold groups keep
// one fold open (the mockup's folds() rule). The map section is the #303
// illustrated Tricity map (components/about-city-map.tsx).
import { Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import BusIcon from "lucide-react-native/icons/bus";
import CreditCardIcon from "lucide-react-native/icons/credit-card";
import ExternalLinkIcon from "lucide-react-native/icons/external-link";
import RouteIcon from "lucide-react-native/icons/route";
import SmartphoneIcon from "lucide-react-native/icons/smartphone";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";

import {
  ABOUT_CITY_APPS,
  ABOUT_CITY_CARD_HOURS,
  ABOUT_CITY_CARD_PACKAGES,
  ABOUT_CITY_CARD_SMAKI_PRICE,
  ABOUT_CITY_DELIVERY,
  ABOUT_CITY_FACT_ICONS,
  ABOUT_CITY_FREE_DAYS,
  ABOUT_CITY_PAY_METHODS,
  ABOUT_CITY_PRICES,
  ABOUT_CITY_RIDES,
  aboutCityHasText,
  aboutCityMoney,
  type AboutCityPayMethod,
  type AboutCitySectionId,
  type AboutCityText,
} from "./about-city-content";
import { DetailRows, Facts, Fold, LineBadge, PriceRows, Remark, Seg, Steps, SubHeading, Tile } from "./about-city-parts";
import { CanonIcon, type CanonGlyph } from "./canon-icon";
import { darkTokens, tokens, type ThemeTokens } from "./design-tokens";
import { PressableSurface } from "./pressable-surface";
import { ScaledText } from "./scaled-text";
import type { AboutCityStrings } from "../contracts/ui-message-types";
import { useThemeStyles } from "./theme";
import { ABOUT_CITY_ATLAS_INITIAL, AboutCityMap, type AboutCityAtlasState } from "./about-city-map";

// What the visitor chose and opened inside the sections; it outlives a
// section switch. The map's choices ride `atlas` (the mockup's ui.atlas).
export type AboutCityUiState = {
  direction: "from" | "to";
  pay: "any" | AboutCityPayMethod;
  hours: (typeof ABOUT_CITY_CARD_HOURS)[number];
  day: number;
  folds: Record<string, boolean>;
  atlas: AboutCityAtlasState;
};

export const ABOUT_CITY_INITIAL_UI: AboutCityUiState = {
  direction: "from",
  pay: "any",
  hours: 24,
  day: 1,
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
};

// The priceRows rule: one list, one shape — if any price has grosze, every
// price shows them.
function priceRows(ctx: AboutCitySectionContext, list: readonly (readonly [key: string, full: number, reduced: number | null])[]) {
  const { t, strings } = ctx;
  const cents = list.some(([, full, reduced]) => !Number.isInteger(full) || (reduced !== null && !Number.isInteger(reduced)));
  return (
    <PriceRows
      rows={list.map(([name, full, reduced]) => [
        t(name),
        aboutCityMoney(strings, full, cents),
        reduced === null ? null : t("u.reduced", { price: aboutCityMoney(strings, reduced, cents) }),
      ])}
    />
  );
}

const AIRPORT_RIDE_IDS = ABOUT_CITY_RIDES.map((ride) => `ride-${ride.id}`);
const TRANSPORT_MODE_IDS = ["mode-ztm", "mode-skm", "mode-rail"];
const FOOD_PAY_IDS = ["pay-cards", "pay-blik"];
const FOOD_PAY_OPTIONS: readonly ("any" | AboutCityPayMethod)[] = ["any", ...ABOUT_CITY_PAY_METHODS];
const CARD_DAYS = [1, 2, 3, 4, 5, 6, 7];

function airport(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, setUi, toggleFold, styles } = ctx;
  const way = ui.direction;
  const rides = (
    <View style={styles.stack}>
      {ABOUT_CITY_RIDES.map((ride) => (
        <Fold
          key={ride.id}
          id={`ride-${ride.id}`}
          open={Boolean(ui.folds[`ride-${ride.id}`])}
          onToggle={(id, open) => toggleFold(AIRPORT_RIDE_IDS, id, open)}
          lead={<LineBadge kind={ride.kind} line={ride.line} kindName={t(`sr.${ride.kind}`)} />}
          title={t(`ride.${ride.id}.${way}`)}
          meta={<Facts items={ride[way].facts.map(([sign, key, params]) => [ABOUT_CITY_FACT_ICONS[sign], t(key, params)])} />}
          body={<DetailRows rows={ride[way].rows.map(([label, value]) => [t(label), aboutCityHasText(ctx.strings, value) ? t(value) : value])} />}
        />
      ))}
    </View>
  );
  const ticket = (glyph: CanonGlyph, title: string, where: string, list?: typeof ABOUT_CITY_PRICES.ztm) => (
    <View key={title} style={[styles.card, styles.ticket]}>
      <View style={styles.ticketHead}>
        <CanonIcon glyph={glyph} label={title} size={18} color={tokens.colorAccent} />
        <ScaledText style={styles.ticketTitle}>{title}</ScaledText>
      </View>
      {list ? priceRows(ctx, list) : null}
      {list ? <ScaledText style={styles.note}>{t("tk.night")}</ScaledText> : null}
      <ScaledText style={styles.note}>{where}</ScaledText>
    </View>
  );
  return (
    <>
      <Seg
        name="direction"
        label={t("air.dirLabel")}
        options={[["from", t("air.dirFrom")], ["to", t("air.dirTo")]]}
        value={way}
        onChange={(value) => setUi({ direction: value as AboutCityUiState["direction"] })}
      />
      <Steps
        items={[
          [
            t(`air.${way}.s1.title`),
            <Fragment key="s1">
              <ScaledText style={styles.text}>{t(`air.${way}.s1.text`)}</ScaledText>
              {way === "from" ? (
                <View style={styles.stack}>
                  <Facts items={[[ABOUT_CITY_FACT_ICONS["map-pin"], t("air.from.s1.stop01")]]} />
                  <Facts items={[[ABOUT_CITY_FACT_ICONS["map-pin"], t("air.from.s1.stop02")]]} />
                </View>
              ) : null}
            </Fragment>,
          ],
          [t("air.s2.title"), rides],
          [
            t("air.s3.title"),
            <View key="s3" style={styles.stack}>
              {ticket(BusIcon, t("air.ticket.bus.title"), t("air.ticket.bus.where"), ABOUT_CITY_PRICES.ztm)}
              {ticket(TrainFrontIcon, t("air.ticket.train.title"), t("air.ticket.train.where"))}
            </View>,
          ],
        ]}
      />
      <Remark tone="warn" text={t("air.notice")} />
    </>
  );
}

function transport(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, toggleFold, styles, openLink } = ctx;
  const fold = (id: string, group: readonly string[], glyph: CanonGlyph, title: string, body: ReactNode, meta?: string) => (
    <Fold
      key={id}
      id={id}
      open={Boolean(ui.folds[id])}
      onToggle={(foldId, open) => toggleFold(group, foldId, open)}
      lead={<CanonIcon glyph={glyph} label={title} size={22} color={tokens.colorAccent} />}
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
        <CanonIcon glyph={app.glyph} label={title} size={22} color={tokens.colorAccent} />
        <View style={styles.appLabel}>
          <ScaledText style={styles.appTitle}>{title}</ScaledText>
          <ScaledText style={styles.appNote}>{note}</ScaledText>
        </View>
        <CanonIcon glyph={ExternalLinkIcon} label={title} color={tokens.colorAccent} size={18} />
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
  const { t, ui, setUi, toggleFold, styles } = ctx;
  const takes = (service: (typeof ABOUT_CITY_DELIVERY)[number]) => ui.pay === "any" || (service.pay as readonly string[]).includes(ui.pay);
  // Services that take the chosen way to pay come first.
  const services = [...ABOUT_CITY_DELIVERY].sort((a, b) => Number(takes(b)) - Number(takes(a)));
  return (
    <>
      <SubHeading>{t("food.deliveryLabel")}</SubHeading>
      <ScaledText style={styles.text}>{t("food.delivery.lead")}</ScaledText>
      <View accessibilityLabel={t("food.pay")} style={styles.chips}>
        {FOOD_PAY_OPTIONS.map((key) => (
          <PressableSurface
            key={key}
            accessibilityRole="button"
            accessibilityLabel={t(`pay.${key}`)}
            accessibilityState={{ selected: ui.pay === key }}
            onPress={() => setUi({ pay: key })}
            style={[styles.chip, ui.pay === key ? styles.chipSelected : null]}
            testID={`pay-${key}`}
          >
            <ScaledText style={[styles.chipText, ui.pay === key ? styles.chipSelectedText : null]}>{t(`pay.${key}`)}</ScaledText>
          </PressableSurface>
        ))}
      </View>
      <View style={styles.stack}>
        {services.map((service) => (
          <View key={service.name} style={[styles.card, styles.service]}>
            <ScaledText style={[styles.serviceName, takes(service) ? null : styles.serviceNameOff]}>{service.name}</ScaledText>
            {takes(service) ? (
              <View style={styles.tags}>
                {service.pay.map((key) => (
                  <ScaledText key={key} style={[styles.tag, key === ui.pay ? styles.tagFree : null]}>
                    {t(`pay.${key}`)}
                  </ScaledText>
                ))}
              </View>
            ) : (
              <ScaledText style={styles.note}>{`${t(`pay.${ui.pay}`)}: ${t("food.unconfirmed")}`}</ScaledText>
            )}
            {service.note && takes(service) ? <ScaledText style={styles.note}>{t(service.note)}</ScaledText> : null}
          </View>
        ))}
      </View>
      <ScaledText style={styles.note}>{t("food.note")}</ScaledText>
      <SubHeading>{t("food.city")}</SubHeading>
      <View style={styles.stack}>
        <Fold
          id="pay-cards"
          open={Boolean(ui.folds["pay-cards"])}
          onToggle={(id, open) => toggleFold(FOOD_PAY_IDS, id, open)}
          lead={<CanonIcon glyph={CreditCardIcon} label={t("food.cards.title")} size={22} color={tokens.colorAccent} />}
          title={t("food.cards.title")}
          meta={t("food.cards.meta")}
          body={<ScaledText style={styles.text}>{t("food.cards.text")}</ScaledText>}
        />
        <Fold
          id="pay-blik"
          open={Boolean(ui.folds["pay-blik"])}
          onToggle={(id, open) => toggleFold(FOOD_PAY_IDS, id, open)}
          lead={<CanonIcon glyph={SmartphoneIcon} label={t("food.blik.title")} size={22} color={tokens.colorAccent} />}
          title={t("food.blik.title")}
          meta={t("food.blik.meta")}
          body={
            <View style={styles.stack}>
              <ScaledText style={styles.text}>{t("food.blik.need")}</ScaledText>
              <DetailRows rows={[[t("food.blik.online.title"), t("food.blik.online.text")], [t("food.blik.till.title"), t("food.blik.till.text")]]} />
              <ScaledText style={styles.note}>{t("food.blik.more")}</ScaledText>
            </View>
          }
        />
      </View>
    </>
  );
}

function card(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, setUi, toggleFold, strings, styles } = ctx;
  const pack = (item: (typeof ABOUT_CITY_CARD_PACKAGES)[number]) => {
    const [full, reduced] = item.prices[ui.hours];
    return (
      <View key={item.id} style={[styles.card, styles.pack]}>
        <View style={styles.packHead}>
          <ScaledText style={styles.packName}>{item.name}</ScaledText>
          <View style={styles.packPrice}>
            <ScaledText style={styles.packSum}>{aboutCityMoney(strings, full)}</ScaledText>
            <ScaledText style={styles.packReduced}>{t("u.reduced", { price: aboutCityMoney(strings, reduced) })}</ScaledText>
          </View>
        </View>
        <ScaledText style={[styles.tag, styles.tagFree]}>{t(`card.${item.id}.entries`)}</ScaledText>
        <ScaledText style={styles.note}>{t(`card.${item.id}.list`)}</ScaledText>
      </View>
    );
  };
  const dayLines = ABOUT_CITY_FREE_DAYS[ui.day];
  return (
    <>
      <SubHeading>{t("card.title")}</SubHeading>
      <ScaledText style={styles.text}>{t("card.lead")}</ScaledText>
      <Seg
        name="hours"
        label={t("card.duration")}
        options={ABOUT_CITY_CARD_HOURS.map((hours) => [String(hours), t("card.hours", { n: hours })])}
        value={String(ui.hours)}
        onChange={(value) => setUi({ hours: Number(value) as AboutCityUiState["hours"] })}
      />
      {ABOUT_CITY_CARD_PACKAGES.map(pack)}
      <View style={[styles.card, styles.pack]}>
        <View style={styles.packHead}>
          <ScaledText style={styles.packName}>{t("card.smaki")}</ScaledText>
          <ScaledText style={styles.packSum}>{aboutCityMoney(strings, ABOUT_CITY_CARD_SMAKI_PRICE)}</ScaledText>
        </View>
      </View>
      <Fold
        id="card-transport"
        open={Boolean(ui.folds["card-transport"])}
        onToggle={(id, open) => toggleFold(["card-transport"], id, open)}
        lead={<CanonIcon glyph={TramFrontIcon} label={t("card.transport.title")} size={22} color={tokens.colorAccent} />}
        title={t("card.transport.title")}
        meta={t("card.transport.meta")}
        body={
          <View style={styles.stack}>
            <ScaledText style={styles.text}>{t("card.transport.text")}</ScaledText>
            {priceRows(ctx, ABOUT_CITY_PRICES.cardTransport)}
          </View>
        }
      />
      <SubHeading>{t("card.freeHeading")}</SubHeading>
      <View accessibilityLabel={t("card.day")} style={styles.week}>
        {CARD_DAYS.map((day) => {
          const free = (ABOUT_CITY_FREE_DAYS[day] ?? []).some(([state]) => state === "free");
          return (
            <PressableSurface
              key={day}
              accessibilityRole="button"
              accessibilityLabel={t(`day.${day}`)}
              accessibilityState={{ selected: day === ui.day }}
              onPress={() => setUi({ day })}
              style={[styles.weekDay, day === ui.day ? styles.weekDaySelected : null]}
              testID={`card-day-${day}`}
            >
              <ScaledText style={[styles.weekDayText, day === ui.day ? styles.chipSelectedText : null]}>{t(`day.${day}`)}</ScaledText>
              {free ? <View style={[styles.weekDot, day === ui.day ? styles.weekDotSelected : null]} /> : null}
            </PressableSurface>
          );
        })}
      </View>
      <View style={[styles.card, styles.place]} accessibilityLiveRegion="polite">
        {dayLines ? dayLines.map(([state, museum, key]) => (
          <Fragment key={key}>
            <View style={styles.placeHead}>
              <ScaledText style={styles.dayMuseum}>{t(museum)}</ScaledText>
              <ScaledText style={[styles.tag, state === "free" ? styles.tagFree : null]}>{t(`card.${state}.badge`)}</ScaledText>
            </View>
            <ScaledText style={styles.text}>{t(key)}</ScaledText>
          </Fragment>
        )) : (
          <ScaledText style={styles.note}>{t("card.other")}</ScaledText>
        )}
      </View>
      <Remark tone="warn" text={t("card.notice")} />
    </>
  );
}

const BUILD: Record<AboutCitySectionId, (ctx: AboutCitySectionContext) => ReactNode> = { airport, transport, city, food, card };

// The open section under the wheel. `ui` keeps what the visitor chose.
export function AboutCitySection({ id, ctx }: {
  id: AboutCitySectionId;
  ctx: Omit<AboutCitySectionContext, "styles">;
}): ReactNode {
  const styles = useThemeStyles(lightStyles, darkStyles);
  return <>{BUILD[id]({ ...ctx, styles })}</>;
}

const createStyles = (palette: ThemeTokens) => StyleSheet.create({
  stack: { gap: 8 },
  text: { color: palette.colorInk, fontSize: 16, lineHeight: 23 },
  note: { color: palette.colorMuted, fontSize: 13, lineHeight: 18 },
  // The transport section's app rows (#254): an icon, the app's name and a
  // one-line note; the row opens the app's page.
  appRow: { alignItems: "center", columnGap: 12, flexDirection: "row", minHeight: 56 },
  appLabel: { flex: 1, flexShrink: 1, gap: 2 },
  appTitle: { color: palette.colorAccent, fontSize: 16 },
  appNote: { color: palette.colorMuted, fontSize: 12 },
  card: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  ticket: { gap: 10 },
  ticketHead: { alignItems: "center", columnGap: 8, flexDirection: "row" },
  ticketTitle: { color: palette.colorInk, fontSize: 16, fontWeight: tokens.fontWeightStrong },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  place: { gap: 10 },
  placeHead: { alignItems: "center", columnGap: 10, flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
  placeTitle: { color: palette.colorInk, fontSize: tokens.fontTitleSize, fontWeight: tokens.fontWeightStrong },
  dayMuseum: { color: palette.colorInk, fontSize: 16, fontWeight: tokens.fontWeightStrong },
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
  pack: { gap: 8 },
  packHead: { alignItems: "flex-start", columnGap: 12, flexDirection: "row" },
  packName: { color: palette.colorInk, flex: 1, fontSize: tokens.fontTitleSize, fontWeight: tokens.fontWeightStrong },
  packPrice: { alignItems: "flex-end" },
  packSum: { color: palette.colorAccent, fontSize: 20, fontWeight: tokens.fontWeightStrong },
  packReduced: { color: palette.colorMuted, fontSize: 12 },
  week: {
    backgroundColor: palette.colorCard,
    borderColor: palette.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  weekDay: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingBottom: 10,
    paddingTop: 4,
  },
  weekDaySelected: { backgroundColor: palette.colorAccent },
  weekDayText: { color: palette.colorInk, fontSize: 13 },
  weekDot: {
    backgroundColor: palette.colorAccent,
    borderRadius: 3,
    bottom: 6,
    height: 6,
    position: "absolute",
    width: 6,
  },
  weekDotSelected: { backgroundColor: palette.colorAccentInk },
});
const lightStyles = createStyles(tokens);
const darkStyles = createStyles(darkTokens);
