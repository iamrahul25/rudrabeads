"""Dump readable body text (scripts/styles/nav stripped) of downloaded site pages."""

import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent / "pages"

for name in sys.argv[1:]:
    raw = (HERE / f"{name}.html").read_text(encoding="utf-8", errors="ignore")
    raw = re.sub(r"(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?i)<br\s*/?>|</(p|div|li|tr|h\d|td|section)>", "\n", raw)
    text = html.unescape(re.sub(r"<[^>]+>", " ", raw))
    lines = [re.sub(r"[ \t\xa0]+", " ", line).strip() for line in text.splitlines()]
    out = [line for line in lines if line]
    print(f"===== {name} ({len(out)} lines) =====")
    print("\n".join(out))
