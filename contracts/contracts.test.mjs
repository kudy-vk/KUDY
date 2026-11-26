// G02.01 — acceptance suite for the content contracts. Issue #54 criteria:
// 1. route_id is the UI "Гід" identity; reordering stops never changes ids.
// 2. origin/namespace isolation.
// 3. Per-file checks: history/version, language, transcript, rights, access.
// 4. An import cannot claim official provenance.
// 5. DiscoveryIndex/refs, FeedbackTarget, time range, seasonal reasons and the
//    separate UI/text/audio readiness per 21 §3.2; catalog envelope/legacy
//    reader per the G01.06 decision (21 §3.3).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateSchemaFile,
  readCatalogDoc,
  checkIndexRules,
  checkOfficialProfile,
  checkImportedProfile,
} from './reader.mjs';
import { checkGuideHintValues } from './hints/guide-hints.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'));

const schema = (name, doc) => validateSchemaFile(`schemas/${name}`, doc);
const fixtureStops = [];

test('positive: demo-route authoring files conform to the schemas', () => {
  for (const [file, name] of [
    ['fixtures/content/demo-route/route.json', 'route.schema.json'],
    ['fixtures/content/demo-route/voices.json', 'voice.schema.json'],
  ]) {
    const res = schema(name, readJson(file));
    assert.ok(res.ok, `${file}: ${JSON.stringify(res.errors)}`);
  }
  for (const places of [readJson('fixtures/content/demo-route/places.json')]) {
    for (const [i, place] of places.entries()) {
      const res = schema('place.schema.json', place);
      assert.ok(res.ok, `places.json[${i}]: ${JSON.stringify(res.errors)}`);
    }
  }
});

test('positive: per-locale stops files (base and extended) conform', () => {
  const localesDir = path.join(REPO, 'fixtures/content/demo-route');
  for (const locale of fs.readdirSync(localesDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    for (const tier of ['base', 'extended']) {
      const file = path.join(localesDir, locale.name, tier, 'stops.json');
      if (!fs.existsSync(file)) continue;
      const stories = JSON.parse(fs.readFileSync(file, 'utf8'));
      fixtureStops.push(...stories);
      for (const [i, story] of stories.entries()) {
        const res = schema('story.schema.json', story);
        assert.ok(res.ok, `${locale.name}/${tier}/stops.json[${i}]: ${JSON.stringify(res.errors)}`);
      }
    }
  }
  assert.ok(fixtureStops.length > 0, 'demo-route carries at least one story');
});

test('positive: public projections conform (places, collections)', () => {
  const projDir = path.join(REPO, 'fixtures/content/demo-route');
  for (const dir of ['places', 'collections']) {
    const base = path.join(projDir, dir);
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(base, entry.name, 'public.json');
      const res = schema('public-projection.schema.json', JSON.parse(fs.readFileSync(file, 'utf8')));
      assert.ok(res.ok, `${dir}/${entry.name}/public.json: ${JSON.stringify(res.errors)}`);
    }
  }
});

test('criterion 1: reordering stops never changes stop ids; route_id keys the guide', () => {
  const route = readJson('fixtures/content/demo-route/route.json');
  const idsBefore = route.stops.map((s) => s.id).sort();
  const reordered = { ...route, stops: [...route.stops].reverse() };
  assert.deepEqual(reordered.stops.map((s) => s.id).sort(), idsBefore);
  for (const stop of reordered.stops) {
    const original = route.stops.find((s) => s.id === stop.id);
    assert.deepEqual(stop, original, 'each stop keeps its own record: ids travel with stops, not with indexes');
  }
  const res = schema('route.schema.json', reordered);
  assert.ok(res.ok, JSON.stringify(res.errors));
  assert.equal(typeof route.route_id, 'string');
  assert.match(route.route_id, /^[a-z0-9._-]{1,64}$/);
});

test('criterion 2: origin accepts only official|imported (namespace isolation)', () => {
  const bad = { ...readJson('fixtures/content/demo-route/route.json'), origin: 'kudy-official' };
  const res = schema('route.schema.json', bad);
  assert.ok(!res.ok);
  assert.ok(res.errors.some((e) => e.keyword === 'enum'));
});

