"""Extract every gallery image URL per product from the freshly downloaded category pages."""

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CATALOG = json.loads((ROOT / "src" / "data" / "catalog.json").read_text(encoding="utf-8"))
OLD = {p["id"]: p for p in json.loads((HERE.parent / "with_images.json").read_text(encoding="utf-8"))["products"]}

result = {}
for page in sorted(HERE.glob("*.html")):
    if page.name == "sitemap.html":
        continue
    html = page.read_text(encoding="utf-8", errors="ignore")
    anchors = [(m.start(), m.group(1)) for m in re.finditer(r'<a id ="([^"]+)"></a><section', html)]
    for idx, (start, pid) in enumerate(anchors):
        end = anchors[idx + 1][0] if idx + 1 < len(anchors) else len(html)
        block = html[start:end]
        multi = re.search(r'data-multiimg="([^"]*)"', block)
        bimg = re.search(r'data-bimg="([^"]*)"', block)
        thumbs = re.findall(r"changeImages1\('index_\d+', '([^']+)'", block)
        urls = []
        for u in ([bimg.group(1)] if bimg and bimg.group(1) else []) + (
            [x for x in multi.group(1).split(",") if x] if multi else []
        ) + thumbs:
            if u not in urls:
                urls.append(u)
        result[pid] = {"page": page.stem, "urls": urls}

(HERE / "galleries.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

catalog_ids = [p["id"] for p in CATALOG["products"]]
print("site products:", len(result), "catalog products:", len(catalog_ids))
print("missing on site:", [i for i in catalog_ids if i not in result])
print("extra on site:", [i for i in result if i not in catalog_ids])
total_new = 0
for p in CATALOG["products"]:
    site = result.get(p["id"], {}).get("urls", [])
    old = OLD.get(p["id"], {}).get("sourceImages", [])
    first_same = bool(site) and bool(old) and site[0] == old[0]
    extra = [u for u in site if u not in old]
    total_new += len(extra)
    print(f"{p['id']:45s} app={len(p['images'])} oldsrc={len(old)} site={len(site)} firstSame={first_same} new={len(extra)}")
print("total new urls:", total_new)
