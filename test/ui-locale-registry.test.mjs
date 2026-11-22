// G21.09 (issue #542) — the one UI-locale registry: the eight requested codes
// and native names verbatim (criterion 1), the complete subset the adapters
// may advertise (criterion 4), and the per-locale native catalogue
// completeness (criterion 5). Deleting a registry entry, a complete code or a
// catalogue family fails here through the standard runner; the store's
// unknown-input semantics are asserted unchanged. G21.46 (G21.42-chinese-language.md — G21.46) adds the
// ninth code zh with its catalogue — complete and still closed until the
// G21.50 release flag opens it.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UI_LOCALES,
  COMPLETE_UI_LOCALES,
  OPEN_UI_LOCALES,
  RELEASE_FLAG_ENV,
  releaseOpenUiLocales,
  uiLocaleNativeName,
  isUiLocaleCode,
  isCompleteUiLocale,
} from '../contracts/ui-locales.ts';
import { createUiLocaleStore, UiLocaleError } from '../controllers/uiLocaleStore.ts';
import { uiStrings } from '../components/ui-strings.ts';
import { previewStrings } from '../controllers/catalog/previewController.ts';
import { runMapStrings } from '../controllers/run/runMap.ts';
import { placeDetailStrings } from '../controllers/place/placeDetailController.ts';
import { nearbyStrings } from '../controllers/nearby/nearbySurfaceController.ts';
import { offerStrings } from '../controllers/commerce/commerceController.ts';

// Issue #542 criterion 1: the eight requested UI codes and native names,
// plus the G21.46 ninth code (zh) — the registry table owns all nine rows.
const EIGHT = [
  { code: 'be', nativeName: 'Беларуская' },
  { code: 'en', nativeName: 'English' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'cs', nativeName: 'Čeština' },
  { code: 'sv', nativeName: 'Svenska' },
];

// G21.46 (G21.42-chinese-language.md — G21.46): the ninth registered code. The native name is stored
// as \uXXXX escapes in the registry (repo bytes stay CJK-free) and decodes to
// the real glyphs — the assertion below proves both halves.
const ZH = { code: 'zh', nativeName: '\u7B80\u4F53\u4E2D\u6587' };
const NB = { code: 'nb', nativeName: 'Norsk bokmål' };
const PL = { code: 'pl', nativeName: 'Polski' };
const DA = { code: 'da', nativeName: 'Dansk' };
const NL = { code: 'nl', nativeName: 'Nederlands' };
const PT = { code: 'pt', nativeName: 'Português' };
const IT = { code: 'it', nativeName: 'Italiano' };
const FI = { code: 'fi', nativeName: 'Suomi' };
const LT = { code: 'lt', nativeName: 'Lietuvių' };
const ET = { code: 'et', nativeName: 'Eesti' };
const LV = { code: 'lv', nativeName: 'Latviešu' };
const SK = { code: 'sk', nativeName: 'Slovenčina' };
const HU = { code: 'hu', nativeName: 'Magyar' };
const SL = { code: 'sl', nativeName: 'Slovenščina' };
const HR = { code: 'hr', nativeName: 'Hrvatski' };
const RO = { code: 'ro', nativeName: 'Română' };
const BG = { code: 'bg', nativeName: 'Български' };
const EL = { code: 'el', nativeName: 'Ελληνικά' };
const SR = { code: 'sr', nativeName: 'Српски' };
const BS = { code: 'bs', nativeName: 'Bosanski' };
const MK = { code: 'mk', nativeName: 'Македонски' };
const SQ = { code: 'sq', nativeName: 'Shqip' };
const IS = { code: 'is', nativeName: 'Íslenska' };
const GA = { code: 'ga', nativeName: 'Gaeilge' };
const MT = { code: 'mt', nativeName: 'Malti' };
const CA = { code: 'ca', nativeName: 'Català' };
const TR = { code: 'tr', nativeName: 'Türkçe' };
const RU = { code: 'ru', nativeName: 'Русский' };
const LB = { code: 'lb', nativeName: 'Lëtzebuergesch' };
const CNR = { code: 'cnr', nativeName: 'Црногорски' };
const THIRTY_EIGHT_ENTRIES = [...EIGHT, ZH, NB, PL, DA, NL, PT, IT, FI, LT, ET, LV, SK, HU, SL, HR, RO, BG, EL, SR, BS, MK, SQ, IS, GA, MT, CA, TR, RU, LB, CNR];
const FROZEN_OPEN = ['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv'];