test('criterion 3: history, language, transcript, rights and access are checked per file', () => {
  const story = readJson('fixtures/content/demo-route/be/base/stops.json')[0];
  for (const [field, name] of [
    ['transcript', 'story.schema.json'],
    ['review', 'story.schema.json'],
  ]) {
    const broken = { ...story };
    delete broken[field];
    const res = schema(name, broken);
    assert.ok(!res.ok, `${field} must be required`);
  }
  const unreviewed = { ...story, review: { ...story.review, decision: 'pending' } };
  assert.ok(schema('story.schema.json', unreviewed).ok, 'pending review is a valid authoring state');
  const media = readJson('contracts/examples/media-demo.json');
  const noLicense = { ...media };
  delete noLicense.license;
  assert.ok(!schema('media.schema.json', noLicense).ok, 'media rights (license) required');
  assert.ok(!schema('media.schema.json', { ...media, credit: '' }).ok, 'credit cannot be an empty string');
  const unknownVoice = [{ ...readJson('fixtures/content/demo-route/voices.json')[0], locale: 'ua' }];
  assert.ok(!schema('voice.schema.json', unknownVoice).ok, 'unknown locale codes are not in the allowlist');
});

// AF6 (Selfer эпік #262, issue #347): pl — дзясятая кантэнтная лакаля
// (ADR docs/architecture/decisions/347-polish-content-locale.md). pl праходзіць
// кантэнтныя схемы і ліміты 9→10; невядомыя коды і ліміты застаюцца зачыненымі.
test('AF6 #347: pl passes the content schemas with limits 9→10; unknown codes still fail', () => {
  const media = readJson('contracts/examples/media-demo.json');
  const plMedia = { ...media, locale: 'pl' };
  delete plMedia.voice_id; // factory narration ships without a voice ref
  assert.ok(schema('media.schema.json', plMedia).ok, JSON.stringify(schema('media.schema.json', plMedia).errors));
  assert.ok(!schema('media.schema.json', { ...media, locale: 'ua' }).ok, 'an unknown locale still fails the enum');
  const plVoice = [{ ...readJson('fixtures/content/demo-route/voices.json')[0], locale: 'pl' }];
  assert.ok(schema('voice.schema.json', plVoice).ok, 'pl narration enters the voice allowlist with the audio wave (AF6)');
  const target = { kind: 'guide', route_id: 'demo-route-a1', version: '1', locale: 'pl' };
  assert.ok(schema('feedback-target.schema.json', target).ok, JSON.stringify(schema('feedback-target.schema.json', target).errors));
  const ten = ['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv', 'zh', 'pl'];
  const localized10 = Object.fromEntries(ten.map((locale) => [locale, 'тэкст']));
  assert.ok(schema('localized-text.schema.json', localized10).ok, 'ten content locales fit maxProperties');
  const localizedCeiling = schema('localized-text.schema.json', { ...localized10, ua: 'тэкст' });
  assert.ok(!localizedCeiling.ok, 'the 11th locale fails maxProperties');
  assert.ok(localizedCeiling.errors.some((e) => e.keyword === 'maxProperties'), JSON.stringify(localizedCeiling.errors));
  const route = readJson('fixtures/content/demo-route/route.json');
  const envelope = {
    catalog_schema_version: 1,
    routes: [{ route_id: route.route_id, version: '1', locales: ten, layers: ['base'], sizes: { base: 1 } }],
  };
  assert.ok(schema('catalog.schema.json', envelope).ok, JSON.stringify(schema('catalog.schema.json', envelope).errors));
  envelope.routes[0].locales = Array(11).fill('be');
  const catalogCeiling = schema('catalog.schema.json', envelope);
  assert.ok(!catalogCeiling.ok, 'the 11th catalog locale fails maxItems');
  assert.ok(catalogCeiling.errors.some((e) => e.keyword === 'maxItems'), JSON.stringify(catalogCeiling.errors));
  const index = readJson('fixtures/discovery-contract/index-valid.json');
  const guide = index.offers.find((offer) => offer.ref.kind === 'guide');
  guide.availability = { text_locales: ten, audio_locales: [...ten] };
  assert.ok(schema('discovery-index.schema.json', index).ok, JSON.stringify(schema('discovery-index.schema.json', index).errors));
  guide.availability = { text_locales: Array(11).fill('be'), audio_locales: [] };
  const discoveryCeiling = schema('discovery-index.schema.json', index);
  assert.ok(!discoveryCeiling.ok, 'the 11th availability locale fails maxItems');
  assert.ok(discoveryCeiling.errors.some((e) => e.keyword === 'maxItems'), JSON.stringify(discoveryCeiling.errors));
});

