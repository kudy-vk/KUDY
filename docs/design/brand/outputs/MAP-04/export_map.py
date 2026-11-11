"""Export or verify the approved map: python export_map.py [--verify] [--out-dir DIR]."""

import argparse
from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import xml.etree.ElementTree as XML

import cv2
import defusedxml.ElementTree as SAFE_XML
import numpy as np

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent / 'menu-map-city-only'
MASTER = HERE.parent / 'MAP-02/vector/map-master-vector.svg'
CANON = HERE.parents[2] / 'visual-language.md'
NS = 'http://www.w3.org/2000/svg'
XML.register_namespace('', NS)
DENSITIES = [1, 2, 3]
BUDGET = 24 * 1024 * 1024


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


GEOMETRY = load_module('map03_geometry', HERE.parent / 'MAP-03/geometry.py')
VECTOR = load_module('map02_export', MASTER.parent / 'export.py')


def fingerprint(path):
    data = path.read_bytes()
    return {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}


def inputs():
    manifest = GEOMETRY.load_manifest()
    geometry = GEOMETRY.export_geometry(manifest)
    width, height = manifest['source']['width'], manifest['source']['height']
    root = SAFE_XML.fromstring(MASTER.read_bytes(), forbid_dtd=True)
    if root.get('viewBox') != f'0 0 {width} {height}':
        raise ValueError('master dimensions differ from geometry')
    for element in root.iter():
        if element.tag not in {f'{{{NS}}}{tag}' for tag in ('svg', 'g', 'path', 'title', 'desc', 'metadata')}:
            raise ValueError('master must contain only vector shapes and metadata')
        if any(key.lower().startswith('on') or 'href' in key or 'url(' in value
               for key, value in element.attrib.items()):
            raise ValueError('master contains an active or external reference')
    sources = [MASTER, MASTER.parent / 'render.mjs', PACKAGE / 'manifest.json', PACKAGE / 'source.png']
    layers = []
    occupied = np.zeros((height, width), dtype=bool)
    for piece in geometry['pieces']:
        path = PACKAGE / f"pieces/{piece['id']}.png"
        mask = cv2.imread(str(path), -1)[:, :, 3] > 0
        occupied[GEOMETRY.mask_rect(piece, width, height)] |= mask
        layers.append((piece, mask))
        sources.append(path)
    layers.append(({'id': 'scene', 'x': 0, 'y': 0, 'width': width, 'height': height}, ~occupied))
    hashes = {str(path.relative_to(HERE.parent)).replace('\\', '/'): fingerprint(path) for path in sources}
    hashes['../../visual-language.md'] = fingerprint(CANON)
    return geometry, root, layers, hashes


def mask_path(mask):
    # Pixel-edge rectangles preserve holes and islands that an outer contour loses.
    runs = []
    for y, row in enumerate(mask):
        edges = np.flatnonzero(np.diff(np.pad(row.astype(np.int8), (1, 1))))
        for start, end in zip(edges[::2], edges[1::2]):
            width = end - start
            runs.append(f'M{start} {y}h{width}v1h-{width}z')
    return ''.join(runs)


def fragment_svg(root, piece, mask):
    fragment = deepcopy(root)
    fragment.set('width', str(piece['width']))
    fragment.set('height', str(piece['height']))
    fragment.set('viewBox', ' '.join(str(piece[key]) for key in ('x', 'y', 'width', 'height')))
    fragment[:] = []
    defs = XML.SubElement(fragment, f'{{{NS}}}defs')
    clip = XML.SubElement(defs, f'{{{NS}}}clipPath', {'id': 'map04-mask', 'clipPathUnits': 'userSpaceOnUse'})
    XML.SubElement(clip, f'{{{NS}}}path', {
        'd': mask_path(mask), 'transform': f"translate({piece['x']} {piece['y']})",
    })
    group = XML.SubElement(fragment, f'{{{NS}}}g', {'clip-path': 'url(#map04-mask)'})
    group.extend(deepcopy(list(root)))
    return XML.tostring(fragment, encoding='unicode') + '\n'


