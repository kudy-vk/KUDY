// Issue #252 — the «Пра горад» render suite: the wheel screen behind the
// map menu's reserve-1 fragment. The guards are the issue's criteria: the
// document renders fully offline (criterion 7 — no fetch), the wheel points
// switch the section under them (criterion 4), the fold groups keep one
// fold open and the blocks follow the layout (criterion 5), every link row
// points at an official page and a failed open leaves the address on the
// screen (criterion 7), and a locale without its own words shows the English
// text (criterion 6, decision L1). The four section pages stay mounted on
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
  "jestemzgdanska.pl",
  "www.pyszne.pl",
  "www.blik.com",
]);

async function openGuide() {
  await renderRouter(frameRoutes(), { initialUrl: "/city/gdansk/about" });
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
    // The a11y contract, now pinned explicitly (SDK 58): the closed page
    // stays mounted on the ring, and the shared RNTL config lifts
    // defaultIncludeHiddenElements to true — so the screen-reader-scoped
    // negative needs its own includeHiddenElements: false to keep meaning
    // «the closed page is not in the accessibility tree».
    expect(screen.queryByTestId(`about-page-${other}`, { includeHiddenElements: false })).toBeNull();
  }
};

test("the guide renders the wheel and the open section without any network call", async () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  await openGuide();
  expect(screen.getByTestId("screen-AboutCity")).toBeTruthy();
  expect(screen.getByTestId("about-city-wheel")).toBeTruthy();
  // The airport section stands in the middle first: what a visitor who just
  // landed needs.
  expect(pageOf("airport").getByText("З аэрапорта і назад")).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("the four section pages ride the strip; only the open one meets the screen reader", async () => {
  await openGuide();
  // Every page stays mounted on the ring (the raw query reaches the hidden
  // ones), and the open page is the only one in the screen-reader tree.
  for (const { id } of ABOUT_CITY_SECTIONS) {
    expect(hiddenPageOf(id)).toBeTruthy();
  }
  expectOpenPage("airport");
});

test("a press on a wheel point opens that section under the wheel (criterion 4)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-food"));
  expectOpenPage("food");
  // The food heading doubles as the wheel label, so the section body carries
  // the assertion.
  expect(pageOf("food").getByText("Аплата ў горадзе")).toBeTruthy();
  await fireEvent.press(screen.getByTestId("wheel-item-airport"));
  expectOpenPage("airport");
});

test("the direction switch turns the airport rides around (criterion 5)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("seg-direction-to"));
  await fireEvent.press(screen.getByTestId("fold-airport-to-step-2"));
  expect(pageOf("airport").getByText("З цэнтра горада")).toBeTruthy();
  expect(pageOf("airport").queryByText("У цэнтр горада")).toBeNull();
});

test("a fold group keeps one fold open (criterion 5)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-transport"));
  const ztm = pageOf("transport").getByTestId("fold-mode-ztm");
  expect(ztm.props.accessibilityState).toMatchObject({ expanded: true });
  await fireEvent.press(pageOf("transport").getByTestId("fold-mode-skm"));
  expect(pageOf("transport").getByTestId("fold-mode-skm").props.accessibilityState).toMatchObject({ expanded: true });
  expect(pageOf("transport").getByTestId("fold-mode-ztm").props.accessibilityState).toMatchObject({ expanded: false });
});

