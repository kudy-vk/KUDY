// Issue #303 — the illustrated Tricity map component: the layer switches,
// the pick card of a zone, a station and the airport, the Google Maps button
// (M13) and the zone list that picks and flies. The gestures themselves are
// the RNGH/Reanimated layer the jest mocks stub out; the under-the-finger
// pick logic runs in the pure modules and is guarded by
// test/about-map.test.mjs. The suite doubles as the jest wiring guard for
// the reused mockup modules: dropping the design/production transform from
// jest.config.js dies here on the ESM parse error.
import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useState } from "react";
import { Linking } from "react-native";

import { AboutCityMap, ABOUT_CITY_ATLAS_INITIAL, type AboutCityAtlasState } from "./about-city-map";
import { aboutCityText } from "./about-city-content";
import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";

// The map's gestures run on the RNGH/Reanimated layer jest cannot host; the
// render suite stubs the gesture builder out through the shared mock (the
// pick logic runs in the pure modules and is guarded by
// test/about-map.test.mjs). The suite doubles as the jest wiring guard for
// the reused mockup modules: dropping the design/production transform from
// jest.config.js dies here on the ESM parse error.
jest.mock("react-native-gesture-handler", () => {
  const { gestureHandlerMock } = require("../test/gesture-handler-mock") as typeof import("../test/gesture-handler-mock");
  return gestureHandlerMock();
});

const atlasWith = (patch: Partial<AboutCityAtlasState>): AboutCityAtlasState => ({ ...ABOUT_CITY_ATLAS_INITIAL, ...patch });

// The atlas state is the caller's; the harness holds it the way the section
// state does, so the map's setAtlas patches land in the render.
function Harness({ initial, lang }: { initial: AboutCityAtlasState; lang: "be" | "en" }) {
  const [atlas, setAtlasState] = useState(initial);
  const onOpenSection = jest.fn();
  harness.onOpenSection = onOpenSection;
  return (
    <AboutCityMap
      t={aboutCityText(ABOUT_CITY_STRINGS[lang])}
      lang={lang}
      atlas={atlas}
      setAtlas={(patch) => setAtlasState((prev) => ({ ...prev, ...patch }))}
      foldOpen
      onToggleFold={() => undefined}
      onOpenSection={onOpenSection}
    />
  );
}
const harness: { onOpenSection: (id: "airport") => void } = { onOpenSection: () => undefined };

function renderMap(atlas: AboutCityAtlasState = ABOUT_CITY_ATLAS_INITIAL, lang: "be" | "en" = "be") {
  render(<Harness initial={atlas} lang={lang} />);
  return { onOpenSection: harness.onOpenSection };
}

test("the map renders with the hint card and the four layer switches", () => {
  renderMap();
  expect(screen.getByTestId("city-map")).toBeTruthy();
  expect(screen.getByText("Націсні на каляровую зону, станцыю або знак аэрапорта, каб даведацца, што гэта.")).toBeTruthy();
  expect(screen.getByTestId("city-map-layer-visit").props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByTestId("city-map-layer-plan").props.accessibilityState).toMatchObject({ selected: true });
  // The switches carry the zone counts of the owner's list (M12).
  expect(screen.getByText("10")).toBeTruthy();
  expect(screen.getByText("12")).toBeTruthy();
});

test("a layer switch turns its chip off through the atlas state", () => {
  renderMap();
  fireEvent.press(screen.getByTestId("city-map-layer-stay"));
  expect(screen.getByTestId("city-map-layer-stay").props.accessibilityState).toMatchObject({ selected: false });
  expect(screen.getByTestId("city-map-layer-visit").props.accessibilityState).toMatchObject({ selected: true });
});

test("the zone list picks the zone; the card names it, its kind and the way in", () => {
  renderMap();
  fireEvent.press(screen.getByTestId("city-map-zone-sopot"));
  const card = within(screen.getByTestId("city-map-card"));
  expect(card.getByText("Sopot")).toBeTruthy();
  expect(card.getByText("Месцы для наведвання")).toBeTruthy();
  expect(card.getByText("Курортны цэнтр: вуліца Monte Cassino (Monciak) вядзе да мора і мола.")).toBeTruthy();
  // The nearest running stop rides the ways (zone.stop, ≤1.5 km).
  expect(card.getByText(/\d+,\d км па прамой/)).toBeTruthy();
});

test("the English zone card keeps one decimal digit with a point", () => {
  renderMap(atlasWith({ pick: { kind: "zone", id: "sopot" } }), "en");
  expect(within(screen.getByTestId("city-map-card")).getByText(/\d+\.\d km in a straight line/)).toBeTruthy();
});

