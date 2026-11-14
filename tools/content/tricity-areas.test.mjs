// Issue #300 criterion 5: mechanical completeness control over the Tricity
// area cards. Happy path runs against the real docs; every rule of
// tricity-areas.mjs is isolated by its own negative fixture, and corrupt
// input answers with diagnostics instead of a thrown error
// (implementation-rules 14). Removing a card, a translation, a source row or
// the source reference must turn this suite red (implementation-rules 1).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseRegistry, parseCards, parseSources, validate } from './tricity-areas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const CARDS_MD = path.join(REPO, 'docs', 'content', 'tricity-area-cards.md');
const SOURCES_MD = path.join(REPO, 'docs', 'content', 'tricity-area-sources.md');

const SRC = `## Крыніцы

| id | Факт | Крыніца | Дата праверкі | Статус |
|---|---|---|---|---|
| S01 | спіс раёнаў | https://example.org/gdansk | 2026-11-14 | ✅ |
| S02 | станцыя | https://example.org/skm | 2026-11-14 | ⚠️ |
`;

function cardMd(areaId, overrides = {}) {
  const what = overrides.what ?? {
    be: `Жылы раён [S01].`,
    en: `A residential district [S01].`,
  };
  const why = overrides.why ?? {
    be: `Рэкамендацыя з тэдаў [S02].`,
    en: `A thread recommendation [S02].`,
  };
  return `### ${areaId}

| Поле | BE | EN |
|---|---|---|
| what | ${what.be} | ${what.en} |
| why | ${why.be} | ${why.en} |
`;
}

const REG = `## Пералік тэрыторый

| areaId | горад | тып | афіцыйная назва | мапа #248 | уваходзіць у |
|---|---|---|---|---|---|
| oliwa | gdansk | district | Oliwa | \`oliwa\` | — |
| sopot | sopot | city | Sopot | — | — |
| westerplatte | gdansk | landmark | Westerplatte | — | przerobka |
| przerobka | gdansk | district | Przeróbka | — | — |
`;

const FULL = `${REG}## Карткі\n\n${cardMd('oliwa')}${cardMd('sopot')}${cardMd('westerplatte')}${cardMd('przerobka')}`;

function run(cardsMd, sourcesMd = SRC) {
  const registry = parseRegistry(cardsMd);
  const cards = parseCards(cardsMd);
  const sources = parseSources(sourcesMd);
  return { registry, cards, sources, defects: validate({ registry: registry.value, cards: cards.value, sources: sources.value }), parseDefects: [...registry.defects, ...cards.defects, ...sources.defects] };
}

test('real repo docs parse clean: every registry area has a full BE/EN card with resolvable sources', () => {
  const cardsMd = fs.readFileSync(CARDS_MD, 'utf8');
  const sourcesMd = fs.readFileSync(SOURCES_MD, 'utf8');
  const { registry, cards, sources, defects, parseDefects } = run(cardsMd, sourcesMd);
  assert.deepEqual(parseDefects, [], 'parser found defects in the real docs');
  assert.deepEqual(defects, [], 'validator found defects in the real docs');
  assert.equal(registry.value.filter((a) => a.city === 'gdansk' && a.type === 'district').length, 35);
  assert.equal(registry.value.filter((a) => a.city === 'gdynia').length, 21);
  assert.equal(registry.value.filter((a) => a.type === 'city').length, 1);
  assert.equal(registry.value.filter((a) => a.type === 'landmark').length, 3);
  assert.equal(cards.value.size, registry.value.length);
  assert.ok(sources.value.size >= 40, 'sources table should hold the research rows');
  assert.ok(registry.value.some((a) => a.areaId === 'oliwa' && a.map.includes('oliwa')));
});

test('reverting one card (registry row without card) is caught', () => {
  const without = FULL.replace(cardMd('oliwa'), '');
  const { defects } = run(without);
  assert.ok(defects.some((d) => d.includes('"oliwa" is in the registry but has no card')), defects.join('\n'));
});

test('a card without a registry row is caught', () => {
  const extra = `${FULL}### rogue\n\n| Поле | BE | EN |\n|---|---|---|\n| what | т [S01] | e [S01] |\n| why | т [S01] | e [S01] |\n`;
  const { defects } = run(extra);
  assert.ok(defects.some((d) => d.includes('card "rogue" has no registry row')), defects.join('\n'));
});

test('duplicate areaId in the registry is caught', () => {
  const dup = REG.replace(
    '| oliwa | gdansk | district | Oliwa | `oliwa` | — |',
    '| oliwa | gdansk | district | Oliwa | `oliwa` | — |\n| oliwa | gdansk | district | Oliwa again | `oliwa` | — |',
  );
  const { parseDefects } = run(`${dup}## Карткі`);
  assert.ok(parseDefects.some((d) => d.includes('duplicate areaId "oliwa"')), parseDefects.join('\n'));
});

test('unknown type is caught', () => {
  const bad = REG.replace('| oliwa | gdansk | district |', '| oliwa | gdansk | quarter |');
  const { parseDefects } = run(`${bad}## Карткі`);
  assert.ok(parseDefects.some((d) => d.includes('unknown type "quarter"')), parseDefects.join('\n'));
});

