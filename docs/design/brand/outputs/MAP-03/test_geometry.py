import unittest
from copy import deepcopy

from geometry import export_geometry, load_manifest


class GeometryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = load_manifest()

    def test_exports_the_current_map_in_source_coordinates(self):
        result = export_geometry(self.manifest)
        self.assertEqual(result['mapVersion'], self.manifest['version'])
        self.assertEqual(result['joints'], self.manifest['joints'])
        self.assertEqual(
            [piece['id'] for piece in result['pieces']],
            [piece['id'] for piece in self.manifest['pieces']],
        )
        self.assertTrue(all(piece['anchorSquarePx'] >= 100 for piece in result['pieces']))
        self.assertEqual(len(result['reservedZones']), 2)

    def test_rejects_a_joint_between_non_neighbors(self):
        manifest = deepcopy(self.manifest)
        first, _, third, *_ = manifest['pieces']
        manifest['joints'].append({
            'a': first['id'], 'b': third['id'], 'port': [600, 400], 'gap': 125,
        })
        first['neighbors'].append(third['id'])
        third['neighbors'].append(first['id'])
        with self.assertRaisesRegex(ValueError, 'joint pairs differ from masks'):
            export_geometry(manifest)

    def test_rejects_a_missing_joint(self):
        manifest = deepcopy(self.manifest)
        removed = manifest['joints'].pop()
        for piece in manifest['pieces']:
            if piece['id'] == removed['a']:
                piece['neighbors'].remove(removed['b'])
            if piece['id'] == removed['b']:
                piece['neighbors'].remove(removed['a'])
        with self.assertRaisesRegex(ValueError, 'joint pairs differ from masks'):
            export_geometry(manifest)

    def test_rejects_overlapping_masks(self):
        manifest = deepcopy(self.manifest)
        manifest['pieces'][1]['x'] -= 10
        with self.assertRaisesRegex(ValueError, 'overlapping fragment masks'):
            export_geometry(manifest)

    def test_rejects_unexpected_gap_in_the_assembly(self):
        manifest = deepcopy(self.manifest)
        manifest['pieces'].pop()
        with self.assertRaisesRegex(ValueError, 'fragment masks differ from the assembled city'):
            export_geometry(manifest)

    def test_rejects_a_port_away_from_its_joint(self):
        manifest = deepcopy(self.manifest)
        manifest['joints'][0]['port'] = [5, 5]
        with self.assertRaisesRegex(ValueError, 'joint port or gap differs from masks'):
            export_geometry(manifest)

    def test_rejects_an_anchor_without_usable_space(self):
        manifest = deepcopy(self.manifest)
        piece = manifest['pieces'][0]
        piece['anchor'] = [piece['x'], piece['y']]
        with self.assertRaisesRegex(ValueError, 'anchor square is smaller'):
            export_geometry(manifest)

    def test_rejects_a_contour_vertex_outside_the_fragment(self):
        manifest = deepcopy(self.manifest)
        manifest['pieces'][0]['path'] = 'M0,0 L1,0 L1,1 Z'
        with self.assertRaisesRegex(ValueError, 'contour differs from fragment mask'):
            export_geometry(manifest)

    def test_rejects_a_contour_whose_vertices_are_inside_the_mask(self):
        manifest = deepcopy(self.manifest)
        piece = manifest['pieces'][0]
        x, y = piece['anchor'][0] - piece['x'], piece['anchor'][1] - piece['y']
        piece['path'] = f'M{x},{y} L{x+1},{y} L{x},{y+1} Z'
        with self.assertRaisesRegex(ValueError, 'contour differs from fragment mask'):
            export_geometry(manifest)

    def test_rejects_a_false_gap_for_a_valid_joint(self):
        manifest = deepcopy(self.manifest)
        manifest['joints'][0]['gap'] = 125
        with self.assertRaisesRegex(ValueError, 'joint port or gap differs from masks'):
            export_geometry(manifest)

    def test_rejects_invalid_piece_entries(self):
        manifest = deepcopy(self.manifest)
        manifest['pieces'][0] = None
        with self.assertRaisesRegex(ValueError, 'invalid geometry manifest'):
            export_geometry(manifest)


if __name__ == '__main__':
    unittest.main()
