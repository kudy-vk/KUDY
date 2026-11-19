// #334: the native message contract follows the accepted #257 wording.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DROPPED, en } from '../docs/design/production/about-257-words-en.mjs';
import { be } from '../docs/design/production/about-257-words-be.mjs';
import { formatMapKilometres } from '../docs/design/production/about-map-geo.mjs';
import { OLD_TOWN, PLANE_PATH } from '../docs/design/production/route-art-paths.mjs';
import { ABOUT_CITY_STRINGS } from '../components/about-city-strings.generated.ts';

const prefix = 'native.aboutCity.';
const own = ['sources.title', 'tr.residents', 'resident.title', 'resident.lead',
  'resident.openOfficial', 'card.brandAlt', 'card.lead', 'card.openOfficial', 'links.kartaTurysty'];

test('obsolete #257 words and fare rows are absent from the native source', () => {
  const source = JSON.parse(readFileSync(new URL('../contracts/ui-messages/source.json', import.meta.url), 'utf8'));
  const ids = new Set(source.records.map((record) => record.id));
  for (const key of [...DROPPED, 'card.freeHeading', 'u.reduced', 'tk.singleRide', 'tk.75', 'tk.day24', 'tk.72h']) {
    assert.equal(ids.has(prefix + key), false, key);
  }
  for (const key of own) assert.ok(ids.has(prefix + key), key);
});

test('BE and EN native words match the approved #257 mockup', () => {
  for (const [locale, expected] of [['be', be], ['en', en]]) {
    for (const key of own) {
      const entry = key.split('.').reduce((node, part) => node[part], ABOUT_CITY_STRINGS[locale]);
      assert.equal(typeof entry === 'function' ? entry('Test') : entry, expected[key].replace('{name}', 'Test'), locale + ': ' + key);
    }
  }
});

test('the map formats kilometres without the removed price decimal key', () => {
  for (const [lang, expected] of [['be', '1,2'], ['en', '1.2']]) {
    assert.equal(formatMapKilometres(1240, lang), expected);
    assert.equal(ABOUT_CITY_STRINGS[lang].card.brandMark, 'KT');
  }
});

test('the accepted Old Town artwork has one shared source for HTML and native SVG', () => {
  assert.ok(OLD_TOWN.length > 0 && /^[Mm]/.test(PLANE_PATH));
  for (const path of ['../docs/design/production/about-257.mjs', '../components/about-city-direction.tsx']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /import\s*\{\s*OLD_TOWN(?:,\s*PLANE_PATH)?\s*\}\s*from\s*['"][^'"]*route-art-paths\.mjs['"]/);
    assert.doesNotMatch(source, /(?:const|let) OLD_TOWN\s*=/);
  }
});
