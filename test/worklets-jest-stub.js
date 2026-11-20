// SDK 58 (issue #339) — the jest seam for react-native-worklets under the
// SDK 58 toolchain: react-native-gesture-handler 3.3 requires the bare
// worklets entry at import time and hands `Worklets.getUIRuntimeHolder` to a
// microtask (reanimatedWrapper.ts). In jest the worklets resolver serves the
// web variant, whose getUIRuntimeHolder throws — killing every render suite
// from a deferred microtask. The stub re-exports the real web entry with
// that one function neutralized: the UI-runtime holder is a native-only
// concept, and RNGH's install path treats undefined as "not installed".
// Reanimated's mock chain uses the same bare entry and does not call
// getUIRuntimeHolder, so nothing else shifts. The mapping lives in
// jest.config.js moduleNameMapper ("^react-native-worklets$").
const worklets = require("react-native-worklets/src/index");

module.exports = {
  ...worklets,
  getUIRuntimeHolder: () => undefined,
};