test('landmark with unknown parent is caught; plain area with parent is caught', () => {
  const badParent = REG.replace('— | przerobka |', '— | nosuch |');
  const badPlain = REG.replace('| oliwa | gdansk | district | Oliwa | `oliwa` | — |', '| oliwa | gdansk | district | Oliwa | `oliwa` | przerobka |');
  const r1 = parseRegistry(badParent);
  assert.ok(r1.defects.some((d) => d.includes('parent "nosuch" that is not a registry area')), r1.defects.join('\n'));
  const r2 = parseRegistry(badPlain);
  assert.ok(r2.defects.some((d) => d.includes('must have parent "—"')), r2.defects.join('\n'));
});

test('missing required field is caught', () => {
  const noWhy = FULL.replace(cardMd('oliwa'), cardMd('oliwa').replace(/\| why \|[^\n]*\n/, ''));
  const { defects } = run(noWhy);
  assert.ok(defects.some((d) => d.includes('card "oliwa" misses required field "why"')), defects.join('\n'));
});

test('empty EN text is caught', () => {
  const emptyEn = FULL.replace(cardMd('oliwa'), cardMd('oliwa', { why: { be: 'тэкст [S02]', en: ' ' } }));
  const { defects } = run(emptyEn);
  assert.ok(defects.some((d) => d.includes('field "why" has empty EN text')), defects.join('\n'));
});

test('BE/EN parity break on an optional field is caught', () => {
  const half = FULL.replace(cardMd('oliwa'), `### oliwa\n\n| Поле | BE | EN |\n|---|---|---|\n| what | Жылы раён [S01]. | A residential district [S01]. |\n| why | Рэкамендацыя [S02]. | A thread recommendation [S02]. |\n| objects | Катэдра [S02] | |\n`);
  const { defects } = run(half);
  assert.ok(defects.some((d) => d.includes('field "objects" has empty EN text')), defects.join('\n'));
});

test('a field without any [S..] reference is caught', () => {
  const noRef = FULL.replace(cardMd('oliwa'), cardMd('oliwa', { why: { be: 'тэкст без крыніцы', en: 'text without a source' } }));
  const { defects } = run(noRef);
  assert.deepEqual(defects.filter((d) => d.includes('no [S..] source reference')).length, 2);
});

test('a reference to an unknown source row is caught', () => {
  const unknown = FULL.replace(cardMd('oliwa'), cardMd('oliwa', { why: { be: 'тэкст [S99]', en: 'text [S99]' } }));
  const { defects } = run(unknown);
  assert.deepEqual(defects.filter((d) => d.includes('"S99" is not in the sources table')).length, 2);
});

test('an objects item without its own reference is caught', () => {
  const item = FULL.replace(cardMd('oliwa'), `### oliwa\n\n| Поле | BE | EN |\n|---|---|---|\n| what | Жылы раён [S01]. | A residential district [S01]. |\n| why | Рэкамендацыя [S02]. | A thread recommendation [S02]. |\n| objects | Катэдра [S02]; Парк без крыніцы | Cathedral [S02]; Park without source |\n`);
  const { defects } = run(item);
  assert.ok(defects.some((d) => d.includes('objects item "Парк без крыніцы" has no [S..] reference')), defects.join('\n'));
});

test('a source row without URL or without ISO date is caught', () => {
  const bad = SRC.replace('| S02 | станцыя | https://example.org/skm | 2026-11-14 | ⚠️ |', '| S02 | станцыя | тэда без URL | 14.11.2026 | ⚠️ |');
  const { parseDefects } = run(FULL, bad);
  assert.ok(parseDefects.some((d) => d.includes('source "S02" has no http(s) URL')), parseDefects.join('\n'));
  assert.ok(parseDefects.some((d) => d.includes('source "S02" has no ISO date')), parseDefects.join('\n'));
});

test('mixed-script tokens and subjective rating words in cards are caught', () => {
  const dirty = FULL.replace(cardMd('oliwa'), cardMd('oliwa', {
    what: { be: 'Раён Górна [S01].', en: 'A district [S01].' },
    why: { be: 'Раён небяспечны ўвечары [S02].', en: 'The district is unsafe at night [S02].' },
  }));
  const { defects } = run(dirty);
  assert.ok(defects.some((d) => d.includes('mixed-script token')), defects.join('\n'));
  assert.ok(defects.some((d) => d.includes('rating word "небяспеч"')), defects.join('\n'));
  assert.ok(defects.some((d) => d.includes('rating word "unsafe"')), defects.join('\n'));
});

test('the real docs hold no mixed-script tokens or rating words in card cells', () => {
  const cardsMd = fs.readFileSync(CARDS_MD, 'utf8');
  const sourcesMd = fs.readFileSync(SOURCES_MD, 'utf8');
  const { defects } = run(cardsMd, sourcesMd);
  assert.deepEqual(defects.filter((d) => d.includes('mixed-script') || d.includes('rating word')), []);
});

test('corrupt input answers with diagnostics, never a thrown error', () => {
  for (const input of ['', '# Пусты файл', '### траўнік без табліцы', REG, '## Пералік тэрыторый\n| гарт |']) {
    const { defects, parseDefects } = run(String(input));
    assert.ok(Array.isArray(defects) && Array.isArray(parseDefects));
  }
  const truncated = run('## Крыніцы\n| S01 | факт | https://ex |');
  assert.ok(truncated.parseDefects.length > 0 || truncated.defects.length > 0);
});