test('criterion 3: stop tier requires its own story id (if/then required without type)', () => {
  const stop = readJson('fixtures/content/demo-route/route.json').stops[0];
  const res = schema('stop.schema.json', stop);
  assert.ok(res.ok, JSON.stringify(res.errors));
  const tier = stop.access_tier;
  const storyField = tier === 'base' ? 'story_base_id' : 'story_extended_id';
  const otherField = tier === 'base' ? 'story_extended_id' : 'story_base_id';
  const without = { ...stop };
  delete without[storyField];
  const missing = schema('stop.schema.json', without);
  assert.ok(!missing.ok, `a ${tier} stop without ${storyField} must fail`);
  const hit = missing.errors.find((e) => e.keyword === 'required' && e.rule.endsWith(storyField));
  assert.ok(hit, `the failure names required ${storyField}: ${JSON.stringify(missing.errors)}`);
  assert.ok(hit.path.endsWith(storyField), 'schema errors carry a path');
  const otherTier = { ...without, [otherField]: stop[storyField] };
  assert.ok(!schema('stop.schema.json', otherTier).ok, 'a story id of the other tier does not satisfy the requirement');
});

test('kernel: draft-07 number includes integers', () => {
  const whole = { id: 'place-int', content_version: '1', lat: 54, lng: 18, trigger_radius_m: 40, kind: 'square' };
  assert.ok(schema('place.schema.json', whole).ok, JSON.stringify(schema('place.schema.json', whole).errors));
  assert.ok(schema('place.schema.json', { ...whole, lat: 54.5 }).ok, 'fractional values still pass');
});

test('criterion 4: an import cannot claim official provenance', () => {
  const imported = readJson('contracts/examples/imported-route.json');
  assert.ok(schema('route.schema.json', imported).ok, 'imported doc is structurally valid content');
  assert.ok(checkImportedProfile(imported).ok, 'import profile accepts its own namespace');
  const official = checkOfficialProfile(imported);
  assert.ok(!official.ok, 'official profile rejects imported provenance');
  assert.ok(official.errors.some((e) => e.rule === 'origin-not-official'));
  const masquerade = { ...imported, origin: 'official' };
  assert.ok(schema('route.schema.json', masquerade).ok, 'the charset alone cannot detect a masquerade');
  const caught = checkOfficialProfile(masquerade);
  assert.ok(!caught.ok, 'official profile rejects imp. ids claiming official');
  assert.ok(caught.errors.some((e) => e.rule === 'import-namespace-in-official'));
  const target = { kind: 'guide', route_id: 'imp.osm-demo.route-1', version: '1', locale: 'be' };
  assert.ok(!checkOfficialProfile(target).ok, 'imported ids never reach feedback targets');
  const credited = { ...readJson('contracts/examples/media-demo.json'), credit: 'photo: imp.archive/example.webp' };
  assert.ok(
    checkOfficialProfile(credited).ok,
    'imp. inside a non-identifier string (credit, note) is not an official-profile violation',
  );
  const borrowedStory = structuredClone(imported);
  borrowedStory.stops[0].story_base_id = 'official-story';
  const ns = checkImportedProfile(borrowedStory);
  assert.ok(!ns.ok, 'an imported route cannot reference official story ids');
  assert.ok(ns.errors.some((e) => e.rule === 'import-namespace-required'), JSON.stringify(ns.errors));
  assert.ok(
    checkImportedProfile({ ...borrowedStory, stops: [{ ...borrowedStory.stops[0], story_base_id: 'imp.ns.story-2' }] }).ok,
    'the imp. namespace satisfies the story reference',
  );
});

test('criterion 5: discovery index — valid fixture passes schema and named rules', () => {
  const index = readJson('fixtures/discovery-contract/index-valid.json');
  const res = schema('discovery-index.schema.json', index);
  assert.ok(res.ok, JSON.stringify(res.errors));
  const rules = checkIndexRules(index);
  assert.ok(rules.ok, JSON.stringify(rules.errors));
});

