// The Norwegian Bokmål (nb) catalogue's locale-specific rendering suite.
// The shipped-locale gate (tools/i18n/check-messages.mjs) proves the nb set's
// completeness, review evidence and output freshness; this suite proves the
// Norwegian words render through the production selectors: the adapter chains
// route nb, the discrete forms (numeric timeCap, named preview detail) render
// the Norwegian variants, and the composed textAudioLine drops its audio tail
// on an empty list.
import test from 'node:test';
import assert from 'node:assert/strict';

import { localeFamilies } from './ui-locale-families.mjs';
import { nb as webNb } from '../web/lib/i18n/nb.ts';
import { getUiStrings } from '../web/lib/i18n/index.ts';

test('the chrome adapter routes nb to the Norwegian Bokmål catalogue', () => {
  const s = localeFamilies('nb').chrome;
  assert.equal(s.back, 'Tilbake');
  assert.equal(s.currentWalk, 'Pågående vandring');
  assert.equal(s.catalogUnavailable, 'Katalogen er ikke tilgjengelig');
  assert.equal(s.retry, 'Prøv igjen');
  assert.equal(s.whatToDo, 'Utforsk →');
  assert.equal(s.discoveryTitle, 'Utforsk');
  assert.equal(s.languageSelfNames.nb, 'Norsk bokmål');
  assert.equal(s.languageSelfNames.be, 'Беларуская');
});

test('the Norwegian discrete forms render over the selector arguments', () => {
  const s = localeFamilies('nb').chrome;
  assert.equal(s.timeCap(30), 'Inntil 30 min');
  assert.equal(s.timeCap(60), 'Inntil én time');
  assert.equal(s.timeCap(120), 'Inntil to timer');
  assert.equal(s.timeCap(240), 'Halv dag');
  assert.equal(s.stopsCount(5), 'Stopp: 5');
  assert.equal(s.stopNumber(3), 'Stopp 3');
  assert.equal(s.durationRange(45, 90), 'Tid: fra 45 til 90 min');
  assert.equal(s.textAudioLine(['nb'], []), 'Tekst: nb');
  assert.equal(s.textAudioLine(['nb'], ['en']), 'Tekst: nb; lyd: en');
});

test('the Norwegian preview detail renders the named kind forms', () => {
  const { preview, previewReasonText } = localeFamilies('nb');
  assert.equal(preview.detail({ kind: 'damaged' }), 'Pakken er skadet: last ned på nytt');
  assert.equal(preview.detail({ kind: 'missing-files', count: 2 }), 'Filer mangler: 2');
  assert.equal(preview.detail({ kind: 'stale' }), 'En oppdatering er tilgjengelig');
  assert.equal(preview.detail({ kind: 'other' }), 'Pakken er ufullstendig');
  assert.equal(previewReasonText('preview#purchase-required', preview), 'Kjøp kreves.');
  assert.equal(previewReasonText('preview#unknown', preview), 'preview#unknown');
});

test('every Norwegian controller family routes and renders its words', () => {
  const f = localeFamilies('nb');
  assert.equal(f.guideHint.heading, 'Det finnes en guide i nærheten…');
  assert.equal(f.guideHint.paid, 'betalt');
  assert.equal(f.run.endWalk, 'Avslutt vandringen');
  assert.equal(f.run.recenter, 'Min posisjon');
  assert.equal(f.runReason('run#package-not-downloaded', f.run), 'Guiden er ikke lastet ned.');
  assert.equal(f.place.playLabel, 'Lytt til smakebiten');
  assert.equal(f.place.stopLabel, 'Stopp');
  assert.equal(f.place.guideLink, 'Til guiden');
  assert.equal(f.nearby.title, 'I nærheten');
  assert.equal(f.offer.buy, 'Kjøp');
  assert.equal(f.offer.dismiss, 'Ikke nå');
  assert.equal(f.feedback.deleteButton, 'Fjern vurderingen');
  assert.equal(f.feedback.ratingOf(4), '4 av 5');
});

test('the Norwegian web catalogue renders through getUiStrings with the same key shape', () => {
  const be = getUiStrings('be');
  const nb = getUiStrings('nb');
  assert.equal(nb, webNb);
  assert.equal(nb.catalogTitle, 'Byguider');
  assert.equal(nb.nextStop, 'Neste stopp');
  assert.equal(nb.privacyTitle, 'Personvern');
  assert.deepEqual(Object.keys(nb).sort(), Object.keys(be).sort());
  for (const [key, value] of Object.entries(nb)) {
    if (typeof value === 'string') assert.ok(value.length > 0, `${key}: empty word`);
  }
});

test('the GOT 2025 top locales (pl, da, nl, pt) route through native and web selectors with idiomatic menu names', () => {
  const expected = {
    pl: { whatToDo: 'Odkrywaj →', aboutCity: 'Praktycznie', recenter: 'Gdzie jestem', guideLink: 'Do przewodnika', webTitle: 'Przewodniki miejskie' },
    da: { whatToDo: 'Oplev →', aboutCity: 'Praktisk info', recenter: 'Find mig', guideLink: 'Til guiden', webTitle: 'Byguider' },
    nl: { whatToDo: 'Ontdek →', aboutCity: 'Praktische info', recenter: 'Waar ben ik', guideLink: 'Naar gids', webTitle: 'Stadsgidsen' },
    pt: { whatToDo: 'Explorar →', aboutCity: 'Guia prático', recenter: 'Onde estou', guideLink: 'Ver guia', webTitle: 'Guias da cidade' },
  };
  for (const [code, exp] of Object.entries(expected)) {
    const f = localeFamilies(code);
    assert.equal(f.chrome.whatToDo, exp.whatToDo);
    assert.equal(f.chrome.aboutCity, exp.aboutCity);
    assert.equal(f.run.recenter, exp.recenter);
    assert.equal(f.place.guideLink, exp.guideLink);
    assert.equal(getUiStrings(code).catalogTitle, exp.webTitle);
  }
});
