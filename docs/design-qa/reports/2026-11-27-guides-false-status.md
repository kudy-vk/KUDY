Verdict: NO_VERIFIED_RULE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 1
Scope: PR #492; diff base `51d598f8b884ce7da0872ce457056465debde7b4`; source commit `d8cd3cad0bfe76e7ca99361c5f9cd721f7fea6ad`; target `main` was `51d598f8b884ce7da0872ce457056465debde7b4`. Changed surface: Settings mockup → Guides screen, empty “Show everything” status and hidden-group reset control.
Sources: [visual language](../../design/visual-language.md) §§1–5 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Guides (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), no applicable accepted rule (`db79d28774fba0c0bbf008829ae76da362d0d550`); [exceptions](../exceptions.md), no matching exception (`96737684fb19c5dc817309d9e4d023fdf4d9b058`). No matching owner verdict was available.

Environment: active Realme RMX3840, Android 16/API 36, Microsoft Edge over wireless ADB; local production mockup server at `127.0.0.1:4400`; viewport 320×640; text scale 1.5×; locale `nb`; light theme; Guides screen. Fixture data has English fallback status text and Belarusian/Italian guide chips.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

No approved matching baseline exists for this state, so pixel comparison was not run. The pre-fix phone capture showed a literal `false`; the post-fix physical capture is embedded in `docs/demos/2026-11-27-guides-status-false.md`. These captures are evidence of the behavior, not an approved baseline comparison.

Browser evidence: `node --test --test-timeout=60000 test/design-guides-false-status-browser.test.mjs test/design-fallback-language-browser.test.mjs` passed 10 tests. The new test was run red before the fix (`false` was the direct text node under the content panel) and green after it. The regression also verifies the hidden-count status and reset control when a group is hidden. Physical-device verification confirmed the empty Guides status at the recorded viewport, text scale and locale; no full Android app/E2E run was made because this change is confined to the HTML design mockup and browser test, per the user's device-testing instruction.

[NOT-VERIFIED] Approved pixel baseline for nb Guides at 320×640 and 1.5× is unavailable; visual DIFF and baseline approval remain unverified.

Second-pass rejected candidates:

- A RULE finding is unsupported: the accepted visual canon has no measurable rule requiring a particular empty-status sentence or prohibiting the literal JavaScript boolean text in this mockup.
- A DIFF finding is unsupported: there is no approved matching baseline and the available pre-fix capture is not a baseline.
- No owner decision is needed for a RULE or DIFF; neither was identified.
