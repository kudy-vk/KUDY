// Issue #495 — the design catalog must not contradict the shipped menu config.
// components/city-map-menu.tsx is the canon for which main-menu pieces are
// active (destination !== null). PR #494 activated all five pieces, but the
// catalog row for KUDY kept claiming the piece is inactive and misled later
// work until #495 fixed it. The repo walk below makes npm test fail when that
// stale claim (or a same-shaped one) returns (implementation-rules §1).
//
// Accepted cost of the simple rule: the check is one-directional — it stops
// an active piece from being documented as inactive, but does not demand the
// reverse (a null-destination piece documented as inactive is legitimate, see
// the MAP-05 states). It is also case-sensitive, so the row title
// «KUDY (гісторыя прагулак)» is not a hit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const MENU = path.join(REPO, 'components', 'city-map-menu.tsx');
const CATALOG = path.join(REPO, 'docs', 'design', 'catalog.md');

// Matches one entry of the `items` array in city-map-menu.tsx verbatim:
// { id: "kudy", labelKey: "kudyLink", destination: "/my" }
// The id is restricted to [a-z0-9-] here, which also keeps it regex-safe
// before interpolation into the word-boundary pattern below.
const ENTRY = /\{ id: "([a-z0-9-]+)", labelKey: "[^"]+", destination: (null|"[^"]+") \}/g;

export function parseMenuPieces(source) {
  const pieces = [];
  for (const match of source.matchAll(ENTRY)) {
    pieces.push({ id: match[1], destination: match[2] === 'null' ? null : match[2].slice(1, -1) });
  }
  return pieces;
}

export function findStaleInactiveClaims(catalogText, pieces) {
  const hits = [];
  catalogText.split(/\r?\n/).forEach((line, index) => {
    for (const piece of pieces) {
      if (piece.destination === null) continue;
      if (new RegExp(`\\b${piece.id}\\b`).test(line) && line.includes('неактыўн')) {
        hits.push({ line: index + 1, id: piece.id });
      }
    }
  });
  return hits;
}

test('catalog does not call an active menu piece inactive', () => {
  const pieces = parseMenuPieces(fs.readFileSync(MENU, 'utf8'));
  assert.ok(pieces.length > 0, 'city-map-menu.tsx yielded no menu entries — the guard is blind, fix the ENTRY pattern');
  assert.ok(
    pieces.some(piece => piece.destination !== null),
    'no active menu pieces found — the guard would pass vacuously',
  );
  const violations = findStaleInactiveClaims(fs.readFileSync(CATALOG, 'utf8'), pieces);
  assert.deepEqual(
    violations,
    [],
    'catalog line names an active menu piece as inactive — align the row with components/city-map-menu.tsx',
  );
});

test('the guard flags a reverted stale row and names the line', () => {
  const pieces = parseMenuPieces('{ id: "kudy", labelKey: "kudyLink", destination: "/my" }');
  const stale = '| KUDY (гісторыя прагулак) | ... | Уваход з меню: частка `kudy` неактыўная |';
  assert.deepEqual(findStaleInactiveClaims(stale, pieces), [{ line: 1, id: 'kudy' }]);
});

test('a null-destination piece may legitimately be documented as inactive', () => {
  const pieces = parseMenuPieces('{ id: "reserve-2", labelKey: "soon", destination: null }');
  assert.deepEqual(findStaleInactiveClaims('частка `reserve-2` неактыўная', pieces), []);
});

test('the entry parser keeps null and route values apart', () => {
  const pieces = parseMenuPieces([
    '{ id: "nearby", labelKey: "nearby", destination: "/map" }',
    '{ id: "reserve-1", labelKey: "aboutCity", destination: null }',
  ].join('\n'));
  assert.deepEqual(pieces, [
    { id: 'nearby', destination: '/map' },
    { id: 'reserve-1', destination: null },
  ]);
});
