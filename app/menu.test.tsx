import { afterEach, expect, jest, test } from "@jest/globals";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import Menu from "./menu";
import AboutCity from "./city/[id]/about";
import { frameRoutes } from "../test/render-helpers";
import { cityMenuConfig } from "../components/city-map-menu";
import { uiStrings } from "../components/ui-strings";
import { OPEN_UI_LOCALES } from "../contracts/ui-locales";
import { createServices } from "../controllers/createServices";
import { layoutWith } from "../test/render-helpers";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";
import HourglassIcon from "lucide-react-native/icons/hourglass";
import LightbulbIcon from "lucide-react-native/icons/lightbulb";

afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

function openMenu() {
  jest.spyOn(Math, "random").mockReturnValue(0.5);
  renderRouter({ ...frameRoutes(), menu: Menu }, { initialUrl: "/menu" });
}

test.each([
  ["nearby", "screen-Map", "btn-map-back"],
  ["guides", "screen-Guides", "btn-guides-back"],
  ["discovery", "screen-Discovery", "btn-discovery-back"],
  // Issue #200: the reserve-1 fragment opens the «Пра горад» guide — the
  // row fails when the transition (or its destination route) is removed.
  ["reserve-1", "screen-AboutCity", "btn-about-back"],
])("%s opens its real destination and Back returns to the map menu", async (id, destination, back) => {
  openMenu();
  const before = screen.getByTestId("city-menu-canvas");
  fireEvent.press(screen.getByTestId(`city-menu-access-${id}`));
  expect(await screen.findByTestId(destination)).toBeTruthy();
  fireEvent.press(screen.getByTestId(back));
  expect(await screen.findByTestId("screen-Menu")).toBeTruthy();
  expect(screen.getByTestId("city-menu-canvas")).not.toBe(before);
});

test("the kudy piece stays visible, named and disabled without navigating", () => {
  openMenu();
  const piece = screen.getByTestId("city-menu-access-kudy");
  expect(piece.props.accessibilityState.disabled).toBe(true);
  expect(piece.props.accessibilityLabel).toContain(uiStrings("be").comingSoon);
  fireEvent.press(piece);
  fireEvent(piece, "accessibilityTap");
  expect(screen.getByTestId("screen-Menu")).toBeTruthy();
});

test("menu config names existing geometry and localizable labels for every open locale", () => {
  expect(cityMenuConfig.items).toHaveLength(5);
  expect(new Set(cityMenuConfig.items.map(item => item.id)).size).toBe(5);
  // Issue #200: reserve-1 carries the guide destination; only kudy stays null.
  expect(cityMenuConfig.items.filter(item => item.destination)).toHaveLength(4);
  expect(cityMenuConfig.items.find(item => item.id === "reserve-1")?.destination).toBe("/city/gdansk/about");
  for (const locale of OPEN_UI_LOCALES) {
    for (const item of cityMenuConfig.items) expect(uiStrings(locale)[item.labelKey].trim()).not.toBe("");
  }
  for (const item of cityMenuConfig.items) expect(manifest.pieces.find(piece => piece.id === item.id)?.png).toBeTruthy();
});

test("the active-walk icon returns to the same Run without writing session state", async () => {
  const liveSession = jest.fn(() => ({ routeId: "route-map", title: "Каралеўская" }));
  const services = createServices({ runSession: { liveSession } });
  renderRouter({ ...frameRoutes(), _layout: layoutWith(services), menu: Menu }, { initialUrl: "/menu" });
  const button = screen.getByTestId("btn-walk-mode");
  expect(button.props.accessibilityLabel).toBe(uiStrings("be").walk);
  fireEvent.press(button);
  expect(await screen.findByTestId("screen-Run")).toBeTruthy();
  expect(services.walk?.liveSession()?.routeId).toBe("route-map");
});

// Issue #216 (M11): the header carries the city name on the right and the
// display heading above the map — both through the contract, for every open
// interface language.
test("the header renders the contract city name and the display heading", () => {
  openMenu();
  expect(screen.getAllByText(uiStrings("be").cityName).length).toBeGreaterThan(0);
  expect(screen.getAllByText(uiStrings("be").whereToToday).length).toBeGreaterThan(0);
  for (const locale of OPEN_UI_LOCALES) {
    expect(uiStrings(locale).cityName.trim()).not.toBe("");
    expect(uiStrings(locale).whereToToday.trim()).not.toBe("");
  }
});

// Issue #216 (AC4/AC6): pieces carry medallions with unique glyphs, no
// visible captions; the map-point, route and lamp signs replace the compass.
test("pieces carry medallions with unique glyphs and no visible captions", () => {
  openMenu();
  for (const item of cityMenuConfig.items) {
    expect(screen.getByTestId(`city-menu-medal-${item.id}`, { includeHiddenElements: true })).toBeTruthy();
    // The caption stays the screen-reader label only; the disabled entry's
    // honest «· Хутка» note rides the same label (HomeMapMenu).
    const word = uiStrings("be")[item.labelKey].replace(/\s*→$/, "");
    const caption = item.destination === null ? `${word} · ${uiStrings("be").comingSoon}` : word;
    expect(screen.queryByText(caption, { includeHiddenElements: true })).toBeNull();
  }
  expect(new Set(cityMenuConfig.items.map(item => item.icon)).size).toBe(cityMenuConfig.items.length);
  expect(cityMenuConfig.items.find(item => item.id === "discovery")?.icon).toBe(LightbulbIcon);
  expect(cityMenuConfig.items.find(item => item.id === "kudy")?.icon).toBe(HourglassIcon);
});

// Issue #216 (AC5): pressing the waiting piece lights it back for a moment
// and nothing opens — the honest no-section answer of the mockup.
test("pressing the waiting piece lights it back for a moment without navigating", () => {
  jest.useFakeTimers();
  openMenu();
  const dim = screen.getByTestId("city-menu-dim-kudy", { includeHiddenElements: true });
  expect(dim.props.opacity).toBe(0.55);
  fireEvent.press(screen.getByTestId("city-menu-access-kudy"));
  expect(dim.props.opacity).toBe(0);
  act(() => { jest.advanceTimersByTime(701); });
  expect(dim.props.opacity).toBe(0.55);
  expect(screen.getByTestId("screen-Menu")).toBeTruthy();
});

// Issue #216 (AC7): the engraved panorama rests in the free space and the
// ad zone vanishes while no banner is loaded (M6; the real creative is #101).
test("the free space carries the panorama and the ad zone stays hidden without a banner", () => {
  openMenu();
  expect(screen.getByTestId("menu-panorama")).toBeTruthy();
  expect(screen.queryByTestId("menu-ad")).toBeNull();
});

