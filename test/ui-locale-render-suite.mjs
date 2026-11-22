// The shared locale-catalogue rendering suite (the EU-UI wave tests register
// their locale data through it — jscpd: one suite, not per-wave copies). The
// shipped-locale gate (tools/i18n/check-messages.mjs) proves each set's
// completeness, review evidence and output freshness; this suite proves the
// words render through the production selectors: the adapter chains route
// each wave's codes, the menu transcreation and the spec length budgets
// hold, the discrete forms (numeric timeCap) render the authored variants,
// and the web catalogues keep the be key shape with non-empty words.
import test from 'node:test';
import assert from 'node:assert/strict';

import { localeFamilies } from './ui-locale-families.mjs';
import { getUiStrings } from '../web/lib/i18n/index.ts';

// The spec's length budgets (2026-11-21-european-ui-locales.md §4): narrow
// screens at 320×640 with ×1.5–2.0 font. Asserted here so reverting any of
// the authored badges to a longer word fails the suite.
export const RENDER_BUDGETS = { recenter: 14, guideLink: 16, paid: 10 };

// `expected` maps code → the transcreated anchors; `timeCapForms` maps code →
// {60,120,240} word tables; `webData` maps code → the generated web catalogue
// export; `label` names the wave in the test titles.
export function registerLocaleRenderSuite({ label, expected, timeCapForms, webData }) {
  const codes = Object.keys(expected);

  test(`the ${label} locales (${codes.join(', ')}) route through native and web selectors with idiomatic menu names`, () => {
    for (const [code, exp] of Object.entries(expected)) {
      const f = localeFamilies(code);
      assert.equal(f.chrome.whatToDo, exp.whatToDo, `${code}: whatToDo`);
      assert.equal(f.chrome.aboutCity, exp.aboutCity, `${code}: aboutCity`);
      assert.equal(f.chrome.languageSelfNames[code], exp.selfName, `${code}: self name`);
      assert.equal(f.run.recenter, exp.recenter, `${code}: recenter`);
      assert.equal(f.place.guideLink, exp.guideLink, `${code}: guideLink`);
      assert.equal(f.chrome.access.paid, exp.paid, `${code}: paid badge`);
      assert.equal(f.offer.buy, exp.offerBuy, `${code}: offer buy`);
      assert.equal(f.feedback.ratingOf(4), exp.ratingOf4, `${code}: ratingOf`);
      assert.equal(f.guideHint.heading, exp.guideHintHeading, `${code}: guide hint`);
      assert.equal(getUiStrings(code).catalogTitle, exp.webTitle, `${code}: web catalog title`);
      assert.equal(getUiStrings(code).privacyTitle, exp.webPrivacyTitle, `${code}: web privacy title`);
      for (const [word, budget] of Object.entries(RENDER_BUDGETS)) {
        const familyWord = { recenter: f.run.recenter, guideLink: f.place.guideLink, paid: f.chrome.access.paid }[word];
        assert.ok(familyWord.length <= budget, `${code}: ${word} ${familyWord.length} > ${budget}`);
      }
    }
  });

  test(`the ${codes.join('/')} discrete time-cap forms switch at 60/120/240 and interpolate the base`, () => {
    for (const [code, exp] of Object.entries(expected)) {
      const chrome = localeFamilies(code).chrome;
      for (const [minutes, word] of Object.entries(timeCapForms[code])) {
        assert.equal(chrome.timeCap(Number(minutes)), word, `${code}: timeCap form ${minutes}`);
      }
      assert.equal(chrome.timeCap(30), exp.timeCapBase30, `${code}: timeCap base interpolates`);
      assert.equal(chrome.stopsCount(5), exp.stopsCount5, `${code}: stopsCount`);
    }
  });

  test(`the ${codes.join('/')} web catalogues render through getUiStrings with the be key shape`, () => {
    const be = getUiStrings('be');
    for (const [code, data] of Object.entries(webData)) {
      const words = getUiStrings(code);
      assert.equal(words, data);
      assert.deepEqual(Object.keys(words).sort(), Object.keys(be).sort(), `${code}: key shape`);
      for (const [key, value] of Object.entries(words)) {
        if (typeof value === 'string') assert.ok(value.length > 0, `${code}: empty word ${key}`);
      }
    }
  });
}
