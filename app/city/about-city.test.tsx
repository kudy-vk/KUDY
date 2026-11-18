// Issue #252 — the «Пра горад» render suite: the wheel screen behind the
// map menu's reserve-1 fragment. The guards are the issue's criteria: the
// document renders fully offline (criterion 7 — no fetch), the wheel points
// switch the section under them (criterion 4), the fold groups keep one
// fold open and the blocks follow the layout (criterion 5), every link row
// points at an official page and a failed open leaves the address on the
// screen (criterion 7), and a locale without its own words shows the English
// text (criterion 6, decision L1). The five section pages stay mounted on
// the wheel's ring (the owner's 2026-11-17 flip request), so the section
// bodies are asserted inside their own page and through the page's
// open/hidden state — a query over the whole screen would find hidden pages.
import { expect, jest, test } from "@jest/globals";
import { fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { Linking } from "react-native";

import AboutCity from "./[id]/about";
import { ABOUT_CITY_APPS, ABOUT_CITY_LINK_URLS, ABOUT_CITY_SECTIONS } from "../../components/about-city-content";
import { aboutCityStrings } from "../../components/about-city-strings";
import { ABOUT_CITY_STRINGS } from "../../components/about-city-strings.generated";
import { frameRoutes } from "../../test/render-helpers";

// The map's gestures run on the RNGH/Reanimated layer jest cannot host; the
// render suite stubs the gesture builder out through the shared mock (the
// pick logic runs in the pure modules and is guarded by
// test/about-map.test.mjs).
jest.mock("react-native-gesture-handler", () => {
  const { gestureHandlerMock } = require("../../test/gesture-handler-mock") as typeof import("../../test/gesture-handler-mock");
  return gestureHandlerMock();
});

// The official hosts the guide may link to — a URL outside this list fails
// the wiring guard (the sources table is the only place a new host joins).
const OFFICIAL_HOSTS = new Set([
  "www.airport.gdansk.pl",
  "ztm.gda.pl",
  "skm.pkp.pl",
  "www.skm.pkp.pl",
  "jakdojade.pl",
  "systemfala.pl",
  "visitgdansk.com",
  "kartaturysty.visitgdansk.com",
  "muzeumgdansk.pl",
  "www.muzeum1939.pl",
  "www.pyszne.pl",
  "www.blik.com",
]);

function openGuide() {
  renderRouter(frameRoutes(), { initialUrl: "/city/gdansk/about" });
}

// Queries scoped to one section page: the pages stay mounted together, so
// the open section's body is asserted inside its own page. The hidden pages
// are not in the screen-reader tree (that is the a11y contract), so raw
// queries (includeHiddenElements) reach their props and the default queries
// must NOT reach them at all.
const pageOf = (id: string) => within(screen.getByTestId(`about-page-${id}`));
const hiddenPageOf = (id: string) => screen.getByTestId(`about-page-${id}`, { includeHiddenElements: true });
const expectOpenPage = (id: string) => {
  expect(screen.getByTestId(`about-page-${id}`).props.pointerEvents).toBe("auto");
  for (const { id: other } of ABOUT_CITY_SECTIONS) {
    if (other === id) continue;
    expect(hiddenPageOf(other).props.pointerEvents).toBe("none");
    expect(screen.queryByTestId(`about-page-${other}`)).toBeNull();
  }
};

test("the guide renders the wheel and the open section without any network call", () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  openGuide();
  expect(screen.getByTestId("screen-AboutCity")).toBeTruthy();
  expect(screen.getByTestId("about-city-wheel")).toBeTruthy();
  // The airport section stands in the middle first: what a visitor who just
  // landed needs.
  expect(pageOf("airport").getByText("З аэрапорта і назад")).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("the five section pages ride the strip; only the open one meets the screen reader", () => {
  openGuide();
  // Every page stays mounted on the ring (the raw query reaches the hidden
  // ones), and the open page is the only one in the screen-reader tree.
  for (const { id } of ABOUT_CITY_SECTIONS) {
    expect(hiddenPageOf(id)).toBeTruthy();
  }
  expectOpenPage("airport");
});

test("a press on a wheel point opens that section under the wheel (criterion 4)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-food"));
  expectOpenPage("food");
  // The food heading doubles as the wheel label, so the section body carries
  // the assertion.
  expect(pageOf("food").getByText("Аплата ў горадзе")).toBeTruthy();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  expectOpenPage("card");
  expect(pageOf("card").getByText("Картка турыста і бясплатныя дні музеяў")).toBeTruthy();
});

test("the direction switch turns the airport rides around (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("seg-direction-to"));
  expect(pageOf("airport").getByText("З цэнтра горада")).toBeTruthy();
  expect(pageOf("airport").queryByText("У цэнтр горада")).toBeNull();
});

test("a fold group keeps one fold open (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  const ztm = pageOf("transport").getByTestId("fold-mode-ztm");
  expect(ztm.props.accessibilityState).toMatchObject({ expanded: true });
  fireEvent.press(pageOf("transport").getByTestId("fold-mode-skm"));
  expect(pageOf("transport").getByTestId("fold-mode-skm").props.accessibilityState).toMatchObject({ expanded: true });
  expect(pageOf("transport").getByTestId("fold-mode-ztm").props.accessibilityState).toMatchObject({ expanded: false });
});

