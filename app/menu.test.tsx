import { afterEach, expect, jest, test } from "@jest/globals";
import { act, fireEvent, renderRouter, screen, within } from "expo-router/testing-library";
import Menu, { menuTopBlockHeight } from "./menu";
import AboutCity from "./city/[id]/about";
import { frameRoutes } from "../test/render-helpers";
import { cityMenuConfig } from "../components/city-map-menu";
import { uiStrings } from "../components/ui-strings";
import { OPEN_UI_LOCALES } from "../contracts/ui-locales";
import { createServices } from "../controllers/createServices";
import { layoutWith } from "../test/render-helpers";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import { StyleSheet } from "react-native";
import SettingsIcon from "lucide-react-native/icons/settings";
import LightbulbIcon from "lucide-react-native/icons/lightbulb";

afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

async function openMenu() {
  jest.spyOn(Math, "random").mockReturnValue(0.5);
  await renderRouter({ ...frameRoutes(), menu: Menu }, { initialUrl: "/menu" });
}

test.each([
  ["nearby", "screen-Map", "btn-map-back"],
  ["guides", "screen-Guides", "btn-guides-back"],
  ["discovery", "screen-Discovery", "btn-discovery-back"],
  // Issue #200: the reserve-1 fragment opens the «Пра горад» guide — the
  // row fails when the transition (or its destination route) is removed.
  ["reserve-1", "screen-AboutCity", "btn-about-back"],
  ["kudy", "screen-KUDY", "btn-my-back"],
])("%s opens its real destination and Back returns to the map menu", async (id, destination, back) => {
  await openMenu();
  const before = screen.getByTestId("city-menu-canvas");
  await fireEvent(screen.getByTestId(`city-menu-access-${id}`), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
  expect(await screen.findByTestId(destination)).toBeTruthy();
  await fireEvent.press(screen.getByTestId(back));
  expect(await screen.findByTestId("screen-Menu")).toBeTruthy();
  expect(screen.getByTestId("city-menu-canvas")).not.toBe(before);
});

test("production menu exposes localized actions and resets movement after returning", async () => {
  await openMenu();
  const piece = () => screen.getByTestId("city-menu-access-guides");
  const position = () => StyleSheet.flatten(piece().props.style).left;
  const initial = position();
  expect(piece().props.accessibilityActions).toContainEqual({ name: "moveLeft", label: uiStrings("be").mapAccessibility.moveLeft });
  await fireEvent(piece(), "accessibilityAction", { nativeEvent: { actionName: "moveLeft" } });
  expect(position()).not.toEqual(initial);
  expect(screen.getByTestId("screen-Menu")).toBeTruthy();
  await fireEvent(piece(), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
  expect(await screen.findByTestId("screen-Guides")).toBeTruthy();
  await fireEvent.press(screen.getByTestId("btn-guides-back"));
  expect(await screen.findByTestId("screen-Menu")).toBeTruthy();
  expect(position()).toEqual(initial);
  for (const locale of OPEN_UI_LOCALES) {
    expect(Object.values(uiStrings(locale).mapAccessibility).every(label => label.trim().length > 0)).toBe(true);
  }
});

test("the KUDY fragment is active and accessible instead of the former coming-soon placeholder", async () => {
  await openMenu();
  const piece = screen.getByTestId("city-menu-access-kudy");
  expect(piece.props.accessibilityState.disabled).toBe(false);
  expect(piece.props.accessibilityActions).toContainEqual({ name: "activate" });
  expect(piece.props.accessibilityLabel).not.toContain(uiStrings("be").comingSoon);
  await fireEvent(piece, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
  expect(await screen.findByTestId("screen-KUDY")).toBeTruthy();
});

test("menu config names existing geometry and localizable labels for every open locale", async () => {
  expect(cityMenuConfig.items).toHaveLength(5);
  expect(new Set(cityMenuConfig.items.map(item => item.id)).size).toBe(5);
  // Every visible fragment now has a real destination.
  expect(cityMenuConfig.items.filter(item => item.destination)).toHaveLength(5);
  expect(cityMenuConfig.items.find(item => item.id === "kudy")?.destination).toBe("/my");
  expect(cityMenuConfig.items.find(item => item.id === "reserve-1")?.destination).toBe("/city/gdansk/about");
  for (const locale of OPEN_UI_LOCALES) {
    for (const item of cityMenuConfig.items) expect(uiStrings(locale)[item.labelKey].trim()).not.toBe("");
  }
  for (const item of cityMenuConfig.items) expect(manifest.pieces.find(piece => piece.id === item.id)?.png).toBeTruthy();
});

test("the main menu settings shortcut opens KUDY and its language picker", async () => {
  await openMenu();
  const settings = screen.getByTestId("btn-menu-settings");
  expect(settings.props.accessibilityLabel).toBe(uiStrings("be").myKudy);
  await fireEvent.press(settings);
  expect(await screen.findByTestId("screen-KUDY")).toBeTruthy();
  expect(screen.getByTestId("my-ui-locale")).toBeTruthy();
  await fireEvent.press(screen.getByTestId("btn-my-back"));
  expect(await screen.findByTestId("screen-Menu")).toBeTruthy();
});

test("the active-walk icon returns to the same Run without writing session state", async () => {
  const liveSession = jest.fn(() => ({ routeId: "route-map", title: "Каралеўская" }));
  const services = createServices({ runSession: { liveSession } });
  await renderRouter({ ...frameRoutes(), _layout: layoutWith(services), menu: Menu }, { initialUrl: "/menu" });
  const button = screen.getByTestId("btn-walk-mode");
  expect(button.props.accessibilityLabel).toBe(uiStrings("be").walk);
  await fireEvent.press(button);
  expect(await screen.findByTestId("screen-Run")).toBeTruthy();
  expect(services.walk?.liveSession()?.routeId).toBe("route-map");
});

// Issue #216 (M11): the header carries the city name on the right and the
// display heading above the map — both through the contract, for every open
// interface language.
test("the header renders the contract city name and the display heading", async () => {
  await openMenu();
  expect(screen.getAllByText(uiStrings("be").cityName).length).toBeGreaterThan(0);
  expect(screen.getAllByText(uiStrings("be").whereToToday).length).toBeGreaterThan(0);
  for (const locale of OPEN_UI_LOCALES) {
    expect(uiStrings(locale).cityName.trim()).not.toBe("");
    expect(uiStrings(locale).whereToToday.trim()).not.toBe("");
  }
});

// Issue #216 (AC4/AC6): pieces carry medallions with unique glyphs, no
// visible captions; the map-point, route and lamp signs replace the compass.
test("pieces carry medallions with unique glyphs and no visible captions", async () => {
  await openMenu();
  const canvas = screen.getByTestId("city-menu-canvas");
  for (const item of cityMenuConfig.items) {
    expect(screen.getByTestId(`city-menu-medal-${item.id}`, { includeHiddenElements: true })).toBeTruthy();
    // The caption stays the screen-reader label only; the disabled entry's
    // honest «· Хутка» note rides the same label (HomeMapMenu).
    const word = uiStrings("be")[item.labelKey].replace(/\s*→$/, "");
    const caption = item.destination === null ? `${word} · ${uiStrings("be").comingSoon}` : word;
    expect(within(canvas).queryByText(caption, { includeHiddenElements: true })).toBeNull();
  }
  expect(new Set(cityMenuConfig.items.map(item => item.icon)).size).toBe(cityMenuConfig.items.length);
  expect(cityMenuConfig.items.find(item => item.id === "discovery")?.icon).toBe(LightbulbIcon);
  expect(cityMenuConfig.items.find(item => item.id === "kudy")?.icon).toBe(SettingsIcon);
});

// Drag-enabled fragments receive a real finger tap through the canvas
// PanResponder, not the inner accessibility Pressable (pointerEvents="none").
test("touching the KUDY medallion through the canvas opens settings", async () => {
  await openMenu();
  const canvas = screen.getByTestId("city-menu-canvas");
  const piece = StyleSheet.flatten(screen.getByTestId("city-menu-access-kudy").props.style);
  const medal = StyleSheet.flatten(screen.getByTestId("city-menu-medal-kudy", { includeHiddenElements: true }).props.style);
  const x = Number(piece.left) + Number(medal.left) + 19 - 9;
  const y = Number(piece.top) + Number(medal.top) + 19 + 15;
  expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
  let stamp = 0;
  const touch = {
    nativeEvent: { locationX: x, locationY: y, pageX: x, pageY: y, touches: [{ pageX: x, pageY: y }] },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: ++stamp,
      touchBank: [{ touchActive: true, currentTimeStamp: stamp, currentPageX: x, currentPageY: y, previousPageX: x, previousPageY: y }],
    },
  };
  const gesture = { dx: 0, dy: 0, numberActiveTouches: 1 };
  expect(canvas.props.onStartShouldSetResponder(touch)).toBe(true);
  await act(() => {
    canvas.props.onResponderGrant(touch, gesture);
    canvas.props.onResponderRelease(touch, gesture);
  });
  expect(await screen.findByTestId("screen-KUDY")).toBeTruthy();
  expect(screen.getByTestId("my-ui-locale")).toBeTruthy();
});

// Issue #216 (AC7): the engraved panorama rests in the free space and the
// ad zone vanishes while no banner is loaded (M6; the real creative is #101).
test("the free space carries the panorama and the ad zone stays hidden without a banner", async () => {
  await openMenu();
  expect(screen.getByTestId("menu-panorama")).toBeTruthy();
  expect(screen.queryByTestId("menu-ad")).toBeNull();
});

// Issue #216 (AC3, M1): the parts block ends at 5/8 of the FULL screen
// height minus the status-bar inset (the README verdict row). Reverting the
// 5/8 formula or the status subtraction turns this red.
test("the map block height is 5/8 of the screen height minus the status inset", async () => {
  expect(menuTopBlockHeight(844, 47)).toBeCloseTo(480.5);
  expect(menuTopBlockHeight(640, 24)).toBeCloseTo(376);
  expect(menuTopBlockHeight(932, 47)).toBeCloseTo(535.5);
});

