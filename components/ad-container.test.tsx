// #215 — the ad container's collapse contract (M6): with no ad loaded the
// component renders nothing at all — no zone, no padding, no empty space;
// with an ad the reserved 90dp framed slot stands (kit.css `.ad-zone`/
// `.ad-slot`).
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { tokens } from "./design-tokens";
import { AdContainer } from "./ad-container";

type Style = Record<string, unknown>;

function layers(style: unknown): Style[] {
  const flat = (value: unknown): Style[] =>
    Array.isArray(value) ? value.flatMap(flat) : value ? [value as Style] : [];
  return flat(style);
}

describe("ad container (#215, decision M6)", () => {
  test("no ad loaded — the zone vanishes and leaves no empty space", () => {
    const { toJSON } = render(<AdContainer loaded={false} testID="ad" />);
    expect(screen.queryByTestId("ad")).toBeNull();
    expect(toJSON()).toBeNull();
  });

  test("an ad is loaded — the reserved 90dp slot stands, framed with the line pair", () => {
    const { toJSON } = render(<AdContainer loaded testID="ad" />);
    const zone = screen.getByTestId("ad");
    expect(layers(zone.props.style)).toMatchObject([
      { paddingBottom: 8, paddingHorizontal: 16, paddingTop: 8 },
    ]);
    const slot = zone.props.children;
    expect(layers(slot.props.style)).toMatchObject([
      { backgroundColor: tokens.colorCard, borderColor: tokens.colorLine, borderWidth: 1, height: 90 },
    ]);
    expect(toJSON()).not.toBeNull();
  });
});
