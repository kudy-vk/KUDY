"""Verify the MAP-02 vector master: structure, reproducible export, fidelity, seams.

    python docs/design/brand/outputs/MAP-02/vector/verify-vector.py

Exits non-zero on any failed check and prints every measured value. The
negative cases prove the structure check rejects a flat raster SVG and
refuses DTD entity expansion.
"""
import importlib.util
import json
import re
import tempfile
from pathlib import Path
import defusedxml.ElementTree as ET
from defusedxml.common import EntitiesForbidden

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
NS = '{http://www.w3.org/2000/svg}'
INKSCAPE = '{http://www.inkscape.org/namespaces/inkscape}'
LAYERS = ['outer-contour', 'water', 'fortifications', 'greenery', 'districts', 'streets',
          'buildings-landmarks', 'trees', 'outlines', 'district-markers']
EMPTY_BY_DECISION = {'buildings-landmarks', 'district-markers'}
MIN_PATHS = {'water': 20, 'fortifications': 100, 'greenery': 5, 'streets': 100, 'trees': 300, 'outlines': 100}
PATH_DATA = re.compile(r'^(M[-0-9. ]+Z)+$')
HIDE_DETAIL = '#outer-contour,#streets,#trees,#outlines{display:none}'


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


EXPORT = load('export_vector', 'export.py')
BUILD = EXPORT.load_builder()
PALETTE = {value for _, _, value in BUILD.PALETTE}
PIECE_IDS = BUILD.PIECE_IDS
DISTRICTS = [f'district-{pid}' for pid in PIECE_IDS] + ['district-strips']
PAPER = EXPORT.PAPER


def check_structure(text):
    """Raise AssertionError unless the SVG is a layered, fully vector master."""
    assert 'data:' not in text, 'embedded data URI (raster) found'
    root = ET.fromstring(text)
    assert root.tag == f'{NS}svg' and root.get('viewBox') == '0 0 1351 1164', 'viewBox changed'
    assert root.get('data-status') == 'draft', 'master must stay marked draft'
    for node in root.iter():
        tag = node.tag.replace(NS, '')
        assert tag in {'svg', 'title', 'desc', 'metadata', 'g', 'path'}, f'unexpected <{tag}>'
        for key, value in node.attrib.items():
            assert not (key.endswith('href') and not value.startswith('#')), 'external reference'
    layers = [g for g in root if g.tag == f'{NS}g']
    assert [g.get('id') for g in layers] == LAYERS, 'layer order or ids changed'
    ids = [node.get('id') for node in root.iter() if node.get('id')]
    assert len(ids) == len(set(ids)), 'duplicate ids'
    parent = {child: node for node in root.iter() for child in node}
    counts = {}
    for layer in layers:
        lid = layer.get('id')
        assert layer.get(f'{INKSCAPE}groupmode') == 'layer', f'{lid} is not an editable layer'
        paths = list(layer.iter(f'{NS}path'))
        counts[lid] = len(paths)
        if lid in EMPTY_BY_DECISION:
            assert len(layer) == 0 and layer.get('data-empty-by'), f'{lid} must stay empty by owner decision'
        else:
            assert paths, f'{lid} is empty'
        assert counts[lid] >= MIN_PATHS.get(lid, 0), f'{lid}: {counts[lid]} paths, too few'
        for path in paths:
            assert PATH_DATA.match(path.get('d', '')), f"{path.get('id')}: unexpected path data"
            fill = path.get('fill') or parent[path].get('fill')
            assert fill in PALETTE, f"{path.get('id')}: fill outside the palette"
    assert counts['outer-contour'] == 1, 'outer contour must be one silhouette path'
    for g in root.find(f"{NS}g[@id='streets']"):
        assert g.get('fill') in PALETTE, f"{g.get('id')}: street colour must sit on the group"
    districts = root.find(f"{NS}g[@id='districts']")
    assert [g.get('id') for g in districts] == DISTRICTS, 'district groups changed'
    for g in districts:
        assert len(g) >= 5, f"{g.get('id')} has too few shapes"
    assert len(root.find(f"{NS}g[@id='trees']")) >= 100, 'tree groups missing'
    return counts


