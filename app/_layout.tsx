import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createServices, type Services } from "../controllers/createServices";
import type { UiLocalePersistence, UiLocaleSwitchCode } from "../controllers/uiLocaleStore";
import { useAppFonts } from "../components/fonts";
import { statusBarStyle, useThemeScheme } from "../components/theme";
import { resolveCatalogSource } from "../controllers/catalogSource";

// The device composition binding is loaded lazily for a remote catalog or
// an explicitly selected embedded phone-test source. Without either, the
// surfaces keep their honest unavailable state; tests never import Expo
// facilities outside the native runtime.
function createDeviceServiceSet(): ReturnType<
  typeof import("../controllers/deviceRoot")["createDeviceServiceSet"]
> | null {
  const source = resolveCatalogSource({
    origin: process.env.EXPO_PUBLIC_CATALOG_ORIGIN,
    demo: process.env.EXPO_PUBLIC_DEMO_MODE,
    sandbox: process.env.EXPO_PUBLIC_SANDBOX,
  });
  if (source === null) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const deviceRoot = require("../controllers/deviceRoot") as typeof import("../controllers/deviceRoot");
  return deviceRoot.createDeviceServiceSet();
}

function createDeviceLocalePersistence(): UiLocalePersistence {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deviceRoot = require("../controllers/deviceRoot") as typeof import("../controllers/deviceRoot");
    return deviceRoot.createDeviceLocalePersistence();
  } catch {
    let cached: UiLocaleSwitchCode | null = null;
    return {
      read: () => cached,
      write: (locale) => {
        cached = locale;
      },
    };
  }
}

// Screens consume services only through this provider (19 §4.2: UI never
// touches services/ directly — controllers only). Exported for the render
// tests, which provide test services through the same context.
export const ServicesContext = createContext<Services | null>(null);

// Screens consume services only through this provider (19 §4.2: UI never
// touches services/ directly — controllers only).
export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error("useServices must be used under the root layout");
  }
  return services;
}

// G14.04.d (16_delivery_backlog.md — G14.04.d) — the display locale the words read per render: the
// useSyncExternalStore idiom of the hint mount, over the ui-locale store the
// My KUDY row writes. Subscribing here is what makes the switch restart-free
// — a screen showing uk words re-renders in place when the row fires, the
// services object never rebuilds.
export function useUiLocale(): string {
  const { uiLocale } = useServices();
  return useSyncExternalStore(uiLocale.subscribe, uiLocale.current);
}

export default function RootLayout() {
  // (docs/design/dark-theme.md): repaint native chrome on an OS theme change without rebuilding
  // services, Run, audio or location ownership.
  const theme = useThemeScheme();
  // G20.20 (issue #491): the ONE device service set comes from the
  // device composition root. A source-less production build keeps empty
  // ports; the sandbox's embedded sample data is selected explicitly.
  const device = useMemo(createDeviceServiceSet, []);
  const services = useMemo(
    () =>
      device === null
        ? createServices({ uiLocalePersistence: createDeviceLocalePersistence() })
        : createServices(device.ports),
    [device],
  );
  // Release controller observers before the device ports they watched.
  useEffect(() => () => {
    services.dispose();
    device?.teardown();
  }, [device, services]);
  // G06.10.b: the approved families load once here, ungated — surfaces render
  // their system-ui fallback while loading and never wait for the faces.
  useAppFonts();
  return (
    <ServicesContext.Provider value={services}>
      {/* docs/design/dark-theme.md — Статус-бар: one root status bar, dark glyphs on light chrome and
          light glyphs on dark chrome. The accepted light splash is separate. */}
      <StatusBar style={statusBarStyle(theme)} />
      {/* UX 02 (screens-and-transitions.md — Агульныя правілы пераходаў): the native header is off — it printed raw route
          names as titles and duplicated the screens' own back; every screen
          owns its frame (one BackButton, safe-area padding). */}
      <Stack screenOptions={{ headerShown: false }} />
    </ServicesContext.Provider>
  );
}
