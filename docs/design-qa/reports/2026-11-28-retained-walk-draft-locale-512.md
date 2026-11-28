Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 2
Scope: PR #492; base `51d598f8b884ce7da0872ce457056465debde7b4`; source head `fe84b75efac5761e2a7c42e2fc5b4cd2f7cb9e54`. Changed surface for Voka finding #512: Walk mockup retained-frame locale labeling after the selected Norwegian contract request fails; the previously rendered Belarusian menu stays in the phone frame.
Sources: [visual language](../../design/visual-language.md) §§2–5, 9 (`96750d5f95b0a769f4ec8027811c20cb278cba96`); [screen transitions](../../design/screens-and-transitions.md), Run error states (`3ddb8cf5481c375b0b037af428ec7a5e1f856d41`); [accepted decisions](../../design/brand/decisions.md), M3 and L1 (`db79d28774fba0c0bbf008829ae76da362d0d550`); [exceptions](../exceptions.md), no matching exception (`96737684fb19c5dc817309d9e4d023fdf4d9b058`). No owner verdict for this mockup failure state was found.
Environment: Microsoft Edge on Realme RMX3840, Android 16/API 36, wireless ADB; Walk mockup, selected locale `nb`, Norwegian contract request deliberately returned HTTP 503; mockup viewport 320×640, text scale 1.5×. The supplied physical captures are `../evidence/512/walk-be-menu-after-nb-503-wireless-rmx3840.png` and `../evidence/512/walk-be-menu-after-nb-503-wireless-rmx3840-menu.png` (1080×2412). The first capture shows the visible contract-load error over the retained Belarusian Walk frame, with no `Draft text: English` status. The second shows the Belarusian Walk menu text (`Меню прагулкі`, `Прыпыніць прагулку`, `Завяршыць прагулку`, `Змяніць гіда`) and no English fallback status.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

The supplied files are current wireless captures, not approved baselines or difference images. No approved matching baseline exists for the retained Belarusian Walk frame during a failed Norwegian contract request, so a pixel comparison and owner baseline verdict are unavailable.

Source review: in `docs/design/production/run.mjs`, the photo/draft string resolver and `draftLanguages` metadata now compare against the locale captured by the currently rendered frame (`c.locale`), instead of the locale selector's mutable state. This keeps retained Belarusian menu text identified as Belarusian while the `nb` request is pending or has failed. The patch changes the locale used for this comparison and metadata; it adds no color, font, component styling, or layout.

Physical-device evidence verifies the visible behavior for the stated fixture and viewport: the Norwegian request returned HTTP 503; retained Belarusian menu content stayed Belarusian and the misleading English-fallback status remained hidden. The screenshot also shows the separate Belarusian load-error message. No measured pixel comparison was made.

[NOT-VERIFIED] Pixel comparison: no approved matching baseline or difference image exists for this state. Needed: owner-approved baseline plus an equivalent capture and difference image.

[NOT-VERIFIED] TalkBack/VoiceOver output and traversal: screenshots establish visible text only. Needed: a device screen-reader session to verify language pronunciation and status announcements while the failed request leaves the Belarusian menu rendered.

Second-pass rejected candidates:

- Candidate RULE: fallback metadata must follow the language of retained Walk content after a failed locale request. The device capture confirms the implementation now does this, but no accepted visual-canon rule specifies the locale source for this mockup's diagnostic label. L1 in the decisions register covers application UI strings and localized pages; it does not define this mockup redraw behavior. Therefore this is not a Design-QA RULE finding.
- Candidate DIFF: the retained-frame presentation violates an approved screenshot. The supplied files capture current behavior, and no approved matching baseline or difference image exists. Therefore no DIFF can be established.

No owner question is required for a verified RULE or DIFF; neither was identified. Pixel-baseline comparison and screen-reader behavior remain unverified.
