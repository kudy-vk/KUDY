import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { LOCALES } from '../../../production/kit.mjs';
import { visibleShortcut, proposal, copyByLocale, viewProps } from './board.mjs';

const labels = {
  'native.chrome.back': 'Back',
  'native.chrome.walk': 'Walk',
  'native.place.resumeLabel': 'Resume',
};

test('UI-REVIEW-02 A is the accepted Back + Walk glyph/style pair', () => {
  assert.deepEqual(proposal.a, {
    back: 'arrow-left', backStyle: 'bare',
    walk: 'footprints', walkStyle: 'filled',
  });
  assert.notDeepEqual(proposal.a, proposal.b);
  assert.notDeepEqual(proposal.a, proposal.c);
});

test('Resume shortcut appears only during an active/paused session outside Run', () => {
  for (const walk of ['active', 'paused', 'none']) {
    for (const screen of ['other', 'run']) {
      const state = { walk, screen, locale: 'be', variant: 'a' };
      const expected = (walk === 'active' || walk === 'paused') && screen === 'other';
      assert.equal(visibleShortcut(state), expected, walk + '/' + screen);
      assert.equal(viewProps(state, labels).shortcut, expected, walk + '/' + screen);
    }
  }
  assert.equal(visibleShortcut({ walk: 'ended', screen: 'other' }), false);
});

test('Each language offered by the production mockup has complete UI-REVIEW-02 fixture copy', () => {
  assert.deepEqual(Object.keys(copyByLocale).sort(), Object.keys(LOCALES).sort());
  for (const locale of Object.keys(LOCALES)) {
    const copy = copyByLocale[locale];
    for (const key of ['title', 'active', 'paused', 'none',
      'infoLabel', 'infoEvent', 'backEvent', 'walkEvent', 'narrowNote']) {
      assert.equal(typeof copy[key], 'string', locale + '.' + key);
      assert.ok(copy[key].trim().length >= 3, locale + '.' + key);
    }
    const view = viewProps({ locale, variant: 'a', screen: 'other', walk: 'paused' }, labels);
    assert.equal(view.title, copy.title, locale + ': title');
    assert.equal(view.status, copy.paused, locale + ': paused state');
    assert.equal(view.copy.infoLabel, copy.infoLabel, locale + ': accessible info label');
    assert.equal(view.copy.walkEvent, copy.walkEvent, locale + ': event feedback');
    assert.equal(view.copy.narrowNote, copy.narrowNote, locale + ': narrow-layout notice');
    if (locale !== 'en') {
      assert.notEqual(view.title, copyByLocale.en.title, locale + ': no English title fallback');
    }
  }
});

test('Reported pl/de/es language regressions cannot silently fall back to Belarusian or English', () => {
  assert.equal(copyByLocale.pl.infoLabel, 'Informacje');
  assert.equal(copyByLocale.pl.paused, 'Spacer wstrzymany');
  assert.equal(copyByLocale.de.infoLabel, 'Informationen');
  assert.equal(copyByLocale.de.active, 'Rundgang läuft');
  assert.equal(copyByLocale.es.title, 'Detalles de la ruta a pie por Gdańsk');
  assert.equal(copyByLocale.es.none, 'Sin recorrido');
});

test('Localized Back, Walk and Resume labels continue to come from app contracts', () => {
  for (const locale of Object.keys(LOCALES)) {
    const file = locale === 'be'
      ? 'contracts/ui-messages/source.json'
      : 'contracts/ui-messages/translations/' + locale + '.json';
    const records = JSON.parse(readFileSync(file, 'utf8')).records;
    const strings = Object.fromEntries(
      Object.keys(labels).map((id) => {
        const record = records.find((item) => item.id === id);
        assert.ok(record, locale + ': missing ' + id);
        return [id, record.value ?? record.source];
      }),
    );
    const view = viewProps({ locale, variant: 'a', screen: 'run', walk: 'active' }, strings);
    assert.equal(view.labelBack, strings['native.chrome.back']);
    assert.equal(view.labelWalk, strings['native.place.resumeLabel'] + ' · ' + strings['native.chrome.walk']);
    assert.equal(view.title, strings['native.chrome.walk']);
    assert.equal(view.shortcut, false);
  }
});

test('Unsupported review locale/variant fails visibly instead of silently falling back', () => {
  assert.throws(
    () => viewProps({ locale: 'zz', variant: 'a', screen: 'other', walk: 'active' }, labels),
    /Unsupported review locale/,
  );
  assert.throws(
    () => viewProps({ locale: 'en', variant: 'z', screen: 'other', walk: 'active' }, labels),
    /Unsupported review variant/,
  );
});
