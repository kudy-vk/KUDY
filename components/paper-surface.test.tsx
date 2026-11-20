// G06.10.e (issue #405) — the paper-surface suite: the grain layer renders
// under the content and consumes the layer token — the file-level mock
// overrides the mirror's opacity with a synthetic value, so a hardcoded
// canon literal in the wrapper fails the opacity assertion
// (implementation-rules 1: the reverted-line check). The layer is
// decorative: hidden from the accessibility tree — the screen-reader tree
// of a surface is its content, never the texture.
import { describe, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Dimensions, Text, type ScaledSize } from "react-native";

import { PaperSurface } from "./paper-surface";

// The synthetic override differs from the canon 0.05 on purpose: the
// assertion reads the mock's value, so only a wrapper that actually
// consumes the mirror paints the overridden opacity.
jest.mock("./design-tokens", () => {
  const actual = jest.requireActual("./design-tokens") as { tokens: Record<string, unknown> };
  return { ...actual, tokens: { ...actual.tokens, texturePaperGrainOpacity: 0.5 } };
});

let mockScheme = "light";
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true, default: () => mockScheme,
}));

// Issue #431: the tiling window is synthetic and differs from the jest
// default on purpose — the size assertions read this value, so only a
// wrapper that sizes the grain through useWindowDimensions (which reads
// Dimensions) passes them. The hook itself stays real.
const syntheticWindow: ScaledSize = { width: 411, height: 875, scale: 3, fontScale: 1 };
jest.spyOn(Dimensions, "get").mockReturnValue(syntheticWindow);

async function renderSurface() {
  return await render(
    <PaperSurface testID="surface">
      <Text style={{ fontSize: 16 }}>Зярно паперы</Text>
    </PaperSurface>,
  );
}

type HostNode = { props?: { testID?: string; style?: unknown; source?: unknown } } | null;

function mergedStyle(node: HostNode): Record<string, unknown> {
  return Object.assign(
    {},
    ...[node?.props?.style].flat(Infinity).filter((s) => s && typeof s === "object"),
  ) as Record<string, unknown>;
}

// RNTL 14 keeps the mounted-but-hidden layer queryable (the global config
// sets defaultIncludeHiddenElements), so the grain is reached with the
// explicit includeHiddenElements view; the a11y-invisibility itself is
// pinned by the marker assertions in its own test.
function grainLayer() {
  return screen.getByTestId("paper-grain", { includeHiddenElements: true }) as unknown as HostNode;
}

describe("PaperSurface (G06.10.e)", () => {
  test("M3 grain uses four percent muted tint above the gradient", async () => {
    mockScheme = "dark";
    try {
      await renderSurface();
      expect(mergedStyle(grainLayer())).toMatchObject({ opacity: 0.04, tintColor: "#d6c5b0" });
      expect(screen.getByTestId("screen-gradient", { includeHiddenElements: true })).toBeTruthy();
    } finally {
      mockScheme = "light";
    }
  });

  test("the grain layer renders under the content at the mirror opacity", async () => {
    await renderSurface();
    const grain = grainLayer();
    expect(grain?.props?.source).toBeDefined();
    expect((grain?.props as { resizeMode?: string })?.resizeMode).toBe("repeat");
    expect(mergedStyle(grain).opacity).toBe(0.5);
    // The way React Native paints the stack: the grain is the surface's
    // first child, the content renders above it.
    const tree = screen.toJSON() as { children?: HostNode[] };
    expect(tree.children?.[0]?.props?.testID).toBe("paper-grain");
    expect(tree.children?.[1]?.props?.testID).toBeUndefined();
  });

  test("children render above the grain and carry none of it", async () => {
    await renderSurface();
    expect(screen.getByText("Зярно паперы")).toBeTruthy();
    const tree = screen.toJSON() as { props?: { testID?: string }; children?: HostNode[] };
    expect(tree.props?.testID).toBe("surface");
    expect(mergedStyle(tree.children?.[1] ?? null).opacity).toBeUndefined();
    // The paper underneath is the canon token through the mirror, not a
    // screen-side literal.
    expect(mergedStyle(screen.getByTestId("surface") as unknown as HostNode).backgroundColor).toBe(
      "#faf7f2",
    );
  });

  test("the layer is invisible to the accessibility tree", async () => {
    await renderSurface();
    // RNTL 14 keeps the decorative layer mounted and the global query config
    // sees hidden elements by default (test/rntl-configure.js), so the old
    // "default query finds nothing" proxy no longer holds. The screen
    // reader's road is pinned directly by the a11y-hidden markers the host
    // carries — the screen-reader tree of the surface is its content only.
    const grain = grainLayer();
    expect(grain?.props).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  // Issue #431: with an absolute fill layer Android's repeat paints through a
  // view-sized postprocessor that races the first layout and collapses to
  // one raw corner tile. The JS-side cause the suite can pin is the
  // explicit window size: reverting the layer to a measured fill drops
  // width/height from the style and turns this red.
  test("the grain layer is sized from the window, not measured (#431)", async () => {
    await renderSurface();
    const style = mergedStyle(grainLayer());
    expect(style.position).toBe("absolute");
    expect(style.width).toBe(411);
    expect(style.height).toBe(875);
    expect((grainLayer()?.props as { resizeMode?: string })?.resizeMode).toBe("repeat");
  });
});
