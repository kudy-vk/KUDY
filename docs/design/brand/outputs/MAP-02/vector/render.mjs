// Render SVG jobs to PNG in headless Chrome: `node render.mjs <jobs.json>`.
// Each job: { svg, out, width, height, dpr?, background?, css?, pieces?, viewBox?, softwareRaster? }.
// `pieces` renders only the five manifest fragments, clipped from the master,
// inside `viewBox` (default: the whole map).
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const jobs = JSON.parse(await readFile(process.argv[2], 'utf8'));
const manifest = JSON.parse(await readFile(
  new URL('../../menu-map-city-only/manifest.json', import.meta.url), 'utf8'));

function piecesMarkup(svg, width, height, viewBox = '0 0 1351 1164') {
  const href = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const clips = manifest.pieces.map(piece =>
    `<clipPath id="clip-${piece.id}"><path transform="translate(${piece.x} ${piece.y})" d="${piece.path}"/></clipPath>`);
  const images = manifest.pieces.map(piece =>
    `<image width="1351" height="1164" href="${href}" clip-path="url(#clip-${piece.id})"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">`
    + `<defs>${clips.join('')}</defs>${images.join('')}</svg>`;
}

// MAP-04 needs stable hashes across fresh sessions; preserve the older export's renderer.
const args = jobs.some(job => job.softwareRaster === true) ? ['--disable-gpu'] : [];
const browser = await chromium.launch({ headless: true, channel: 'chrome', args });
try {
  for (const job of jobs) {
    const svg = await readFile(job.svg, 'utf8');
    if (/<script|<foreignObject/i.test(svg)) throw new Error(`${job.svg}: active SVG content`);
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height }, deviceScaleFactor: job.dpr ?? 1 });
    const body = job.pieces ? piecesMarkup(svg, job.width, job.height, job.viewBox)
      : svg.replace(/<svg([^>]*?) width="\d+" height="\d+"/, `<svg$1 width="${job.width}" height="${job.height}"`);
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:${job.background ?? 'transparent'}}`
      + `svg{display:block}${job.css ?? ''}</style>${body}`);
    const png = await page.screenshot({ omitBackground: !job.background, clip: { x: 0, y: 0, width: job.width, height: job.height } });
    await writeFile(job.out, png);
    await page.close();
  }
} finally {
  await browser.close();
}