test('R07 preview geometry accepts guide stops and rejects corrupt or place-owned points', () => {
  const index = readJson('fixtures/discovery-contract/index-valid.json');
  const guide = index.offers.find((offer) => offer.ref.kind === 'guide');
  const place = index.offers.find((offer) => offer.ref.kind === 'place');
  guide.preview_points = [{ lat: 54.4, lng: 18.6 }];
  assert.ok(schema('discovery-index.schema.json', index).ok);
  assert.ok(checkIndexRules(index).ok);
  guide.preview_points = [{ lat: 91, lng: 18.6 }];
  assert.ok(!schema('discovery-index.schema.json', index).ok, 'out-of-range latitude is rejected');
  guide.preview_points = [{ lat: 54.4, lng: 18.6 }];
  place.preview_points = [{ lat: 54.4, lng: 18.6 }];
  assert.ok(checkIndexRules(index).errors.some((error) => error.rule === 'preview-points-guide-only'));
});

test('criterion 5: index-invalid fixtures fail on their named rule', () => {
  // Named rules are checked by checkIndexRules (e.rule); schema-level pins are
  // keywords (e.keyword), because a schema error's `rule` holds the doc path.
  const expected = {
    'index-invalid-duplicate-ref.json': ['duplicate-member-ref'],
    'index-invalid-duration-range.json': ['estimated_duration_range'],
    'index-invalid-foreign-city.json': ['foreign-city'],
    'index-invalid-missing-overlap-note.json': ['missing-overlap-note'],
    'index-invalid-nested-collection.json': ['oneOf'],
    'index-invalid-private-path.json': ['oneOf'],
    'index-invalid-unknown-locale.json': ['enum'],
    'index-invalid-unknown-season.json': ['enum'],
  };
  for (const [file, namedRules] of Object.entries(expected)) {
    const doc = readJson(`fixtures/discovery-contract/${file}`);
    const res = schema('discovery-index.schema.json', doc);
    const rules = res.ok ? checkIndexRules(doc) : { ok: false, errors: [] };
    assert.ok(!res.ok || !rules.ok, `${file} must fail`);
    for (const name of namedRules) {
      assert.ok(
        res.errors.some((e) => e.keyword === name || e.rule === name) ||
          rules.errors.some((e) => e.rule === name),
        `${file} must fail on ${name}: ${JSON.stringify({ schema: res.errors, rules: rules.errors })}`,
      );
    }
  }
});

test('criterion 5: every limits case of index-invalid-limits.json fails on its own bound', () => {
  const wrapper = readJson('fixtures/discovery-contract/index-invalid-limits.json');
  assert.ok(!schema('discovery-index.schema.json', wrapper).ok, 'the cases wrapper is not itself an index');
  // The identifier limit (≤ 64 chars of [a-z0-9._-]) is encoded inside the
  // bounded pattern ^[a-z0-9._-]{1,64}$, so both identifier cases fail as
  // `pattern`, not as a separate maxLength.
  const keywords = {
    'lim-offers': 'maxItems',
    'lim-collections': 'maxItems',
    'lim-members': 'maxItems',
    'lim-themes': 'maxItems',
    'lim-themes-per-offer': 'maxItems',
    'lim-title': 'maxLength',
    'lim-summary': 'maxLength',
    'lim-season-reason': 'maxLength',
    'lim-editorial-order': 'maximum',
    'lim-duration-min': 'minimum',
    'lim-duration-max': 'maximum',
    'lim-distance': 'maximum',
    'lim-identifier-charset': 'pattern',
    'lim-identifier-length': 'pattern',
  };
  assert.equal(wrapper.cases.length, Object.keys(keywords).length, 'one case per 21 §3.2 bound');
  for (const c of wrapper.cases) {
    const res = schema('discovery-index.schema.json', c.index);
    assert.ok(!res.ok, `${c.id} (${c.rule}) must fail schema validation: ${JSON.stringify(res.errors)}`);
    assert.ok(
      res.errors.some((e) => e.keyword === keywords[c.id]),
      `${c.id} must fail on ${keywords[c.id]}: ${JSON.stringify(res.errors)}`,
    );
  }
});

test('criterion 5: duplicate-offer-id is rejected by the named rules', () => {
  const dup = structuredClone(readJson('fixtures/discovery-contract/index-valid.json'));
  dup.offers.push({ ...dup.offers[0], offer_id: dup.offers[0].offer_id });
  const res = checkIndexRules(dup);
  assert.ok(!res.ok);
  assert.ok(res.errors.some((e) => e.rule === 'duplicate-offer-id'), JSON.stringify(res.errors));
});

test('criterion 5: a collection of another city is rejected by the named rules', () => {
  const alien = structuredClone(readJson('fixtures/discovery-contract/index-valid.json'));
  alien.collections[0].city_id = 'other-city';
  const res = checkIndexRules(alien);
  assert.ok(!res.ok);
  assert.ok(res.errors.some((e) => e.rule === 'foreign-city'), JSON.stringify(res.errors));
});