test("the transport section carries no fares and opens the three apps in the owner's order (#254, criterion 6)", async () => {
  // The owner's verdict: prices, the ticket catalogue and the activation
  // rules live in the apps, never in the guide. Bringing any of them back
  // into the transport section fails this test.
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-transport"));
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

test("the transport app rows open the official app pages (criterion 6)", async () => {
  for (const app of ABOUT_CITY_APPS) {
    expect(OFFICIAL_HOSTS.has(new URL(app.url).host)).toBe(true);
  }
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-transport"));
  await fireEvent.press(screen.getByTestId("about-app-fala"));
  expect(spy).toHaveBeenCalledWith("https://systemfala.pl");
  spy.mockRestore();
});

test("the city section shows the illustrated Tricity map, not the schematic (issue #303)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-city"));
  // The map box with the picture, the layer switches and the hint card.
  expect(screen.getByTestId("city-map")).toBeTruthy();
  expect(screen.getByTestId("city-map-layers")).toBeTruthy();
  expect(screen.getByText("Націсні на каляровую зону, станцыю або знак аэрапорта, каб даведацца, што гэта.")).toBeTruthy();
  // The map's caption is the mockup's own: the drawing is approximate.
  expect(screen.getByText(/малюнак прыблізны\. Не для навігацыі\./)).toBeTruthy();
  // The old schematic's places are gone with it.
  expect(screen.queryByTestId("city-spot-stogi")).toBeNull();
});

test("the city section carries no official-pages rows (decision M13)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-city"));
  expect(pageOf("city").queryByText("Афіцыйныя спасылкі")).toBeNull();
  expect(pageOf("city").queryByTestId("link-about-visitGdanskMap")).toBeNull();
  // The other sections keep theirs.
  await fireEvent.press(screen.getByTestId("wheel-item-transport"));
  await fireEvent.press(screen.getByTestId("fold-official-sources-transport"));
  expect(pageOf("transport").getByTestId("link-about-ztmSchedule")).toBeTruthy();
});

test("the payment filter dims the services that refuse the chosen way (criterion 5)", async () => {
  await openGuide();
  await fireEvent.press(screen.getByTestId("wheel-item-food"));
  await fireEvent.press(pageOf("food").getByTestId("pay-blik"));
  // Bolt Food takes no BLIK: the honest unconfirmed line replaces its tags.
  expect(pageOf("food").getByText("BLIK: афіцыйна не пацверджана")).toBeTruthy();
});

test("every section link row points at an official page and opens it (criterion 7)", async () => {
  for (const section of ABOUT_CITY_SECTIONS) {
    for (const linkKey of section.links) {
      expect(OFFICIAL_HOSTS.has(new URL(ABOUT_CITY_LINK_URLS[linkKey]).host)).toBe(true);
    }
  }
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  await openGuide();
  await fireEvent.press(screen.getByTestId("fold-official-sources-airport"));
  await fireEvent.press(screen.getByTestId("link-about-airportBuses"));
  expect(spy).toHaveBeenCalledWith(ABOUT_CITY_LINK_URLS.airportBuses);
  spy.mockRestore();
});

