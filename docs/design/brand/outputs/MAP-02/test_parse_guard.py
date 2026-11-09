"""Guard the MAP-02 XML parse path against DTD entity expansion.

    python docs/design/brand/outputs/MAP-02/test_parse_guard.py

The MAP-02 tooling parses only files this repository generates, but the parse
path must reject DTD entities explicitly (issue #184) instead of relying on
the stdlib refusing undefined entities as a side effect.
"""
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


if __name__ == '__main__':
    unittest.main()
