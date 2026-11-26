import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { AppState, Text } from "react-native";

import { NearbyNativeMap } from "./nearby-native-map";
import { createControllerStore } from "../controllers/createControllerStore";
import { useNearbySurface, type NearbySurfaceBinding, type NearbySurfaceState } from "../controllers/nearby/nearbySurfaceController";
import { FakeLocationOsPort } from "../services/location/fake-port";
import { LocationService } from "../services/location/service";
import { WATCHDOG_GAP_MS, RESUBSCRIBE_DELAYS_MS } from "../services/location/types";

class ManualClock {
  private ms = 0;
  private scheduled: { due: number; run: () => void }[] = [];

  now = () => this.ms;

  schedule = (delay: number, run: () => void) => {
    const entry = { due: this.ms + delay, run };
    this.scheduled.push(entry);
    return () => { this.scheduled = this.scheduled.filter((task) => task !== entry); };
  };

  advance(ms: number) {
    const target = this.ms + ms;
    while (true) {
      this.scheduled.sort((a, b) => a.due - b.due);
      const next = this.scheduled[0];
      if (!next || next.due > target) break;
      this.scheduled.shift();
      this.ms = next.due;
      next.run();
    }
    this.ms = target;
  }
}

function NearbyGpsProbe({ binding }: { binding: NearbySurfaceBinding }) {
  const { position, locationView } = useNearbySurface(binding);
  return (
    <>
      <Text testID="gps-status">{locationView.state === "proximity" ? (locationView.note ?? "live") : locationView.state}</Text>
      <NearbyNativeMap
        offers={[]}
        position={locationView.state === "proximity" && locationView.note === null ? position : null}
        onOpenGuide={() => {}}
        guideLabel="Гід"
        recenterLabel="Паблізу"
        retryLabel="Паўтарыць"
      />
    </>
  );
}

beforeEach(() => { AppState.currentState = "active"; });

test("first fix, GPS watchdog recovery/stall, and fresh fix remove and restore the current-position marker", async () => {
  const port = new FakeLocationOsPort();
  const clock = new ManualClock();
  const location = new LocationService({ port, clock, permissions: { foreground: "fg", background: "bg" } });
  const store = createControllerStore<NearbySurfaceState>(() => ({ kind: "ready", offers: [], degraded: null }));
  const rendered = await render(<NearbyGpsProbe binding={{ store, location, locale: "be" }} />);
  expect(location.currentMode()).toBe("city-surface");
  expect(port.activeSubscriptions()).toBe(1);
  await fireEvent(screen.getByTestId("nearby-native-map"), "onDidFinishLoadingMap");
  expect(screen.getByTestId("gps-status").props.children).toBe("acquiring");

  await act(() => port.emitFix(1, { lat: 54.35, lng: 18.65, accuracy: 5, at: 0 }));
  expect(screen.getByTestId("nearby-current-position")).toBeTruthy();
  expect(screen.getByTestId("gps-status").props.children).toBe("live");

  await act(() => clock.advance(WATCHDOG_GAP_MS));
  expect(location.currentMode()).toBe("city-surface");
  expect(screen.getByTestId("gps-status").props.children).toBe("recovering");
  expect(screen.queryByTestId("nearby-current-position")).toBeNull();

  await act(() => clock.advance(RESUBSCRIBE_DELAYS_MS.reduce((sum, delay) => sum + delay, 0)));
  expect(screen.getByTestId("gps-status").props.children).toBe("stalled");
  expect(screen.queryByTestId("nearby-current-position")).toBeNull();

  await act(() => port.emitFix(5, { lat: 54.352, lng: 18.652, accuracy: 5, at: 30_000 }));
  expect(screen.getByTestId("gps-status").props.children).toBe("live");
  expect(screen.getByTestId("nearby-current-position")).toBeTruthy();

  await rendered.unmount();
  expect(location.currentMode()).toBe("idle");
  expect(port.activeSubscriptions()).toBe(0);
  expect(port.violations).toEqual([]);
});
