// SDK 58 (issue #339) — the shared RNTL 14 global config for the render
// suites. expo-router 58's native stack marks every RNSScreen
// `aria-hidden={true}` until the mocked screens environment reports focus,
// and RNTL 14's default queries skip aria-hidden subtrees — without this the
// whole mounted screen tree is invisible to every query. The suites already
// pass `{ includeHiddenElements: true }` explicitly for decorative layers
// (the a11y-invisible contract stays pinned by the dedicated negative tests);
// this only lifts the default to match the hidden-but-mounted screens the
// router renders in jest.
const { configure } = require("@testing-library/react-native");

configure({ defaultIncludeHiddenElements: true });

