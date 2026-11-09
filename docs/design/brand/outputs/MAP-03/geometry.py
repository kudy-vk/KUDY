"""Export the menu geometry from the existing map package."""

import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent / 'menu-map-city-only'
sys.path.insert(0, str(ROOT))
from map_geometry import contour_path, map_joints

MIN_ANCHOR_SQUARE = 100
RESERVED_ZONES = (
    {'id': 'reserve-2', 'x': 590, 'y': 150, 'width': 120, 'height': 120},
    {'id': 'reserve-3', 'x': 370, 'y': 630, 'width': 80, 'height': 80},
)
PIECE_FIELDS = ('id', 'x', 'y', 'width', 'height', 'path', 'anchor', 'neighbors')


def load_manifest():
    return json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))


def mask_rect(item, width, height):
    x, y, w, h = (item[key] for key in ('x', 'y', 'width', 'height'))
    if not all(type(value) is int for value in (x, y, w, h)):
        raise ValueError('mask rectangle coordinates must be integers')
    if min(x, y) < 0 or min(w, h) < 1 or x + w > width or y + h > height:
        raise ValueError('mask rectangle outside source')
    return np.s_[y:y+h, x:x+w]


def export_geometry(manifest):
    try:
        return build_geometry(manifest)
    except (KeyError, TypeError, AttributeError, IndexError) as error:
        raise ValueError(f'invalid geometry manifest: {error}') from error


def build_geometry(manifest):
    version = manifest['version']
    if type(version) is not int or version < 1:
        raise ValueError('map version must be a positive integer')
    snap_distance = manifest['gesture']['snapDistanceDp']
    if type(snap_distance) not in (int, float) or not 0 < snap_distance < float('inf'):
        raise ValueError('snap distance must be positive and finite')

    source = manifest['source']
    width, height = source['width'], source['height']
    artwork = cv2.imread(str(ROOT / 'source.png'), cv2.IMREAD_UNCHANGED)
    if artwork is None or artwork.shape != (height, width, 4):
        raise ValueError('source PNG dimensions differ from manifest')

    pieces = {}
    masks = {}
    occupied = np.zeros((height, width), dtype=bool)
    for entry in manifest['pieces']:
        piece = {key: entry[key] for key in PIECE_FIELDS}
        piece_id = piece['id']
        if not re.fullmatch(r'[a-z][a-z0-9-]*', piece_id) or piece_id in pieces:
            raise ValueError(f'invalid or duplicate fragment ID: {piece_id!r}')
        png = f'pieces/{piece_id}.png'
        if entry['png'] != png:
            raise ValueError(f'fragment PNG path differs from ID: {piece_id}')
        rect = mask_rect(piece, width, height)
        image = cv2.imread(str(ROOT / png), cv2.IMREAD_UNCHANGED)
        if image is None or image.shape != (piece['height'], piece['width'], 4):
            raise ValueError(f'fragment PNG dimensions differ from manifest: {piece_id}')

        fragment = image[:, :, 3] > 0
        if piece['path'] != contour_path(fragment.astype(np.uint8)):
            raise ValueError(f'contour differs from fragment mask: {piece_id}')
        if (occupied[rect] & fragment).any():
            raise ValueError('overlapping fragment masks')
        occupied[rect] |= fragment
        mask = np.zeros((height, width), dtype=bool)
        mask[rect] = fragment
        ax, ay = piece['anchor']
        radius = 0
        if 0 <= ax < width and 0 <= ay < height and mask[ay, ax]:
            limit = min(ax, ay, width - 1 - ax, height - 1 - ay)
            while radius < limit:
                r = radius + 1
                if not mask[ay-r:ay+r+1, ax-r:ax+r+1].all():
                    break
                radius = r
        piece['anchorSquarePx'] = 2 * radius + 1
        if piece['anchorSquarePx'] < MIN_ANCHOR_SQUARE:
            raise ValueError(f'anchor square is smaller than {MIN_ANCHOR_SQUARE}px: {piece_id}')
        pieces[piece_id] = piece
        masks[piece_id] = mask

    if not 4 <= len(pieces) <= 5:
        raise ValueError('expected 4–5 menu fragments')

    assembled = cv2.imread(str(ROOT / 'city-only.png'), cv2.IMREAD_UNCHANGED)
    if assembled is None or assembled.shape != artwork.shape or not np.array_equal(occupied, assembled[:, :, 3] > 0):
        raise ValueError('fragment masks differ from the assembled city')

    expected = map_joints({piece_id: mask.astype(np.uint8) for piece_id, mask in masks.items()})
    joints = manifest['joints']
    pairs = {frozenset((joint['a'], joint['b'])) for joint in joints}
    if pairs != {frozenset((joint['a'], joint['b'])) for joint in expected} or len(pairs) != len(joints):
        raise ValueError('joint pairs differ from masks')
    if joints != expected:
        raise ValueError('joint port or gap differs from masks')
    for piece_id, piece in pieces.items():
        neighbors = [next(iter(pair - {piece_id})) for pair in pairs if piece_id in pair]
        if sorted(piece['neighbors']) != sorted(neighbors):
            raise ValueError(f'neighbor list differs from joints: {piece_id}')

    for zone in RESERVED_ZONES:
        rect = mask_rect(zone, width, height)
        if zone['id'] in pieces or occupied[rect].any() or not (artwork[rect][:, :, 3] > 0).all():
            raise ValueError(f'reserved zone is not on unused scene artwork: {zone["id"]}')

    return {
        'mapVersion': version,
        'source': source,
        'snapDistanceDp': snap_distance,
        'pieces': list(pieces.values()),
        'joints': joints,
        'reservedZones': RESERVED_ZONES,
    }


if __name__ == '__main__':
    try:
        print(json.dumps(export_geometry(load_manifest()), indent=2))
    except (OSError, ValueError) as error:
        sys.exit(f'MAP-03: {error}')
