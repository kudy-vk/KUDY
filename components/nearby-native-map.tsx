// The Nearby map uses the same online map source as Run. Only published
// guide preview points become tappable markers; place offers without geometry
// stay in the list, never on invented map coordinates.
import { Camera, Map, Marker, type CameraRef } from "@maplibre/maplibre-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import LocateFixedIcon from "lucide-react-native/icons/locate-fixed";
import RouteIcon from "lucide-react-native/icons/route";

import { mapProvider } from "../contracts/map-provider";
import type { NearbyOfferFacts } from "../services/catalog/types";
import { tokens } from "./design-tokens";
import { ScaledText } from "./scaled-text";

const MAP_ZOOM = 14;
// The Tricity starting view uses the existing illustrated city map's center
// (components/about-city-map.tsx). Once GPS is available, the camera follows
// the real position; the fallback never claims to locate the visitor.
const TRICITY_CENTER: [number, number] = [18.6, 54.41];

const styles = StyleSheet.create({
  frame: {
    backgroundColor: tokens.colorMap,
    borderColor: tokens.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: 1,
    height: 220,
    marginBottom: tokens.spaceM,
    overflow: "hidden",
  },
  map: { ...StyleSheet.absoluteFill },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  marker: {
    alignItems: "center",
    backgroundColor: tokens.colorMap,
    borderColor: tokens.colorInk,
    borderRadius: 999,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  position: {
    backgroundColor: "#1677d2",
    borderColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 3,
    height: 20,
    width: 20,
  },
  recenter: {
    alignItems: "center",
    backgroundColor: tokens.colorPaper,
    borderColor: tokens.colorLine,
    borderRadius: 999,
    borderWidth: 1,
    bottom: tokens.spaceM,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: tokens.spaceM,
    width: 48,
  },
  retry: {
    backgroundColor: tokens.colorPaper,
    borderColor: tokens.colorLine,
    borderRadius: tokens.radiusBase,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: tokens.spaceM,
  },
});

export function NearbyNativeMap({
  offers,
  position,
  onOpenGuide,
  guideLabel,
  recenterLabel,
  retryLabel,
}: {
  offers: readonly NearbyOfferFacts[];
  position: readonly [number, number] | null;
  onOpenGuide: (routeId: string) => void;
  guideLabel: string;
  recenterLabel: string;
  retryLabel: string;
}) {
  const camera = useRef<CameraRef>(null);
  const following = useRef(true);
  const hadGpsPosition = useRef(false);
  const guideCentered = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showRecenter, setShowRecenter] = useState(false);
  const points = useMemo(() => offers.flatMap((offer) => {
    if (offer.kind !== "guide" || !offer.route_id || !offer.preview_points?.length) return [];
    const first = offer.preview_points[0];
    return [{ offer, routeId: offer.route_id, coordinate: [first.lng, first.lat] as [number, number] }];
  }), [offers]);
  const initialViewState = useRef({ center: points[0]?.coordinate ?? TRICITY_CENTER, zoom: MAP_ZOOM }).current;

  useEffect(() => {
    if (position) hadGpsPosition.current = true;
    if (loaded && position && following.current) {
      camera.current?.easeTo({ center: [...position] as [number, number], zoom: MAP_ZOOM, duration: 650, easing: "ease" });
    }
  }, [loaded, position]);

  useEffect(() => {
    // On catalog arrival, center once on the first published guide. A GPS
    // timeout must not move the camera back to a guide or the city center.
    if (loaded && !position && points.length && following.current &&
        !hadGpsPosition.current && !guideCentered.current) {
      guideCentered.current = true;
      camera.current?.easeTo({ center: points[0].coordinate, zoom: MAP_ZOOM, duration: 650, easing: "ease" });
    }
  }, [loaded, points, position]);

  const recenter = () => {
    if (!position) return;
    following.current = true;
    setShowRecenter(false);
    camera.current?.easeTo({ center: [...position] as [number, number], zoom: MAP_ZOOM, duration: 650, easing: "ease" });
  };

  return (
    <View style={styles.frame} testID="nearby-map-frame">
      {!failed ? (
        <Map
          key={retryKey}
          mapStyle={mapProvider.styleUrl}
          style={styles.map}
          attribution
          onDidFinishLoadingMap={() => setLoaded(true)}
          onDidFailLoadingMap={() => { setFailed(true); setLoaded(false); }}
          onRegionWillChange={(event) => {
            if (event.nativeEvent.userInteraction) {
              following.current = false;
              setShowRecenter(true);
            }
          }}
          testID="nearby-native-map"
        >
          <Camera ref={camera} initialViewState={initialViewState} />
          {loaded && position ? (
            <Marker id="nearby-position" lngLat={[...position] as [number, number]}>
              <View style={styles.position} testID="nearby-current-position" />
            </Marker>
          ) : null}
          {loaded ? points.map(({ offer, routeId, coordinate }) => (
            <Marker key={offer.offer_id} id={offer.offer_id} lngLat={coordinate}>
              <Pressable
                onPress={() => onOpenGuide(routeId)}
                style={styles.marker}
                accessibilityRole="button"
                accessibilityLabel={`${guideLabel}: ${offer.title ?? offer.route_id}`}
                testID={`nearby-map-marker-${offer.offer_id}`}
              >
                <RouteIcon color={tokens.colorInk} size={22} />
              </Pressable>
            </Marker>
          )) : null}
        </Map>
      ) : null}
      {!loaded ? (
        <View style={styles.loading} pointerEvents={failed ? "auto" : "none"}>
          {failed ? (
            <Pressable
              style={styles.retry}
              accessibilityRole="button"
              onPress={() => { following.current = true; setShowRecenter(false); setFailed(false); setRetryKey((key) => key + 1); }}
              testID="nearby-map-retry"
            >
              <ScaledText>{retryLabel}</ScaledText>
            </Pressable>
          ) : <ActivityIndicator color={tokens.colorAccent} />}
        </View>
      ) : null}
      {loaded && showRecenter && position ? (
        <Pressable
          style={styles.recenter}
          accessibilityRole="button"
          accessibilityLabel={recenterLabel}
          onPress={recenter}
          testID="nearby-map-recenter"
        >
          <LocateFixedIcon color={tokens.colorInk} size={24} />
        </Pressable>
      ) : null}
    </View>
  );
}
