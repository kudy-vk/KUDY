// Mechanical completeness control for the Tricity area cards (issue #300).
// The two human docs are the single source of truth:
//   docs/content/tricity-area-cards.md   — registry table + one card per territory (BE/EN)
//   docs/content/tricity-area-sources.md — source rows with stable [S..] ids
// The validator reads both and returns diagnostics; it never throws on
// corrupt input (implementation-rules 14) and every rule here is isolated by
// a negative test in tricity-areas.test.mjs (implementation-rules 14).
//
// Checks: duplicate areaId; legal type; landmark parent; registry/card set
// equality; required fields in both languages; optional-field parity; every
// fact cell carries a [S..] reference; every object item carries a reference;
// source rows carry an https URL and an ISO date; no mixed-script tokens; no
// subjective rating words in card cells (criterion 6 of issue #300).

const REFS = /\[S\d+(?:,\s*S\d+)*\]/g;
const REF_NAME = /\[S\d+(?:,\s*S\d+)*\]/;
const MIXED_SCRIPT = /[А-Яа-яЁёЎў][A-Za-z]|[A-Za-z][А-Яа-яЁёЎў]/;
// Criterion 6 of issue #300: no subjective good/bad/dangerous/beautiful
// ratings in published card cells.
const RATINGS = [
  'небяспеч', 'небяспек', 'кепск', 'прыгож', 'беспечн', 'безпек',
  'dangerous', 'unsafe', 'beautiful', 'ugly', 'niebezpieczn', 'ładny',
];
const TYPES = ['district', 'city', 'landmark'];
const CITIES = ['gdansk', 'gdynia', 'sopot'];
const FIELDS = ['what', 'objects', 'why', 'nav'];
const REQUIRED = ['what', 'why'];

function splitLines(text) {
  return String(text ?? '').split(/\r?\n/);
}

function section(text, startHeading, nextHeading) {
  const lines = splitLines(text);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === startHeading) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return { value: [], defects: [`no ${startHeading} heading found`] };
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim().startsWith(nextHeading)) {
      end = i;
      break;
    }
  }
  return { value: lines.slice(start, end), defects: [] };
}

function splitRow(line) {
  return line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
}

function parseRegistry(cardsMd) {
  const defects = [];
  const found = [];
  const sec = section(cardsMd, '## Пералік тэрыторый', '## Карткі');
  const rows = sec.value.filter((l) => l.startsWith('|'));
  if (rows.length === 0) {
    defects.push('registry table has no rows');
    return { value: found, defects };
  }
  const seen = new Map();
  for (const line of rows) {
    const cells = splitRow(line);
    if (cells.length < 6) continue; // header or separator
    if (!/^[a-z0-9-]+$/.test(cells[0])) continue; // header | areaId ...
    if (!CITIES.includes(cells[1])) continue; // separator row |---|---|...
    const areaId = cells[0];
    const city = cells[1];
    const type = cells[2];
    if (seen.has(areaId)) {
      defects.push(`duplicate areaId "${areaId}" (first seen at city "${seen.get(areaId)}")`);
      continue;
    }
    seen.set(areaId, city);
    if (!TYPES.includes(type)) defects.push(`areaId "${areaId}": unknown type "${type}"`);
    found.push({ areaId, city, type, officialName: cells[3], map: cells[4], parent: cells[5] });
  }
  if (found.length === 0) defects.push('registry table parsed but holds no areas');
  const byId = new Map(found.map((a) => [a.areaId, a]));
  for (const a of found) {
    if (a.type === 'landmark') {
      if (!byId.has(a.parent)) defects.push(`landmark "${a.areaId}" has parent "${a.parent}" that is not a registry area`);
    } else if (a.parent && a.parent !== '—') {
      defects.push(`area "${a.areaId}" (type ${a.type}) must have parent "—", got "${a.parent}"`);
    }
  }
  return { value: found, defects };
}

