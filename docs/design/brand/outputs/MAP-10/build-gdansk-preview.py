"""Preview only: Gdańsk cutout, grounded in the repository's city map.
Source: docs/design/production/about-map.webp, which is illustrated and not to scale.
Keep existing puzzle masks; do not replace production art without visual approval.
"""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[5]
PKG = ROOT / "docs/design/brand/outputs/menu-map-city-only"
OUT = Path(__file__).parent
manifest = json.loads((PKG / "manifest.json").read_text(encoding="utf-8"))
image = Image.open(ROOT / "docs/design/production/about-map.webp").convert("RGBA")
density = image.width / 892
assert image.height == round(971 * density)
region = (350, 500, 890, 965)  # Gdańsk, logical map coordinates
crop = tuple(round(value * density) for value in region)
base = image.crop(crop).resize((1351, 1164), Image.Resampling.LANCZOS)
base.save(OUT / "gdansk-reference.png")
assembled = Image.new("RGBA", base.size)
scattered = Image.new("RGBA", (1600, 1600))
slots = {
    "nearby": (153, 138),
    "guides": (984, 153),
    "discovery": (1006, 806),
    "reserve-1": (125, 698),
    "kudy": (448, 1292),
}
for part in manifest["pieces"]:
    x, y, w, h = (part[key] for key in ("x", "y", "width", "height"))
    image_piece = base.crop((x, y, x + w, y + h))
    alpha = Image.open(PKG / part["png"]).convert("RGBA").getchannel("A")
    assert alpha.size == (w, h)
    image_piece.putalpha(alpha)
    assembled.alpha_composite(image_piece, (x, y))
    scattered.alpha_composite(image_piece, slots[part["id"]])
assembled.save(OUT / "gdansk-map-joined.png")
scattered.save(OUT / "gdansk-map-pieces.png")
print("Gdańsk preview derived from existing map and five masks")
