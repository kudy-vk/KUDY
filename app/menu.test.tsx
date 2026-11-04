import { afterEach, expect, jest, test } from "@jest/globals";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import Menu from "./menu";
import { frameRoutes } from "../test/render-helpers";
import { cityMenuConfig } from "../components/city-map-menu";
import { uiStrings } from "../components/ui-strings";
import { OPEN_UI_LOCALES } from "../contracts/ui-locales";
import { createServices } from "../controllers/createServices";
import { layoutWith } from "../test/render-helpers";
import manifest from "../docs/design/brand/outputs/menu-map-city-only/manifest.json";

afterEach(() => { jest.restoreAllMocks(); });

function openMenu() {
  jest.spyOn(Math, "random").mockReturnValue(0.5);
  renderRouter({ ...frameRoutes(), menu: Menu }, { initialUrl: "/menu" });
}

test.each([
  ["nearby", "screen-Map", "btn-map-back"],
  ["guides", "screen-Guides", "btn-guides-back"],
  ["discovery", "screen-Discovery", "btn-discovery-back"],
])("%s opens its real destination and Back returns to the map menu", async (id, destination, back) => {
  openMenu();
  const before = screen.getByTestId("city-menu-canvas");
  fireEvent.press(screen.getByTestId(`city-menu-access-${id}`));
  expect(await screen.findByTestId(destination)).toBeTruthy();
  fireEvent.press(screen.getByTestId(back));
  expect(await screen.findByTestId("screen-Menu")).toBeTruthy();
  expect(screen.getByTestId("city-menu-canvas")).not.toBe(before);
});

test("two reserved pieces stay visible, named and disabled without navigating", () => {
  openMenu();
  for (const id of ["reserve-1", "kudy"]) {
    const piece = screen.getByTestId(`city-menu-access-${id}`);
    expect(piece.props.accessibilityState.disabled).toBe(true);
    expect(piece.props.accessibilityLabel).toContain(uiStrings("be").comingSoon);
    fireEvent.press(piece);
    fireEvent(piece, "accessibilityTap");
    expect(screen.getByTestId("screen-Menu")).toBeTruthy();
  }
});

test("menu config names existing geometry and localizable labels for every open locale", () => {
  expect(cityMenuConfig.items).toHaveLength(5);
  expect(new Set(cityMenuConfig.items.map(item => item.id)).size).toBe(5);
  expect(cityMenuConfig.items.filter(item => item.destination)).toHaveLength(3);
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

