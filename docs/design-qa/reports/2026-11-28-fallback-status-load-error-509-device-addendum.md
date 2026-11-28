Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 2
Scope: PR #492; base `51d598f8b884ce7da0872ce457056465debde7b4`; source head `154e26d38bd7f1af2e254fd01313c2a4e7b170a7`. Addendum to [the issue #509 Design-QA report](2026-11-28-fallback-status-load-error-509.md). Changed surface: Settings mockup → Guides locale-redraw status. On `nb` → `pl` with `translations/pl.json` returning HTTP 503, existing `nb` frames, English fallback label, and visible load error persist; a successful switch to `be` replaces the frames and clears the fallback label/error.
Sources: [visual language](../../design/visual-language.md) §§2–5 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Explore error state and Guides (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), L1 and M3 (`db79d28774fba0c0bbf008829ae76da362d0d550`); [exceptions](../exceptions.md), no matching exception (`96737684fb19c5dc817309d9e4d023fdf4d9b058`). No owner verdict for this exact failed-redraw state was found.
Environment: Microsoft Edge on Realme RMX3840, Android 16/API 36, connected over wireless ADB; production Settings mockup, mockup viewport 320×640, text scale 1.5×, Guides view. Fixture returned HTTP 503 for `translations/pl.json`. The two supplied 1080×2412 captures are `../evidence/509/guides-nb-503-wireless-rmx3840.png` and `../evidence/509/guides-be-recovery-wireless-rmx3840.png`. The captured failure state shows the Belarusian load error and `Draft text: English` above retained `nb` content; the recovery state shows Belarusian content and no fallback/error status.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

The supplied screenshots are current physical-device evidence, not approved baselines or difference images. No approved matching baseline exists for the HTTP-503 state, so a pixel comparison and owner baseline verdict are unavailable. The renderer change only changes when the existing status is cleared; it adds no color, font, or component styling.

Physical-device evidence: the supplied wireless captures and observed sequence verify the issue #509 behavior at the stated device, mockup viewport, text scale, locale, view, and fixture. On `nb`, both old frames remained while the HTTP 503 error and English fallback label were visible. Switching to `be` loaded successfully, changed both frames to `be`, and cleared both statuses. This device evidence replaces the physical-device NOT-VERIFIED item in the prior report; the earlier report is left unchanged.

[NOT-VERIFIED] Pixel comparison: no approved matching baseline or difference image exists for the failed-load state. Needed: owner-approved baseline plus equivalent captures and a difference image.

[NOT-VERIFIED] TalkBack/VoiceOver announcement and traversal: the device screenshots establish visible output, not screen-reader speech or focus order. Needed: an explicit device screen-reader session for the failed switch and recovery.

Second-pass rejected candidates:

- Candidate RULE: the fallback status must persist while old frames remain after a contract error. The acceptance behavior is now reproduced on the physical device, but no accepted visual rule specifies persistence in this state. L1 addresses app UI strings and localized pages, not the mockup's diagnostic status; the Explore error-state text in screen transitions does not set fallback-status persistence. This is functional acceptance, not a Design-QA RULE.
- Candidate DIFF: the 503-state display violates an approved screenshot. The supplied images are captures of the current behavior; there is no approved matching baseline or difference image. Therefore no DIFF can be established.

No owner question is needed for a verified RULE or DIFF; neither was identified. Device-visible behavior is verified; pixel-baseline approval and screen-reader behavior remain unverified.
