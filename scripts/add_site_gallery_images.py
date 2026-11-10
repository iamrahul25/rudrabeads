"""Add the rudrabeads.in gallery photos that were missing from the app catalog.

Source photos come from tmp_scrape/v2 (category pages listed on
https://www.rudrabeads.in/sitemap.html, parsed by tmp_scrape/v2/parse_galleries.py and
downloaded by tmp_scrape/v2/download_galleries.py).

Every other site photo is already in the catalog as a cleaned white-background version, so
only the photos in NEW_SITE_IMAGES are added. Each one is written twice:
  <product>-<n>.webp           background removed, product centred on white 1000x1000
  <product>-<n>-original.webp  untouched photo fitted into a white 1000x1000 square

WebP encoding uses the image-to-webp tool (C:/all-projects/apps-and-website-tools/image-to-webp)
at the same quality as the rest of the catalog.

Steps (default runs all three):
  python scripts/add_site_gallery_images.py images    # write image files
  python scripts/add_site_gallery_images.py catalog   # append to catalog.json + shopByMukhi
  python scripts/add_site_gallery_images.py requires  # regenerate src/data/productImages.ts
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WEBP_CLI = Path("C:/all-projects/apps-and-website-tools/image-to-webp/bin/image-to-webp.js")
WEBP_QUALITY = 80
RAW_DIR = ROOT / "tmp_scrape" / "v2" / "raw"
CATALOG_DIR = ROOT / "assets" / "products" / "catalog"
CATALOG_JSON = [ROOT / "src" / "data" / "catalog.json", ROOT / "catalog.json"]
REQUIRE_MAP = ROOT / "src" / "data" / "productImages.ts"

SIZE = 1000
PRODUCT_FILL = 0.8

# (product id, index in the site gallery, file number in assets/products/catalog).
# Products whose only site photo is the "Request Seller for Photos" placeholder are skipped:
# 21-mukhi-rudraksha, divine-spiritual-pendants, crystal-beads-bracelets, gemstone-beads-bracelet.
NEW_SITE_IMAGES = [
    ("5-mukhi-nepali-rudraksha", 0, 2),
    ("1-mukhi-rudraksha", 0, 2),
    ("14-mukhi-indonesian-rudraksha", 4, 4),
    ("8mm-simple-karungali-mala", 4, 4),
    ("3-mukhi-rudraksha-fruit", 4, 4),
    ("3-mukhi-rudraksha-fruit", 5, 5),
    ("8mm-rudraksha-bracelet", 4, 4),
]


def catalog_path(name: str) -> str:
    return f"assets/products/catalog/{name}"


def file_names(pid: str, number: int) -> tuple[str, str]:
    return f"{pid}-{number}.webp", f"{pid}-{number}-original.webp"


def save_webp(image: Image.Image, dest: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / f"{dest.stem}.png"
        image.save(source)
        proc = subprocess.run(
            ["node", str(WEBP_CLI), str(source), "-f", str(dest), "-q", str(WEBP_QUALITY), "--overwrite", "--json"],
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"image-to-webp failed for {dest.name}: {proc.stdout or proc.stderr}")


def fit_on_white(image: Image.Image, box: int) -> Image.Image:
    scale = box / max(image.size)
    image = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.LANCZOS
    )
    canvas = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    offset = ((SIZE - image.width) // 2, (SIZE - image.height) // 2)
    if image.mode == "RGBA":
        canvas.paste(image, offset, image)
    else:
        canvas.paste(image.convert("RGB"), offset)
    return canvas


def has_white_background(image: Image.Image) -> bool:
    gray = image.convert("L")
    w, h = gray.size
    edges = [gray.crop(box) for box in ((0, 0, w, 8), (0, h - 8, w, h), (0, 0, 8, h), (w - 8, 0, w, h))]
    pixels = sorted(p for edge in edges for p in edge.tobytes())
    return pixels[len(pixels) // 20] >= 245


def write_images() -> None:
    from rembg import new_session, remove

    session = new_session("birefnet-general")
    for pid, site_index, number in NEW_SITE_IMAGES:
        cleaned, original = file_names(pid, number)
        source = Image.open(RAW_DIR / f"{pid}-site{site_index}.jpg").convert("RGB")
        save_webp(fit_on_white(source, SIZE), CATALOG_DIR / original)

        # Background removal drops thin detached parts (e.g. a pendant beside a mala),
        # so photos already shot on white are only cropped.
        if has_white_background(source):
            ink = Image.eval(source.convert("L"), lambda v: 255 if v < 240 else 0)
            cutout = source.crop(ink.getbbox() or (0, 0, *source.size))
        else:
            cutout = remove(source, session=session, post_process_mask=True).convert("RGBA")
            bbox = cutout.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
            if bbox:
                cutout = cutout.crop(bbox)
        save_webp(fit_on_white(cutout, round(SIZE * PRODUCT_FILL)), CATALOG_DIR / cleaned)
        print(f"{pid}: site{site_index} -> {cleaned}, {original}")


def current_shop_by_mukhi(products: list[dict]) -> list[dict]:
    """Snapshot of the mukhi circles the home screen showed before shopByMukhi existed."""
    by_mukhi: dict[int, dict] = {}
    for product in products:
        mukhi = product.get("mukhi")
        if mukhi is None or mukhi < 1 or mukhi > 21:
            continue
        existing = by_mukhi.get(mukhi)
        if not existing or (
            product["categoryId"] == "nepali-rudraksha" and existing["categoryId"] != "nepali-rudraksha"
        ):
            by_mukhi[mukhi] = product
    one_mukhi = next((p for p in products if p["id"] == "1-mukhi-rudraksha"), None)
    if one_mukhi:
        by_mukhi[1] = one_mukhi
    return [
        {"mukhi": mukhi, "name": f"{mukhi} Mukhi", "image": by_mukhi[mukhi]["image"]}
        for mukhi in sorted(by_mukhi)
    ]


def update_catalog() -> None:
    for json_path in CATALOG_JSON:
        catalog = json.loads(json_path.read_text(encoding="utf-8"))
        if "shopByMukhi" not in catalog:
            catalog["shopByMukhi"] = current_shop_by_mukhi(catalog["products"])

        by_id = {p["id"]: p for p in catalog["products"]}
        for pid, _, number in NEW_SITE_IMAGES:
            images = by_id[pid]["images"]
            for name in file_names(pid, number):
                path = catalog_path(name)
                if path not in images:
                    images.append(path)

        notes = catalog["meta"].setdefault("notes", [])
        for note in (
            "image is the main product image (cards, cart and first gallery slide); images lists every product photo in gallery order.",
            "Files ending in '-original.webp' are untouched site photos; the same name without the suffix is the white-background version.",
            "shopByMukhi holds the home 'Shop by Mukhi' circles (mukhi, name, image) independently of product main images.",
        ):
            if note not in notes:
                notes.append(note)

        json_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"updated {json_path.relative_to(ROOT)}")


def write_require_map() -> None:
    files = sorted(f.name for f in CATALOG_DIR.glob("*.webp"))
    lines = [
        "/** Auto-generated require map for catalog product images. */",
        "",
        "export const productImages: Record<string, number> = {",
        *(f"  '{catalog_path(name)}': require('../../{catalog_path(name)}')," for name in files),
        "};",
        "",
        "export function resolveProductImage(path: string | null | undefined): number | undefined {",
        "  if (!path) return undefined;",
        "  return productImages[path];",
        "}",
        "",
    ]
    REQUIRE_MAP.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {REQUIRE_MAP.relative_to(ROOT)} ({len(files)} images)")


if __name__ == "__main__":
    steps = {"images": write_images, "catalog": update_catalog, "requires": write_require_map}
    for step in sys.argv[1:] or steps:
        steps[step]()
