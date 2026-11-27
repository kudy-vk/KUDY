Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 2
Scope: PR #492; diff base `b14e706419a4e5f316f6f84c3a25dde7686b2c48`; source commit `6637d958dfbc82cce285e73c7a3d428266246c78`; target `main` was `7c90054d5289358b8f0d47c75d42f57104a413ce`. Changed surfaces: Settings → Guides Belarusian content chips and the fallback-status behavior during locale redraw.
Sources: [visual language](../../design/visual-language.md) §§2–5, 9 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Guides and Walk (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), M3 and L1 (`db79d28774fba0c0bbf008829ae76da362d0d550`); [exceptions](../exceptions.md) (`96737684fb19c5dc817309d9e4d023fdf4d9b058`).
Environment: Chromium 153.0.8010.12 through `test/browser-page.mjs`; browser acceptance covered the five switch locales, light and dark mockups, and a delayed `nb` string request. No Android, TalkBack or VoiceOver session.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

No visible content or styling changed. There is no approved matching baseline for these screens, so pixel comparison was not performed.

Browser evidence: `node --test --experimental-strip-types test/design-fallback-language-browser.test.mjs test/design-critical-locales-browser.test.mjs` passed 17 tests. The regressions verify that Belarusian Guides chips declare `lang="be"` and inherit that effective language, and that a callback from a superseded locale draw cannot restore a cleared English-fallback status. The existing acceptance checks still cover all five switch locales, both themes, photo cards, fallback resolution and narrow-frame controls.

[NOT-VERIFIED] Pixel comparison: no approved matching baseline/current/difference set exists for these mockups.

[NOT-VERIFIED] TalkBack and VoiceOver pronunciation and traversal: this HTML mockup was not checked with a device screen reader. Device evidence is required to verify actual assistive-technology behavior.

Second-pass rejected candidates:

- Treating the Belarusian `lang` metadata or the redraw guard as a visual RULE is unsupported: the accepted visual canon and exception register do not define those HTML semantics. Browser tests reproduce the accessibility metadata and stale-status behavior; no visual-canon violation was found.
- Treating the change as a visual DIFF is unsupported: no visible content or styling changed, and there is no approved matching baseline to compare.

No owner decision is needed for a verified RULE or DIFF; neither was identified.
