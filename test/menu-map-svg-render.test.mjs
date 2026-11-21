import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifySvgAssembly } from '../docs/design/brand/outputs/MAP-04/verify-svg.mjs';

const assets = new URL('../docs/design/brand/outputs/MAP-04/assets/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', assets), 'utf8'));

test('standalone SVGs reconstruct the master at 1x/2x/3x; geometry and paint mutations fail', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'map04-svg-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const id of [...manifest.pieces.map(piece => piece.id), 'scene']) {
    await copyFile(new URL(`${id}.svg`, assets), path.join(directory, `${id}.svg`));
  }
  const result = await verifySvgAssembly(directory);
  assert.deepEqual(result.densities, [1, 2, 3]);
  assert.equal(result.fragments, 6);
  assert.equal(result.alphaDifferences, 0);
  assert.equal(result.colorDifferences, 0);

  const file = path.join(directory, 'nearby.svg');
  const original = await readFile(file, 'utf8');
  const piece = manifest.pieces.find(piece => piece.id === 'nearby');
  const mutations = [
    ['viewBox', original.replace(`viewBox="${piece.x} ${piece.y} `, `viewBox="${piece.x + 1} ${piece.y} `), /SVG alpha differs/u],
    ['clip transform', original.replace(`translate(${piece.x} ${piece.y})`, `translate(${piece.x + 1} ${piece.y})`), /SVG alpha differs/u],
    ['paint', original.replace(/#[0-9a-f]{6}/giu, '#0000ff'), /SVG colours differ/u],
  ];
  for (const [name, mutated, diagnostic] of mutations) {
    assert.notEqual(mutated, original, `${name}: mutation must reach the SVG`);
    await writeFile(file, mutated);
    await assert.rejects(verifySvgAssembly(directory), diagnostic, name);
    await writeFile(file, original);
  }
});
