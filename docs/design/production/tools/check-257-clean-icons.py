#!/usr/bin/env python3
"""Offline structural and renderer check for #257 reduced-detail SVG set."""
from pathlib import Path
from xml.etree import ElementTree as ET
import subprocess

HERE=Path(__file__).resolve().parents[1]
ICONS=HERE/"icons-257"
expected=("airport","gdansk","map","food","transport")
ns="{http://www.w3.org/2000/svg}"
for stem in expected:
    file=ICONS/(stem+".svg")
    assert file.is_file(),f"Missing {file}"
    text=file.read_text()
    svg=ET.fromstring(text)
    assert svg.tag==ns+"svg"
    assert svg.get("viewBox")=="0 0 256 256"
    assert len(svg.findall(ns+"circle"))>=1
    assert len(svg.findall(".//"+ns+"path"))>=1
    assert not svg.findall(".//"+ns+"image"),f"Embedded bitmap in {stem}"
    assert not svg.findall(".//"+ns+"filter"),f"Unnecessary noisy filter in {stem}"
    assert not svg.findall(".//"+ns+"pattern"),f"Textured pattern in {stem}"
    assert "stroke=\"#482c1b\"" in text or "stroke=\"#4d2e1a\"" in text, f"Missing shared ink contour {stem}"
    assert "fill=\"#c48950\"" in text, f"Missing shared bronze rim {stem}"
    assert "stop-color=\"#129cdb\"" in text and "stop-color=\"#0575b9\"" in text, f"Vivid blue background missing: {stem}"
    assert file.stat().st_size<4000,f"Excessive asset detail: {stem}"
    result=subprocess.run(
        ["rsvg-convert","-w","64","-h","64",str(file)],
        capture_output=True,check=True,timeout=10)
    assert result.stdout[:8]==b"\x89PNG\r\n\x1a\n",f"Invalid render {stem}"
    assert len(result.stdout)>200, f"Empty rendering {stem}"
    print("PASS",stem,file.stat().st_size,"bytes",len(svg.findall(".//"+ns+"path")),"vector paths, 64px preview")
legacy=(HERE/"about-257-icons.html").read_text()
for stem in expected:
    assert f"icons-257/{stem}.svg" in legacy
assert "grayscale(.65)" in legacy
screen=(HERE/"about-257.mjs").read_text()
page=(HERE/"about-257.html").read_text()
catalog=(HERE.parent/"catalog.md").read_text()
assert "if (state.medallions === 'blue')" in screen
assert "artBySection = { airport: 'airport', transport: 'transport', city: 'gdansk', food: 'food' }" in screen
assert "Іконкі кола" in screen
assert ".wheel-color-art" in page
assert "production/about-257.html" in catalog
assert "production/about-257-icons.html" in catalog
assert "icons-257" not in (HERE/"about-wheel.mjs").read_text(), "Canonical wheel changed before approval"
assert not (HERE.parent/"catalog-257.html").exists(), "Separate HTML catalog must not exist"
assert not (HERE.parent/"catalog-257.md").exists(), "Separate Markdown catalog must not exist"
print("PASS: five vector assets inside the canonical-catalog #257 screen, shared wheel untouched")
