// Issue #252 — the wheel's own suite. The coast math is the port of the
// owner-approved mockup module (docs/design/production/about-wheel.mjs), so
// the pure-function tests pin the exact approved numbers, and the render
// tests prove the select paths: a press on a side item brings it to the
// middle and fires the section select, and a section change made outside
// the wheel (the screen's index echo — the map's airport card) turns the
// wheel to that item. slotOffset carries the one wrap math the section
// pages ride (components/about-city-pages.tsx).
import { describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";

import {
  COAST_TIME,
  MAX_TURN,
  SPEED_WINDOW,
  STEP_TIME,
  TAP_SLOP,
  AboutCityWheel,
  releaseSpeed,
  slotOffset,
  stopAfterPush,
  type SpeedSample,
} from "./about-city-wheel";
import PlaneIcon from "lucide-react-native/icons/plane";
import MapIcon from "lucide-react-native/icons/map";

const ITEMS = [
  { id: "airport", icon: PlaneIcon, label: "Аэрапорт" },
  { id: "city", icon: MapIcon, label: "Дзе што ў горадзе" },
] as const;

const SLOT = 100;

test("the coast constants keep the mockup's approved numbers", async () => {
  expect(COAST_TIME).toBe(300);
  expect(STEP_TIME).toBe(110);
  expect(SPEED_WINDOW).toBe(100);
  expect(TAP_SLOP).toBe(6);
  expect(MAX_TURN).toBe(1.5);
});

describe("releaseSpeed", () => {
  test("a hand that stood still before letting go gives 0", async () => {
    const samples: SpeedSample[] = [[0, 500], [400, 500]];
    expect(releaseSpeed(samples, 500)).toBe(0);
  });

  test("the speed reads the last SPEED_WINDOW of the drag, positive when the hand moved left", async () => {
    // 100 px left over the last 50 ms → 2 px/ms forward.
    const samples: SpeedSample[] = [[0, 500], [50, 400]];
    expect(releaseSpeed(samples, 60)).toBeCloseTo(2);
  });

  test("older movement outside the window is ignored", async () => {
    const samples: SpeedSample[] = [[0, 0], [1000, 400], [180, 480], [200, 480]];
    // Only the [180..200] window counts: no movement → 0.
    expect(releaseSpeed(samples, 200)).toBe(0);
  });
});

describe("stopAfterPush", () => {
  test("speed 0 settles on the nearest item", async () => {
    expect(stopAfterPush({ position: 260, speed: 0, slot: SLOT, count: 5 })).toBe(300);
    expect(stopAfterPush({ position: 249, speed: 0, slot: SLOT, count: 5 })).toBe(200);
  });

  test("a light push moves one item, a strong one several", async () => {
    // 0.4 px/ms × 300 ms = 120 px → one slot; 2 px/ms × 300 ms = 600 px →
    // six slots.
    expect(stopAfterPush({ position: 0, speed: 0.4, slot: SLOT, count: 5 })).toBe(100);
    expect(stopAfterPush({ position: 0, speed: 2, slot: SLOT, count: 5 })).toBe(600);
  });

  test("the coast clamps at MAX_TURN rings either way", async () => {
    // The clamp limit sits between slots; the wheel settles on the nearest
    // item (the mockup's round-to-nearest rule — its half rounds up, so the
    // backward clamp lands a slot nearer than the forward one).
    expect(stopAfterPush({ position: 0, speed: 1000, slot: SLOT, count: 5 })).toBe(800);
    expect(stopAfterPush({ position: 0, speed: -1000, slot: SLOT, count: 5 })).toBe(-700);
  });
});

describe("slotOffset — the wrap math the medals and the section pages share", () => {
  test("the middle item sits at 0; the neighbors stand a slot away each side", async () => {
    expect(slotOffset(0, 0, SLOT, 5 * SLOT)).toBe(0);
    expect(slotOffset(1, 0, SLOT, 5 * SLOT)).toBe(SLOT);
    expect(slotOffset(2, 0, SLOT, 5 * SLOT)).toBe(2 * SLOT);
    expect(slotOffset(3, 0, SLOT, 5 * SLOT)).toBe(-2 * SLOT);
    expect(slotOffset(4, 0, SLOT, 5 * SLOT)).toBe(-SLOT);
  });

  test("a full ring forward brings every item back to its place", async () => {
    expect(slotOffset(0, 5 * SLOT, SLOT, 5 * SLOT)).toBe(0);
    expect(slotOffset(3, 5 * SLOT, SLOT, 5 * SLOT)).toBe(-2 * SLOT);
  });

  test("settling on an item puts it exactly in the middle (the pages' alignment)", async () => {
    // The pages flip by this math: at the settled position the open page
    // carries no offset — a re-introduced entry nudge would fail here.
    for (const item of [0, 1, 2, 3, 4]) {
      expect(slotOffset(item, item * SLOT, SLOT, 5 * SLOT)).toBe(0);
    }
  });
});

// The screen's own contract: the open section comes back through the
// `index` prop. The harness mirrors it, so a press and an outside change
// both take the road the production screen gives them.
test("a press on a side item selects it and fires the section select", async () => {
  const onSelect = jest.fn();
  function Harness() {
    const [index, setIndex] = useState(0);
    return (
      <AboutCityWheel
        items={ITEMS}
        index={index}
        slot={SLOT}
        label="Раздзелы"
        onSelect={(next: number, direction: number) => {
          onSelect(next, direction);
          setIndex(next);
        }}
      />
    );
  }
  await render(<Harness />);
  const side = screen.getByTestId("wheel-item-city");
  expect(side.props.accessibilityState).toMatchObject({ selected: false });
  await fireEvent.press(side);
  expect(onSelect).toHaveBeenCalledWith(1, expect.any(Number));
  // The echoed index finds `chosen` already on the item: the wheel stays.
  expect(screen.getByTestId("wheel-item-city").props.accessibilityState).toMatchObject({ selected: true });
});

test("a section change made outside the wheel turns the wheel to that item", async () => {
  let setOutside: ((next: number) => void) | null = null;
  function Harness() {
    const [index, setIndex] = useState(0);
    setOutside = setIndex;
    return (
      <AboutCityWheel items={ITEMS} index={index} slot={SLOT} label="Раздзелы" onSelect={() => undefined} />
    );
  }
  await render(<Harness />);
  expect(screen.getByTestId("wheel-item-airport").props.accessibilityState).toMatchObject({ selected: true });
  // The map's airport card road: the screen re-renders with another section.
  await act(() => setOutside?.(1));
  expect(screen.getByTestId("wheel-item-city").props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByTestId("wheel-item-airport").props.accessibilityState).toMatchObject({ selected: false });
});
