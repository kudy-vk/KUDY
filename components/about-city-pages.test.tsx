// The section pages' own suite (the owner's 2026-11-17 request): the strip
// rides the wheel's position through the one wrap math (slotOffset), so a
// settled wheel puts the open page exactly in the middle — the guard that
// fails if an entry offset (the old stuck from-side slide) ever comes back
// — and only the open page takes touches or meets the screen reader.
// The map's gestures run on the RNGH/Reanimated layer jest cannot host; the
// shared mock stubs the gesture builder out (the map pick logic is guarded
// by test/about-map.test.mjs).
import { describe, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { ABOUT_CITY_SECTIONS, aboutCityText, type AboutCitySectionId } from "./about-city-content";
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
      ring={5 * SLOT}
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
    expect(translateXOf("food")).toBe(-2 * WIDTH);
    expect(translateXOf("card")).toBe(-WIDTH);
  });

  test("one wheel slot moves a page a full width; a full ring wraps it home", () => {
    render(<PagesHarness posValue={SLOT} activeId="airport" />);
    expect(translateXOf("transport")).toBe(0);
    expect(translateXOf("airport")).toBe(-WIDTH);
    render(<PagesHarness posValue={5 * SLOT} activeId="airport" />);
    expect(translateXOf("airport")).toBe(0);
    expect(translateXOf("food")).toBe(-2 * WIDTH);
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
