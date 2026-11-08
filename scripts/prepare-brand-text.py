"""Crop RudraBeads wordmark, remove background, export WebP."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "brand-text-source.png"
OUT_WEBP = ASSETS / "brand-text.webp"
BG_RGB = np.array([254, 254, 254], dtype=np.float32)
BG_THRESHOLD = 22.0
CROP_PAD_PX = 6
WEBP_QUALITY = 95


def remove_light_background(img: Image.Image) -> Image.Image:
    rgba = np.array(img.convert("RGBA"), dtype=np.uint8)
    rgb = rgba[:, :, :3].astype(np.float32)
    dist = np.sqrt(((rgb - BG_RGB) ** 2).sum(axis=2))
    h, w = dist.shape
    bg = dist <= BG_THRESHOLD
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    visited = np.zeros((h, w), dtype=bool)
    while stack:
        x, y = stack.pop()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[y, x] or not bg[y, x]:
            continue
        visited[y, x] = True
        stack.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    rgba[:, :, 3] = np.where(visited, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def tight_crop(img: Image.Image, pad: int = CROP_PAD_PX) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing source image: {SOURCE}")

    cutout = tight_crop(remove_light_background(Image.open(SOURCE)))
    cutout.save(
        OUT_WEBP,
        format="WEBP",
        quality=WEBP_QUALITY,
        method=6,
        lossless=False,
    )
    print(f"Wrote {OUT_WEBP} ({cutout.size[0]}x{cutout.size[1]}, q={WEBP_QUALITY})")


if __name__ == "__main__":
    main()
