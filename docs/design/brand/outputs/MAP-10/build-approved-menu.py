"""MAP-10: export approved historical artwork using the existing menu geometry.

The historically styled picture is generated artwork approved for this menu,
not a survey map or verification of real building/ship positions.
Preserve the five published alpha masks and two passive layers unchanged,
so hit testing, joining, and navigation IDs remain compatible.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import json

HERE = Path(__file__).resolve().parent
PKG = HERE.parent / "menu-map-city-only"
ART = HERE / "approved-historical-source.jpg"
OUT = HERE / "historical"
SOURCE = Image.open(ART).convert("RGBA")
manifest = json.loads((PKG / "manifest.json").read_text(encoding="utf-8"))
size = (manifest["source"]["width"], manifest["source"]["height"])
assert SOURCE.size == size, (SOURCE.size, size)
(OUT / "pieces").mkdir(parents=True, exist_ok=True)
(OUT / "layers").mkdir(parents=True, exist_ok=True)

def new_piece(original, position, size):
    art = SOURCE.crop((position[0], position[1], position[0] + size[0], position[1] + size[1]))
    alpha = original.getchannel("A")
    colored = Image.new("RGBA", size)
    # Zero RGB in fully transparent pixels; do not pack the entire source JPEG
    # under the mask. Keep the original alpha including antialiased edges.
    colored.paste(art,(0,0),alpha.point(lambda value: 255 if value else 0))
    colored.putalpha(alpha)
    return colored

def ui_edition(piece, padding):
    w,h=piece.size
    paper=Image.new("RGBA",(w+padding*2,h+padding*2),(0,0,0,0))
    alpha=Image.new("L",paper.size)
    alpha.paste(piece.getchannel("A"),(padding,padding))
    border=alpha.filter(ImageFilter.MaxFilter(11))
    border=ImageChops.subtract(border,alpha)
    outline=Image.new("RGBA",paper.size,(177,126,65,0))
    outline.putalpha(border)
    shadow=Image.new("RGBA",paper.size,(58,38,22,0))
    shadow_alpha=alpha.filter(ImageFilter.GaussianBlur(11)).point(lambda v: round(v*0.31))
    shadow.putalpha(shadow_alpha)
    paper.alpha_composite(shadow,(0,7))
    paper.alpha_composite(outline)
    paper.alpha_composite(piece,(padding,padding))
    return paper

assembled = Image.new("RGBA",size)
scattered = Image.new("RGBA",(1600,1600))
slots = {"nearby":(153,138),"guides":(984,153),"discovery":(1006,806),"reserve-1":(125,698),"kudy":(448,1292)}
for item in manifest["pieces"]+manifest["layers"]:
    x,y,w,h=(item[k] for k in ("x","y","width","height"))
    original=Image.open(PKG / item["png"]).convert("RGBA")
    assert original.size == (w,h)
    colored=new_piece(original,(x,y),(w,h))
    where=OUT / item["png"]
    colored.save(where,optimize=True)
    assembled.alpha_composite(colored,(x,y))
    if item in manifest["pieces"]:
        pad=item["padding"]
        ui = ui_edition(colored,pad)
        ui.save(OUT / item["ui"],optimize=True)
        left,top = slots[item["id"]]
        scattered.alpha_composite(ui,(left-pad,top-pad))

original_alpha=Image.open(PKG / "styled-source.png").getchannel("A")
assert ImageChops.difference(original_alpha,assembled.getchannel("A")).getbbox() is None, "the seven masks no longer reconstruct the source"
assembled.save(OUT/"assembled.png",optimize=True)
scattered.save(OUT/"scattered.png",optimize=True)
print("PASS: five clipped historical menu parts and two scene layers; full alpha reconstruction unchanged")