test('the registry defines the eight requested UI codes plus zh, nb, pl, da, nl, pt, it, fi, lt, et, lv, sk, hu, sl, hr, ro, bg, el, sr, bs, mk, sq, is, ga, mt, ca, tr, ru, lb and cnr, with native names, once (criterion 1)', () => {
  assert.deepEqual([...UI_LOCALES], THIRTY_EIGHT_ENTRIES);
  for (const { code, nativeName } of THIRTY_EIGHT_ENTRIES) {
    assert.equal(uiLocaleNativeName(code), nativeName);
  }
  assert.throws(() => uiLocaleNativeName('gr'), /ui-locale-unregistered/);
});

test('the complete set is be/en/uk/de/es/fr/cs/sv/zh/nb/pl/da/nl/pt/it/fi/lt/et/lv/sk/hu/sl/hr/ro/bg/el/sr/bs/mk/sq/is/ga/mt/ca/tr/ru/lb/cnr — all thirty-eight registered UI codes (criterion 4)', () => {
  assert.deepEqual([...COMPLETE_UI_LOCALES], ['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv', 'zh', 'nb', 'pl', 'da', 'nl', 'pt', 'it', 'fi', 'lt', 'et', 'lv', 'sk', 'hu', 'sl', 'hr', 'ro', 'bg', 'el', 'sr', 'bs', 'mk', 'sq', 'is', 'ga', 'mt', 'ca', 'tr', 'ru', 'lb', 'cnr']);
  for (const { code } of THIRTY_EIGHT_ENTRIES) {
    assert.equal(isUiLocaleCode(code), true, `${code} is registered`);
  }
  for (const code of COMPLETE_UI_LOCALES) {
    assert.equal(isCompleteUiLocale(code), true, `${code} is complete`);
  }
  for (const code of ['gr']) {
    assert.equal(isCompleteUiLocale(code), false, `${code} is not even registered`);
  }
});

test('every complete locale renders every registered native message family (criterion 5)', () => {
  for (const locale of COMPLETE_UI_LOCALES) {
    const families = {
      chrome: uiStrings(locale),
      preview: previewStrings(locale),
      run: runMapStrings(locale),
      place: placeDetailStrings(locale),
      nearby: nearbyStrings(locale),
      offer: offerStrings(locale),
    };
    for (const [name, catalog] of Object.entries(families)) {
      assert.equal(typeof catalog, 'object', `${name}(${locale}) renders a catalog`);
      assert.ok(Object.keys(catalog).length > 0, `${name}(${locale}) is non-empty`);
    }
    // The chrome catalog's self-name table covers exactly the complete codes
    // — the picker never names an unregistered or incomplete language.
    assert.deepEqual(Object.keys(uiStrings(locale).languageSelfNames).sort(), [...COMPLETE_UI_LOCALES].sort());
  }
});

test('the store derives its vocabulary from the registry and keeps unknown-input semantics (criterion 4)', () => {
  const store = createUiLocaleStore();
  assert.equal(store.current(), 'be');
  store.set('en');
  assert.equal(store.current(), 'en');
  // Unregistered codes are refused exactly like an incomplete one used to be
  // (the named UiLocaleError, no silent state), and a refused switch keeps
  // the current locale. A complete catalogue joins the store's vocabulary
  // the commit it lands (es, G21.11 — 2026-10-03-single-source-translations.md; fr, G21.12 — same record; cs,
  // G21.13 — same record; sv, G21.14 — same record — the eight requested codes are
  // all complete now): the positive siblings of the refusals.
  for (const unregistered of ['gr']) {
    assert.throws(() => store.set(unregistered), UiLocaleError);
    assert.equal(store.current(), 'en');
  }
  store.set('es');
  assert.equal(store.current(), 'es');
  store.set('fr');
  assert.equal(store.current(), 'fr');
  store.set('cs');
  assert.equal(store.current(), 'cs');
  store.set('sv');
  assert.equal(store.current(), 'sv');
  store.set('be');
  assert.equal(store.current(), 'be');
  // G21.46/G21.50: zh is registered complete but closed by the release gate —
  // the switch refuses it with its own named rule (not the unknown one) and
  // keeps the current locale. The openLocales seam (the tests' one) accepts
  // it, because the code's catalogue is complete.
  assert.throws(
    () => store.set('zh'),
    (error) => error instanceof UiLocaleError && error.rule === 'ui-locale-closed',
  );
  assert.equal(store.current(), 'be');
  const openStore = createUiLocaleStore(undefined, COMPLETE_UI_LOCALES);
  openStore.set('zh');
  assert.equal(openStore.current(), 'zh');
});

