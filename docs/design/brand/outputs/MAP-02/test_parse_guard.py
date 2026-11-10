"""Guard the MAP-02 XML parse path against DTD entity expansion.

    python docs/design/brand/outputs/MAP-02/test_parse_guard.py

The MAP-02 tooling parses only files this repository generates, but the parse
path must reject DTD entities explicitly (issue #184) instead of relying on
the stdlib refusing undefined entities as a side effect. The third test drives
the entity bomb through the production check_structure in vector/verify-vector.py
(issue #189).
"""
import importlib.util
import unittest
from pathlib import Path

from defusedxml.ElementTree import fromstring
from defusedxml.common import EntitiesForbidden

HERE = Path(__file__).resolve().parent

ENTITY_BOMB = (
    '<?xml version="1.0"?>'
    '<!DOCTYPE r [<!ENTITY a "aaa">'
    '<!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>'
    '<r>&b;</r>'
)


class ParseGuardTests(unittest.TestCase):
    def test_rejects_dtd_entity_expansion(self):
        with self.assertRaises(EntitiesForbidden):
            fromstring(ENTITY_BOMB)

    def test_parse_sites_import_defusedxml(self):
        for name in ('package-cutout.py', 'vector/verify-vector.py'):
            text = (HERE / name).read_text(encoding='utf-8')
            self.assertIn('import defusedxml.ElementTree as ET', text, name)
            self.assertNotIn('from xml.etree import', text, name)

    def test_production_check_structure_refuses_dtd_entities(self):
        for name in ('cv2', 'numpy', 'scipy', 'skimage'):
            try:
                __import__(name)
            except ModuleNotFoundError:
                self.skipTest(f'{name} is unavailable; verify-vector cannot load')
        spec = importlib.util.spec_from_file_location(
            'verify_vector', HERE / 'vector' / 'verify-vector.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with self.assertRaises(EntitiesForbidden):
            module.check_structure(ENTITY_BOMB)


if __name__ == '__main__':
    unittest.main()
