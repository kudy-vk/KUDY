// The Italian, Finnish and Lithuanian catalogues' locale-specific rendering
// suite (EU-UI-01, issue #377). The shipped-locale gate
// (tools/i18n/check-messages.mjs) proves the three sets' completeness, review
// evidence and output freshness; this suite proves the words render through
// the production selectors: the adapter chains route it/fi/lt, the menu
// transcreation and the spec length budgets hold, the discrete forms (numeric
// timeCap) render the authored variants, and the web catalogues keep the be
// key shape with non-empty words.
import test from 'node:test';
import assert from 'node:assert/strict';

import { localeFamilies } from './ui-locale-families.mjs';
import { it as webIt } from '../web/lib/i18n/it.ts';
import { fi as webFi } from '../web/lib/i18n/fi.ts';
import { lt as webLt } from '../web/lib/i18n/lt.ts';
import { getUiStrings } from '../web/lib/i18n/index.ts';

const WEB_DATA = { it: webIt, fi: webFi, lt: webLt };

// The spec's length budgets (2026-11-21-european-ui-locales.md §4): narrow
// screens at 320×640 with ×1.5–2.0 font. Asserted here so reverting any of
// the three authored badges to a longer word fails the suite.
const BUDGETS = { recenter: 14, guideLink: 16, paid: 10 };

const EXPECTED = {
  it: {
    whatToDo: 'Cosa fare →',
    aboutCity: 'Guida città',
    recenter: 'Dove sono',
    guideLink: 'Alla guida',
    paid: 'Pagamento',
    timeCapForm60: "Fino a un'ora",
    timeCapBase30: 'Fino a 30 min',
    stopsCount5: 'Tappe: 5',
    offerBuy: 'Acquista',
    ratingOf4: '4 su 5',
    guideHintHeading: "Nelle vicinanze c'è una guida…",
    selfName: 'Italiano',
    webTitle: 'Guide della città',
    webPrivacyTitle: 'Privacy',
  },
  fi: {
    whatToDo: 'Tekemistä →',
    aboutCity: 'Kaupunkiopas',
    recenter: 'Oma sijainti',
    guideLink: 'Katso opas',
    paid: 'Maksu',
    timeCapForm60: 'Enintään tunti',
    timeCapBase30: 'Enintään 30 min',
    stopsCount5: 'Kohteet: 5',
    offerBuy: 'Osta',
    ratingOf4: '4 / 5',
    guideHintHeading: 'Lähellä on opas…',
    selfName: 'Suomi',
    webTitle: 'Kaupungin oppaat',
    webPrivacyTitle: 'Tietosuoja',
  },
  lt: {
    whatToDo: 'Ką veikti →',
    aboutCity: 'Miesto gidas',
    recenter: 'Kur esu',
    guideLink: 'Į gidą',
    paid: 'Mokama',
    timeCapForm60: 'Iki valandos',
    timeCapBase30: 'Iki 30 min',
    stopsCount5: 'Sustojimai: 5',
    offerBuy: 'Pirkti',
    ratingOf4: '4 iš 5',
    guideHintHeading: 'Netoliese yra gidas…',
    selfName: 'Lietuvių',
    webTitle: 'Miesto gidai',
    webPrivacyTitle: 'Privatumas',
  },
};

test('the GOT 2025 wave-2 locales (it, fi, lt) route through native and web selectors with idiomatic menu names', () => {
  for (const [code, exp] of Object.entries(EXPECTED)) {
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
    for (const [word, budget] of Object.entries(BUDGETS)) {
      const familyWord = { recenter: f.run.recenter, guideLink: f.place.guideLink, paid: f.chrome.access.paid }[word];
      assert.ok(familyWord.length <= budget, `${code}: ${word} ${familyWord.length} > ${budget}`);
    }
  }
});

test('the it/fi/lt discrete time-cap forms switch at 60/120/240 and interpolate the base', () => {
  const forms = {
    it: { 60: "Fino a un'ora", 120: 'Fino a due ore', 240: 'Mezza giornata' },
    fi: { 60: 'Enintään tunti', 120: 'Enintään kaksi tuntia', 240: 'Puoli päivää' },
    lt: { 60: 'Iki valandos', 120: 'Iki dviejų valandų', 240: 'Pusė dienos' },
  };
  for (const [code, exp] of Object.entries(EXPECTED)) {
    const chrome = localeFamilies(code).chrome;
    for (const [minutes, word] of Object.entries(forms[code])) {
      assert.equal(chrome.timeCap(Number(minutes)), word, `${code}: timeCap form ${minutes}`);
    }
    assert.equal(chrome.timeCap(30), exp.timeCapBase30, `${code}: timeCap base interpolates`);
    assert.equal(chrome.stopsCount(5), exp.stopsCount5, `${code}: stopsCount`);
  }
});

test('the it/fi/lt web catalogues render through getUiStrings with the be key shape', () => {
  const be = getUiStrings('be');
  for (const [code, data] of Object.entries(WEB_DATA)) {
    const words = getUiStrings(code);
    assert.equal(words, data);
    assert.deepEqual(Object.keys(words).sort(), Object.keys(be).sort(), `${code}: key shape`);
    for (const [key, value] of Object.entries(words)) {
      if (typeof value === 'string') assert.ok(value.length > 0, `${code}: empty word ${key}`);
    }
  }
});
