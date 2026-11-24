// #204: keep the recorded owner decision and its follow-up gates in sync.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const decisions = readFileSync(join(root, 'docs/design/brand/decisions.md'), 'utf8');
const catalog = readFileSync(join(root, 'docs/design/catalog.md'), 'utf8');

test('#204 owner decision remains recorded with its dates and limits', () => {
  const heading = '## Рашэнне ўладара 2026-11-11 — дракон застаецца';
  assert.ok(decisions.includes(heading), 'missing accepted dragon decision');
  const section = decisions.split(heading)[1].split('\n## ')[0];

  assert.match(section, /Дракон \*\*застаецца ў дадатку\*\*/);
  assert.match(section, /2026-11-11.*issuecomment-6807470086/);
  assert.match(section, /2026-11-17.*issuecomment-6934182636/);
  assert.match(section, /#205.*толькі па рэшце часу/);
  assert.match(section, /пасля прадугледжанага ёю ўзгаднення дызайну/);
  assert.match(section, /#206.*не трэба распрацоўваць|не трэба распрацоўваць.*#206/);
  assert.match(section, /не ўхваляе позы G25\.03/);
});

test('#204 catalogue does not revert to an undecided dragon status', () => {
  const row = catalog.split('\n').find((line) => line.startsWith('| Дракон |'));
  assert.ok(row, 'missing dragon row');
  const columns = row.split('|').slice(1, -1).map((value) => value.trim());
  assert.equal(columns.length, 4, 'dragon row must preserve the catalogue columns');
  const [, assets, status, followUp] = columns;

  assert.match(assets, /dragon-paths\.json/);
  assert.match(assets, /позы G25\.03.*толькі прапановы/);
  assert.match(status, /^Прынята: дракон застаецца/);
  assert.match(status, /2026-11-11.*2026-11-17/);
  assert.match(status, /issues\/204/);
  assert.match(followUp, /issues\/205.*толькі па рэшце часу і пасля ўзгаднення дызайну/);
  assert.match(followUp, /issues\/206.*не патрэбная/);
});
