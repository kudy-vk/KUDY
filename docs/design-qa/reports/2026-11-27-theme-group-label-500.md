Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 1
Scope: PR #492; diff base `b14e706419a4e5f316f6f84c3a25dde7686b2c48`; source commit `813f4f14673b8c2479c23a3c0b9069055a969c9f`; target `main` was `7c90054d5289358b8f0d47c75d42f57104a413ce`. Changed surface: Settings → Appearance radiogroup accessible name and its language metadata for a selected locale that falls back to English.
Sources: [visual language](../../design/visual-language.md) §§1–5 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Settings (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), no applicable accepted rule for this accessible-name language behavior (`3bd7a63fdc88ebc667547eb5763999792bd2d5bb`); [exceptions](../exceptions.md), no matching exception (`96737684fb19c5dc817309d9e4d023fdf4d9b058`). No matching owner verdict was available.

Environment: Browser acceptance through `test/browser-page.mjs`. The fix references the visible, language-tagged Appearance heading with `aria-labelledby`; local labels remain in their resolved language. No visible copy or styling changed.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

Pixel comparison was not run because this change does not alter rendered pixels. The existing mockup evidence set has no approved matching baseline for this state.

Browser evidence: `node --test --experimental-strip-types test/design-fallback-language-browser.test.mjs test/design-critical-locales-browser.test.mjs` passed 20 tests. The new regression verifies that the `nb` Appearance heading carries `lang="en"`, the radiogroup references that heading and does not inherit `lang="en"`, and the Belarusian heading stays local without a language override.

[NOT-VERIFIED] TalkBack/VoiceOver pronunciation and traversal: no device screen-reader session was run. The browser checks DOM language metadata and the accessible-name reference, not actual assistive-technology output.

Second-pass rejected candidates:

- A visual RULE finding is unsupported: the accepted visual canon does not define the language metadata of this mockup accessible name.
- A visual DIFF finding is unsupported: no visible content or styling changed.

No owner decision is needed for a verified RULE or DIFF; neither was identified.
