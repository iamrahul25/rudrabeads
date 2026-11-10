"""Download every gallery image listed in galleries.json into tmp_scrape/v2/raw/."""

import json
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)
galleries = json.loads((HERE / "galleries.json").read_text(encoding="utf-8"))

manifest = {}
for pid, info in galleries.items():
    files = []
    for i, url in enumerate(info["urls"]):
        dest = RAW / f"{pid}-site{i}.jpg"
        if not dest.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        dest.write_bytes(resp.read())
                    break
                except Exception as exc:  # noqa: BLE001
                    print("retry", pid, i, exc)
                    time.sleep(2)
        files.append({"url": url, "file": dest.name, "bytes": dest.stat().st_size if dest.exists() else 0})
    manifest[pid] = files

(HERE / "raw_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("products", len(manifest), "files", sum(len(v) for v in manifest.values()))
print("failed", [(p, f["file"]) for p, fs in manifest.items() for f in fs if not f["bytes"]])
