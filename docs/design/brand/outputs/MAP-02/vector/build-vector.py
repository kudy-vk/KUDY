"""Rebuild map-cutout-v2 as an editable, layered vector draft (MAP-02-VECTOR).

The selected artwork is flat-coloured, so every opaque pixel is assigned to one
colour of a fixed palette and to one semantic layer. Base layers (water,
fortifications, greenery, districts) partition the whole silhouette; detail
layers (streets, trees, outlines) are traced exactly and drawn above them. A
solid silhouette at the bottom backs the sub-pixel gaps under outline strokes,
so no seam reveals the background. The output is deterministic for a given
source PNG and library versions; no randomness, no embedded raster.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import cv2
import numpy as np
from scipy import ndimage
from skimage import measure

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'map-cutout-v2.png'
SOURCE_SHA256 = '72c208a8a14a687f215137511a2b722cc75e2f619bbc0805d4fc3e7c746f80f0'
PIECES = HERE.parent.parent / 'menu-map-city-only'
GEOMETRY_VERSION = 'map-02-vector-draft-1'

# Fixed palette: 20 Lab k-means centres of the opaque source pixels plus one
# mid slope green from a k-means pass over green pixels, rounded to hex and
# named by role. Fixing it keeps the build deterministic and editable.
PALETTE = [
    ('water', 'water', '#18b1a8'), ('water-shade', 'water', '#178d85'),
    ('water-deep', 'water', '#11655e'),
    ('ink-black', 'ink', '#100e06'), ('ink-dark', 'ink', '#491103'),
    ('ink-brown', 'ink', '#6f2404'), ('ink-light', 'ink', '#94571d'),
    ('tree-dark', 'tree', '#073f32'), ('tree', 'tree', '#1c5d26'),
    ('green-dark', 'green', '#3f772a'), ('park', 'green', '#b3c47f'),
    ('meadow', 'green', '#a1b645'), ('meadow-shade', 'green', '#88a23c'),
    ('meadow-dark', 'green', '#618d37'),
    ('rampart', 'ochre', '#eeb654'), ('rampart-shade', 'ochre', '#c58931'),
    ('yellow', 'fill', '#fbcf77'), ('cream', 'cream', '#fbf2de'),
    ('street', 'cream', '#f1dab3'), ('pink', 'fill', '#f1b28c'),
    ('orange', 'fill', '#fba16f'),
]
NAMES = [name for name, _, _ in PALETTE]
ROLES = np.array([role for _, role, _ in PALETTE])
HEX = [value for _, _, value in PALETTE]
PIECE_IDS = ['nearby', 'guides', 'discovery', 'reserve-1', 'kudy']
SCENE = len(PIECE_IDS)
MIN_AREA = 6          # px; smaller colour specks merge into their neighbours
MIN_BASE_AREA = 30    # px; base-layer shading specks merge within their own group
TREE_MAX_AREA = 4000  # px; a dark-green blob larger than this is not a tree
TREE_MIN_AREA = 40    # px; smaller dark-green specks are slope or outline shading
TREE_MAX_ELONGATION = 3.0  # long thin dark-green bands are rampart shading, not tree crowns
EDGE_WIDTH = 3        # px; anti-aliased rim pixels take the group of the shape they border
SMALL_GROUP_AREA = 150  # px; smaller islands of one semantic group join the surrounding group
BASE_TOLERANCE = 0.55
DETAIL_TOLERANCE = 0.45
SEAM_STROKE = 1.2     # same-colour stroke that closes anti-aliasing seams between base shapes

LABELS = {
    'outer-contour': 'Вонкавы контур',
    'water': 'Вада',
    'fortifications': 'Умацаванні',
    'greenery': 'Зеляніна і астравы',
    'districts': 'Раёны',
    'streets': 'Вуліцы',
    'buildings-landmarks': 'Будынкі і арыенціры — пусты (рашэнне ўладальніка 2026-11-03)',
    'trees': 'Дрэвы',
    'outlines': 'Контурныя лініі',
    'district-markers': 'Раённыя маркеры — пусты (рашэнне ўладальніка 2026-11-03)',
}


def hex_to_lab(values):
    bgr = np.array([[[int(v[5:7], 16), int(v[3:5], 16), int(v[1:3], 16)] for v in values]], np.uint8)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)[0].astype(np.float32)


def load_source():
    data = SOURCE.read_bytes()
    assert hashlib.sha256(data).hexdigest() == SOURCE_SHA256, 'Source PNG changed; re-derive the palette'
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)
    assert image is not None and image.shape == (1164, 1351, 4)
    return image


def quantize(image, opaque):
    flat = cv2.pyrMeanShiftFiltering(np.ascontiguousarray(image[:, :, :3]), 2, 10)
    lab = cv2.cvtColor(flat, cv2.COLOR_BGR2LAB).astype(np.float32)
    centres = hex_to_lab(HEX)
    hard = np.stack([((lab - centre) ** 2).sum(-1) for centre in centres], -1).argmin(-1)
    # Majority smoothing of the label map: argmax of blurred one-hot planes.
    planes = np.stack([cv2.GaussianBlur((hard == k).astype(np.float32), (0, 0), 0.8)
                       for k in range(len(PALETTE))], -1)
    labels = planes.argmax(-1).astype(np.int16)
    labels[~opaque] = -1
    return merge_specks(labels, opaque)


def merge_specks(labels, opaque, min_area=MIN_AREA):
    invalid = np.zeros(labels.shape, bool)
    for k in range(len(PALETTE)):
        count, comp, stats, _ = cv2.connectedComponentsWithStats(((labels == k) & opaque).astype(np.uint8),
                                                                 connectivity=4)
        small = np.flatnonzero(stats[:, cv2.CC_STAT_AREA] < min_area)
        small = small[small > 0]
        if len(small):
            invalid |= np.isin(comp, small)
    return fill_from_nearest(labels, invalid & opaque, opaque)


def fill_from_nearest(labels, replace, opaque):
    """Replace masked pixels with the label of the nearest unmasked opaque pixel."""
    source = opaque & ~replace
    _, (rows, cols) = ndimage.distance_transform_edt(~source, return_indices=True)
    out = labels.copy()
    out[replace] = labels[rows[replace], cols[replace]]
    return out


def piece_regions(shape):
    manifest = json.loads((PIECES / 'manifest.json').read_text(encoding='utf-8'))
    assert [p['id'] for p in manifest['pieces']] == PIECE_IDS
    region = np.full(shape, SCENE, np.int8)
    for index, piece in enumerate(manifest['pieces']):
        alpha = cv2.imread(str(PIECES / piece['png']), cv2.IMREAD_UNCHANGED)[:, :, 3] > 0
        assert alpha.sum() == piece['pixelCount'], piece['id']
        window = region[piece['y']:piece['y'] + alpha.shape[0], piece['x']:piece['x'] + alpha.shape[1]]
        assert (window[alpha] == SCENE).all(), f"{piece['id']} overlaps another piece"
        window[alpha] = index
    return region


def tree_mask(labels):
    seeds = np.isin(labels, [NAMES.index('tree-dark'), NAMES.index('tree')]).astype(np.uint8)
    blobs = cv2.morphologyEx(seeds, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    blobs = ndimage.binary_fill_holes(blobs).astype(np.uint8)
    count, comp, stats, _ = cv2.connectedComponentsWithStats(blobs, connectivity=8)
    keep = []
    for k in range(1, count):
        x, y, w, h, area = stats[k]
        if not TREE_MIN_AREA <= area <= TREE_MAX_AREA:
            continue
        contours, _ = cv2.findContours((comp[y:y + h, x:x + w] == k).astype(np.uint8),
                                       cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        (_, _), (rw, rh), _ = cv2.minAreaRect(max(contours, key=len))
        if max(rw, rh) <= TREE_MAX_ELONGATION * max(min(rw, rh), 1):
            keep.append(k)
    trees = np.isin(comp, keep).astype(np.uint8)
    grown = cv2.dilate(trees, np.ones((3, 3), np.uint8)) > 0
    tree_like = np.isin(ROLES[np.maximum(labels, 0)], ['tree', 'green', 'ink']) & (labels >= 0)
    return (trees > 0) | (grown & tree_like)


def neighbour_votes(mask, x, y, voters):
    """Count, per voter mask, the pixels in a 4 px ring around one component crop."""
    pad = 5
    height, width = next(iter(voters.values())).shape
    y0, x0 = max(y - pad, 0), max(x - pad, 0)
    y1, x1 = min(y + mask.shape[0] + pad, height), min(x + mask.shape[1] + pad, width)
    local = np.zeros((y1 - y0, x1 - x0), np.uint8)
    local[y - y0:y - y0 + mask.shape[0], x - x0:x - x0 + mask.shape[1]] = mask
    ring = (cv2.dilate(local, np.ones((9, 9), np.uint8)) > 0) & (local == 0)
    return {key: int((ring & value[y0:y1, x0:x1]).sum()) for key, value in voters.items()}


def vote_groups(mask, voters):
    """Give each component of mask the group whose voter pixels surround it most."""
    result = np.zeros(mask.shape, '<U16')
    for part, x, y in components(mask):
        votes = neighbour_votes(part, x, y, voters)
        window = result[y:y + part.shape[0], x:x + part.shape[1]]
        window[part] = max(votes, key=lambda key: (votes[key], key))
    return result


def nearest_within(region, valid):
    """Row and column of the nearest valid pixel inside the same fragment region."""
    rows = np.zeros(region.shape, np.intp)
    cols = np.zeros(region.shape, np.intp)
    for value in np.unique(region):
        inside = region == value
        if not (valid & inside).any():
            continue
        _, (r, c) = ndimage.distance_transform_edt(~(valid & inside), return_indices=True)
        rows[inside], cols[inside] = r[inside], c[inside]
    return rows, cols


def absorb_small_groups(base_group, opaque, region):
    """Reassign the silhouette rim and tiny islands of a group to the nearest larger group."""
    small = opaque & (ndimage.distance_transform_edt(opaque) <= EDGE_WIDTH)
    for gid in np.unique(base_group[opaque]):
        for part, x, y in components(base_group == gid):
            if part.sum() < SMALL_GROUP_AREA:
                small[y:y + part.shape[0], x:x + part.shape[1]] |= part
    rows, cols = nearest_within(region, opaque & ~small)
    out = base_group.copy()
    out[small] = base_group[rows[small], cols[small]]
    return out


def classify(labels, region, opaque):
    roles = ROLES[np.maximum(labels, 0)]
    water = (roles == 'water') & opaque
    trees = tree_mask(labels) & opaque & ~water
    ink = (roles == 'ink') & opaque & ~trees & ~water
    lab = hex_to_lab(HEX)
    streets = np.zeros(labels.shape, bool)
    fills = {}
    for index in range(SCENE):
        inside = (region == index) & ~water & ~trees & ~ink
        values, counts = np.unique(labels[inside], return_counts=True)
        fill = int(values[counts.argmax()])
        fills[PIECE_IDS[index]] = NAMES[fill]
        lighter = np.flatnonzero((lab[:, 0] > lab[fill, 0]) & np.isin(ROLES, ['cream', 'fill']))
        streets |= inside & np.isin(labels, lighter)
    scene = (region == SCENE) & opaque
    streets |= scene & (labels == NAMES.index('street')) & ~water & ~trees & ~ink

    base_group = np.zeros(labels.shape, '<U24')
    for index, pid in enumerate(PIECE_IDS):
        base_group[region == index] = f'district-{pid}'
    ochre = (roles == 'ochre') | (labels == NAMES.index('yellow'))
    base_group[scene & np.isin(roles, ['ochre', 'fill', 'ink'])] = 'fortifications'
    base_group[scene & (roles == 'cream')] = 'district-strips'
    # Scene greens are rampart slopes, city-strip parks or meadows, depending on
    # their surroundings; dark greens outside tree crowns are slope shading or
    # the dark rim of the river.
    green = scene & (roles == 'green')
    groups = vote_groups(green, {'fortifications': ochre, 'district-strips': roles == 'cream', 'greenery': water})
    base_group[green] = groups[green]
    dark = scene & (roles == 'tree') & ~trees
    groups = vote_groups(dark, {gid: base_group == gid for gid in ('fortifications', 'district-strips', 'greenery')}
                         | {'water': water})
    base_group[dark] = groups[dark]
    base_group[water] = 'water'
    base_group[~opaque] = ''
    # Detail pixels inherit colour and group of the nearest base pixel of the
    # same fragment, so base shapes stay solid underneath streets, trees and
    # outlines without crossing a manifest fragment boundary.
    detail = streets | trees | ink
    rows, cols = nearest_within(region, opaque & ~detail)
    base_labels = labels.copy()
    base_labels[detail] = labels[rows[detail], cols[detail]]
    base_group[detail] = base_group[rows[detail], cols[detail]]
    base_group = absorb_small_groups(base_group, opaque, region)
    for gid in np.unique(base_group[opaque]):
        inside = base_group == gid
        base_labels[inside] = merge_specks(base_labels, inside, MIN_BASE_AREA)[inside]
    return dict(trees=trees, ink=ink, streets=streets, base_labels=base_labels,
                base_group=base_group, fills=fills)


def fmt(value):
    text = f'{value:.1f}'
    return text[:-2] if text.endswith('.0') else text


def trace(mask, tolerance, x0=0, y0=0):
    """Trace one binary mask into an even-odd path; coordinates are SVG units (pixel edges)."""
    ys, xs = np.nonzero(mask)
    x0, y0 = x0 + xs.min(), y0 + ys.min()
    crop = np.pad(mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 1).astype(np.float32)
    x0, y0 = x0 - 1, y0 - 1
    rings = []
    for contour in measure.find_contours(crop, 0.5):
        points = measure.approximate_polygon(contour, tolerance)
        if len(points) < 4:
            continue
        points = points[:-1]
        area = 0.5 * abs(np.dot(points[:, 0], np.roll(points[:, 1], 1)) - np.dot(points[:, 1], np.roll(points[:, 0], 1)))
        if area < 1.0:
            continue
        # Pixel (row, col) covers [col, col+1] x [row, row+1]; its centre is +0.5.
        coords = [f'{fmt(x + x0 + 0.5)} {fmt(y + y0 + 0.5)}' for y, x in points]
        rings.append('M' + ' '.join(coords) + 'Z')
    return ''.join(rings)


def components(mask):
    """Yield (crop, x, y) per 8-connected component, ordered top-to-bottom, left-to-right."""
    count, comp, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    order = sorted(range(1, count), key=lambda k: (stats[k, cv2.CC_STAT_TOP], stats[k, cv2.CC_STAT_LEFT]))
    for k in order:
        x, y, w, h = stats[k, :4]
        yield comp[y:y + h, x:x + w] == k, x, y


def colour_paths(mask, labels, prefix, tolerance, stroke=False, x0=0, y0=0):
    out = []
    for k in range(len(PALETTE)):
        layer = mask & (labels == k)
        if not layer.any():
            continue
        for n, (part, x, y) in enumerate(components(layer), 1):
            d = trace(part, tolerance, x + x0, y + y0)
            if not d:
                continue
            seam = f' stroke="{HEX[k]}" stroke-width="{SEAM_STROKE}" stroke-linejoin="round"' if stroke else ''
            out.append(f'<path id="{prefix}-{NAMES[k]}-{n}" fill="{HEX[k]}"{seam} d="{d}"/>')
    return out


def stacked(mask, labels, prefix, details=True, base_suffix=''):
    """One solid path per component in its dominant colour; other colours lie above it."""
    out = []
    for n, (part, x, y) in enumerate(components(mask), 1):
        local = labels[y:y + part.shape[0], x:x + part.shape[1]]
        values, counts = np.unique(local[part], return_counts=True)
        dominant = int(values[counts.argmax()])
        d = trace(part, DETAIL_TOLERANCE, x, y)
        if not d:
            continue
        body = [f'<path id="{prefix}-{n:03d}{base_suffix}" fill="{HEX[dominant]}" d="{d}"/>']
        if details:
            body += colour_paths(part & (local != dominant), local, f'{prefix}-{n:03d}', DETAIL_TOLERANCE, x0=x, y0=y)
        out.append((f'{prefix}-{n:03d}', body))
    return out


def group(gid, body, indent='  ', layer=True, extra=''):
    attrs = f' inkscape:groupmode="layer" inkscape:label="{LABELS[gid]}"' if layer else ''
    inner = ''.join(f'\n{indent}  {line}' for line in body)
    return f'{indent}<g id="{gid}"{attrs}{extra}>{inner}\n{indent}</g>' if body else f'{indent}<g id="{gid}"{attrs}{extra}/>'


def build():
    image = load_source()
    height, width = image.shape[:2]
    opaque = image[:, :, 3] >= 128
    labels = quantize(image, opaque)
    region = piece_regions(labels.shape)
    c = classify(labels, region, opaque)

    def base_section(gid):
        return colour_paths(c['base_group'] == gid, c['base_labels'], gid, BASE_TOLERANCE, stroke=True)

    region_names = PIECE_IDS + ['scene']
    district_ids = [f'district-{pid}' for pid in PIECE_IDS] + ['district-strips']
    districts = []
    for gid in district_ids:
        districts.append(group(gid, base_section(gid), '    ', layer=False,
                               extra=f' data-fill="{c["fills"].get(gid[9:], "cream")}"'))
    def flat(parts):
        return [line for _, body in parts for line in body]

    def street_group(name, lines):
        # The group carries the common street colour, so recolouring a district's
        # streets is one attribute; only paths in another colour keep their own fill.
        fills = [re.search(r' fill="(#[0-9a-f]{6})"', line).group(1) for line in lines]
        common = max(sorted(set(fills)), key=fills.count)
        lines = [line.replace(f' fill="{common}"', '', 1) if fill == common else line
                 for line, fill in zip(lines, fills)]
        return group(f'streets-{name}', lines, '    ', layer=False, extra=f' fill="{common}"')

    streets = [street_group(name, flat(stacked(c['streets'] & (region == index), labels,
                                               f'street-{name}', details=False)))
               for index, name in enumerate(region_names)]
    outlines = [group(f'outlines-{name}', flat(stacked(c['ink'] & (region == index), labels,
                                                       f'outline-{name}', details=False)), '    ', layer=False)
                for index, name in enumerate(region_names)]
    trees = [group(gid, body, '    ', layer=False)
             for gid, body in stacked(c['trees'], labels, 'tree', base_suffix='-base')]

    # The silhouette is the bottom layer: a solid dark-ink shape that is both the
    # editable outer contour and the backing that keeps sub-pixel gaps under
    # the outline strokes from showing the background.
    outline = trace(opaque, 0.6)
    contour = HEX[NAMES.index('ink-brown')]
    sections = [
        group('outer-contour', [f'<path id="outer-contour-path" fill="{contour}" d="{outline}"/>']),
        group('water', base_section('water')),
        group('fortifications', base_section('fortifications')),
        group('greenery', base_section('greenery')),
        group('districts', [d.strip() for d in districts]),
        group('streets', [s.strip() for s in streets]),
        group('buildings-landmarks', [], extra=' data-empty-by="owner-decision-2026-11-03"'),
        group('trees', [t.strip() for t in trees]),
        group('outlines', [o.strip() for o in outlines]),
        group('district-markers', [], extra=' data-empty-by="owner-decision-2026-11-03"'),
    ]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg"
 xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
 width="{width}" height="{height}" viewBox="0 0 {width} {height}"
 data-geometry-version="{GEOMETRY_VERSION}" data-status="draft">
 <title>KUDY — вектарная майстар-карта (чарнавік)</title>
 <desc>Editable vector reconstruction of map-cutout-v2 (sha256 {SOURCE_SHA256}). Draft: historical accuracy (MAP-02-HIST) and rights (MAP-02-RIGHTS) are not cleared. No embedded raster.</desc>
 <metadata>Coordinate unit: source PNG pixel; viewBox shared with menu-map-city-only/manifest.json. Generated by build-vector.py; edit layers, then keep IDs stable.</metadata>
{chr(10).join(sections)}
</svg>
'''
    return svg


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=HERE / 'map-master-vector.svg')
    args = parser.parse_args()
    svg = build()
    args.out.write_text(svg, encoding='utf-8', newline='\n')
    print(f'Vector master: {args.out.name}, {len(svg.encode()) / 1e6:.2f} MB, {svg.count("<path")} paths')


if __name__ == '__main__':
    main()
