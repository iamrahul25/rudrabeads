"""Build src/data/catalog.json from scraped site data + app spec enrichments."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = json.loads((ROOT / "tmp_scrape" / "with_images.json").read_text(encoding="utf-8"))

SPEC_MOQ = {
    "12-mukhi-nepali-rudraksha-beads": (10, "Piece"),
    "7-mukhi-rudraksha": (1000, "Piece"),
    "8-mukhi-rudraksha-beads": (10, "Piece"),
    "5-mukhi-rudraksha-beads": (10, "Piece"),
    "13-mukhi-rudraksha-beads": (10, "Piece"),
    "2-mukhi-rudraksha": (1, "Piece"),
    "1-mukhi-rudraksha": (10, "Piece"),
    "14-mukhi-indonesian-rudraksha": (10, "Piece"),
    "16-mukhi-indonesian-rudraksha": (10, "Piece"),
    "5-mukhi-nepali-ganesh-rudraksha-mala": (10, "Piece"),
    "9-mukhi-indonesia-rudraksha-mala": (10, "Piece"),
    "5-mukhi-indonesian-ganesh-rudraksha-mala": (10, "Piece"),
    "5-mukhi-nepali-rudraksha-mala": (10, "Piece"),
    "5-mukhi-gold-plated-rudraksha-mala": (10, "Piece"),
    "8mm-simple-karungali-mala": (10, "Pack"),
    "black-ebony-karungali-bracelet": (20, "Piece"),
    "silver-cap-brace-karungali-bracelet": (20, "Piece"),
    "silver-chain-karungali-bracelet": (20, "Piece"),
    "8mm-rudraksha-bracelet": (100, "Piece"),
    "5-01-carats-natural-hessonite-gomed-gemstone": (10, "Carat"),
}

SPEC_DEITY_PLANET = {
    "8-mukhi-nepali-rudraksha": ("Ganesha", "Rahu"),
    "5-mukhi-nepali-rudraksha": ("Kalagni Rudra", "Jupiter"),
    "7-mukhi-nepali-rudraksha": ("Mahalakshmi", "Saturn"),
    "6-mukhi-nepali-rudraksha": ("Kartikeya", "Venus"),
    "4-mukhi-nepali-rudraksha": ("Brahma", "Mercury"),
    "10-mukhi-nepali-rudraksha": ("Vishnu", "All Planets"),
    "11-mukhi-nepali-rudraksha": ("Hanuman", "Mars"),
    "14-mukhi-nepali-rudraksha": ("Hanuman", "Mars"),
    "15-mukhi-nepali-rudraksha": ("Pashupatinath", "Mercury"),
    "13-mukhi-nepali-rudraksha": ("Kaamdev", "Venus"),
    "3-mukhi-nepali-rudraksha": ("Agni Dev", "Mars"),
    "12-mukhi-nepali-rudraksha": ("Surya", "Sun"),
    "2-mukhi-nepali-rudraksha": ("Ardhanarishwar", "Moon"),
    "9-mukhi-nepali-rudraksha": ("Durga", "Ketu"),
    "16-mukhi-nepali-rudraksha": ("Mahakaal", "Moon"),
    "4-mukhi-rudraksha": ("Brahma", "Mercury"),
    "7-mukhi-rudraksha": ("Mahalakshmi", "Saturn"),
    "8-mukhi-rudraksha-beads": ("Ganesha", "Rahu"),
    "13-mukhi-rudraksha-beads": ("Kaamdev", "Venus"),
    "1-mukhi-rudraksha": ("Shiva", "All Planets"),
    "6-mukhi-indonesian-rudraksha": ("Kartikeya", "Venus"),
    "14-mukhi-indonesian-rudraksha": ("Hanuman", "Mars"),
    "3-mukhi-rudraksha-indonesian": ("Agni Dev", "Mars"),
    "5-mukhi-nepali-rudraksha-mala": ("Kalagni Rudra", "Jupiter"),
}

CATEGORY_ORDER = [
    "nepali-rudraksha",
    "rudraksha-beads",
    "indonesian-rudraksha",
    "rudraksha-mala",
    "karungali-mala",
    "karungali-bracelet",
    "rudraksha-fruit",
    "rudraksha-bracelet",
    "gauri-shankar-rudraksha",
    "natural-hessonite-gomed-gemstone",
    "new-items",
]

INTROS = {
    "nepali-rudraksha": (
        "Pioneers in the industry, we offer 8 mukhi, 5 mukhi, 7 mukhi, "
        "6 mukhi, 4 mukhi and 10 mukhi nepali rudraksha from India."
    ),
    "rudraksha-beads": "Certified and natural Rudraksha beads for mala making, pendant and puja use.",
    "indonesian-rudraksha": "Indonesian Rudraksha beads in multiple mukhi counts for pendant, mala and bracelet use.",
    "rudraksha-mala": "Rudraksha malas for japa, wearing and spiritual practice.",
    "karungali-mala": "Karungali (ebony) malas with copper, silver capping and plain finishes.",
    "karungali-bracelet": "Karungali bracelets in ebony wood, silver cap and silver chain styles.",
    "rudraksha-fruit": "Premium grade Rudraksha fruit offered by the ounce.",
    "rudraksha-bracelet": "Elastic Rudraksha bracelets for meditation and daily wear.",
    "gauri-shankar-rudraksha": "Collector Gauri Shankar Rudraksha symbolizing the union of Shiva and Parvati.",
    "natural-hessonite-gomed-gemstone": "Natural Hessonite (Gomed) gemstones, unheated and faceted.",
    "new-items": "New spiritual pendants and crystal/gemstone bead bracelets.",
}

FEATURED = {
    "2-mukhi-rudraksha-fruit",
    "5-mukhi-nepali-ganesh-rudraksha-mala",
    "6-mukhi-indonesian-rudraksha",
    "8mm-rudraksha-bracelet",
    "8-mukhi-nepali-rudraksha",
    "7-mukhi-rudraksha",
    "9-mukhi-indonesia-rudraksha-mala",
}


def normalize_unit(unit: str | None) -> str | None:
    if not unit:
        return None
    ul = unit.strip().lower()
    if "piece" in ul:
        return "Piece"
    if "pack" in ul:
        return "Pack"
    if "oz" in ul:
        return "Oz"
    if "carat" in ul:
        return "Carat"
    return unit.strip()


def infer_mukhi(pid: str, specs: dict, mukhi: int | None) -> int | None:
    if mukhi is not None:
        return mukhi
    for key in ("Rudraksha Mukhi", "Number Of Mukhi", "Mukhi", "Bead Type"):
        if key in specs:
            match = re.search(r"(\d+)", str(specs[key]))
            if match:
                return int(match.group(1))
    return None


def infer_origin(pid: str, specs: dict) -> str | None:
    if specs.get("Origin"):
        return specs["Origin"]
    if "nepali" in pid:
        return "Nepal"
    if "indonesian" in pid or "indonesia" in pid:
        return "Indonesia"
    return None


def build_products() -> list[dict]:
    products: list[dict] = []
    for index, item in enumerate(RAW["products"], start=1):
        pid = item["id"]
        specs = dict(item.get("specs") or {})

        if pid in SPEC_DEITY_PLANET:
            deity, planet = SPEC_DEITY_PLANET[pid]
            specs.setdefault("Ruling Deity", deity)
            specs.setdefault("Ruling Planet", planet)

        moq = item.get("minOrderQty")
        moq_unit = item.get("minOrderUnit")
        if moq is None and pid in SPEC_MOQ:
            moq, moq_unit = SPEC_MOQ[pid]

        unit = normalize_unit(item.get("priceUnit"))
        price = item.get("price")
        mukhi = infer_mukhi(pid, specs, item.get("mukhi"))
        origin = infer_origin(pid, specs)

        products.append(
            {
                "id": pid,
                "sku": f"RB-{index:03d}",
                "name": item["name"],
                "categoryId": item["categoryId"],
                "category": item["category"],
                "price": price,
                "priceUnit": unit,
                "currency": "INR",
                "priceDisplay": None if price is None else f"₹{price:,}",
                "minOrderQty": moq,
                "minOrderUnit": moq_unit,
                "mukhi": mukhi,
                "origin": origin,
                "beadSize": specs.get("Bead Size")
                or specs.get("Bead size")
                or specs.get("Size"),
                "certification": specs.get("Certification"),
                "labName": specs.get("Lab Name"),
                "treatment": specs.get("Treatment") or specs.get("Stone Treatment"),
                "rulingDeity": specs.get("Ruling Deity") or specs.get("Ruling God"),
                "rulingPlanet": specs.get("Ruling Planet"),
                "usage": specs.get("Usage")
                or specs.get("Usage/Application")
                or specs.get("Purpose")
                or specs.get("Spiritual Use"),
                "shape": specs.get("Shape") or specs.get("Stone Shape"),
                "color": specs.get("Color"),
                "material": specs.get("Material") or specs.get("Bracelet Material"),
                "specs": specs,
                "description": item.get("description")
                or (
                    f"We are engaged in offering {item['name']} to our clients. "
                    "Our range of all products is widely appreciated by our clients."
                ),
                "image": item.get("image"),
                "images": item.get("images") or [],
                "imageSource": item.get("imageSource", "seller"),
                "inStock": True,
                "featured": pid in FEATURED,
                "order": item.get("order", 0),
            }
        )
    return products


def build_categories(products: list[dict]) -> list[dict]:
    categories: list[dict] = []
    for cid in CATEGORY_ORDER:
        cat_products = [p for p in products if p["categoryId"] == cid]
        name = next(c["name"] for c in RAW["categories"] if c["id"] == cid)
        categories.append(
            {
                "id": cid,
                "name": name,
                "slug": cid,
                "intro": INTROS.get(cid, ""),
                "productCount": len(cat_products),
                "image": cat_products[0]["image"] if cat_products else None,
                "productIds": [p["id"] for p in cat_products],
            }
        )
    return categories


def main() -> None:
    products = build_products()
    categories = build_categories(products)

    catalog = {
        "meta": {
            "source": "https://www.rudrabeads.in/",
            "spec": "rudrabeads_app_spec.md",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "currency": "INR",
            "totalCategories": len(categories),
            "totalProducts": len(products),
            "imageStyle": "white-blank-background-1000x1000",
            "imageBasePath": "assets/products/catalog/",
            "notes": [
                "Prices are single list prices as shown on the site; no MRP/compare-at prices exist.",
                "4 products have no price on the site: 21 Mukhi Rudraksha, Divine Spiritual Pendants, Crystal Beads Bracelets, Gemstone Beads Bracelet.",
                "Images normalized to pure white square backgrounds for catalog consistency.",
                "Products without seller photos use catalog-matched white-background fallbacks.",
            ],
        },
        "business": {
            "name": "Rudra Beads",
            "tagline": "GET IN TOUCH WITH US FOR BEST DEALS",
            "ceo": "Mr. Sahil Ahuja",
            "phone": "08048250557",
            "gst": "09EEQPA4774B1ZE",
            "address": (
                "B-139, Shalimar Garden Main, Sahibabad, "
                "Ghaziabad - 201005, Uttar Pradesh, India"
            ),
            "established": 2025,
        },
        "categories": categories,
        "products": products,
    }

    out_src = ROOT / "src" / "data" / "catalog.json"
    out_root = ROOT / "catalog.json"
    out_src.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(catalog, indent=2, ensure_ascii=False)
    out_src.write_text(payload, encoding="utf-8")
    out_root.write_text(payload, encoding="utf-8")

    print(f"categories={len(categories)} products={len(products)}")
    print(f"with_price={sum(1 for p in products if p['price'] is not None)}")
    print(f"with_images={sum(1 for p in products if p['image'])}")
    print(f"wrote {out_src}")
    print(f"wrote {out_root}")


if __name__ == "__main__":
    main()
