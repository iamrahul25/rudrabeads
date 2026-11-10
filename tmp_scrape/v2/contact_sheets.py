"""Contact sheets: per product, top row = current app images, bottom row = site images."""

import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CATALOG = json.loads((ROOT / "src" / "data" / "catalog.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((HERE / "raw_manifest.json").read_text(encoding="utf-8"))
OUT = HERE / "preview"
OUT.mkdir(exist_ok=True)

T = 130
COLS = 6
PER_SHEET = 6


def tile(path: Path, label: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    im.thumbnail((T, T))
    canvas = Image.new("RGB", (T, T + 14), "white")
    canvas.paste(im, ((T - im.width) // 2, (T - im.height) // 2))
    ImageDraw.Draw(canvas).text((2, T), label, fill="black")
    return canvas


products = CATALOG["products"]
for s in range(0, len(products), PER_SHEET):
    chunk = products[s : s + PER_SHEET]
    row_h = T + 14
    sheet = Image.new("RGB", (COLS * T + 10, len(chunk) * (2 * row_h + 22)), (220, 220, 220))
    draw = ImageDraw.Draw(sheet)
    y = 0
    for p in chunk:
        draw.text((4, y + 2), p["id"], fill="red")
        y += 16
        for i, img in enumerate(p["images"][:COLS]):
            sheet.paste(tile(ROOT / img, f"app{i}"), (i * T, y))
        y += row_h
        for i, f in enumerate(MANIFEST[p["id"]][:COLS]):
            sheet.paste(tile(HERE / "raw" / f["file"], f"site{i}"), (i * T, y))
        y += row_h + 6
    sheet.save(OUT / f"sheet_{s // PER_SHEET:02d}.jpg", quality=85)
print("done")