def negative_cases(text):
    """Every flat-raster, stripped or DTD-entity variant must fail the structure check."""
    raster = (HERE.parent / 'map-cutout-v2.svg').read_text(encoding='utf-8')
    flat_layer = re.sub(r'<g id="streets"[\s\S]*?\n  </g>',
                        '<g id="streets" inkscape:groupmode="layer" inkscape:label="x">'
                        '<image href="data:image/png;base64,iVBORw0KGgo="/></g>', text, count=1)
    no_trees = re.sub(r'<g id="trees"[\s\S]*?\n  </g>\n', '', text, count=1)
    single_shape = re.sub(r'<g id="fortifications"[\s\S]*?\n  </g>',
                          '<g id="fortifications" inkscape:groupmode="layer" inkscape:label="x">'
                          '<path fill="#eeb654" d="M0 0 1351 0 1351 1164 0 1164Z"/></g>', text, count=1)
    cases = {'hybrid raster SVG (map-cutout-v2.svg)': raster, 'streets replaced by a PNG': flat_layer,
             'trees layer removed': no_trees, 'fortifications flattened to one shape': single_shape}
    for name, variant in cases.items():
        assert variant != text, f'negative case not constructed: {name}'
        try:
            check_structure(variant)
        except AssertionError as error:
            print(f'  rejected as expected: {name} ({error})')
        else:
            raise AssertionError(f'structure check accepted {name}')
    entity_bomb = ('<?xml version="1.0"?><!DOCTYPE r [<!ENTITY a "aaa">'
                   '<!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]><r>&b;</r>')
    try:
        check_structure(entity_bomb)
    except EntitiesForbidden as error:
        print(f'  rejected as expected: DTD entity bomb ({error})')
    else:
        raise AssertionError('structure check accepted a DTD entity bomb')


def read_png(path, alpha=True):
    image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    assert image is not None and image.ndim == 3 and (image.shape[2] == 4 or not alpha), path
    return image


def on_paper(image):
    paper = np.array([int(PAPER[5:7], 16), int(PAPER[3:5], 16), int(PAPER[1:3], 16)], float)
    alpha = image[:, :, 3:] / 255
    return (image[:, :, :3] * alpha + paper * (1 - alpha)).round().astype(np.uint8)


def delta_e(a, b):
    la = cv2.cvtColor(on_paper(a), cv2.COLOR_BGR2LAB).astype(float)
    lb = cv2.cvtColor(on_paper(b), cv2.COLOR_BGR2LAB).astype(float)
    la[..., 0] *= 100 / 255
    lb[..., 0] *= 100 / 255
    return np.sqrt(((la - lb) ** 2).sum(-1))


