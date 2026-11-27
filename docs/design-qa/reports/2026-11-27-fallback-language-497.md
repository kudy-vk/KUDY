Verdict: INSUFFICIENT_EVIDENCE
Counts: RULE 0 · DIFF 0 · OPINION 0 · NOT-VERIFIED 2
Scope: PR #492; base `b14e706419a4e5f316f6f84c3a25dde7686b2c48`; head `cebb2b3c3c7d303fc4680f283d4a237da7989742`; Walk menu dialog and Settings → Guides accessible names in `nb`.
Sources: [visual language](../../design/visual-language.md) §§2–5, 9 (`48912dd2eda1eb2dc56e586dc651b03bcf03b93f`); [screen transitions](../../design/screens-and-transitions.md), Guides and Walk (`8c990d4fcd58d8ee40134d29c1d82ecf7317ce75`); [accepted decisions](../../design/brand/decisions.md), M3 and L1 (`b14e706419a4e5f316f6f84c3a25dde7686b2c48`); [exceptions](../exceptions.md) (`9165d2226723cde76851db04a974b3b19b83307a`).
Environment: Chromium 153.0.8010.12 through `test/browser-page.mjs`; semantic regression at browser viewport 1000×2200, selected locale `nb`, light phone; broader acceptance suite covers light and dark frames. No Android, TalkBack or VoiceOver session.

DIFF table:

| surface/state | approved baseline | current PNG | difference PNG | region/threshold | owner verdict |
|---|---|---|---|---|---|

No visible content or styling changed, and there is no approved matching baseline for these screens; pixel comparison was not performed.

Browser evidence: `node --test --experimental-strip-types test/design-fallback-language-browser.test.mjs test/design-critical-locales-browser.test.mjs` passed 16 tests. The new regression confirms that `Walk menu` and the Guides group label carry `lang="en"` on their referenced visible headings, while Norwegian actions and Belarusian guide tags do not acquire English language metadata. The test covers DOM language inheritance, not screen-reader pronunciation.

[NOT-VERIFIED] Pixel comparison: no approved matching baseline/current/difference set exists for these mockups.

[NOT-VERIFIED] TalkBack and VoiceOver pronunciation and traversal: this HTML mockup was not checked with a device screen reader. Device evidence is required to verify actual assistive-technology behavior.

Second-pass rejected candidates:

- Treating the inherited-language defect as a RULE is unsupported: the accepted visual canon does not specify language metadata on HTML mockup containers. The finding is an accessibility correctness issue independently reproduced and covered by a browser regression, not a visual-canon violation.
- Treating the new `aria-labelledby` references as a visual DIFF is unsupported: the referenced headings are already visible and unchanged; the patch changes only accessible-name wiring and `lang` inheritance.

No owner decision is needed for a verified RULE or DIFF; neither was identified.
