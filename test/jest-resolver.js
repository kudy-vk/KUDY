// SDK 58 (issue #339): reanimated 4.7 resolves its native initializers to the
// web variants under jest through its own resolver — without it the eager
// worklets unpacker install crashes at require time
// (NativeWorklets.native.ts → loadUnpackersWithCode on the missing proxy).
// Chain: reanimated's resolver (which delegates to the worklets resolver)
// → @react-native/jest-preset's resolver (strips react-native's exports map)
// → the built-in default resolver captured from the incoming options. The
// reanimated moduleNameMapper in jest.config.js is guarded by
// test/app-jest-wiring.test.mjs and stays.
const rnResolver = require.resolve("@react-native/jest-preset/jest/resolver.js");
const reanimatedResolver = require.resolve("react-native-reanimated/jest/resolver.js");

module.exports = (request, options) => {
  const baseResolver = options.defaultResolver;
  return require(reanimatedResolver)(request, {
    ...options,
    defaultResolver: (req, opts) =>
      require(rnResolver)(req, { ...opts, defaultResolver: baseResolver }),
  });
};
