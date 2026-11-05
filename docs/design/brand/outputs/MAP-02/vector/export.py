"""Regenerate the vector master and all its exports with one command.

    python docs/design/brand/outputs/MAP-02/vector/export.py [--out-dir DIR]

Writes map-master-vector.svg (build-vector.py), a full-size transparent PNG and
three previews on the brand paper colour: the full map, ~240 x 210 px, and the
five menu fragments assembled at phone width (390 CSS px, 3x density).
"""
import argparse
import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PAPER = '#faf7f2'  # color.paper in docs/design/visual-language.md
WIDTH, HEIGHT = 1351, 1164
OUTPUTS = {
    'svg': 'map-master-vector.svg',
    'png': 'map-master-vector.png',
    'full': 'preview-full.png',
    'small': 'preview-240.png',
    'phone': 'preview-phone-pieces.png',
}


def load_builder():
    spec = importlib.util.spec_from_file_location('build_vector', HERE / 'build-vector.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pieces_box(margin=24):
    """Bounding box of the five manifest fragments, with a margin, in map units."""
    manifest = json.loads((HERE.parent.parent / 'menu-map-city-only' / 'manifest.json').read_text(encoding='utf-8'))
    x0 = min(p['x'] for p in manifest['pieces']) - margin
    y0 = min(p['y'] for p in manifest['pieces']) - margin
    x1 = max(p['x'] + p['width'] for p in manifest['pieces']) + margin
    y1 = max(p['y'] + p['height'] for p in manifest['pieces']) + margin
    return x0, y0, x1 - x0, y1 - y0


def render(jobs):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / 'jobs.json'
        path.write_text(json.dumps(jobs), encoding='utf-8')
        subprocess.run(['node', str(HERE / 'render.mjs'), str(path)], check=True)


def export(out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    svg = out_dir / OUTPUTS['svg']
    svg.write_text(load_builder().build(), encoding='utf-8', newline='\n')
    small_height = round(240 * HEIGHT / WIDTH)
    x, y, w, h = pieces_box()
    phone_height = round(390 * h / w)
    render([
        {'svg': str(svg), 'out': str(out_dir / OUTPUTS['png']), 'width': WIDTH, 'height': HEIGHT},
        {'svg': str(svg), 'out': str(out_dir / OUTPUTS['full']), 'width': WIDTH // 2,
         'height': HEIGHT // 2, 'dpr': 2, 'background': PAPER},
        {'svg': str(svg), 'out': str(out_dir / OUTPUTS['small']), 'width': 240, 'height': small_height,
         'background': PAPER},
        {'svg': str(svg), 'out': str(out_dir / OUTPUTS['phone']), 'width': 390, 'height': phone_height,
         'dpr': 3, 'background': PAPER, 'pieces': True, 'viewBox': f'{x} {y} {w} {h}'},
    ])
    return {key: out_dir / name for key, name in OUTPUTS.items()}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out-dir', type=Path, default=HERE)
    files = export(parser.parse_args().out_dir)
    for key, path in files.items():
        print(f'{key}: {path.name} ({path.stat().st_size / 1e3:.0f} kB)')


if __name__ == '__main__':
    main()
