import assert from 'node:assert/strict';
import test from 'node:test';

test('SVG raster mode belongs to the batch and mixed per-job modes are refused before launch', async t => {
  const launches = [];
  t.mock.module('playwright', { namedExports: { chromium: { launch: async options => {
    launches.push(options);
    return { close: async () => {} };
  } } } });
  const { renderJobs } = await import('../docs/design/brand/outputs/MAP-02/vector/render.mjs');
  const svg = new URL('../docs/design/brand/outputs/MAP-02/vector/map-master-vector.svg', import.meta.url);
  // Empty batches still launch so both advertised batch modes exercise the real dispatcher.
  await renderJobs([], { softwareRaster: true });
  await renderJobs([], { softwareRaster: false });
  assert.deepEqual(launches.map(options => options.args), [['--disable-gpu'], []]);
  await assert.rejects(renderJobs([
    { svg, softwareRaster: true }, { svg, softwareRaster: false },
  ]), /softwareRaster is a batch option/u);
  assert.equal(launches.length, 2);
});
