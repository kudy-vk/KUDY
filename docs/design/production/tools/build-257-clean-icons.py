#!/usr/bin/env python3
"""Rebuild the five vivid-blue bronze KUDY #257 vector medallions.

Source: editable SVG markup below, based on the owner's accepted 18 Nov 2026
colored reference. These are intentional vector reinterpretations, not crops
or auto-traces of the image. No fonts, embedded PNG, network, or filters.
"""
from pathlib import Path
from xml.etree import ElementTree as ET

OUT = Path(__file__).resolve().parents[1] / "icons-257"
OUT.mkdir(parents=True, exist_ok=True)

SVG = {
    "airport": r'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="airport-title">
<title id="airport-title">Аэрапорт</title>
<defs><radialGradient id="airport-sky" cx="46%" cy="38%" r="73%"><stop offset="0" stop-color="#129cdb"/><stop offset="1" stop-color="#0575b9"/></radialGradient><clipPath id="airport-clip"><circle cx="128" cy="128" r="101"/></clipPath></defs>
<circle cx="128" cy="128" r="116" fill="#4d2e1a"/>
<circle cx="128" cy="128" r="112" fill="#c48950"/>
<circle cx="128" cy="128" r="108" fill="none" stroke="#f3cf99" stroke-width="3"/>
<circle cx="128" cy="128" r="102" fill="url(#airport-sky)" stroke="#4d2e1a" stroke-width="4"/>
<g clip-path="url(#airport-clip)"><path d="M128 48c-7 0-11 12-11 27v27l-54 31c-6 4-9 9-9 16v10c0 4 4 7 8 5l55-20v34l-17 15v10l24-8 4 18 4-18 24 8v-10l-17-15v-34l55 20c4 2 8-1 8-5v-10c0-7-3-12-9-16l-54-31V75c0-15-4-27-11-27z" fill="#fff1d9" stroke="#482c1b" stroke-width="4.6" stroke-linejoin="round"/>
</g>
</svg>
''',
    "gdansk": r'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="gdansk-title">
<title id="gdansk-title">Гданьск</title>
<defs><radialGradient id="gdansk-sky" cx="46%" cy="38%" r="73%"><stop offset="0" stop-color="#129cdb"/><stop offset="1" stop-color="#0575b9"/></radialGradient><clipPath id="gdansk-clip"><circle cx="128" cy="128" r="101"/></clipPath></defs>
<circle cx="128" cy="128" r="116" fill="#4d2e1a"/>
<circle cx="128" cy="128" r="112" fill="#c48950"/>
<circle cx="128" cy="128" r="108" fill="none" stroke="#f3cf99" stroke-width="3"/>
<circle cx="128" cy="128" r="102" fill="url(#gdansk-sky)" stroke="#4d2e1a" stroke-width="4"/>
<g clip-path="url(#gdansk-clip)"><path d="M25 207V141l16-13 16 13v66z" fill="#d95b38" stroke="#482c1b" stroke-width="3.4"/><path d="M25 142l16-19 16 19" fill="none" stroke="#482c1b" stroke-width="3.4"/>
<path d="M54 207v-67l10-8v-10h10v-9h9v9h10v10l9 8v67z" fill="#efbc70" stroke="#482c1b" stroke-width="3.5"/>
<path d="M100 207V105h10V87l9-10v-14l9-15 9 15v14l9 10v18h9v102z" fill="#c66e42" stroke="#482c1b" stroke-width="3.5"/>
<path d="M112 85l16-37 16 37" fill="#4caa71" stroke="#482c1b" stroke-width="3.3"/>
<path d="M157 207v-66l12-14v-9h11v9l13 14v66z" fill="#dc6241" stroke="#482c1b" stroke-width="3.5"/>
<path d="M193 207v-67l9-9v-10h10v10l10 9v67z" fill="#fff1d9" stroke="#482c1b" stroke-width="3.4"/>
<path d="M105 105h46M118 87h20" stroke="#482c1b" stroke-width="3"/>
<circle cx="128" cy="115" r="9" fill="#fff1d9" stroke="#482c1b" stroke-width="3"/>
<path d="M128 109v6l4 3" fill="none" stroke="#482c1b" stroke-width="2"/>
<path d="M38 160h6v10h-6zm0 24h6v10h-6zm29-36h6v10h-6zm14 0h6v10h-6zm-14 23h6v10h-6zm14 0h6v10h-6zm41-26h12v20h-12zm-1 31h14v31h-14zm48-24h7v12h-7zm0 25h7v12h-7zm34-22h7v12h-7zm0 24h7v12h-7z" fill="#57341f"/>
<path d="M25 207h207" stroke="#482c1b" stroke-width="4"/></g>
</svg>
''',
    "map": r'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="map-title">
<title id="map-title">Карта</title>
<defs><radialGradient id="map-sky" cx="46%" cy="38%" r="73%"><stop offset="0" stop-color="#129cdb"/><stop offset="1" stop-color="#0575b9"/></radialGradient><clipPath id="map-clip"><circle cx="128" cy="128" r="101"/></clipPath></defs>
<circle cx="128" cy="128" r="116" fill="#4d2e1a"/>
<circle cx="128" cy="128" r="112" fill="#c48950"/>
<circle cx="128" cy="128" r="108" fill="none" stroke="#f3cf99" stroke-width="3"/>
<circle cx="128" cy="128" r="102" fill="url(#map-sky)" stroke="#4d2e1a" stroke-width="4"/>
<g clip-path="url(#map-clip)"><path d="M40 174l15-70 42-17 51 19 51-18 17 87-53 21-53-20-49 20z" fill="#fff0d8" stroke="#482c1b" stroke-width="4.5" stroke-linejoin="round"/>
<path d="M56 108l42-16 12 78-47 19z" fill="#6eb45b"/><path d="M98 92l50 18 15 79-53-19z" fill="#a3cc7a"/><path d="M148 110l49-17 12 77-46 19z" fill="#62ad59"/>
<path d="M98 92l12 78m38-60 15 79" stroke="#fff0d8" stroke-width="5" fill="none"/>
<path d="M66 151c27-17 42-5 55 0s35-12 72-6" fill="none" stroke="#f1e4c5" stroke-width="5" stroke-linecap="round"/>
<path d="M145 50c-24 0-42 18-42 42 0 26 29 57 42 76 14-19 42-50 42-76 0-24-18-42-42-42z" fill="#e34e36" stroke="#482c1b" stroke-width="4.5"/><circle cx="145" cy="92" r="15" fill="#fff0d8" stroke="#482c1b" stroke-width="3.6"/></g>
</svg>
''',
    "food": r'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="food-title">
<title id="food-title">Ежа</title>
<defs><radialGradient id="food-sky" cx="46%" cy="38%" r="73%"><stop offset="0" stop-color="#129cdb"/><stop offset="1" stop-color="#0575b9"/></radialGradient><clipPath id="food-clip"><circle cx="128" cy="128" r="101"/></clipPath></defs>
<circle cx="128" cy="128" r="116" fill="#4d2e1a"/>
<circle cx="128" cy="128" r="112" fill="#c48950"/>
<circle cx="128" cy="128" r="108" fill="none" stroke="#f3cf99" stroke-width="3"/>
<circle cx="128" cy="128" r="102" fill="url(#food-sky)" stroke="#4d2e1a" stroke-width="4"/>
<g clip-path="url(#food-clip)"><path d="M46 84v42m-11-42v42m22-42v42m-11 0v77" fill="none" stroke="#fff0d8" stroke-width="8" stroke-linecap="round"/>
<path d="M46 126c-13 0-15-9-15-18m15 18c13 0 15-9 15-18" fill="none" stroke="#482c1b" stroke-width="4"/>
<path d="M46 84v42m-11-42v29m22-29v29m-11 13v76" fill="none" stroke="#482c1b" stroke-width="3.4" stroke-linecap="round"/>
<path d="M211 82c-16 17-19 42-19 61h17v60" fill="#fff0d8" stroke="#482c1b" stroke-width="4.3" stroke-linejoin="round"/>
<path d="M70 170h117l-17 24H87z" fill="#d84f3d" stroke="#482c1b" stroke-width="4"/>
<path d="M75 161c1-45 27-68 58-68s58 23 59 68z" fill="#fff0d8" stroke="#482c1b" stroke-width="4.5"/>
<path d="M79 161h110" stroke="#482c1b" stroke-width="5" stroke-linecap="round"/>
<circle cx="133" cy="91" r="7" fill="#f3c583" stroke="#482c1b" stroke-width="3"/>
<path d="M113 72c-6-11 5-18 1-29m20 29c-6-11 5-18 1-29m20 29c-6-11 5-18 1-29" fill="none" stroke="#fff0d8" stroke-width="5" stroke-linecap="round"/></g>
</svg>
''',
    "transport": r'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-labelledby="transport-title">
<title id="transport-title">Транспарт</title>
<defs><radialGradient id="transport-sky" cx="46%" cy="38%" r="73%"><stop offset="0" stop-color="#129cdb"/><stop offset="1" stop-color="#0575b9"/></radialGradient><clipPath id="transport-clip"><circle cx="128" cy="128" r="101"/></clipPath></defs>
<circle cx="128" cy="128" r="116" fill="#4d2e1a"/>
<circle cx="128" cy="128" r="112" fill="#c48950"/>
<circle cx="128" cy="128" r="108" fill="none" stroke="#f3cf99" stroke-width="3"/>
<circle cx="128" cy="128" r="102" fill="url(#transport-sky)" stroke="#4d2e1a" stroke-width="4"/>
<g clip-path="url(#transport-clip)"><rect x="58" y="61" width="140" height="146" rx="25" fill="#fff0d8" stroke="#482c1b" stroke-width="5"/>
<path d="M61 149h134v39c0 12-9 19-21 19H83c-13 0-22-7-22-19z" fill="#d5533e"/>
<rect x="71" y="84" width="114" height="59" rx="7" fill="#078ac7" stroke="#482c1b" stroke-width="4"/>
<path d="M128 85v57" stroke="#482c1b" stroke-width="3.3"/>
<rect x="96" y="72" width="64" height="7" rx="3" fill="#d5533e" stroke="#482c1b" stroke-width="2"/>
<rect x="43" y="104" width="17" height="30" rx="6" fill="#d5533e" stroke="#482c1b" stroke-width="3.5"/>
<rect x="196" y="104" width="17" height="30" rx="6" fill="#d5533e" stroke="#482c1b" stroke-width="3.5"/>
<path d="M58 112H44m153 0h15" stroke="#482c1b" stroke-width="3.5"/>
<circle cx="83" cy="167" r="13" fill="#fff0d8" stroke="#482c1b" stroke-width="3.5"/><circle cx="173" cy="167" r="13" fill="#fff0d8" stroke="#482c1b" stroke-width="3.5"/>
<path d="M109 165h38m-38 11h38" stroke="#482c1b" stroke-width="3.6" stroke-linecap="round"/>
<rect x="78" y="201" width="21" height="11" rx="4" fill="#482c1b"/><rect x="158" y="201" width="21" height="11" rx="4" fill="#482c1b"/></g>
</svg>
''',
}

for key, source in SVG.items():
    root = ET.fromstring(source)
    assert root.tag.endswith("svg")
    assert root.get("viewBox") == "0 0 256 256"
    assert not any(element.tag.endswith("image") for element in root.iter())
    output = OUT / (key + ".svg")
    output.write_text(source, encoding="utf-8")
    print(f"SVG {key}: {output.stat().st_size} bytes, editable vector")