test('criterion 5: FeedbackTarget shape per 21 §5.1', () => {
  const guide = { kind: 'guide', route_id: 'demo-route-a1', version: '1', locale: 'be' };
  const place = { kind: 'place', place_id: 'place-1', content_version: '1', locale: 'en' };
  assert.ok(schema('feedback-target.schema.json', guide).ok);
  assert.ok(schema('feedback-target.schema.json', place).ok);
  assert.ok(!schema('feedback-target.schema.json', { kind: 'collection', collection_id: 'c', content_version: '1', locale: 'be' }).ok);
});

test('catalog envelope: v1 with and without discovery_index, legacy v0, unknown major', () => {
  const withDiscovery = readCatalogDoc(readJson('fixtures/discovery-contract/catalog-with-discovery.json'));
  assert.equal(withDiscovery.status, 'v1');
  assert.ok(withDiscovery.ok, JSON.stringify(withDiscovery.errors));
  assert.ok(withDiscovery.discovery_index);
  const legacy = readCatalogDoc(readJson('fixtures/discovery-contract/catalog-legacy.json'));
  assert.equal(legacy.status, 'v1');
  assert.ok(legacy.ok);
  assert.equal(legacy.discovery_index, null);
  const v0 = readCatalogDoc(readJson('fixtures/discovery-contract/catalog-legacy-v0.json'));
  assert.equal(v0.status, 'legacy-v0');
  assert.ok(v0.ok && Array.isArray(v0.routes));
  const unknownMajor = readCatalogDoc({
    catalog_schema_version: 2,
    routes: [{ route_id: 'r', version: '1', locales: ['be'], layers: ['base'], sizes: { base: 1 } }],
    discovery_index: { schema_version: 1, revision: 'r', path: 'discovery/c/r/index.json', bytes: 10, sha256: 'a'.repeat(64) },
  });
  assert.equal(unknownMajor.status, 'unknown-major');
  assert.equal(unknownMajor.discovery_index, null, 'discovery is not pulled for unknown major');
  assert.deepEqual(unknownMajor.routes.map((r) => r.route_id), ['r']);
});

test('catalog rejects an oversized discovery index before any fetch', () => {
  const doc = readCatalogDoc(readJson('fixtures/discovery-contract/catalog-invalid-oversized.json'));
  assert.ok(!doc.ok);
  assert.ok(doc.errors.some((e) => e.rule === 'discovery-index-oversized'));
});

test('catalog validates the declared date-time format of generated_at', () => {
  const base = { catalog_schema_version: 1, routes: [] };
  assert.ok(schema('catalog.schema.json', { ...base, generated_at: '2026-09-17T12:00:00Z' }).ok);
  assert.ok(schema('catalog.schema.json', { ...base, generated_at: '2026-09-17T12:00:00.500+02:00' }).ok);
  const bad = schema('catalog.schema.json', { ...base, generated_at: '2026-09-17 12:00:00' });
  assert.ok(!bad.ok, 'space-separated time is not RFC 3339');
  assert.ok(bad.errors.some((e) => e.keyword === 'format'), JSON.stringify(bad.errors));
});

test('examples: moment and media conform; all schema files are valid JSON with $schema', () => {
  assert.ok(schema('moment.schema.json', readJson('contracts/examples/moment-demo.json')).ok);
  assert.ok(schema('media.schema.json', readJson('contracts/examples/media-demo.json')).ok);
  const schemasDir = path.join(HERE, 'schemas');
  for (const file of fs.readdirSync(schemasDir)) {
    const doc = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf8'));
    assert.equal(doc.$schema, 'http://json-schema.org/draft-07/schema#', file);
  }
});

// G07.04 — nearby-guide hint values (R07): the values file is the proposal
// awaiting the founder decision (ADR G07.04 §3); each invalid fixture
// isolates exactly one named rule.
test('G07.04: the hint values file passes its own schema and named rules', () => {
  const res = checkGuideHintValues(readJson('contracts/hints/guide-hints.values.v1.json'));
  assert.ok(res.ok, JSON.stringify(res.errors));
});