test("the station card carries the line badges and the change note", () => {
  renderMap(atlasWith({ pick: { kind: "station", id: "wrzeszcz" } }));
  const card = within(screen.getByTestId("city-map-card"));
  expect(card.getByText("Gdańsk Wrzeszcz")).toBeTruthy();
  expect(card.getByText("Станцыя")).toBeTruthy();
  expect(card.getByText("SKM")).toBeTruthy();
  expect(card.getByText("PKM")).toBeTruthy();
  expect(card.getByText("Тут перасадка паміж SKM і цягнікамі да аэрапорта.")).toBeTruthy();
});

test("the airport card opens the airport section through the wheel", () => {
  const { onOpenSection } = renderMap(atlasWith({ pick: { kind: "airport", id: "airport" } }));
  expect(within(screen.getByTestId("city-map-card")).getByText("Port Lotniczy Gdańsk")).toBeTruthy();
  fireEvent.press(screen.getByTestId("city-map-airport-go"));
  expect(onOpenSection).toHaveBeenCalledWith("airport");
});

test("the Google Maps button opens the picked place; the hint opens the Tricity middle (M13)", () => {
  const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  const picked = renderMap(atlasWith({ pick: { kind: "zone", id: "glowne" } }));
  fireEvent.press(screen.getByTestId("city-map-google"));
  expect(spy).toHaveBeenLastCalledWith(expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=54\.3\d+,18\.6\d+$/));

  renderMap();
  fireEvent.press(screen.getByTestId("city-map-google"));
  expect(spy).toHaveBeenLastCalledWith("https://www.google.com/maps/search/?api=1&query=54.41000,18.60000");
  spy.mockRestore();
  expect(picked).toBeTruthy();
});

test("a failed Google Maps open leaves the address on the screen", async () => {
  const spy = jest.spyOn(Linking, "openURL").mockRejectedValueOnce(new Error("offline"));
  renderMap();
  fireEvent.press(screen.getByTestId("city-map-google"));
  expect(await screen.findByText(/google\.com\/maps\/search/)).toBeTruthy();
  // The next open succeeds: the stale failed-open notice is gone.
  spy.mockResolvedValueOnce(undefined as never);
  fireEvent.press(screen.getByTestId("city-map-google"));
  await waitFor(() => expect(screen.queryByText(/google\.com\/maps\/search/)).toBeNull());
  spy.mockRestore();
});

test("the zone list picks a stay zone; its ways come from the map data", () => {
  renderMap();
  fireEvent.press(screen.getByTestId("city-map-zone-wrzeszcz"));
  const card = within(screen.getByTestId("city-map-card"));
  expect(card.getByText("Wrzeszcz")).toBeTruthy();
  expect(card.getByText("Зручна спыніцца")).toBeTruthy();
});

// #312 — without a pointer the list rows are the screen reader's path to
// every selectable sign: named buttons over the one production pick path,
// their cards announced through the live region (the app port of the
// mockup's subtest «without a pointer…», test/about-map-browser.test.mjs).
test("without a pointer, the list reaches the airport and a station and picks them like a touch (#312)", () => {
  renderMap();
  expect(screen.getByTestId("city-map-card").props.accessibilityLiveRegion).toBe("polite");
  const airport = screen.getByTestId("city-map-airport");
  expect(airport.props.accessibilityRole).toBe("button");
  expect(airport.props.accessibilityLabel).toBe("Port Lotniczy Gdańsk");
  fireEvent.press(airport);
  const airportCard = within(screen.getByTestId("city-map-card"));
  expect(airportCard.getByText("Port Lotniczy Gdańsk")).toBeTruthy();
  expect(airportCard.getByText("GDN")).toBeTruthy();

  const station = screen.getByTestId("city-map-station-gdynia-glowna");
  expect(station.props.accessibilityRole).toBe("button");
  expect(station.props.accessibilityLabel).toBe("Gdynia Główna");
  fireEvent.press(station);
  const card = within(screen.getByTestId("city-map-card"));
  expect(card.getByText("Gdynia Główna")).toBeTruthy();
  expect(card.getByText("Станцыя")).toBeTruthy();
});

test("a station row on a hidden layer turns the layer back on and picks the station (#312)", () => {
  renderMap(atlasWith({ show: { ...ABOUT_CITY_ATLAS_INITIAL.show, rail: false } }));
  expect(screen.getByTestId("city-map-layer-rail").props.accessibilityState).toMatchObject({ selected: false });
  fireEvent.press(screen.getByTestId("city-map-station-gdynia-glowna"));
  expect(screen.getByTestId("city-map-layer-rail").props.accessibilityState).toMatchObject({ selected: true });
  expect(within(screen.getByTestId("city-map-card")).getByText("Gdynia Główna")).toBeTruthy();
});

test("a planned station row opens the planned card (#312)", () => {
  renderMap();
  fireEvent.press(screen.getByTestId("city-map-station-chelm"));
  const card = within(screen.getByTestId("city-map-card"));
  expect(card.getByText("Chełm")).toBeTruthy();
  expect(card.getByText("Плануецца")).toBeTruthy();
});
