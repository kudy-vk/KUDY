import importlib.util
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('map04_export', HERE / 'export_map.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class ExportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.output = Path(cls.temp.name)
        cls.manifest = exporter.export(cls.output)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_exports_canonical_geometry_and_all_densities(self):
        source = exporter.GEOMETRY.load_manifest()
        self.assertEqual(self.manifest['mapVersion'], source['version'])
        self.assertEqual(self.manifest['pieces'], exporter.GEOMETRY.export_geometry(source)['pieces'])
        self.assertEqual(self.manifest['densities'], [1, 2, 3])
        exporter.verify(self.output)
        for piece in source['pieces']:
            svg = (self.output / f"{piece['id']}.svg").read_text(encoding='utf-8')
            self.assertNotIn('<image', svg)
            self.assertNotIn('data:', svg)
            for density in self.manifest['densities']:
                image = cv2.imread(str(self.output / f"{piece['id']}@{density}x.png"), -1)
                self.assertEqual(image.shape, (piece['height'] * density, piece['width'] * density, 4))

    def test_misregistered_asset_fails_even_with_updated_checksum(self):
        path = self.output / 'nearby@1x.png'
        original = path.read_bytes()
        manifest_path = self.output / 'manifest.json'
        original_manifest = manifest_path.read_bytes()
        try:
            image = cv2.imdecode(np.frombuffer(original, dtype=np.uint8), -1)
            cv2.imwrite(str(path), np.roll(image, 1, axis=1))
            manifest = json.loads(original_manifest)
            manifest['files'][path.name] = exporter.fingerprint(path)
            manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'pixels differ: nearby@1x'):
                exporter.verify(self.output)
        finally:
            path.write_bytes(original)
            manifest_path.write_bytes(original_manifest)

    def test_wrong_clip_fails_even_with_updated_checksum(self):
        path = self.output / 'nearby.svg'
        original = path.read_bytes()
        manifest_path = self.output / 'manifest.json'
        original_manifest = manifest_path.read_bytes()
        try:
            path.write_bytes(original.replace(b'clip-path="url(#map04-mask)"', b'opacity="1"'))
            manifest = json.loads(original_manifest)
            manifest['files'][path.name] = exporter.fingerprint(path)
            manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'SVG differs: nearby'):
                exporter.verify(self.output)
        finally:
            path.write_bytes(original)
            manifest_path.write_bytes(original_manifest)

    def test_mask_preserves_holes_and_one_pixel_islands(self):
        mask = np.array([[1, 1, 1], [1, 0, 1], [0, 0, 1]], dtype=bool)
        path = exporter.mask_path(mask)
        # Each horizontal run is an integer-aligned rectangle; no approximation.
        self.assertEqual(path, 'M0 0h3v1h-3zM0 1h1v1h-1zM2 1h1v1h-1zM2 2h1v1h-1z')

    def test_fresh_export_is_byte_reproducible(self):
        with tempfile.TemporaryDirectory() as temp:
            result = exporter.export(Path(temp))
            self.assertEqual(result, self.manifest)
            self.assertEqual((Path(temp) / 'manifest.json').read_bytes(),
                             (self.output / 'manifest.json').read_bytes())

    def test_render_failure_preserves_the_previous_package(self):
        before = {path.name: path.read_bytes() for path in self.output.iterdir()}
        with patch.object(exporter.VECTOR, 'render', side_effect=RuntimeError('browser failed')):
            with self.assertRaisesRegex(RuntimeError, 'browser failed'):
                exporter.export(self.output)
        self.assertEqual(before, {path.name: path.read_bytes() for path in self.output.iterdir()})


if __name__ == '__main__':
    unittest.main()
