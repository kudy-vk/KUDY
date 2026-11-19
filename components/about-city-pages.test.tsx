// The section pages' own suite (the owner's 2026-11-17 request): the strip
// rides the wheel's position through the one wrap math (slotOffset), so a
// settled wheel puts the open page exactly in the middle — the guard that
// fails if an entry offset (the old stuck from-side slide) ever comes back
// — and only the open page takes touches or meets the screen reader.
// The map's gestures run on the RNGH/Reanimated layer jest cannot host; the
// shared mock stubs the gesture builder out (the map pick logic is guarded
// by test/about-map.test.mjs).
import { describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { ABOUT_CITY_LINK_URLS, ABOUT_CITY_SECTIONS, aboutCityText, type AboutCitySectionId } from "./about-city-content";
import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";
import { ABOUT_CITY_INITIAL_UI } from "./about-city-sections";
import { AboutCityPages, type AboutCityPagesContext } from "./about-city-pages";

jest.mock("react-native-gesture-handler", () => {
  const { gestureHandlerMock } = require("../test/gesture-handler-mock") as typeof import("../test/gesture-handler-mock");
  return gestureHandlerMock();
});

const SLOT = 100;
const WIDTH = 390;

const noOp = () => undefined;
const ctx: AboutCityPagesContext = {
  strings: ABOUT_CITY_STRINGS.be,
  t: aboutCityText(ABOUT_CITY_STRINGS.be),
  ui: ABOUT_CITY_INITIAL_UI,
  setUi: noOp,
  toggleFold: noOp,
  onOpenSection: noOp,
  openLink: noOp,
};

// The harness remounts the strip per position value: the reanimated jest
// mock evaluates the animated styles at mount time, so each geometry case
// renders the strip fresh at its own wheel position.
function PagesHarness({ posValue, activeId }: { posValue: number; activeId: AboutCitySectionId }) {
  const pos = useSharedValue(posValue);
  pos.value = posValue;
  return (
    <AboutCityPages
      key={posValue}
      sections={ABOUT_CITY_SECTIONS}
      pos={pos}
      slot={SLOT}
      ring={ABOUT_CITY_SECTIONS.length * SLOT}
      width={WIDTH}
      activeId={activeId}
      ctx={ctx}
      failedLink={null}
    />
  );
}

const translateXOf = (id: AboutCitySectionId): number => {
  // The geometry is not about accessibility: read every page, the hidden
  // ones included.
  const style = StyleSheet.flatten(
    screen.getByTestId(`about-page-${id}`, { includeHiddenElements: true }).props.style as StyleProp<ViewStyle>,
  );
  const transform = (style?.transform ?? []) as readonly { translateX?: number }[];
  const shift = transform.find((entry) => typeof entry.translateX === "number");
  if (!shift || typeof shift.translateX !== "number") throw new Error(`page ${id} carries no translateX`);
  return shift.translateX;
};

describe("the strip rides the wheel's ring", () => {
  test("the settled wheel puts the open page exactly in the middle — no entry offset", () => {
    render(<PagesHarness posValue={0} activeId="airport" />);
    expect(translateXOf("airport")).toBe(0);
    // The neighbors stand where their medals do: one slot = one page width.
    expect(translateXOf("transport")).toBe(WIDTH);
    expect(translateXOf("city")).toBe(2 * WIDTH);
    expect(translateXOf("food")).toBe(-WIDTH);
  });

  test("one wheel slot moves a page a full width; a full ring wraps it home", () => {
    render(<PagesHarness posValue={SLOT} activeId="airport" />);
    expect(translateXOf("transport")).toBe(0);
    expect(translateXOf("airport")).toBe(-WIDTH);
    render(<PagesHarness posValue={4 * SLOT} activeId="airport" />);
    expect(translateXOf("airport")).toBe(0);
    expect(translateXOf("food")).toBe(-WIDTH);
  });

  test("every settled section places its page at exactly zero", () => {
    // The Instagram-like flip settles without a residue: at the wheel's
    // settled position the open page's offset is 0 in the exact numbers,
    // not approximately.
    ABOUT_CITY_SECTIONS.forEach((section, index) => {
      render(<PagesHarness posValue={index * SLOT} activeId={section.id} />);
      expect(translateXOf(section.id)).toBe(0);
    });
  });
});

test("only the open page takes touches and meets the screen reader", () => {
  render(<PagesHarness posValue={0} activeId="food" />);
  expect(screen.getByTestId("about-page-food").props.pointerEvents).toBe("auto");
  expect(screen.getByTestId("about-page-food").props.accessibilityElementsHidden).toBe(false);
  for (const { id } of ABOUT_CITY_SECTIONS) {
    if (id === "food") continue;
    // The hidden page takes no touches, and the default queries — the
    // screen reader's road — do not reach it at all.
    expect(screen.getByTestId(`about-page-${id}`, { includeHiddenElements: true }).props.pointerEvents).toBe("none");
    expect(screen.queryByTestId(`about-page-${id}`)).toBeNull();
  }
});

function InteractivePages({ activeId = "airport", locale = "be", failedLink = null, openLink = noOp }: {
  activeId?: AboutCitySectionId;
  locale?: "be" | "en";
  failedLink?: string | null;
  openLink?: (url: string) => void;
}) {
  const [ui, setUiState] = useState(ABOUT_CITY_INITIAL_UI);
  const strings = ABOUT_CITY_STRINGS[locale];
  const position = useSharedValue(0);
  return (
    <AboutCityPages sections={ABOUT_CITY_SECTIONS} pos={position} slot={SLOT}
      ring={ABOUT_CITY_SECTIONS.length * SLOT} width={WIDTH} activeId={activeId}
      failedLink={failedLink} ctx={{
        ...ctx, strings, t: aboutCityText(strings), ui, openLink,
        setUi: (patch) => setUiState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) })),
        toggleFold: (group, id, open) => setUiState((prev) => ({
          ...prev, folds: { ...prev.folds, ...Object.fromEntries(group.map((key) => [key, key === id ? open : open ? false : prev.folds[key]])) },
        })),
      }} />
  );
}

