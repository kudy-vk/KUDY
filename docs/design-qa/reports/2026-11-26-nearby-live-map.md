# Design-QA — Nearby live map and stable location status (2026-11-26)

- **Verdict:** INSUFFICIENT_EVIDENCE
- **Counts:** RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 2
- **Scope:** local branch `chatgpt/fix-nearby-live-map-20261126`, based on `5d21aeb3`; the Nearby (`/map`) screen, live cartography, marker taps, GPS acquisition/status, and dark theme.
- **Sources (base `5d21aeb3`):** `docs/design/visual-language.md` (map tokens and sign conventions), `docs/design/screens-and-transitions.md` (Nearby empty/manual/GPS states), `docs/design/brand/decisions.md` (DT-4), `docs/design-qa/exceptions.md` (light cartography in both themes).
- **Environment:** React Native render tests with mocked MapLibre and fake GPS; Android/iOS device, system font scale, TalkBack, exact runtime screenshots: NOT-VERIFIED.

## Findings

| Surface / state | Approved baseline | Current PNG | Difference PNG | Region / threshold | Owner verdict |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

[NOT-VERIFIED] Nearby map, loading/ready/failed, light and dark: no equivalent approved device screenshot, current-device capture, diff PNG or baseline manifest. Run `visual:check` and a device capture to resolve.

[NOT-VERIFIED] Native gestures, marker touch bounds, GPS recovery, large font and TalkBack: mocked React Native tests verify the event wiring, but not device hit geometry or accessibility speech. Verify on Android and iOS before approval.

## Source-based checks

- Map background uses the fixed `tokens.colorMap`, not the page dark palette (DT-4).
- The guide marker has a spoken label and a 48 dp pressable face; no quantitative touch measurement or device claim is inferred.
- On-screen location status reserves height, and the map frame retains 220 dp height when tiles fail, so a named state does not add or remove the layout block.
- No geolocation subscription is opened by the map itself; Nearby observes the existing one.
- No accepted baseline is modified.

## Mandatory refuting second pass

- Rejected candidate RULE: a light map in the dark theme is **not** a contrast/theme violation, because DT-4 explicitly exempts cartography.
- Rejected candidate RULE: a missing point pin for a place with no catalog geometry is not a violation; making up coordinates would contradict the published-data contract.
- No verified accepted-rule violation survives. Missing device evidence remains NOT-VERIFIED; this is not a design-QA approval.
