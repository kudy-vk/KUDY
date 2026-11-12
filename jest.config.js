// UX 05 (issue #351): the jest workers' timezone is pinned before they fork
// from this parent process. The My KUDY local-day test can only fail on a
// UTC revert from a non-UTC zone (GitHub CI runs UTC), so this pin gives
// the check its teeth (implementation-rules 1). No other suite in this
// config's scope reads the clock.
process.env.TZ = "America/Anchorage";

module.exports = {
  preset: "jest-expo",
  // #132: under a full npm test run the jest workers contend for CPU and the
  // heavy render suites (hint-card, discovery, place) exceed jest's 5000 ms
  // default per-test timeout on the dev host, while the node --test half of
  // npm test already pins 60000 ms (a stuck file must fail by name, not by a
  // flaky default). The same 60 s contract applies here; guard:
  // test/app-jest-wiring.test.mjs.
  testTimeout: 60000,
  testMatch: ["<rootDir>/app/**/*.test.tsx", "<rootDir>/components/**/*.test.tsx", "<rootDir>/docs/design/brand/outputs/menu-map-city-only/native/**/*.test.tsx"],
  transform: {
    "menu-map-city-only[/\\\\](magnet|amber-light)\\.mjs$": ["babel-jest", {
      presets: [require.resolve("babel-preset-expo", { paths: [require.resolve("expo/package.json")] })],
      caller: { name: "metro", bundler: "metro", platform: "ios" },
    }],
    // Issue #216 (M11): the panorama builder is ESM the same way — the app
    // component imports it, so jest needs the Expo transform for it too.
    "panorama-paths\\.mjs$": ["babel-jest", {
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
  moduleNameMapper: {
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
};
