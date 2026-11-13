// Issue #252 — the five «Пра горад» section bodies, the typed port of the
// mockup's about.mjs builders (docs/design/production/, #202 approved
// 2026-11-12). Each section is facts, not paragraphs: steps, rides with
// their numbers, price rows, folds, switches. The visitor's choices inside
// the sections ride `ui` and survive a section switch; the fold groups keep
// one fold open (the mockup's folds() rule).
import { Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import BusIcon from "lucide-react-native/icons/bus";
import CreditCardIcon from "lucide-react-native/icons/credit-card";
import RouteIcon from "lucide-react-native/icons/route";
import ScanQrCodeIcon from "lucide-react-native/icons/scan-qr-code";
import SmartphoneIcon from "lucide-react-native/icons/smartphone";
import StoreIcon from "lucide-react-native/icons/store";
import TicketIcon from "lucide-react-native/icons/ticket";
import TramFrontIcon from "lucide-react-native/icons/tram-front";
import TrainFrontIcon from "lucide-react-native/icons/train-front";

import {
  ABOUT_CITY_CARD_HOURS,
  ABOUT_CITY_CARD_PACKAGES,
  ABOUT_CITY_CARD_SMAKI_PRICE,
  ABOUT_CITY_DELIVERY,
  ABOUT_CITY_FACT_ICONS,
  ABOUT_CITY_FREE_DAYS,
  ABOUT_CITY_PAY_METHODS,
  ABOUT_CITY_PLACES,
  ABOUT_CITY_PRICES,
  ABOUT_CITY_RIDES,
  aboutCityHasText,
  aboutCityMoney,
  type AboutCityPayMethod,
  type AboutCityPlace,
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

// What the visitor chose and opened inside the sections; it outlives a
// section switch.
export type AboutCityUiState = {
  direction: "from" | "to";
  zone: keyof typeof ABOUT_CITY_PRICES;
  place: string;
  pay: "any" | AboutCityPayMethod;
  hours: (typeof ABOUT_CITY_CARD_HOURS)[number];
  day: number;
  folds: Record<string, boolean>;
};

export const ABOUT_CITY_INITIAL_UI: AboutCityUiState = {
  direction: "from",
  zone: "ztm",
  place: "glowne",
  pay: "any",
  hours: 24,
  day: 1,
  // The first transport fold starts open, as the mockup says (open: true).
  folds: { "mode-ztm": true },
};

export type AboutCitySectionStyles = ReturnType<typeof createStyles>;

// What the section builders receive: the screen owns the words, the choices
// and the fold memory; the section resolver adds the themed styles (the
// builders are plain functions, not components — the one hook call lives in
// AboutCitySection).
export type AboutCitySectionContext = {
  strings: AboutCityStrings;
  t: AboutCityText;
  ui: AboutCityUiState;
  setUi: (patch: Partial<AboutCityUiState>) => void;
  toggleFold: (group: readonly string[], id: string, open: boolean) => void;
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
const TRANSPORT_ACT_IDS = ["act-paper", "act-mobile", "act-valid"];
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
  const { t, ui, setUi, toggleFold, styles } = ctx;
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
      <SubHeading>{t("tr.prices")}</SubHeading>
      <Seg
        name="zone"
        label={t("tr.zoneLabel")}
        options={(["ztm", "metro", "rail"] as const).map((zone) => [zone, t(`tr.zone.${zone}`)])}
        value={ui.zone}
        onChange={(value) => setUi({ zone: value as AboutCityUiState["zone"] })}
      />
      <View style={[styles.card, styles.ticket]}>
        <ScaledText style={styles.note}>{t(`tr.zoneNote.${ui.zone}`)}</ScaledText>
        {priceRows(ctx, ABOUT_CITY_PRICES[ui.zone])}
        {ui.zone !== "rail" ? <ScaledText style={styles.note}>{t("tk.night")}</ScaledText> : null}
      </View>
      <SubHeading>{t("tr.activate")}</SubHeading>
      <View style={styles.stack}>
        {fold("act-paper", TRANSPORT_ACT_IDS, ScanQrCodeIcon, t("tr.act.paper.title"), <ScaledText style={styles.text}>{t("tr.act.paper.text")}</ScaledText>)}
        {fold("act-mobile", TRANSPORT_ACT_IDS, SmartphoneIcon, t("tr.act.mobile.title"), <ScaledText style={styles.text}>{t("tr.act.mobile.text")}</ScaledText>)}
        {fold("act-valid", TRANSPORT_ACT_IDS, ABOUT_CITY_FACT_ICONS.clock, t("tr.act.valid.title"), <ScaledText style={styles.text}>{t("tr.act.valid.text")}</ScaledText>)}
      </View>
      <SubHeading>{t("tr.buyLabel")}</SubHeading>
      <View style={styles.tiles}>
        <Tile glyph={SmartphoneIcon} title={t("tr.buy.fala.title")} text={t("tr.buy.fala.text")} />
        <Tile glyph={TicketIcon} title={t("tr.buy.apps.title")} text={t("tr.buy.apps.text")} />
        <Tile glyph={CreditCardIcon} title={t("tr.buy.board.title")} text={t("tr.buy.board.text")} />
        <Tile glyph={StoreIcon} title={t("tr.buy.desk.title")} text={t("tr.buy.desk.text")} />
      </View>
      <Remark tone="tip" text={t("tr.tip.card")} />
      <Remark tone="tip" text={t("tr.tip.kompas")} />
    </>
  );
}

// The orientation schematic: light in both themes (decision DT-4), like
// every map of the app — its styles ride the fixed light tokens, not the
// theme's palette. Each place is one button; the chosen one is described
// below.
function city(ctx: AboutCitySectionContext): ReactNode {
  const { t, ui, setUi, styles } = ctx;
  const chosen = ABOUT_CITY_PLACES.find((place) => place.id === ui.place) ?? ABOUT_CITY_PLACES[0];
  const beach = chosen.kind === "beach" || chosen.kind === "island";
  return (
    <>
      <View style={styles.orientation}>
        <View style={styles.schematic} testID="city-schematic" accessibilityLabel={t("city.pick")}>
          <View style={[styles.schematicLine, styles.coast]} />
          <View style={[styles.schematicLine, styles.river]} />
          <ScaledText style={[styles.water, styles.sea]}>{t("city.sea")}</ScaledText>
          <ScaledText style={[styles.water, styles.motlawa]}>{t("city.motlawa")}</ScaledText>
          {ABOUT_CITY_PLACES.map((place) => (
            <PlaceSpot
              key={place.id}
              place={place}
              selected={place.id === ui.place}
              onPress={() => setUi({ place: place.id })}
            />
          ))}
        </View>
        <ScaledText style={styles.note}>{t("city.caption")}</ScaledText>
      </View>
      <View style={[styles.card, styles.place]} accessibilityLiveRegion="polite">
        <View style={styles.placeHead}>
          <ScaledText style={styles.placeTitle}>{chosen.title ?? chosen.name}</ScaledText>
          <ScaledText style={styles.tag}>{t(`kind.${chosen.kind}`)}</ScaledText>
        </View>
        <ScaledText style={styles.text}>{t(`place.${chosen.id === "stogi" ? "stogiBeach" : chosen.id}`)}</ScaledText>
        {chosen.get.length > 0 ? (
          <View style={styles.stack}>
            <ScaledText style={styles.note}>{`${t("city.get")}:`}</ScaledText>
            {chosen.get.map(([sign, key]) => (
              <Facts key={key} items={[[sign, t(key)]]} />
            ))}
          </View>
        ) : null}
        {chosen.warn ? <Remark tone="warn" text={t(chosen.warn)} /> : null}
        {beach ? <ScaledText style={styles.note}>{t("city.summer")}</ScaledText> : null}
      </View>
    </>
  );
}

// The one place button: its dot stands on the point (x, y) and its name
// beside it — to the right, to the left, or under it.
function PlaceSpot({ place, selected, onPress }: {
  place: AboutCityPlace;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemeStyles(lightStyles, darkStyles);
  const dot = place.main ? 10 : 8;
  return (
    <View
      style={[
        styles.spot,
        place.side === "right" ? styles.spotRight : place.side === "left" ? styles.spotLeft : styles.spotBelow,
        { left: `${place.x}%`, top: `${place.y}%` },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={place.name}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={styles.spotButton}
        testID={`city-spot-${place.id}`}
      >
        <View style={styles.dotBox}>
          {selected ? <View style={[styles.dotRing, { borderRadius: (dot + 12) / 2, height: dot + 12, width: dot + 12 }]} /> : null}
          <View style={[styles.dot, place.main ? styles.dotMain : null, { borderRadius: dot / 2, height: dot, width: dot }]} />
        </View>
        <ScaledText style={[styles.spotName, place.main ? styles.spotNameMain : null, selected ? styles.spotNameSelected : null]}>
          {place.name}
        </ScaledText>
      </Pressable>
    </View>
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
  orientation: { gap: 6 },
  schematic: {
    aspectRatio: 0.8,
    backgroundColor: tokens.colorMap,
    borderColor: tokens.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  schematicLine: { backgroundColor: tokens.colorLine, position: "absolute" },
  coast: { height: 1, left: 0, right: 0, top: "13%" },
  river: { bottom: 0, left: "62%", top: "13%", width: 2 },
  water: { color: tokens.colorInk, fontSize: 13, position: "absolute" },
  sea: { left: "4%", top: "3%" },
  motlawa: { left: "65.5%", top: "68%" },
  spot: { position: "absolute" },
  spotRight: { alignItems: "center", flexDirection: "row", transform: [{ translateX: -4 }, { translateY: "-50%" }] },
  spotLeft: { alignItems: "center", flexDirection: "row-reverse", transform: [{ translateX: 4 }, { translateY: "-50%" }] },
  spotBelow: { alignItems: "flex-end", flexDirection: "column", transform: [{ translateX: 12 }, { translateY: -10 }] },
  spotButton: { alignItems: "center", columnGap: 5, flexDirection: "row", padding: 2 },
  dotBox: { alignItems: "center", height: 22, justifyContent: "center", width: 22 },
  dot: { backgroundColor: tokens.colorInk },
  dotMain: { backgroundColor: tokens.colorAccent },
  dotRing: { borderColor: tokens.colorMedalGlow, borderWidth: 3, position: "absolute" },
  spotName: {
    color: tokens.colorInk,
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  spotNameMain: { color: tokens.colorAccent },
  spotNameSelected: { backgroundColor: tokens.colorAccent, borderRadius: 4, color: tokens.colorAccentInk },
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