test("the transport section carries no fares and opens the three apps in the owner's order (#254, criterion 6)", () => {
  // The owner's verdict: prices, the ticket catalogue and the activation
  // rules live in the apps, never in the guide. Bringing any of them back
  // into the transport section fails this test.
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  const page = pageOf("transport");
  expect(page.getByText("Дзе купіць")).toBeTruthy();
  expect(page.queryByText(/4,80 zł|6,00 zł|30 zł|34 zł/)).toBeNull();
  expect(page.queryByTestId("seg-zone")).toBeNull();
  expect(page.queryByTestId("seg-zone-rail")).toBeNull();
  expect(page.queryByTestId("fold-act-paper")).toBeNull();
  expect(screen.getByText("Jakdojade")).toBeTruthy();
  expect(screen.getByText("FALA")).toBeTruthy();
  expect(screen.getByText("SKM KomPas")).toBeTruthy();
  // jakdojade first, FALA second, KomPas third — the owner set the order.
  const renderedOrder = screen.getAllByText(/^(Jakdojade|FALA|SKM KomPas)$/).map((node) => node.props.children);
  expect(renderedOrder).toEqual(["Jakdojade", "FALA", "SKM KomPas"]);
});

test("the transport app rows open the official app pages (criterion 6)", () => {
  for (const app of ABOUT_CITY_APPS) {
    expect(OFFICIAL_HOSTS.has(new URL(app.url).host)).toBe(true);
  }
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  fireEvent.press(screen.getByTestId("about-app-fala"));
  expect(spy).toHaveBeenCalledWith("https://systemfala.pl");
  spy.mockRestore();
});

test("the city section shows the illustrated Tricity map, not the schematic (issue #303)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-city"));
  // The map box with the picture, the layer switches and the hint card.
  expect(screen.getByTestId("city-map")).toBeTruthy();
  expect(screen.getByTestId("city-map-layers")).toBeTruthy();
  expect(screen.getByText("Націсні на каляровую зону, станцыю або знак аэрапорта, каб даведацца, што гэта.")).toBeTruthy();
  // The map's caption is the mockup's own: the drawing is approximate.
  expect(screen.getByText(/малюнак прыблізны\. Не для навігацыі\./)).toBeTruthy();
  // The old schematic's places are gone with it.
  expect(screen.queryByTestId("city-spot-stogi")).toBeNull();
});

test("the city section carries no official-pages rows (decision M13)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-city"));
  expect(pageOf("city").queryByText("Афіцыйныя старонкі")).toBeNull();
  expect(pageOf("city").queryByTestId("link-about-visitGdanskMap")).toBeNull();
  // The other sections keep theirs.
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  expect(pageOf("transport").getByTestId("link-about-ztmSchedule")).toBeTruthy();
});

test("the payment filter dims the services that refuse the chosen way (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-food"));
  fireEvent.press(pageOf("food").getByTestId("pay-blik"));
  // Bolt Food takes no BLIK: the honest unconfirmed line replaces its tags.
  expect(pageOf("food").getByText("BLIK: афіцыйна не пацверджана")).toBeTruthy();
});

test("the tourist card term switch reprices the packages (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  expect(pageOf("card").getByText("75 zł")).toBeTruthy();
  fireEvent.press(pageOf("card").getByTestId("seg-hours-72"));
  expect(pageOf("card").getByText("95 zł")).toBeTruthy();
});

test("the free-days week opens the chosen day's museum lines (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  fireEvent.press(pageOf("card").getByTestId("card-day-2"));
  expect(pageOf("card").getByText(/Білет за 0 zł выдаюць толькі ў касе/)).toBeTruthy();
});

test("every section link row points at an official page and opens it (criterion 7)", () => {
  for (const section of ABOUT_CITY_SECTIONS) {
    for (const linkKey of section.links) {
      expect(OFFICIAL_HOSTS.has(new URL(ABOUT_CITY_LINK_URLS[linkKey]).host)).toBe(true);
    }
  }
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  openGuide();
  fireEvent.press(screen.getByTestId("link-about-airportBuses"));
  expect(spy).toHaveBeenCalledWith(ABOUT_CITY_LINK_URLS.airportBuses);
  spy.mockRestore();
});

test("a failed open leaves the page address on the screen; another open clears it (criterion 7)", async () => {
  const spy = jest.spyOn(Linking, "openURL").mockRejectedValueOnce(new Error("offline"));
  openGuide();
  fireEvent.press(screen.getByTestId("link-about-airportBuses"));
  // The whole remark is one text node: the sentence and the address. The
  // failed-open notice stays with its own page.
  expect(await screen.findByText(new RegExp(ABOUT_CITY_LINK_URLS.airportBuses.replace(/[.//]/g, "\\$&")))).toBeTruthy();
  // The next open succeeds: the stale failed-open notice is gone. Reverting
  // the clear in openLink fails this half (voka round 3, missing-revert-test).
  // The ztmSchedule row lives on the open airport page too — no section
  // switch, so the clear is asserted on the very page that showed the notice.
  spy.mockResolvedValueOnce(undefined as never);
  fireEvent.press(screen.getByTestId("link-about-ztmSchedule"));
  await waitFor(() => expect(screen.queryByText(/Не ўдалося адкрыць старонку/)).toBeNull());
  spy.mockRestore();
});

test("a locale without its own words shows the English text (criterion 6, L1)", () => {
  // The be+en catalogues both mirror the canonical records; every other
  // display locale selects the English set — the be fallback of #200 is gone.
  expect(aboutCityStrings("be").tab.airport).toBe("Аэрапорт");
  expect(aboutCityStrings("en").tab.airport).toBe("Airport");
  expect(aboutCityStrings("uk").tab.airport).toBe("Airport");
  expect(aboutCityStrings("de").tab.airport).toBe(ABOUT_CITY_STRINGS.en.tab.airport);
  expect(aboutCityStrings("uk").tab.airport).not.toBe(ABOUT_CITY_STRINGS.be.tab.airport);
});
