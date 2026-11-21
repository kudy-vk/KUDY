// APR-10.b (issue #959) — the ≥600dp content-width cap over the real
// screens (rule 15): the canon token content.max-width caps the catalog
// body (explore, guides), the My KUDY settings list and the guide preview
// at 800dp and 1280dp. Removing the cap from any of the four surfaces turns
// this red (implementation-rules 1); the token mirror's canon equality is
// the design-tokens guard's own test/design-tokens.test.mjs pin.
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { renderRouter, screen } from "expo-router/testing-library";
import { Dimensions, type ScaledSize } from "react-native";

import Explore from "./(tabs)/explore";
import My from "./(tabs)/my";
import Guides from "./city/[id]/guides";
import RoutePreview from "./route/[id]";
import { tokens } from "../components/design-tokens";
import { createServices } from "../controllers/createServices";
import { CATALOG_FIXTURES, layoutWith, serve, sha256 } from "../test/render-helpers";
import { getByProps } from "../test/render-helpers";


// The smallest published catalog the two city surfaces render honestly
// (both fixture guides carry the display-locale text, so both stay visible).
const catalog = JSON.stringify({
  catalog_schema_version: 1,
  routes: [
    { route_id: "guide-001", version: "1", locales: ["be"], layers: ["base"] },
    { route_id: "guide-002", version: "1", locales: ["be"], layers: ["base"] },
  ],
});

function atWidth(width: number): void {
  jest.spyOn(Dimensions, "get").mockReturnValue({ width, height: 875, scale: 3, fontScale: 1 } as ScaledSize);
}

// The effective contentContainer style: the surfaces pass a single object or
// a merged array, the cap fields must survive the merge.
function flatContent(style: unknown): Record<string, unknown> {
  return [style]
    .flat(Infinity)
    .filter((part) => part !== null && part !== undefined && typeof part === "object")
    .reduce<Record<string, unknown>>((acc, part) => ({ ...acc, ...(part as Record<string, unknown>) }), {});
}

// Both list kinds carry their content width as one testID'd prop — the FlatList
// of the city surfaces and My KUDY, the ScrollView of the preview.
// RNTL 14 exposes the host-only tree: the FlatList composite is not an
// instance, so the numColumns/columnWrapperStyle contracts read through the
// documented unstable-fiber bridge from the ScrollView host that carries the
// list's testID (app/catalog-list.test.tsx owns the reference pattern).
function flatListProps(id: string): { numColumns?: number; columnWrapperStyle?: unknown } {
  const host = screen.getByTestId(id) as unknown as {
    unstable_fiber: { memoizedProps?: Record<string, unknown>; return?: unknown } | null;
  };
  let fiber: { memoizedProps?: Record<string, unknown>; return?: unknown } | null | undefined = host.unstable_fiber;
  while (fiber) {
    const props = fiber.memoizedProps as { testID?: string; numColumns?: number; columnWrapperStyle?: unknown } | null;
    if (props && props.testID === id && props.numColumns !== undefined) {
      return { numColumns: props.numColumns, columnWrapperStyle: props.columnWrapperStyle };
    }
    fiber = fiber.return as typeof fiber;
  }
  throw new Error(`missing ${id}`);
}

function expectCap(testID: string): void {
  const element = getByProps(screen, { testID });
  expect(flatContent(element.props.contentContainerStyle)).toMatchObject({
    maxWidth: tokens.contentMaxWidth,
    alignSelf: "center",
  });
}

// The card column's width at 1280dp: the first ancestor of the card that
// carries an explicit width is the two-column wrapper View ([row, gridColumn])
// — neither the card nor the link between them declares one. Issue #970 pins
// the exception geometry the canon documents: 48.5% of the capped inner width.
function columnWidthFromCard(): unknown {
  let node = getByProps(screen, { testID: "guide-card-guide-001" }).parent;
  while (node) {
    const flat = flatContent(node.props?.style);
    if (flat.width !== undefined) return flat.width;
    node = node.parent;
  }
  return undefined;
}

// The city surfaces' shared arrange: the published synthetic catalog over the
// real services, mounted at the requested surface (a sibling copy would be a
// jscpd clone — implementation-rules 3).
async function openCitySurface(path: "/explore" | "/city/gdansk/guides"): Promise<void> {
  const services = createServices({
    catalogLoader: async (relPath) => {
      if (relPath === "catalog.json") return catalog;
      throw new Error(`missing synthetic file: ${relPath}`);
    },
    catalogSha256: sha256,
  });
  await services.catalog?.controller.getState().refresh();
  await renderRouter(
    {
      _layout: layoutWith(services),
      "(tabs)/explore": Explore,
      "city/[id]/guides": Guides,
    },
    { initialUrl: path },
  );
  await screen.findByTestId("guide-card-guide-001");
}

afterEach(() => { jest.restoreAllMocks(); });

describe("APR-10.b (issue #959): the canon content width on wide windows", () => {
  test.each([
    { surface: "/explore", testID: "scroll-explore" },
    { surface: "/city/gdansk/guides", testID: "scroll-guides" },
  ] as const)("$surface body caps at 800 and 1280 dp", async ({ surface, testID }) => {
    for (const width of [800, 1280]) {
      atWidth(width);
      await openCitySurface(surface);
      expectCap(testID);
    }
  });

  test.each([800, 1280])("the My KUDY settings content caps at %i dp", async (width) => {
    atWidth(width);
    await renderRouter({ _layout: layoutWith(createServices({})), "(tabs)/my": My }, { initialUrl: "/my" });
    await screen.findByTestId("my-ui-locale");
    expectCap("scroll-my");
  });

  // Issue #970: the two-column guide-card grid is the fixed exception to the
  // 45–75 line-length goal — the canon token content.max-width documents it
  // over this exact geometry (card column = 48.5% of the capped inner width).
  // Breaking the grid or re-widening the columns without re-documenting the
  // canon turns this red (implementation-rules 1).
  test.each([
    { surface: "/explore", testID: "scroll-explore" },
    { surface: "/city/gdansk/guides", testID: "scroll-guides" },
  ] as const)("$surface keeps the two-column card grid the #970 exception documents", async ({ surface, testID }) => {
    atWidth(800);
    await openCitySurface(surface);
    const narrow = flatListProps(testID);
    expect(narrow.numColumns).toBe(1);
    expect(narrow.columnWrapperStyle).toBeUndefined();

    atWidth(1280);
    await openCitySurface(surface);
    const wide = flatListProps(testID);
    expect(wide.numColumns).toBe(2);
    expect(wide.columnWrapperStyle).toBeTruthy();
    expect(columnWidthFromCard()).toBe("48.5%");
  });

  test.each([800, 1280])("the guide preview content caps at %i dp", async (width) => {
    atWidth(width);
    serve(CATALOG_FIXTURES);
    await renderRouter(
      {
        _layout: layoutWith(createServices({ catalogOrigin: "https://catalog.test", catalogSha256: sha256 })),
        "route/[id]": RoutePreview,
      },
      { initialUrl: "/route/guide-route-b1" },
    );
    await screen.findByTestId("scroll-preview");
    expectCap("scroll-preview");
  });
});
