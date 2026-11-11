import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PNG } from 'pngjs';

const outputs = new URL('../docs/design/brand/outputs/', import.meta.url);
const assets = new URL('MAP-04/assets/', outputs);
const readJson = url => JSON.parse(readFileSync(url, 'utf8'));
const canonical = readJson(new URL('menu-map-city-only/manifest.json', outputs));
const exported = readJson(new URL('manifest.json', assets));

test('MAP-04 assets are versioned, bounded and match the canonical inputs', () => {
  assert.equal(exported.mapVersion, canonical.version);
  assert.deepEqual(exported.densities, [1, 2, 3]);
  assert.deepEqual(exported.sourceSize, [canonical.source.width, canonical.source.height]);
  const fields = ['id', 'x', 'y', 'width', 'height', 'path', 'anchor', 'neighbors'];
  assert.deepEqual(exported.pieces.map(piece => fields.map(key => piece[key])),
    canonical.pieces.map(piece => fields.map(key => piece[key])));
  const sources = ['MAP-02/vector/map-master-vector.svg', 'MAP-02/vector/render.mjs', '../../visual-language.md',
    'menu-map-city-only/manifest.json',
    'menu-map-city-only/source.png', ...canonical.pieces.map(piece => `menu-map-city-only/${piece.png}`)];
  assert.deepEqual(Object.keys(exported.sources).sort(), sources.sort());
  const ids = [...canonical.pieces.map(piece => piece.id), 'scene'];
  const hashedText = ['docs/design/brand/outputs/MAP-02/vector/map-master-vector.svg',
    'docs/design/brand/outputs/MAP-02/vector/render.mjs',
    ...ids.map(id => `docs/design/brand/outputs/MAP-04/assets/${id}.svg`),
    'docs/design/brand/outputs/MAP-04/assets/manifest.json'];
  const attributes = execFileSync('git', ['check-attr', 'eol', '--', ...hashedText], { encoding: 'utf8' });
  assert.equal(attributes.trim().split('\n').length, hashedText.length);
  assert.ok(attributes.trim().split('\n').every(line => line.trim().endsWith(': eol: lf')));
  assert.match(execFileSync('git', ['check-attr', 'text', '--',
    'docs/design/brand/outputs/menu-map-city-only/manifest.json'], { encoding: 'utf8' }), /: text: unset\s*$/u);
  assert.match(execFileSync('git', ['check-attr', 'text', '--',
    'docs/design/visual-language.md'], { encoding: 'utf8' }), /: text: unset\s*$/u);
  const files = [...ids.map(id => `${id}.svg`),
    ...[...ids, 'master'].flatMap(id => [1, 2, 3].map(density => `${id}@${density}x.png`)),
    'preview-light-320.png', 'preview-dark-320.png'];
  assert.deepEqual(Object.keys(exported.files).sort(), files.sort());
  for (const [base, entries] of [[outputs, exported.sources], [assets, exported.files]]) {
    for (const [name, digest] of Object.entries(entries)) {
      const bytes = readFileSync(new URL(name, base));
      assert.equal(bytes.length, digest.bytes, name);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), digest.sha256, name);
    }
  }
  assert.ok(Object.values(exported.files).reduce((sum, file) => sum + file.bytes, 0) <= 24 * 1024 * 1024);
  for (const id of ids) {
    const svg = readFileSync(new URL(`${id}.svg`, assets), 'utf8');
    assert.doesNotMatch(svg, /<image\b|data:|<script\b|<foreignObject\b/iu);
    assert.match(svg, /clip-path="url\(#map04-mask\)"/u);
  }
});

test('MAP-04 PNG fragments and scene partition the master without a shifted or missing pixel', () => {
  const width = canonical.source.width;
  const reference = PNG.sync.read(readFileSync(new URL('master@1x.png', assets)));
  const occupied = new Uint8Array(width * canonical.source.height);
  const pieces = canonical.pieces.map(piece => ({ ...piece,
    mask: PNG.sync.read(readFileSync(new URL(`menu-map-city-only/${piece.png}`, outputs))) }));
  for (const piece of pieces) {
    for (let y = 0; y < piece.height; y++) {
      for (let x = 0; x < piece.width; x++) {
        if (piece.mask.data[(y * piece.width + x) * 4 + 3] === 0) continue;
        const position = (piece.y + y) * width + piece.x + x;
        assert.equal(occupied[position], 0, 'fragment overlap');
        occupied[position] = 1;
      }
    }
  }
  pieces.push({ id: 'scene', x: 0, y: 0, width, height: canonical.source.height });
  for (const piece of pieces) {
    const actual = PNG.sync.read(readFileSync(new URL(`${piece.id}@1x.png`, assets)));
    assert.deepEqual([actual.width, actual.height], [piece.width, piece.height]);
    const expected = Buffer.alloc(actual.data.length);
    for (let y = 0; y < piece.height; y++) {
      for (let x = 0; x < piece.width; x++) {
        const local = (y * piece.width + x) * 4;
        const global = (piece.y + y) * width + piece.x + x;
        const visible = piece.mask ? piece.mask.data[local + 3] > 0 : occupied[global] === 0;
        if (visible) reference.data.copy(expected, local, global * 4, global * 4 + 4);
      }
    }
    assert.ok(actual.data.equals(expected), `${piece.id}: misregistered, missing or duplicated pixels`);
  }
});