test("a failed open leaves the page address on the screen; another open clears it (criterion 7)", async () => {
  const spy = jest.spyOn(Linking, "openURL").mockRejectedValueOnce(new Error("offline"));
  await openGuide();
  await fireEvent.press(screen.getByTestId("fold-official-sources-airport"));
  await fireEvent.press(screen.getByTestId("link-about-airportBuses"));
  // The whole remark is one text node: the sentence and the address. The
  // failed-open notice stays with its own page.
  expect(await screen.findByText(new RegExp(ABOUT_CITY_LINK_URLS.airportBuses.replace(/[.//]/g, "\\$&")))).toBeTruthy();
  // The next open succeeds: the stale failed-open notice is gone. Reverting
  // the clear in openLink fails this half (voka round 3, missing-revert-test).
  // The ztmSchedule row lives on the open airport page too — no section
  // switch, so the clear is asserted on the very page that showed the notice.
  spy.mockResolvedValueOnce(undefined as never);
  await fireEvent.press(screen.getByTestId("link-about-ztmSchedule"));
  await waitFor(() => expect(screen.queryByText(/Не ўдалося адкрыць старонку/)).toBeNull());
  spy.mockRestore();
});

test("a locale without its own words shows the English text (criterion 6, L1)", async () => {
  // The be+en catalogues both mirror the canonical records; every other
  // display locale selects the English set — the be fallback of #200 is gone.
  expect(aboutCityStrings("be").tab.airport).toBe("Аэрапорт");
  expect(aboutCityStrings("en").tab.airport).toBe("Airport");
  expect(aboutCityStrings("uk").tab.airport).toBe("Airport");
  expect(aboutCityStrings("de").tab.airport).toBe(ABOUT_CITY_STRINGS.en.tab.airport);
  expect(aboutCityStrings("uk").tab.airport).not.toBe(ABOUT_CITY_STRINGS.be.tab.airport);
});

// #334 — regression guards for the accepted #257 mockup (decision M14).
test("M14 has exactly four sections in the accepted order", async () => {
  expect(ABOUT_CITY_SECTIONS.map(({ id }) => id)).toEqual(["airport", "transport", "city", "food"]);
  await openGuide();
  expect(screen.queryByTestId("wheel-item-card", { includeHiddenElements: true })).toBeNull();
  expect(screen.queryByTestId("about-page-card", { includeHiddenElements: true })).toBeNull();
});

test("airport directions keep accessible names without printed switch labels", async () => {
  await openGuide();
  const page = pageOf("airport");
  const from = page.getByRole("radio", { name: "З аэрапорта" });
  const to = page.getByRole("radio", { name: "У аэрапорт" });
  expect(from.props.accessibilityState).toMatchObject({ checked: true });
  expect(to.props.accessibilityState).toMatchObject({ checked: false });
  expect(page.queryByText("З аэрапорта")).toBeNull();
  expect(page.queryByText("У аэрапорт")).toBeNull();
  await fireEvent.press(to);
  expect(page.getByRole("radio", { name: "У аэрапорт" }).props.accessibilityState).toMatchObject({ checked: true });
  expect(page.getByRole("radio", { name: "З аэрапорта" }).props.accessibilityState).toMatchObject({ checked: false });
});

test("the airport steps start closed and keep separate direction state", async () => {
  await openGuide();
  const page = pageOf("airport");
  const first = page.getByRole("button", { name: "Выйдзі з тэрмінала" });
  const ticket = page.getByRole("button", { name: "Вазьмі білет" });
  expect(first.props.accessibilityState).toMatchObject({ expanded: false });
  expect(ticket.props.accessibilityState).toMatchObject({ expanded: false });
  await fireEvent.press(first);
  expect(page.getByRole("button", { name: "Выйдзі з тэрмінала" }).props.accessibilityState).toMatchObject({ expanded: true });
  await fireEvent.press(page.getByRole("radio", { name: "У аэрапорт" }));
  expect(page.getByRole("button", { name: "Вазьмі білет" }).props.accessibilityState).toMatchObject({ expanded: false });
  await fireEvent.press(page.getByRole("button", { name: "Вазьмі білет" }));
  await fireEvent.press(page.getByRole("radio", { name: "З аэрапорта" }));
  expect(page.getByRole("button", { name: "Выйдзі з тэрмінала" }).props.accessibilityState).toMatchObject({ expanded: true });
  expect(page.getByRole("button", { name: "Вазьмі білет" }).props.accessibilityState).toMatchObject({ expanded: false });
});

test("official links start collapsed and open the same address when expanded", async () => {
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  try {
    await openGuide();
    const page = pageOf("airport");
    const fold = page.getByRole("button", { name: "Афіцыйныя спасылкі" });
    expect(fold.props.accessibilityState).toMatchObject({ expanded: false });
    expect(page.queryByTestId("link-about-airportBuses")).toBeNull();
    await fireEvent.press(fold);
    await fireEvent.press(page.getByTestId("link-about-airportBuses"));
    expect(spy).toHaveBeenCalledWith(ABOUT_CITY_LINK_URLS.airportBuses);
  } finally {
    spy.mockRestore();
  }
});

test("tourist and resident card links point to the accepted official destinations", async () => {
  expect(ABOUT_CITY_LINK_URLS).toMatchObject({
    kartaTurysty: "https://kartaturysty.visitgdansk.com/pl/pakiety",
    jestemZGdanska: "https://jestemzgdanska.pl/",
  });
  expect(Object.keys(ABOUT_CITY_LINK_URLS)).not.toContain("muzeumGdanska");
  expect(Object.keys(ABOUT_CITY_LINK_URLS)).not.toContain("muzeum1939");
});