test('G07.04: each invalid values fixture fails on its own named rule', () => {
  const expected = {
    'invalid-negative-value.json': ['hint-value-non-positive'],
    'invalid-missing-cooldown.json': ['hint-cooldown-required'],
    'invalid-accuracy-exceeds-radius.json': ['hint-accuracy-exceeds-radius'],
    'invalid-unknown-field.json': ['hint-unknown-field'],
  };
  for (const [file, rules] of Object.entries(expected)) {
    const res = checkGuideHintValues(readJson(`contracts/fixtures/guide-hints/${file}`));
    assert.ok(!res.ok, `${file} must fail`);
    for (const rule of rules) {
      assert.ok(
        res.errors.some((e) => e.rule === rule),
        `${file} must fail on ${rule}: ${JSON.stringify(res.errors)}`,
      );
    }
  }
});

test('G07.04: corrupt values input answers with diagnostics, not a throw', () => {
  for (const bad of [null, [], 42, 'values', { guide_hints_values_version: 'one' }]) {
    const res = checkGuideHintValues(bad);
    assert.ok(!res.ok, `corrupt input must fail: ${JSON.stringify(bad)}`);
    assert.ok(res.errors.length > 0, `corrupt input must carry a diagnostic: ${JSON.stringify(bad)}`);
  }
});

test('G07.04: the accuracy rule gates the radius it serves', () => {
  const values = readJson('contracts/hints/guide-hints.values.v1.json');
  const below = { ...values, accepted_accuracy_m: values.proximity_radius_m - 1 };
  assert.ok(checkGuideHintValues(below).ok, JSON.stringify(checkGuideHintValues(below).errors));
  const equal = { ...values, accepted_accuracy_m: values.proximity_radius_m };
  assert.ok(!checkGuideHintValues(equal).ok, 'accuracy equal to the radius must fail');
  assert.ok(
    checkGuideHintValues(equal).errors.some((e) => e.rule === 'hint-accuracy-exceeds-radius'),
    JSON.stringify(checkGuideHintValues(equal).errors),
  );
});

test('G07.04: non-finite numbers answer with a named diagnostic', () => {
  // JSON cannot carry NaN/±Infinity, so this rule has no fixture file — the
  // corrupt input is only reachable programmatically.
  const values = readJson('contracts/hints/guide-hints.values.v1.json');
  for (const field of ['proximity_radius_m', 'accepted_accuracy_m']) {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const res = checkGuideHintValues({ ...values, [field]: bad });
      assert.ok(!res.ok, `${field}=${bad} must fail`);
      assert.equal(
        res.errors.filter((e) => e.rule === 'hint-value-non-finite').length,
        1,
        `${field}=${bad} must name exactly one non-finite path: ${JSON.stringify(res.errors)}`,
      );
      assert.ok(
        res.errors.some((e) => e.rule === 'hint-value-non-finite' && e.path === `$.${field}`),
        `${field}=${bad} must fail on hint-value-non-finite naming $.${field}: ${JSON.stringify(res.errors)}`,
      );
    }
  }
});

test('G07.04: both number fields non-finite are each named (#391)', () => {
  const values = readJson('contracts/hints/guide-hints.values.v1.json');
  const res = checkGuideHintValues({
    ...values,
    proximity_radius_m: NaN,
    accepted_accuracy_m: Infinity,
  });
  assert.ok(!res.ok, 'both fields non-finite must fail');
  assert.deepEqual(
    res.errors.filter((e) => e.rule === 'hint-value-non-finite').map((e) => e.path),
    ['$.proximity_radius_m', '$.accepted_accuracy_m'],
    JSON.stringify(res.errors),
  );
});

// G21.45 (G21.42-chinese-language.md — G21.45) — the ninth content-locale code zh (ADR G21.42 §4:
// «enums + zh, ліміты maxProperties/maxItems 8→9»; рашэнне ўладара ў G21.42).
// Any Chinese sample value enters as a \uXXXX escape — repo bytes stay
// CJK-free (criterion 7 of the issue).
const ZH_SAMPLE = '\u4E2D\u6587';

