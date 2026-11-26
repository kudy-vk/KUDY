// Issue #261 / decision L1: missing Ukrainian guide-hint words use English,
// while authored locale catalogues continue to render their own translations.
import { describe, expect, test } from "@jest/globals";

import { guideHintStrings } from "./GuideHintCard";
import { GUIDE_HINT_STRINGS } from "./guide-hint-strings.generated";

describe("guideHintStrings fallback (L1)", () => {
  test("Ukrainian without authored guide-hint words uses English, not Belarusian", () => {
    expect(guideHintStrings("uk")).toEqual(GUIDE_HINT_STRINGS.en);
    expect(guideHintStrings("uk")).not.toEqual(GUIDE_HINT_STRINGS.be);
  });

  test("translated locales still use their own catalogue", () => {
    for (const locale of ["be", "en", "de", "pl", "fr"] as const) {
      expect(guideHintStrings(locale)).toEqual(GUIDE_HINT_STRINGS[locale]);
    }
  });

  test("an unknown locale uses the English base language", () => {
    expect(guideHintStrings("eo")).toEqual(GUIDE_HINT_STRINGS.en);
  });
});
