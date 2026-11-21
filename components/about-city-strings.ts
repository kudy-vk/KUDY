// Issue #252 — the «Пра горад» wheel screen's word selector (the uiStrings
// idiom): the generated projection carries be and en, and decision L1
// (docs/design/brand/decisions.md) makes English the base language — a
// display locale without its own words shows the English text, not the be
// base the #200 document used. A locale set joins the translation gate the
// same way the chrome locales joined.
import type { AboutCityStrings } from "../contracts/ui-message-types";

import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";

function hasCatalogue(locale: string): locale is keyof typeof ABOUT_CITY_STRINGS {
  return locale in ABOUT_CITY_STRINGS;
}

export function aboutCityStrings(locale: string): AboutCityStrings {
  return hasCatalogue(locale) ? ABOUT_CITY_STRINGS[locale] : ABOUT_CITY_STRINGS.en;
}
