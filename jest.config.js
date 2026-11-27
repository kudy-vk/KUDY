// UX 05: the jest workers' timezone is pinned before they fork
// from this parent process. The My KUDY local-day test can only fail on a
// UTC revert from a non-UTC zone (GitHub CI runs UTC), so this pin gives
// the check its teeth (implementation-rules 1). No other suite in this
// config's scope reads the clock.
process.env.TZ = "America/Anchorage";

module.exports = {
  preset: "jest-expo",
  // SDK 58 (#339): RNGH 3.3 jestSetup mocks its native module for render suites.
  setupFiles: ["<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js"],
  // SDK 58 (#339): the reanimated/worklets jest resolver chain - see
  // test/jest-resolver.js for why a project resolver is required.
  resolver: "<rootDir>/test/jest-resolver.js",
  // #132: under a full npm test run the jest workers contend for CPU and the
  // heavy render suites (hint-card, discovery, place) exceed jest's 5000 ms
  // default per-test timeout on the dev host, while the node --test half of
  // npm test already pins 60000 ms (a stuck file must fail by name, not by a
  // flaky default). The same 60 s contract applies here; guard:
  // test/app-jest-wiring.test.mjs.
  testTimeout: 60000,
  // SDK 58 (#339): the RNTL 14 global config (test/rntl-configure.js) needs the
  // jest framework globals, so it runs in the after-env phase.
  setupFilesAfterEnv: ["<rootDir>/test/rntl-configure.js"],
  testMatch: ["<rootDir>/app/**/*.test.tsx", "<rootDir>/components/**/*.test.tsx", "<rootDir>/docs/design/brand/outputs/menu-map-city-only/native/**/*.test.tsx"],
  transform: {
    "menu-map-city-only[/\\\\](magnet|amber-light|atlas-art)\\.mjs$": ["babel-jest", {
      presets: [require.resolve("babel-preset-expo", { paths: [require.resolve("expo/package.json")] })],
      caller: { name: "metro", bundler: "metro", platform: "ios" },
    }],
    // Issue #216 (M11): the panorama builder is ESM the same way — the app
    // component imports it, so jest needs the Expo transform for it too.
    "panorama-paths\\.mjs$": ["babel-jest", {
      presets: [require.resolve("babel-preset-expo", { paths: [require.resolve("expo/package.json")] })],
      caller: { name: "metro", bundler: "metro", platform: "ios" },
    }],
    // Issue #303: the about screen reuses the mockup's pure map modules
    // (kit-geo, about-map-data, about-map-geo) without copying — the same
    // ESM the design zone serves to the browser; jest needs the Expo
    // transform the way the magnet/amber pieces get it. The guard is
    // components/about-city-map.test.tsx: dropping the mapping dies on the
    // ESM parse error. #334 also shares route-art-paths and kit-icons;
    // components/about-city-pages.test.tsx exercises their native import.
    "production[/\\\\](kit-geo|about-map-data|about-map-geo|route-art-paths|kit-icons)\\.mjs$": ["babel-jest", {
      presets: [require.resolve("babel-preset-expo", { paths: [require.resolve("expo/package.json")] })],
      caller: { name: "metro", bundler: "metro", platform: "ios" },
    }],
  },
  // G06.10.c (docs/agent-tasks/app/G06.10.md — G06.10.c): jest reads the "react-native" export condition,
  // which hands lucide-react-native's deep icon imports their ESM .mjs build —
  // an extension babel-jest's transform pattern never matches. The CJS build
  // of the same glyph is a drop-in for the test run; Metro keeps the device
  // bundle on the ESM condition. The guard is canon-icon.test.tsx itself:
  // drop this mapping and the suite dies on the ESM parse error.
  // G06.10.f (issue #406): the reanimated base is jest-mocked through the
  // official mock plus a controllable useReducedMotion stub (the official
  // mock omits it) — the seam the motion tests flip between the two paths.
  // The bare specifier covers the component suites; the `mock` subpath
  // covers expo-router's testing-library, whose mock factory returns
  // require("react-native-reanimated/mock") and would otherwise hand the
  // app suites the stub-less official mock. The guard is
  // test/app-jest-wiring.test.mjs: dropping the mapping loads the real base
  // and its worklet runtime, which jest cannot run.
  // SDK 58 (#339): RNGH 3.3 hands Worklets.getUIRuntimeHolder to a deferred
  // microtask; the worklets web variant throws in jest - the stub keeps the
  // same entry with that one function neutralized (test/worklets-jest-stub.js).
  moduleNameMapper: {
  "^react-native-worklets$": "<rootDir>/test/worklets-jest-stub.js",
    "^@maplibre/maplibre-react-native$": "<rootDir>/test/maplibre-react-native-mock.js",
    "^react-native-reanimated$": "<rootDir>/test/reanimated-mock.js",
    "^react-native-reanimated/mock$": "<rootDir>/test/reanimated-mock-subpath.js",
    // DQ-13 (issue #914): the route suite mounts the Storybook surface through
    // this identity mock — the real UI root pulls the storybook runtime whose
    // dist build jest cannot parse, on top of the machine-local generated
    // requires module and native peers jest cannot host. The guard is
    // app/storybook.test.tsx itself: dropping the mapping dies on the
    // storybook dist parse error.
    "^\\.\\./\\.rnstorybook(/.*)?$": "<rootDir>/test/storybook-ui-mock.tsx",
    "^lucide-react-native/icons/(.*)$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js",
  },
  // #337: decode-uri-component 0.5.1 (the npm-advisory fix override) ships
  // ESM-only — the same shape lucide-react-native hands jest through the
  // "react-native" export condition. The first pattern is jest-expo's preset
  // list with decode-uri-component added to the negation group; Metro keeps
  // the device bundle on the same ESM module, so this is a test-host concern
  // only. The guard is test/app-jest-wiring.test.mjs plus the app suites that
  // reach query-string: dropping the entry dies on the ESM parse error. #339 adds standard-navigation (an expo-router 58 dependency, ESM-only) to the same negation group.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|decode-uri-component|standard-navigation))",
    // Disable transforming the reanimated plugin in multi-platform tests, causing "Reentrant plugin detected trying to load react-native-reanimated/plugin.."
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