def export(out_dir):
    geometry, root, layers, sources = inputs()
    out_dir = Path(out_dir)
    out_dir.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='map04-', dir=out_dir.parent) as temp:
        stage = Path(temp)
        jobs = []
        for piece, mask in layers:
            svg = stage / f"{piece['id']}.svg"
            svg.write_text(fragment_svg(root, piece, mask), encoding='utf-8', newline='\n')
        width, height = (int(root.get(key)) for key in ('width', 'height'))
        for density in DENSITIES:
            jobs.append({'svg': str(MASTER), 'out': str(stage / f'master@{density}x.png'),
                         'width': width, 'height': height, 'dpr': density})
        canon = CANON.read_text(encoding='utf-8')
        tokens = json.loads(canon.split('```json')[1].split('```')[0])
        for theme, paper in [('light', tokens['tokens']['color.paper']['value']),
                             ('dark', tokens['darkTheme']['tokens']['color.paper'])]:
            jobs.append({'svg': str(MASTER), 'out': str(stage / f'preview-{theme}-320.png'),
                         'width': 320, 'height': round(320 * height / width), 'background': paper})
        for job in jobs:
            job['softwareRaster'] = True
        VECTOR.render(jobs)
        # One rasterization per density avoids Chrome's clip-dependent colour rounding.
        for density in DENSITIES:
            reference = cv2.imread(str(stage / f'master@{density}x.png'), -1)
            for piece, mask in layers:
                x, y, w, h = (piece[key] * density for key in ('x', 'y', 'width', 'height'))
                scaled = np.repeat(np.repeat(mask, density, axis=0), density, axis=1)
                image = np.where(scaled[:, :, None], reference[y:y+h, x:x+w], 0)
                target = stage / f"{piece['id']}@{density}x.png"
                if not cv2.imwrite(str(target), image):
                    raise OSError(f'cannot write {target.name}')
        manifest = {'mapVersion': geometry['mapVersion'], 'masterStatus': root.get('data-status'),
                    'sourceSize': [width, height], 'densities': DENSITIES, 'pieces': geometry['pieces'],
                    'sources': sources, 'budgetBytes': BUDGET,
                    'files': {path.name: fingerprint(path) for path in sorted(stage.iterdir())}}
        (stage / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n',
                                           encoding='utf-8', newline='\n')
        verify(stage)
        # Publish the manifest last: a failed render cannot certify a partial export.
        out_dir.mkdir(parents=True, exist_ok=True)
        for name in manifest['files']:
            shutil.copyfile(stage / name, out_dir / name)
        shutil.copyfile(stage / 'manifest.json', out_dir / 'manifest.json')
    return manifest


def verify(out_dir):
    out_dir = Path(out_dir)
    manifest = json.loads((out_dir / 'manifest.json').read_text(encoding='utf-8'))
    geometry, root, layers, sources = inputs()
    width, height = (int(root.get(key)) for key in ('width', 'height'))
    if (manifest['mapVersion'] != geometry['mapVersion'] or manifest['pieces'] != geometry['pieces']
            or manifest['sources'] != sources or manifest['densities'] != DENSITIES
            or manifest['sourceSize'] != [width, height] or manifest['budgetBytes'] != BUDGET
            or manifest['masterStatus'] != root.get('data-status')):
        raise ValueError('export differs from current canonical inputs')
    expected = {f"{piece['id']}.svg" for piece, _ in layers}
    expected |= {f"{piece['id']}@{density}x.png" for piece, _ in layers for density in DENSITIES}
    expected |= {f'master@{density}x.png' for density in DENSITIES}
    expected |= {'preview-light-320.png', 'preview-dark-320.png'}
    if set(manifest['files']) != expected:
        raise ValueError('asset list differs from required export')
    for name, recorded in manifest['files'].items():
        if fingerprint(out_dir / name) != recorded:
            raise ValueError(f'checksum differs: {name}')
    if sum(item['bytes'] for item in manifest['files'].values()) > BUDGET:
        raise ValueError('export exceeds 24 MiB budget')
    for piece, mask in layers:
        if (out_dir / f"{piece['id']}.svg").read_text(encoding='utf-8') != fragment_svg(root, piece, mask):
            raise ValueError(f"SVG differs: {piece['id']}")
    for density in DENSITIES:
        reference = cv2.imread(str(out_dir / f'master@{density}x.png'), -1)
        if reference is None or reference.shape != (height * density, width * density, 4):
            raise ValueError('master raster dimensions differ')
        for piece, mask in layers:
            name = f"{piece['id']}@{density}x"
            image = cv2.imread(str(out_dir / f'{name}.png'), -1)
            x, y, w, h = (piece[key] * density for key in ('x', 'y', 'width', 'height'))
            scaled = np.repeat(np.repeat(mask, density, axis=0), density, axis=1)
            expected_pixels = np.where(scaled[:, :, None], reference[y:y+h, x:x+w], 0)
            if not np.array_equal(image, expected_pixels):
                raise ValueError(f'pixels differ: {name}')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out-dir', type=Path, default=HERE / 'assets')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    try:
        result = verify(args.out_dir) if args.verify else export(args.out_dir)
    except (ValueError, OSError, KeyError) as error:
        parser.exit(1, f'MAP-04: {error}\n')
    print(f"MAP-04 v{result['mapVersion']}: {len(result['pieces'])} fragments, "
          f"{len(result['files'])} assets, {sum(item['bytes'] for item in result['files'].values())} bytes; "
          'exact assembly at 1x/2x/3x verified')
