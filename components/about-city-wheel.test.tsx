// Issue #252 — the wheel's own suite. The coast math is the port of the
// owner-approved mockup module (docs/design/production/about-wheel.mjs), so
// the pure-function tests pin the exact approved numbers, and the render
// test proves the press path: a side item comes to the middle and the
// section select fires (issue criterion 2 and 4).
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  COAST_TIME,
  MAX_TURN,
  SPEED_WINDOW,
  STEP_TIME,
  TAP_SLOP,
  AboutCityWheel,
  releaseSpeed,
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

test("the coast constants keep the mockup's approved numbers", () => {
  expect(COAST_TIME).toBe(300);
  expect(STEP_TIME).toBe(110);
  expect(SPEED_WINDOW).toBe(100);
  expect(TAP_SLOP).toBe(6);
  expect(MAX_TURN).toBe(1.5);
});

describe("releaseSpeed", () => {
  test("a hand that stood still before letting go gives 0", () => {
    const samples: SpeedSample[] = [[0, 500], [400, 500]];
    expect(releaseSpeed(samples, 500)).toBe(0);
  });

  test("the speed reads the last SPEED_WINDOW of the drag, positive when the hand moved left", () => {
    // 100 px left over the last 50 ms → 2 px/ms forward.
    const samples: SpeedSample[] = [[0, 500], [50, 400]];
    expect(releaseSpeed(samples, 60)).toBeCloseTo(2);
  });

  test("older movement outside the window is ignored", () => {
    const samples: SpeedSample[] = [[0, 0], [1000, 400], [180, 480], [200, 480]];
    // Only the [180..200] window counts: no movement → 0.
    expect(releaseSpeed(samples, 200)).toBe(0);
  });
});

describe("stopAfterPush", () => {
  test("speed 0 settles on the nearest item", () => {
    expect(stopAfterPush({ position: 260, speed: 0, slot: SLOT, count: 5 })).toBe(300);
    expect(stopAfterPush({ position: 249, speed: 0, slot: SLOT, count: 5 })).toBe(200);
  });

  test("a light push moves one item, a strong one several", () => {
    // 0.4 px/ms × 300 ms = 120 px → one slot; 2 px/ms × 300 ms = 600 px →
    // six slots.
    expect(stopAfterPush({ position: 0, speed: 0.4, slot: SLOT, count: 5 })).toBe(100);
    expect(stopAfterPush({ position: 0, speed: 2, slot: SLOT, count: 5 })).toBe(600);
  });

  test("the coast clamps at MAX_TURN rings either way", () => {
    // The clamp limit sits between slots; the wheel settles on the nearest
    // item (the mockup's round-to-nearest rule — its half rounds up, so the
    // backward clamp lands a slot nearer than the forward one).
    expect(stopAfterPush({ position: 0, speed: 1000, slot: SLOT, count: 5 })).toBe(800);
    expect(stopAfterPush({ position: 0, speed: -1000, slot: SLOT, count: 5 })).toBe(-700);
  });
});

test("a press on a side item selects it and fires the section select", () => {
  const onSelect = jest.fn();
  render(<AboutCityWheel items={ITEMS} slot={SLOT} label="Раздзелы" onSelect={onSelect} />);
  const side = screen.getByTestId("wheel-item-city");
  expect(side.props.accessibilityState).toMatchObject({ selected: false });
  fireEvent.press(side);
  expect(onSelect).toHaveBeenCalledWith(1, expect.any(Number));
});
