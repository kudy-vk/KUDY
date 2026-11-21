// Render the actual exported SVGs, independently of fragment_svg() and generated PNGs.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const here = fileURLToPath(new URL('.', import.meta.url));
const packageRoot = new URL('../menu-map-city-only/', import.meta.url);
const master = new URL('../MAP-02/vector/map-master-vector.svg', import.meta.url);

export async function verifySvgAssembly(directory = join(here, 'assets')) {
  const canonical = JSON.parse(await readFile(new URL('manifest.json', packageRoot), 'utf8'));
  const pieces = [];
  for (const piece of canonical.pieces) {
    pieces.push({ ...piece, svg: (await readFile(join(directory, `${piece.id}.svg`))).toString('base64'),
      mask: (await readFile(new URL(piece.png, packageRoot))).toString('base64') });
  }
  pieces.push({ id: 'scene', x: 0, y: 0, ...canonical.source,
    svg: (await readFile(join(directory, 'scene.svg'))).toString('base64') });
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'],
    ...(existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:">');
    await page.evaluate(async ({ pieces, masterSvg, source }) => {
      const load = async (data, type) => {
        const image = new Image();
        image.src = `data:image/${type};base64,${data}`;
        await image.decode();
        return image;
      };
      const masks = new Uint8Array(source.width * source.height);
      for (const piece of pieces) {
        piece.image = await load(piece.svg, 'svg+xml');
        // Paint the real SVG's clipping group opaque to separate clip geometry from artwork antialiasing.
        const text = new TextDecoder().decode(Uint8Array.from(atob(piece.svg), char => char.charCodeAt(0)));
        const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
        const group = svg.querySelector('svg > g[clip-path]');
        if (!group) throw new Error(`SVG clipping group missing: ${piece.id}`);
        const rectangle = svg.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rectangle.setAttribute('width', source.width);
        rectangle.setAttribute('height', source.height);
        group.replaceChildren(rectangle);
        piece.geometry = new Image();
        piece.geometry.src = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        await piece.geometry.decode();
        if (!piece.mask) continue;
        const canvas = document.createElement('canvas');
        canvas.width = piece.width;
        canvas.height = piece.height;
        const context = canvas.getContext('2d');
        context.drawImage(await load(piece.mask, 'png'), 0, 0);
        piece.maskPixels = context.getImageData(0, 0, piece.width, piece.height).data;
        for (let y = 0; y < piece.height; y++) {
          for (let x = 0; x < piece.width; x++) {
            if (piece.maskPixels[(y * piece.width + x) * 4 + 3] === 0) continue;
            const at = (piece.y + y) * source.width + piece.x + x;
            if (masks[at]) throw new Error('canonical masks overlap');
            masks[at] = 1;
          }
        }
      }
      window.map04 = { pieces, source, masks, master: await load(masterSvg, 'svg+xml') };
    }, { pieces, source: canonical.source, masterSvg: (await readFile(master)).toString('base64') });

    for (const density of [1, 2, 3]) {
      const rendered = await page.evaluate(d => {
        const { pieces, source, masks, master } = window.map04;
        const canvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
        const reference = canvas(source.width * d, source.height * d);
        const assembled = canvas(reference.width, reference.height);
        const refContext = reference.getContext('2d');
        refContext.drawImage(master, 0, 0, reference.width, reference.height);
        for (const piece of pieces) {
          const layer = canvas(piece.width * d, piece.height * d);
          const context = layer.getContext('2d');
          context.drawImage(piece.geometry, 0, 0, layer.width, layer.height);
          const geometry = context.getImageData(0, 0, layer.width, layer.height).data;
          for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
              const sourceX = Math.floor(x / d), sourceY = Math.floor(y / d);
              const at = (piece.y + sourceY) * source.width + piece.x + sourceX;
              const visible = piece.maskPixels
                ? piece.maskPixels[(sourceY * piece.width + sourceX) * 4 + 3] > 0 : masks[at] === 0;
              if (geometry[(y * layer.width + x) * 4 + 3] !== (visible ? 255 : 0)) {
                throw new Error(`SVG alpha differs: ${piece.id}@${d}x at ${x},${y}`);
              }
            }
          }
          context.clearRect(0, 0, layer.width, layer.height);
          context.drawImage(piece.image, 0, 0, layer.width, layer.height);
          assembled.getContext('2d').drawImage(layer, piece.x * d, piece.y * d);
        }
        return { reference: reference.toDataURL().split(',')[1], assembled: assembled.toDataURL().split(',')[1] };
      }, density);
      const expected = PNG.sync.read(Buffer.from(rendered.reference, 'base64'));
      const actual = PNG.sync.read(Buffer.from(rendered.assembled, 'base64'));
      // Chrome's clipped artwork rounds edge coverage by up to 8/255; the mask probe above is exact.
      for (let i = 3; i < actual.data.length; i += 4) {
        if (Math.abs(actual.data[i] - expected.data[i]) > 8) throw new Error(`SVG assembled alpha differs at ${density}x`);
      }
      // Match the project's pixelmatch colour/antialias policy; geometry permits zero alpha error.
      const different = pixelmatch(expected.data, actual.data, null, expected.width, expected.height,
        { threshold: 0.1, includeAA: false });
      if (different !== 0) throw new Error(`SVG colours differ: ${different} pixels at ${density}x`);
    }
    return { densities: [1, 2, 3], fragments: pieces.length, alphaDifferences: 0, colorDifferences: 0 };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await verifySvgAssembly(process.argv[2]);
  console.log('SVG assembly: 6 fragments at 1x/2x/3x; mask alpha differences 0; perceptual colour differences 0');
}