test("M14 displays four sections and direction cards with accessible, unprinted labels", () => {
  expect(ABOUT_CITY_SECTIONS.map(({ id }) => id)).toEqual(["airport", "transport", "city", "food"]);
  render(<InteractivePages />);
  const page = within(screen.getByTestId("about-page-airport"));
  expect(page.getByRole("radio", { name: "З аэрапорта" }).props.accessibilityState.checked).toBe(true);
  expect(page.getByRole("radio", { name: "У аэрапорт" }).props.accessibilityState.checked).toBe(false);
  expect(page.queryByText("З аэрапорта")).toBeNull();
  expect(page.queryByText("У аэрапорт")).toBeNull();
  fireEvent.press(page.getByRole("radio", { name: "У аэрапорт" }));
  expect(page.getByRole("radio", { name: "У аэрапорт" }).props.accessibilityState.checked).toBe(true);
  expect(page.getByRole("radio", { name: "З аэрапорта" }).props.accessibilityState.checked).toBe(false);
});

test("English directions retain their accessible names", () => {
  render(<InteractivePages locale="en" />);
  const words = ABOUT_CITY_STRINGS.en.air;
  expect(screen.getByRole("radio", { name: words.dirFrom })).toBeTruthy();
  expect(screen.getByRole("radio", { name: words.dirTo })).toBeTruthy();
});

test("airport steps are collapsed, mutually exclusive and remembered separately", () => {
  render(<InteractivePages />);
  const page = within(screen.getByTestId("about-page-airport"));
  const step = (direction: string, n: number) => page.getByTestId("fold-airport-" + direction + "-step-" + n);
  for (const n of [1, 2, 3]) expect(step("from", n).props.accessibilityState.expanded).toBe(false);
  fireEvent.press(step("from", 1));
  expect(step("from", 1).props.accessibilityState.expanded).toBe(true);
  fireEvent.press(step("from", 3));
  expect(step("from", 1).props.accessibilityState.expanded).toBe(false);
  expect(step("from", 3).props.accessibilityState.expanded).toBe(true);
  expect(page.queryByText(/\d+(?:[,.]\d{1,2})?\s*zł|12 снежня 2026|Праверана/)).toBeNull();
  fireEvent.press(page.getByTestId("seg-direction-to"));
  for (const n of [1, 2, 3]) expect(step("to", n).props.accessibilityState.expanded).toBe(false);
  fireEvent.press(step("to", 2));
  fireEvent.press(page.getByTestId("seg-direction-from"));
  expect(step("from", 3).props.accessibilityState.expanded).toBe(true);
  expect(step("from", 2).props.accessibilityState.expanded).toBe(false);
});

test("tourist card is offline and only on the journey from the airport", () => {
  const openLink = jest.fn();
  render(<InteractivePages openLink={openLink} />);
  const page = within(screen.getByTestId("about-page-airport"));
  const card = within(page.getByTestId("about-tourist-card"));
  expect(card.getByText("KT")).toBeTruthy();
  expect(card.queryByText(ABOUT_CITY_STRINGS.be.card.lead)).toBeNull();
  fireEvent.press(card.getByTestId("fold-tourist-card"));
  expect(card.getByText(ABOUT_CITY_STRINGS.be.card.lead)).toBeTruthy();
  fireEvent.press(card.getByTestId("official-card"));
  expect(openLink).toHaveBeenCalledWith("https://kartaturysty.visitgdansk.com/pl/pakiety");
  fireEvent.press(page.getByTestId("seg-direction-to"));
  expect(page.queryByTestId("about-tourist-card")).toBeNull();
});

test("resident card opens its official site; other official links start closed", () => {
  const openLink = jest.fn();
  render(<InteractivePages activeId="transport" openLink={openLink} />);
  const page = within(screen.getByTestId("about-page-transport"));
  const card = within(page.getByTestId("about-resident-card"));
  expect(card.getByText("Jestem z Gdańska")).toBeTruthy();
  fireEvent.press(card.getByTestId("official-resident"));
  expect(openLink).toHaveBeenCalledWith("https://jestemzgdanska.pl/");
  const fold = page.getByRole("button", { name: "Афіцыйныя спасылкі" });
  expect(fold.props.accessibilityState.expanded).toBe(false);
  expect(page.queryByTestId("link-about-ztmSchedule")).toBeNull();
  fireEvent.press(fold);
  fireEvent.press(page.getByTestId("link-about-ztmSchedule"));
  expect(openLink).toHaveBeenCalledWith(ABOUT_CITY_LINK_URLS.ztmSchedule);
});

test("the failed card link is shown even while the official list is closed", () => {
  render(<InteractivePages activeId="transport" failedLink={ABOUT_CITY_LINK_URLS.jestemZGdanska} />);
  const page = within(screen.getByTestId("about-page-transport"));
  expect(page.getByText(ABOUT_CITY_STRINGS.be.link.failed(ABOUT_CITY_LINK_URLS.jestemZGdanska))).toBeTruthy();
  expect(page.getByTestId("fold-official-sources-transport").props.accessibilityState.expanded).toBe(false);
});