function parseCards(cardsMd) {
  const defects = [];
  const lines = splitLines(cardsMd);
  const cards = new Map();
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = /^### ([a-z0-9-]+)\s*$/.exec(lines[i].trim());
    if (m) {
      if (current) cards.set(current.areaId, current);
      if (cards.has(m[1])) defects.push(`duplicate card heading "${m[1]}"`);
      current = { areaId: m[1], line: i + 1, fields: {} };
      continue;
    }
    if (current && lines[i].startsWith('|')) {
      const cells = splitRow(lines[i]);
      if (cells.length < 3) continue;
      const key = cells[0];
      if (!FIELDS.includes(key)) continue; // header row "| Поле | BE | EN |"
      if (current.fields[key]) {
        defects.push(`card "${current.areaId}" repeats field "${key}"`);
        continue;
      }
      current.fields[key] = { be: cells[1], en: cells[2] };
    }
  }
  if (current) cards.set(current.areaId, current);
  if (cards.size === 0) defects.push('no card headings ("### <areaId>") parsed');
  return { value: cards, defects };
}

function parseSources(sourcesMd) {
  const defects = [];
  const sources = new Map();
  const sec = section(sourcesMd, '## Крыніцы', '## Не ўключана');
  const rows = sec.value.filter((l) => l.startsWith('|'));
  if (rows.length === 0) {
    defects.push('sources table has no rows');
    return { value: sources, defects };
  }
  for (const line of rows) {
    const cells = splitRow(line);
    if (cells.length < 5) continue;
    const m = /^S\d+$/.test(cells[0]) ? cells[0] : null;
    if (!m) continue; // header or separator
    const urlMatch = /https?:\/\/[^\s|]+/.exec(cells[2]);
    const dateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(cells[3]);
    if (!urlMatch) defects.push(`source "${m}" has no http(s) URL`);
    if (!dateMatch) defects.push(`source "${m}" has no ISO date (YYYY-MM-DD), got "${cells[3]}"`);
    sources.set(m, { url: urlMatch ? urlMatch[0] : null, date: dateMatch ? dateMatch[0] : null });
  }
  if (sources.size === 0) defects.push('sources table parsed but holds no source rows');
  return { value: sources, defects };
}

function checkCell(cardId, field, lang, text, sources, defects) {
  if (MIXED_SCRIPT.test(text)) {
    defects.push(`card "${cardId}" field "${field}" (${lang}): mixed-script token in "${text.slice(0, 60)}"`);
  }
  const lower = text.toLowerCase();
  for (const w of RATINGS) {
    if (lower.includes(w)) {
      defects.push(`card "${cardId}" field "${field}" (${lang}): subjective rating word "${w}"`);
    }
  }
  if (!REF_NAME.test(text)) {
    defects.push(`card "${cardId}" field "${field}" (${lang}): no [S..] source reference`);
    return;
  }
  for (const ref of text.match(REFS) ?? []) {
    for (const id of ref.slice(1, -1).split(',').map((t) => t.trim())) {
      if (!sources.has(id)) {
        defects.push(`card "${cardId}" field "${field}" (${lang}): reference "${id}" is not in the sources table`);
      }
    }
  }
}

function validate({ registry, cards, sources }) {
  const defects = [];
  const regIds = new Set(registry.map((a) => a.areaId));
  const cardIds = new Set(cards.keys());
  for (const id of regIds) {
    if (!cardIds.has(id)) defects.push(`area "${id}" is in the registry but has no card`);
  }
  for (const id of cardIds) {
    if (!regIds.has(id)) defects.push(`card "${id}" has no registry row`);
  }
  for (const card of cards.values()) {
    for (const field of FIELDS) {
      const cell = card.fields[field];
      if (!cell) {
        if (REQUIRED.includes(field)) defects.push(`card "${card.areaId}" misses required field "${field}"`);
        continue;
      }
      if (!cell.be?.trim()) defects.push(`card "${card.areaId}" field "${field}" has empty BE text`);
      if (!cell.en?.trim()) defects.push(`card "${card.areaId}" field "${field}" has empty EN text`);
      for (const lang of ['be', 'en']) {
        if (cell[lang]?.trim()) checkCell(card.areaId, field, lang, cell[lang], sources, defects);
      }
      if (field === 'objects' && cell.be?.trim()) {
        for (const item of cell.be.split(';')) {
          if (item.trim() && !REF_NAME.test(item)) {
            defects.push(`card "${card.areaId}" objects item "${item.trim().slice(0, 40)}" has no [S..] reference`);
          }
        }
      }
    }
  }
  return defects;
}

export { parseRegistry, parseCards, parseSources, validate, RATINGS, TYPES, FIELDS, REQUIRED };