def luminance(bgr):
    channel = np.array(bgr[::-1], float) / 255
    linear = np.where(channel <= 0.03928, channel / 12.92, ((channel + 0.055) / 1.055) ** 2.4)
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(a, b):
    la, lb = sorted([luminance(a), luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hex_bgr(value):
    return [int(value[5:7], 16), int(value[3:5], 16), int(value[1:3], 16)]


def piece_masks(shape):
    pieces_dir = HERE.parent.parent / 'menu-map-city-only'
    manifest = json.loads((pieces_dir / 'manifest.json').read_text(encoding='utf-8'))
    masks = {}
    for piece in manifest['pieces']:
        alpha = cv2.imread(str(pieces_dir / piece['png']), cv2.IMREAD_UNCHANGED)[:, :, 3] > 0
        mask = np.zeros(shape, bool)
        mask[piece['y']:piece['y'] + alpha.shape[0], piece['x']:piece['x'] + alpha.shape[1]] = alpha
        masks[piece['id']] = mask
    return masks


def main():
    committed = (HERE / 'map-master-vector.svg').read_text(encoding='utf-8')
    counts = check_structure(committed)
    print('Structure: fully vector, layers', ', '.join(f'{k}={v}' for k, v in counts.items()))
    negative_cases(committed)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        fresh = EXPORT.export(tmp)
        assert fresh['svg'].read_bytes() == (HERE / 'map-master-vector.svg').read_bytes(), \
            'build-vector.py no longer reproduces the committed SVG byte for byte'
        for key in ('png', 'full', 'small', 'phone'):
            a, b = read_png(fresh[key], False), read_png(HERE / EXPORT.OUTPUTS[key], False)
            assert a.shape == b.shape, f'{key}: size changed'
            changed = (np.abs(a.astype(int) - b.astype(int)).max(-1) > 8).mean()
            assert changed <= 0.002, f'{key}: {changed:.2%} pixels differ from the committed export'
        print('Export: SVG reproduced byte for byte; 4 PNG exports reproduced (<=0.2% pixels differ)')

        source = read_png(HERE.parent / 'map-cutout-v2.png')
        render = read_png(fresh['png'])
        src_in, out_in = source[:, :, 3] >= 128, render[:, :, 3] >= 128
        iou = (src_in & out_in).sum() / (src_in | out_in).sum()
        de = delta_e(source, render)
        print(f'Fidelity: silhouette IoU {iou:.4f}; dE mean {de[src_in].mean():.2f}, '
              f'p95 {np.percentile(de[src_in], 95):.1f}, share dE<20 {(de[src_in] < 20).mean():.3f}')
        assert iou >= 0.995 and de[src_in].mean() <= 8 and (de[src_in] < 20).mean() >= 0.92

        masks = piece_masks(src_in.shape)
        for pid, mask in masks.items():
            value = de[mask].mean()
            print(f'  piece {pid}: {mask.sum()} px, dE mean {value:.2f}')
            assert value <= 8, f'{pid}: fragment drifted from the source'

        jobs = [{'svg': str(fresh['svg']), 'out': str(tmp / 'base.png'), 'width': 1351, 'height': 1164,
                 'css': HIDE_DETAIL},
                {'svg': str(fresh['svg']), 'out': str(tmp / 'water.png'), 'width': 1351, 'height': 1164,
                 'css': 'svg>g:not(#water){display:none}'}]
        for gid in DISTRICTS:
            jobs.append({'svg': str(fresh['svg']), 'out': str(tmp / f'{gid}.png'), 'width': 1351, 'height': 1164,
                         'css': f'svg>g:not(#districts){{display:none}}#districts>g:not(#{gid}){{display:none}}'})
        EXPORT.render(jobs)

        interior = cv2.erode(src_in.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        interior &= source[:, :, 3] >= 250
        base = read_png(tmp / 'base.png')
        seams = {'base layers without contour backing': int((interior & (base[:, :, 3] < 240)).sum()),
                 'full map': int((interior & (render[:, :, 3] < 240)).sum())}
        print(f'Seams: interior pixels with alpha<240 — {seams}')
        assert seams['full map'] == 0, 'background shows through the map'
        assert seams['base layers without contour backing'] <= 150, 'gaps between base shapes'

        water = read_png(tmp / 'water.png')[:, :, 3] >= 128
        district = {gid: read_png(tmp / f'{gid}.png')[:, :, 3] >= 128 for gid in DISTRICTS}
        for pid, mask in masks.items():
            shape = district[f'district-{pid}']
            land = mask & ~water
            coverage = (shape & land).sum() / land.sum()
            spill = int((shape & ~mask).sum())
            print(f'  district-{pid}: covers {coverage:.4f} of the fragment land, {spill} px outside the fragment')
            assert coverage >= 0.97 and spill <= 0.03 * mask.sum(), f'{pid}: district geometry deviates'
        overlap = max(int((district[a] & district[b]).sum()) for i, a in enumerate(DISTRICTS) for b in DISTRICTS[i + 1:])
        print(f'Districts: largest pairwise overlap {overlap} px (seam strokes only)')
        assert overlap <= 2000, 'district groups overlap'

        rim = src_in & (cv2.erode(src_in.astype(np.uint8), np.ones((5, 5), np.uint8)) == 0)
        rim_colour = np.median(render[:, :, :3][rim & out_in], axis=0)
        ratio = contrast(rim_colour, hex_bgr(PAPER))
        print(f'Contrast: outer rim vs color.paper {PAPER} = {ratio:.1f}:1')
        assert ratio >= 3, 'outer contour is not distinguishable on the paper background'
        root = ET.fromstring(committed)
        for pid in PIECE_IDS:
            fill = BUILD.HEX[BUILD.NAMES.index(root.find(f".//{NS}g[@id='district-{pid}']").get('data-fill'))]
            street = root.find(f".//{NS}g[@id='streets-{pid}']").get('fill')
            print(f'  streets-{pid}: {street} on {fill} = {contrast(hex_bgr(street), hex_bgr(fill)):.2f}:1')
    print('MAP-02 vector master: all checks passed (draft; not production-approved).')


if __name__ == '__main__':
    main()