test('G21.45+#347: localized-text (the allowlist owner) accepts zh and pl and holds the 10-locale ceiling', () => {
  const nine = { be: 'x', en: 'x', uk: 'x', de: 'x', es: 'x', fr: 'x', cs: 'x', sv: 'x', zh: ZH_SAMPLE };
  assert.ok(schema('localized-text.schema.json', nine).ok, JSON.stringify(schema('localized-text.schema.json', nine).errors));
  const ten = { ...nine, pl: 'x' };
  assert.ok(schema('localized-text.schema.json', ten).ok, JSON.stringify(schema('localized-text.schema.json', ten).errors));
  // The reader reports the enum and the count errors together, so the
  // keyword assert pins the count bound itself, not just some rejection —
  // the fill reuses a valid code as hygiene, not as a requirement.
  const eleven = { ...ten, ua: 'x' };
  const res = schema('localized-text.schema.json', eleven);
  assert.ok(!res.ok, 'an 11th locale must fail maxProperties');
  assert.ok(res.errors.some((e) => e.keyword === 'maxProperties'), JSON.stringify(res.errors));
  assert.ok(schema('localized-text.schema.json', { zh: ZH_SAMPLE }).ok, 'zh alone is a valid localized map');
  assert.ok(!schema('localized-text.schema.json', { zh: '' }).ok, 'zh strings keep the minLength-1 rule');
});

test('G21.45+#347: discovery availability accepts zh and pl in both locale lists under the 10-item ceilings', () => {
  const index = structuredClone(readJson('fixtures/discovery-contract/index-valid.json'));
  index.offers[0].availability.text_locales.push('zh', 'pl');
  index.offers[0].availability.audio_locales.push('zh', 'pl');
  assert.ok(schema('discovery-index.schema.json', index).ok, JSON.stringify(schema('discovery-index.schema.json', index).errors));
  assert.ok(checkIndexRules(index).ok, JSON.stringify(checkIndexRules(index).errors));
  // The reader reports maxItems regardless of the items' enum validity, so
  // the keyword assert pins the count bound on its own; the valid-code fill
  // keeps the case honest about which bound it exercises.
  const eleven = structuredClone(index);
  eleven.offers[0].availability.text_locales = Array(11).fill('be');
  const res = schema('discovery-index.schema.json', eleven);
  assert.ok(!res.ok, 'an 11th text locale must fail maxItems');
  assert.ok(res.errors.some((e) => e.keyword === 'maxItems'), JSON.stringify(res.errors));
});

test('G21.45: media locale and both feedback-target branches accept zh', () => {
  const media = { ...readJson('contracts/examples/media-demo.json'), locale: 'zh' };
  assert.ok(schema('media.schema.json', media).ok, JSON.stringify(schema('media.schema.json', media).errors));
  const guide = { kind: 'guide', route_id: 'demo-route-a1', version: '1', locale: 'zh' };
  const place = { kind: 'place', place_id: 'place-1', content_version: '1', locale: 'zh' };
  assert.ok(schema('feedback-target.schema.json', guide).ok, JSON.stringify(schema('feedback-target.schema.json', guide).errors));
  assert.ok(schema('feedback-target.schema.json', place).ok, JSON.stringify(schema('feedback-target.schema.json', place).errors));
});