// G21.50 (G21.42-chinese-language.md — G21.50): the open subset is a separate fact from the complete
// set. zh is the first real gated consumer (it lands with G21.46 and stays
// closed): a code can be complete and still closed, only the flag opens it,
// and the frozen eight stay open under every flag state. Removing the
// resolver's union or its complete-set check turns these red.
const TEN = [...COMPLETE_UI_LOCALES, 'zz'];

test('the release resolver keeps the frozen eight open when the flag is absent, empty or corrupt (criterion 1)', () => {
  for (const flag of [undefined, null, '', '   ', ',', ' , , ', 'bogus', 'gr', 'bogus, ,gr']) {
    assert.deepEqual(
      [...releaseOpenUiLocales(flag, TEN)],
      FROZEN_OPEN,
      `flag ${JSON.stringify(flag)} opens nothing beyond the frozen default`,
    );
  }
  // Production binding: the default `complete` is the real registry, where
  // zh is a registered complete code — an absent flag still leaves it closed.
  assert.deepEqual([...releaseOpenUiLocales(undefined)], FROZEN_OPEN);
  assert.deepEqual([...OPEN_UI_LOCALES], FROZEN_OPEN);
  assert.equal(RELEASE_FLAG_ENV, 'EXPO_PUBLIC_OPEN_UI_LOCALES');
});

test('the release resolver opens a registered complete code only when the flag names it, additively (criterion 1)', () => {
  // The real gated codes: naming the gated codes opens them alongside the frozen eight.
  assert.deepEqual([...releaseOpenUiLocales('zh')], [...FROZEN_OPEN, 'zh']);
  assert.deepEqual([...releaseOpenUiLocales('zh,nb,pl,da,nl,pt,it,fi,lt,et,lv,sk,hu,sl,hr,ro,bg,el,sr,bs,mk,sq,is,ga,mt,ca,tr,ru,lb,cnr')], COMPLETE_UI_LOCALES);
  assert.deepEqual([...releaseOpenUiLocales('  zh , nb , pl , da , nl , pt , it , fi , lt , et , lv , sk , hu , sl , hr , ro , bg , el , sr , bs , mk , sq , is , ga , mt , ca , tr , ru , lb , cnr ,bogus,gr\t')], COMPLETE_UI_LOCALES);
  // A synthetic extra code keeps the generic additive proof independent of
  // which codes exist today: naming zz opens exactly zz (gated codes stay closed).
  assert.deepEqual([...releaseOpenUiLocales('zz', TEN)], [...FROZEN_OPEN, 'zz']);
  assert.deepEqual([...releaseOpenUiLocales('  zz ,bogus,gr\t', TEN)], [...FROZEN_OPEN, 'zz']);
  // Additive only: naming an already-open code neither duplicates it nor
  // removes any of the frozen eight (hiding sv is out of scope, G21.50).
  assert.deepEqual([...releaseOpenUiLocales('be, en', TEN)], FROZEN_OPEN);
  assert.deepEqual([...releaseOpenUiLocales('sv, zh, nb, pl, da, nl, pt, it, fi, lt, et, lv, sk, hu, sl, hr, ro, bg, el, sr, bs, mk, sq, is, ga, mt, ca, tr, ru, lb, cnr, zz', TEN)], TEN);
});
