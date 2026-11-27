import { bearingMarks, cosmosEngravings, ribbonFontSize, ribbonPadding, ribbonPaths, ribbonTail } from '../brand/outputs/menu-map-city-only/atlas-art.mjs';
import { svg } from './kit.mjs';

await document.fonts.load(`600 ${ribbonFontSize}px Alegreya`);

export function atlasMotifs(ox, oy, ratio, mask, terrain) {
  return svg('g', { class: 'bg-motifs', mask, 'aria-hidden': 'true' },
    ...bearingMarks(svg, ox + 675, oy + 582, ratio),
    svg('g', { transform: `translate(${ox} ${oy})` }, terrain ?? cosmosEngravings(svg, ratio)));
}

export function createRibbon(label, scale) {
  const height = 22 * scale;
  const text = svg('text', {
    class: 'r-text', x: 0, y: 0, 'text-anchor': 'middle',
    'dominant-baseline': 'central', 'font-size': ribbonFontSize * scale,
  }, label);
  const shapes = { tail: 'tail', fold: 'fold', body: 'body', inner: 'inner', leftDot: 'dot', rightDot: 'dot' };
  const paths = Object.entries(shapes).map(([key, cls]) => [key, svg('path', { class: `r-${cls}` })]);
  const badge = svg('g', { class: 'ribbon-badge' }, ...paths.map(([, path]) => path), text);
  const layout = () => {
    const measured = text.isConnected ? text.getComputedTextLength() : 0;
    const width = Math.max(30 * scale, measured || label.length * 6.8 * scale) + ribbonPadding * scale;
    const geometry = ribbonPaths(width, height, scale);
    for (const [key, path] of paths) path.setAttribute('d', geometry[key]);
    return { padW: width / 2 + ribbonTail * scale + 1, padH: height / 2 + 4 * scale };
  };
  return { badge, layout, ...layout() };
}

// Used by both boards to keep background and reveal layers clipped identically.
export function atlasScenery(layers, base, clip) {
  return svg('g', clip ? { 'clip-path': clip } : {},
    ...layers.map(({ png, x, y, width, height }) => svg('image', { href: new URL(png, base), x, y, width, height })));
}

export function atlasVignette(uid, width, height) {
  const gradient = svg('radialGradient', { id: `${uid}-vignette-grad`, cx: '50%', cy: '50%', r: '52%' },
    ...[[0, 1], [0.62, 0.88], [0.86, 0.32], [1, 0]].map(([offset, opacity]) =>
      svg('stop', { offset, 'stop-color': 'white', 'stop-opacity': opacity })));
  const rect = { x: -200, y: -200, width: width + 400, height: height + 400 };
  const mask = svg('mask', { id: `${uid}-vignette-mask`, maskUnits: 'userSpaceOnUse', ...rect },
    svg('rect', { ...rect, fill: `url(#${uid}-vignette-grad)` }));
  return [gradient, mask];
}
