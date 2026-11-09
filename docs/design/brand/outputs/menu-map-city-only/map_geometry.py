"""Derive menu outlines and joints from the source-pixel alpha masks."""

from itertools import combinations

import cv2
import numpy as np

MAX_JOINT_GAP = 125


def contour_path(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    paths = []
    for contour in contours:
        points = cv2.approxPolyDP(contour, .5, True).reshape(-1, 2)
        if len(points) >= 3:
            paths.append('M' + ' L'.join(f'{px},{py}' for px, py in points) + ' Z')
    return ' '.join(paths)


def map_joints(masks):
    boundaries = {}
    for piece_id, mask in masks.items():
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        points = np.concatenate([cv2.approxPolyDP(c, 4, True).reshape(-1, 2) for c in contours])
        boundaries[piece_id] = points.astype(float)

    joints = []
    for a, b in combinations(boundaries, 2):
        left, right = boundaries[a], boundaries[b]
        distances = ((left[:, None, :] - right[None, :, :]) ** 2).sum(axis=-1)
        ai, bi = np.unravel_index(distances.argmin(), distances.shape)
        gap = float(np.sqrt(distances[ai, bi]))
        if gap <= MAX_JOINT_GAP:
            port = ((left[ai] + right[bi]) / 2).round(1).tolist()
            joints.append({'a': a, 'b': b, 'port': port, 'gap': round(gap, 1)})
    return joints
