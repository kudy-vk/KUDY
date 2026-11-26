import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { expect, jest, test } from "@jest/globals";

import { NearbyNativeMap } from "./nearby-native-map";
import type { NearbyOfferFacts } from "../services/catalog/types";
import { mapProvider } from "../contracts/map-provider";

const { cameraCalls } = require("../test/maplibre-react-native-mock") as {
  cameraCalls: Array<{ center: [number, number]; zoom: number; duration: number }>;
};

const guide: NearbyOfferFacts = {
  offer_id: "guide-1",
  kind: "guide",
  route_id: "walk-1",
  place_id: null,
  editorial_order: 1,
  title: "Гісторыі горада",
  summary: null,
  distance_m: null,
  text_locales: ["be"],
  audio_locales: [],
  access: "free",
  estimated_duration: null,
  content_version: null,
  content_locale: null,
  preview_points: [{ lat: 54.35, lng: 18.65 }],
};
const place: NearbyOfferFacts = {
  ...guide,
  kind: "place",
  route_id: null,
  place_id: "place-1",
  offer_id: "place-1",
  preview_points: undefined,
};
const onOpenGuide = jest.fn();
const props = {
  offers: [guide, place],
  position: null,
  onOpenGuide,
  guideLabel: "Гід",
  recenterLabel: "Дзе я",
  retryLabel: "Паўтарыць",
};

test("Nearby uses the shared live tiles, renders only real coordinates, and opens the guide by marker tap", async () => {
  onOpenGuide.mockClear();
  await render(<NearbyNativeMap {...props} />);
  const map = screen.getByTestId("nearby-native-map");
  expect(map.props.mapStyle).toBe(mapProvider.styleUrl);
  expect(screen.queryByTestId("nearby-map-marker-guide-1")).toBeNull();
  await fireEvent(map, "onDidFinishLoadingMap");
  expect(screen.getByTestId("mock-map-marker-guide-1").props.lngLat).toEqual([18.65, 54.35]);
  const pin = screen.getByTestId("nearby-map-marker-guide-1");
  expect(pin.props.accessibilityLabel).toBe("Гід: Гісторыі горада");
  expect(pin.props.style.height).toBe(48);
  expect(screen.queryByTestId("nearby-map-marker-place-1")).toBeNull();
  await fireEvent.press(pin);
  expect(onOpenGuide).toHaveBeenCalledWith("walk-1");
});

test("GPS uses the existing position observer, pan keeps the user's view, and recenter restores tracking", async () => {
  cameraCalls.length = 0;
  const rendered = await render(<NearbyNativeMap {...props} />);
  const map = screen.getByTestId("nearby-native-map");
  await fireEvent(map, "onDidFinishLoadingMap");
  await rendered.rerender(<NearbyNativeMap {...props} position={[18.651, 54.351]} />);
  expect(screen.getByTestId("nearby-current-position")).toBeTruthy();
  expect(cameraCalls.at(-1)).toEqual(expect.objectContaining({ center: [18.651, 54.351] }));
  await fireEvent(map, "onRegionWillChange", { nativeEvent: { userInteraction: true } });
  const callsBefore = cameraCalls.length;
  await rendered.rerender(<NearbyNativeMap {...props} position={[18.652, 54.352]} />);
  expect(cameraCalls).toHaveLength(callsBefore);
  expect(screen.getByTestId("nearby-map-recenter").props.accessibilityLabel).toBe("Дзе я");
  await fireEvent.press(screen.getByTestId("nearby-map-recenter"));
  expect(cameraCalls.at(-1)).toEqual(expect.objectContaining({ center: [18.652, 54.352] }));
  expect(screen.queryByTestId("nearby-map-recenter")).toBeNull();
  const callsAtPosition = cameraCalls.length;
  await rendered.rerender(<NearbyNativeMap {...props} position={null} />);
  expect(cameraCalls).toHaveLength(callsAtPosition); // Losing GPS must not jump to a guide.
});

test("tile errors show retry in the same sized frame; missing catalog coordinates never become fake pins", async () => {
  await render(<NearbyNativeMap {...props} offers={[place]} />);
  const map = screen.getByTestId("nearby-native-map");
  await fireEvent(map, "onDidFinishLoadingMap");
  expect(screen.queryByTestId(/^nearby-map-marker-/)).toBeNull();
  await fireEvent(map, "onDidFailLoadingMap");
  expect(screen.getByTestId("nearby-map-frame").props.style.height).toBe(220);
  expect(screen.queryByTestId("nearby-native-map")).toBeNull();
  await fireEvent.press(screen.getByTestId("nearby-map-retry"));
  expect(screen.getByTestId("nearby-native-map")).toBeTruthy();
});

test("retry restores a late-arriving guide center after a tile failure with no GPS", async () => {
  cameraCalls.length = 0;
  const rendered = await render(<NearbyNativeMap {...props} offers={[]} />);
  await fireEvent(screen.getByTestId("nearby-native-map"), "onDidFinishLoadingMap");
  const firstCameraState = screen.getByTestId("mock-map-camera").props.initialViewState;
  expect(firstCameraState.center).toEqual([18.6, 54.41]);
  // Native MapLibre may freeze the supplied prop. The late guide must not mutate it.
  Object.freeze(firstCameraState);

  await rendered.rerender(<NearbyNativeMap {...props} offers={[guide]} />);
  expect(firstCameraState.center).toEqual([18.6, 54.41]);
  expect(cameraCalls.at(-1)).toEqual(expect.objectContaining({ center: [18.65, 54.35] }));

  await fireEvent(screen.getByTestId("nearby-native-map"), "onDidFailLoadingMap");
  expect(screen.queryByTestId("nearby-native-map")).toBeNull();
  await fireEvent.press(screen.getByTestId("nearby-map-retry"));
  const retryCameraState = screen.getByTestId("mock-map-camera").props.initialViewState;
  expect(retryCameraState).not.toBe(firstCameraState);
  expect(retryCameraState.center).toEqual([18.65, 54.35]);

  const callsAtRetry = cameraCalls.length;
  await fireEvent(screen.getByTestId("nearby-native-map"), "onDidFinishLoadingMap");
  expect(screen.getByTestId("mock-map-camera").props.initialViewState.center).toEqual([18.65, 54.35]);
  expect(cameraCalls).toHaveLength(callsAtRetry);
  expect(screen.getByTestId("nearby-map-marker-guide-1")).toBeTruthy();
});

test("manual pan without GPS keeps the map from jumping to a late guide", async () => {
  cameraCalls.length = 0;
  const rendered = await render(<NearbyNativeMap {...props} offers={[]} />);
  await fireEvent(screen.getByTestId("nearby-native-map"), "onDidFinishLoadingMap");
  await fireEvent(screen.getByTestId("nearby-native-map"), "onRegionWillChange", {
    nativeEvent: { userInteraction: true },
  });
  await rendered.rerender(<NearbyNativeMap {...props} offers={[guide]} />);
  expect(cameraCalls).toHaveLength(0);
  expect(screen.getByTestId("mock-map-camera").props.initialViewState.center).toEqual([18.6, 54.41]);
});
