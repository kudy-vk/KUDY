import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const evidenceDir = join('docs', 'testing', 'evidence', '2026-11-02-issue959');
const reportPath = join('docs', 'agent-tasks', 'results', 'APR-10.b.md');

test('APR-10.b screenshot matrix has the documented dimensions in both orientations', () => {
  const screenshots = readdirSync(evidenceDir).filter((name) => name.endsWith('.png'));
  assert.equal(screenshots.length, 16);

  const counts = { 800: 0, 1280: 0 };
  for (const name of screenshots) {
    const match = /^(800|1280)dp-font[12]-(explore|guides|preview|my)\.png$/.exec(name);
    assert.ok(match, `Unexpected evidence screenshot: ${name}`);

    const png = readFileSync(join(evidenceDir, name));
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const portrait = match[1] === '800';
    assert.deepEqual([width, height], portrait ? [1280, 2048] : [1280, 800], name);
    counts[match[1]] += 1;
  }
  assert.deepEqual(counts, { 800: 8, 1280: 8 });
});

test('APR-10.b report distinguishes portrait and landscape pixel-to-dp scales', () => {
  const report = readFileSync(reportPath, 'utf8');

  assert.match(report, /800dp, партрэт:[\s\S]*?1280×2048 px[\s\S]*?0,8 раза[\s\S]*?1dp = 1,6 px PNG/);
  assert.match(report, /1280dp, альбом:[\s\S]*?1280×800 px[\s\S]*?0,5 раза[\s\S]*?1dp = 1px PNG/);
  assert.match(report, /суцэльнага асноўнага прамежку/);
  assert.match(report, /усе тры каналы ≥ 245/);
  assert.match(report, /width_px = x_right - x_left \+ 1/);
  assert.match(report, /width_dp = width_px \/ pixels_per_dp/);
  assert.match(report, /знешнія краі[\s\S]*?групы дзвюх картак/);
  assert.match(report, /x=337–629 і x=650–942/);
  assert.match(report, /604dp[\s\S]*?966,4 px[\s\S]*?604 px/);
  assert.match(report, /636dp[\s\S]*?1017,6 px[\s\S]*?636 px/);
  assert.doesNotMatch(report, /width_dp = \(x_right - x_left\) \/ pixels_per_dp/);
  assert.doesNotMatch(report, /1px здымку = 1dp акна/);
});
