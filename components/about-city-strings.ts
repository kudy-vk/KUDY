// Issue #200 — the «Пра горад» guide's word selector (the runMapStrings
// idiom): the generated projection carries the authored catalogue and this
// adapter only picks it. The document is authored in Belarusian — the app's
// first preference — so every display locale renders the be text until its
// words are authored (the guideHint documented-fallback idiom); a locale set
// joins the translation gate the same way the guideHint locales joined.
import type { AboutCityStrings } from "../contracts/ui-message-types";

import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";

export function aboutCityStrings(locale: string): AboutCityStrings {
  // The generated projection carries one authored catalogue (be), so the
  // selector renders it for every display locale (the documented-fallback
  // idiom); the argument keeps the shared strings-selector signature.
  return ABOUT_CITY_STRINGS;
}
