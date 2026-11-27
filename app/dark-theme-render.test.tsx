// docs/design/dark-theme.md: render the production screens under a dark system scheme. These
// assertions fail if a surface reverts to light-only card or frame styles.
import { afterEach, expect, jest, test } from "@jest/globals";
import { renderRouter, screen, within } from "expo-router/testing-library";
import { render } from "@testing-library/react-native";
import { Svg } from "react-native-svg";
import MapPinIcon from "lucide-react-native/icons/map-pin";

import Collection from "./collection/[id]";
import Discovery from "./discovery";
import Menu from "./menu";
import { CanonIcon } from "../components/canon-icon";
import { darkTokens } from "../components/design-tokens";
import { createServices } from "../controllers/createServices";
import { CATALOG_FIXTURES, CATALOG_POINTER, flatStyle, frameRoutes, layoutWith, serve, sha256 } from "../test/render-helpers";
import { getByType } from "../test/render-helpers";


// React Native re-exports this hook from its Utilities module. Mocking that
// module exercises the real theme hook and the actual rendered screen styles.
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => "dark",
}));

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ["/menu", "screen-Menu"],
  ["/explore", "screen-Explore"], ["/my", "screen-KUDY"],
  ["/city/gdansk/guides", "screen-Guides"], ["/route/r1", "screen-Route preview"],
  ["/place/p1", "screen-Place detail"], ["/collection/c1", "screen-Collection"],
  ["/discovery", "screen-Discovery"], ["/feedback", "screen-Feedback"],
  ["/run/r1", "screen-Run"], ["/map", "screen-Map"],
  ["/missing", "screen-Not found"],
])("M3 gradient reaches the actual %s screen", async (url, testID) => {
  await renderRouter({ ...frameRoutes(), menu: Menu }, { initialUrl: url });
  const root = await screen.findByTestId(testID);
  expect(within(root).getByTestId("screen-gradient", { includeHiddenElements: true })).toBeTruthy();
});

test("the dark menu uses the approved legible ribbon palette", async () => {
  await renderRouter({ ...frameRoutes(), menu: Menu }, { initialUrl: "/menu" });
  const ribbon = screen.getByTestId("city-menu-ribbon-nearby", { includeHiddenElements: true });
  const caption = within(ribbon).getByText("Побач", { includeHiddenElements: true });
  expect(flatStyle(caption)).toMatchObject({ color: "#f4eadb", fontFamily: darkTokens.fontFamilyDisplay });
  expect(flatStyle(screen.getByTestId("screen-Menu")).backgroundColor).toBe(darkTokens.colorPaper);
});

async function openDiscovery(url: string) {
  serve({ "catalog.json": CATALOG_FIXTURES["catalog.json"], [CATALOG_POINTER]: CATALOG_FIXTURES[CATALOG_POINTER] });
  let cached: Uint8Array | null = null;
  const services = createServices({
    catalogOrigin: "https://cdn.test",
    catalogSha256: sha256,
    discoverySnapshot: {
      read: async () => cached,
      write: async (next: Uint8Array) => { cached = next; },
    },
    discoveryAnalytics: { offerShown: () => {}, offerOpened: () => {} },
  });
  await renderRouter({
    _layout: layoutWith(services),
    discovery: Discovery,
    "collection/[id]": Collection,
  }, { initialUrl: url });
}

test("Nearby chrome and Back icon use dark tokens while the map preview remains light", async () => {
  const previous = process.env.EXPO_PUBLIC_DEMO_MODE;
  process.env.EXPO_PUBLIC_DEMO_MODE = "1";
  try {
    await renderRouter(frameRoutes(), { initialUrl: "/map" });
    const root = await screen.findByTestId("screen-Map");
    expect(flatStyle(root).backgroundColor).toBe(darkTokens.colorPaper);
    const back = screen.getByTestId("btn-map-back");
    expect(getByType(back, "RNSVGSvgView").props.stroke).toBe(darkTokens.colorAccent);
    const map = screen.getByTestId("nearby-demo-map");
    expect(flatStyle(map).backgroundColor).toBe("#eaf1eb");
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_DEMO_MODE;
    else process.env.EXPO_PUBLIC_DEMO_MODE = previous;
  }
});

test("Discovery offer card background and title contrast follow dark tokens", async () => {
  await openDiscovery("/discovery");
  const card = await screen.findByTestId("offer-card-offer-b1-guide");
  expect(flatStyle(card).backgroundColor).toBe(darkTokens.colorCard);
  const title = within(card).getAllByText(/.+/)[0];
  expect(flatStyle(title).color).toBe(darkTokens.colorMuted);
});

test("Collection place member card uses dark background and text", async () => {
  await openDiscovery("/collection/collection-f1");
  const card = await screen.findByTestId("collection-member-offer-a1-place");
  expect(flatStyle(card).backgroundColor).toBe(darkTokens.colorCard);
  const title = within(card).getAllByText(/.+/)[0];
  expect(flatStyle(title).color).toBe(darkTokens.colorMuted);
});

test("CanonIcon default glyph color resolves from the dark palette", async () => {
  const icon = await render(<CanonIcon glyph={MapPinIcon} label="Кропка" />);
  expect(getByType(icon, "RNSVGSvgView").props.stroke).toBe(darkTokens.colorInk);
});
