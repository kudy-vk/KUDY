Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 3
Scope: PR #492; base `51d598f8b884ce7da0872ce457056465debde7b4`; source head `154e26d38bd7f1af2e254fd01313c2a4e7b170a7`. Changed surface for issue #509: shared mockup renderer's fallback-language status during locale redraw; exercised on Settings/Guides by switching from `nb` to `pl` when `translations/pl.json` returns HTTP 503, with the previous light and dark phone frames retained.
Sources: [visual language](../../design/visual-language.md) §§2–5 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Explore error state and Guides (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), L1 and M3 (`db79d28774fba0c0bbf008829ae76da362d0d550`); [exceptions](../exceptions.md), no matching exception (`96737684fb19c5dc817309d9e4d023fdf4d9b058`). No owner verdict for this exact failed-redraw state was found.
Environment: Playwright Chromium via `test/browser-page.mjs`; browser viewport 1000×2200, reduced motion, mockup device preset 390×844, text scale 1, locale `nb`, light and dark frames; test route intercepts `translations/pl.json` with HTTP 503. The Realme RMX3840 was attached over wireless ADB, but its foreground app was `by.kudy.app.dev` and the local mockup server on port 4400 was not running; this exact interaction was not exercised on device. No TalkBack/VoiceOver session.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

No approved matching baseline exists for the Settings/Guides fallback-status error state, and this run generated no current/difference PNGs. The existing browser manifest captures regular `nb` Settings, Guides and Walk views from source commit `779d7256b456d324646314619c8e28587d633b18`; those are not equivalent error-state captures and are not an approved baseline. Pixel comparison was not performed.

Browser evidence: `node --test --experimental-strip-types test/design-fallback-language-browser.test.mjs` passed 10 tests. The issue #509 case starts with English fallback status on the `nb` frames, returns HTTP 503 for uncached `pl`, confirms the load error remains visible and the old `nb` frames remain, then switches to `be` and confirms the successful redraw clears fallback status and the error. The obsolete-draw regression also passed. Source inspection confirms the renderer now clears fallback status only after the requested strings resolve, the current draw is confirmed, cleanup runs, and the old phone nodes are replaced.

[NOT-VERIFIED] Pixel comparison: no approved matching baseline or equivalent current/difference PNG set exists for this failed-load state. Needed: owner-approved baseline plus equivalent captures and a difference image.

[NOT-VERIFIED] Physical-device rendering of issue #509 flow: an RMX3840 is attached, but the current foreground is the native dev app and the local mockup server is stopped; no wireless browser capture of this transition was made. Needed: serve the mockup and reproduce the HTTP 503 path on the device.

[NOT-VERIFIED] TalkBack/VoiceOver announcement and traversal: browser regression checks DOM `role="status"` and visible text state, not actual screen-reader output. Needed: a device screen-reader session for the failed locale switch and recovery.

Second-pass rejected candidates:

- Candidate RULE: the fallback-language status must remain visible while stale frames remain after a contract failure. The issue acceptance test establishes this product behavior, but no accepted visual rule states this persistence requirement. L1 in the decision register concerns app UI strings and localized pages, not this mockup's diagnostic status; the error-state note in screens-and-transitions does not specify fallback-status persistence. Therefore this is not a Design-QA RULE finding.
- Candidate DIFF: the visible status/error combination is a regression against an approved screenshot. No approved capture exists for this same failed-load state, and the browser manifest's normal-screen captures are not equivalent. Therefore no DIFF can be established.

No owner question is needed for a verified RULE or DIFF; neither was identified. The product acceptance behavior is covered by the browser regression, while the listed pixel and device accessibility evidence remains unverified.