test('G21.45+#347: the 9→10 move is the only count-limit change; the residual mirrors stay at eight', () => {
  const NINE = ['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv', 'zh'];
  const TEN = [...NINE, 'pl'];
  const EIGHT = NINE.slice(0, 8);
  // Extended spots (issue criteria 1, 3, 4, 5 of G21.45 + #347): the owner and
  // its four declared projections. catalog.routes[].locales is the generator's
  // fail-closed mirror (assertSameSet) — extending the owner without it
  // fails `npm run contracts:wire:check`.
  const localizedText = readJson('contracts/schemas/localized-text.schema.json');
  assert.deepEqual(localizedText.propertyNames.enum, TEN);
  assert.equal(localizedText.maxProperties, 10);
  const offer = readJson('contracts/schemas/discovery-index.schema.json').definitions.offer.properties;
  for (const list of ['text_locales', 'audio_locales']) {
    assert.deepEqual(offer.availability.properties[list].items.enum, TEN, list);
    assert.equal(offer.availability.properties[list].maxItems, 10, list);
  }
  assert.deepEqual(readJson('contracts/schemas/media.schema.json').properties.locale.enum, TEN);
  const feedback = readJson('contracts/schemas/feedback-target.schema.json');
  for (const [i, branch] of feedback.oneOf.entries()) {
    assert.deepEqual(branch.properties.locale.enum, TEN, `feedback branch ${i}`);
  }
  const catalogLocales = readJson('contracts/schemas/catalog.schema.json').properties.routes.items.properties.locales;
  assert.deepEqual(catalogLocales.items.enum, TEN);
  assert.equal(catalogLocales.maxItems, 10);
  // Residual mirrors (issue notes file list + ADR G21.42 §4 keep them out of
  // this task's scope; the future zh-content/UI tasks extend them the way
  // G21.16 did): these pins make any silent drift — either direction — fail.
  const discovery = readJson('contracts/schemas/discovery-index.schema.json').definitions;
  const residualDiscovery = [
    discovery.offer.properties.localized.properties.title,
    discovery.offer.properties.season_recommendations.items.properties.reason,
    discovery.collection.properties.localized.properties.title,
    discovery.text400,
  ];
  for (const [i, spot] of residualDiscovery.entries()) {
    assert.deepEqual(spot.propertyNames.enum, EIGHT, `discovery residual map ${i}`);
    assert.equal(spot.maxProperties, 8, `discovery residual map ${i}`);
  }
  const placeRefs = readJson('contracts/schemas/place.schema.json').properties.name_audio_refs;
  assert.deepEqual(placeRefs.propertyNames.enum, EIGHT);
  assert.equal(placeRefs.maxProperties, 8);
  // #347: the voice allowlist follows the pl audio wave (stories need a
  // same-locale voice); zh stays out until the G21.49 TTS pilot.
  assert.deepEqual(readJson('contracts/schemas/voice.schema.json').items.properties.locale.enum, [...EIGHT, 'pl']);
  // #347: MEDIA_LOCALES is the declared mirror of media.schema.json — its
  // literal is pinned here at the source, verbatim with the schema enum.
  const validatorSource = fs.readFileSync(path.join(REPO, 'tools/validate/validate-package.mjs'), 'utf8');
  assert.ok(
    validatorSource.includes("new Set(['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv', 'zh', 'pl'])"),
    'tools/validate/validate-package.mjs MEDIA_LOCALES must mirror media.schema.json verbatim',
  );
  // The tools/UI residuals are pinned at their source as well, so the claim
  // "the whole residual list stays at eight" is test-checked, not prose:
  // a silent widening there trips this pin too (and a zh task widening them
  // consciously updates these lines with it).
  const residualSources = [
    ['tools/build-bundle/build-bundle.mjs', "['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv']", 'LOCALE_ALLOWLIST'],
    ['tools/validate/validate-authoring.mjs', "['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv']", 'LOCALES'],
  ];
  for (const [file, eight, label] of residualSources) {
    const text = fs.readFileSync(path.join(REPO, file), 'utf8');
    assert.ok(text.includes(eight), `${file} ${label} must stay at the residual eight until a zh task extends it`);
  }
  // Owner decision 2026-11-23 (chat, on merging EU-UI-01–06): the UI registry's
  // RELEASE_DEFAULT_OPEN consciously widened from the residual eight to the
  // fourteen open-by-default codes — pinned at the source like the COMPLETE
  // set below, so a silent revert to eight fails in the same place.
  const releaseDefault = fs.readFileSync(path.join(REPO, 'contracts/ui-locales.ts'), 'utf8');
  assert.ok(
    releaseDefault.includes(
      'RELEASE_DEFAULT_OPEN: readonly CompleteUiLocaleCode[] = ["be", "en", "uk", "de", "es", "fr", "cs", "sv", "nb", "pl", "da", "nl", "pt", "it"]',
    ),
    'contracts/ui-locales.ts RELEASE_DEFAULT_OPEN must carry the fourteen owner-decided open-by-default UI locales',
  );
  // G21.46 (G21.42-chinese-language.md — G21.46): the one owner that DID move — the UI registry's complete
  // set — is pinned at the source too, so a silent revert to eight fails here
  // in the same place the residual pins catch drift in the other direction.
  const registry = fs.readFileSync(path.join(REPO, 'contracts/ui-locales.ts'), 'utf8');
  assert.ok(
    registry.includes(
      'COMPLETE_UI_LOCALES: readonly CompleteUiLocaleCode[] = ["be", "en", "uk", "de", "es", "fr", "cs", "sv", "zh", "nb", "pl", "da", "nl", "pt", "it", "fi", "lt", "et", "lv", "sk", "hu", "sl", "hr", "ro", "bg", "el", "sr", "bs", "mk", "sq", "is", "ga", "mt", "ca", "tr", "ru", "lb", "cnr", "nn", "rm", "ka", "hy", "az"]',
    ),
    'contracts/ui-locales.ts COMPLETE_UI_LOCALES must carry the complete UI locales including nb/pl/da/nl/pt, it/fi/lt, et/lv/sk/hu/sl, hr/ro/bg/el/sr/bs/mk/sq and nn/rm/ka/hy/az',
  );
});
