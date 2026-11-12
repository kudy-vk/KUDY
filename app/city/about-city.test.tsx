// Issue #252 — the «Пра горад» render suite: the wheel screen behind the
// map menu's reserve-1 fragment. The guards are the issue's criteria: the
// document renders fully offline (criterion 7 — no fetch), the wheel points
// switch the section under them (criterion 4), the fold groups keep one
// fold open and the blocks follow the layout (criterion 5), every link row
// points at an official page and a failed open leaves the address on the
// screen (criterion 7), and a locale without its own words shows the English
// text (criterion 6, decision L1).
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Linking } from "react-native";

import AboutCity from "./[id]/about";
import { ABOUT_CITY_LINK_URLS, ABOUT_CITY_SECTIONS } from "../../components/about-city-content";
import { aboutCityStrings } from "../../components/about-city-strings";
import { ABOUT_CITY_STRINGS } from "../../components/about-city-strings.generated";
import { frameRoutes } from "../../test/render-helpers";

// The official hosts the guide may link to — a URL outside this list fails
// the wiring guard (the sources table is the only place a new host joins).
const OFFICIAL_HOSTS = new Set([
  "www.airport.gdansk.pl",
  "ztm.gda.pl",
  "www.skm.pkp.pl",
  "jakdojade.pl",
  "mzkzg.org",
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

test("the guide renders the wheel and the open section without any network call", () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  openGuide();
  expect(screen.getByTestId("screen-AboutCity")).toBeTruthy();
  expect(screen.getByTestId("about-city-wheel")).toBeTruthy();
  // The airport section stands in the middle first: what a visitor who just
  // landed needs.
  expect(screen.getByText("З аэрапорта і назад")).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("a press on a wheel point opens that section under the wheel (criterion 4)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-food"));
  // The food heading doubles as the wheel label, so the section body carries
  // the assertion.
  expect(screen.getByText("Аплата ў горадзе")).toBeTruthy();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  expect(screen.getByText("Картка турыста і бясплатныя дні музеяў")).toBeTruthy();
});

test("the direction switch turns the airport rides around (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("seg-direction-to"));
  expect(screen.getByText("З цэнтра горада")).toBeTruthy();
  expect(screen.queryByText("У цэнтр горада")).toBeNull();
});

test("a fold group keeps one fold open (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  const ztm = screen.getByTestId("fold-mode-ztm");
  expect(ztm.props.accessibilityState).toMatchObject({ expanded: true });
  fireEvent.press(screen.getByTestId("fold-mode-skm"));
  expect(screen.getByTestId("fold-mode-skm").props.accessibilityState).toMatchObject({ expanded: true });
  expect(screen.getByTestId("fold-mode-ztm").props.accessibilityState).toMatchObject({ expanded: false });
});

test("the zone switch changes the price list; one list keeps one shape (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-transport"));
  // The Gdańsk list holds a grosze price, so every price shows grosze.
  expect(screen.getByText("4,80 zł")).toBeTruthy();
  fireEvent.press(screen.getByTestId("seg-zone-rail"));
  expect(screen.getByText("30 zł")).toBeTruthy();
  expect(screen.queryByText("4,80 zł")).toBeNull();
});

test("the schematic places are buttons; the chosen place is described (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-city"));
  fireEvent.press(screen.getByTestId("city-spot-stogi"));
  expect(screen.getByText("Шырокі спакойны пляж.")).toBeTruthy();
  // The named warning of the cut trams stays a visible remark, not a title.
  expect(screen.getByText(/Мост Siennicki закрыты/)).toBeTruthy();
});

test("the payment filter dims the services that refuse the chosen way (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-food"));
  fireEvent.press(screen.getByTestId("pay-blik"));
  // Bolt Food takes no BLIK: the honest unconfirmed line replaces its tags.
  expect(screen.getByText("BLIK: афіцыйна не пацверджана")).toBeTruthy();
});

test("the tourist card term switch reprices the packages (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  expect(screen.getByText("75 zł")).toBeTruthy();
  fireEvent.press(screen.getByTestId("seg-hours-72"));
  expect(screen.getByText("95 zł")).toBeTruthy();
});

test("the free-days week opens the chosen day's museum lines (criterion 5)", () => {
  openGuide();
  fireEvent.press(screen.getByTestId("wheel-item-card"));
  fireEvent.press(screen.getByTestId("card-day-2"));
  expect(screen.getByText(/Білет за 0 zł выдаюць толькі ў касе/)).toBeTruthy();
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

test("a failed open leaves the page address on the screen (criterion 7)", async () => {
  const spy = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("offline"));
  openGuide();
  fireEvent.press(screen.getByTestId("link-about-airportBuses"));
  // The whole remark is one text node: the sentence and the address.
  expect(await screen.findByText(new RegExp(ABOUT_CITY_LINK_URLS.airportBuses.replace(/[.//]/g, "\\$&")))).toBeTruthy();
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
