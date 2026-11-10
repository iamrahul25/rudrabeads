"""Crop trishula mark and export app logo assets from source art."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "logo-source.png"
BG_RGB = np.array([254, 254, 254], dtype=np.float32)
BG_THRESHOLD = 22.0
CROP_PAD_PX = 8
SPLASH_BG = (253, 247, 242)  # #FDF7F2 — matches app.json adaptive icon


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

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = alpha
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


def fit_center(canvas: int, logo: Image.Image, scale: float) -> Image.Image:
    target = int(canvas * scale)
    w, h = logo.size
    ratio = min(target / w, target / h)
    nw, nh = max(1, int(w * ratio)), max(1, int(h * ratio))
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(resized, ((canvas - nw) // 2, (canvas - nh) // 2), resized)
    return out


def on_solid_bg(logo: Image.Image, size: int, bg: tuple[int, int, int]) -> Image.Image:
    fg = fit_center(size, logo, 0.82)
    out = Image.new("RGBA", (size, size), (*bg, 255))
    out.alpha_composite(fg)
    return out.convert("RGB")


def monochrome_foreground(logo: Image.Image, size: int) -> Image.Image:
    fg = fit_center(size, logo, 0.72)
    gray = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    alpha = fg.split()[3]
    sil = Image.new("L", (size, size), 255)
    gray.paste(sil, mask=alpha)
    return gray


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing source image: {SOURCE}")

    raw = Image.open(SOURCE)
    cutout = tight_crop(remove_light_background(raw))

    ASSETS.mkdir(parents=True, exist_ok=True)
    cutout.save(ASSETS / "logo.webp", format="WEBP", lossless=True, method=6)

    icon = on_solid_bg(cutout, 1024, SPLASH_BG)
    icon.save(ASSETS / "icon.png", optimize=True)

    splash = on_solid_bg(cutout, 512, SPLASH_BG)
    splash.save(ASSETS / "splash-icon.png", optimize=True)

    fg = fit_center(1024, cutout, 0.62)
    fg.save(ASSETS / "android-icon-foreground.png", optimize=True)

    bg = Image.new("RGB", (1024, 1024), SPLASH_BG)
    bg.save(ASSETS / "android-icon-background.png", optimize=True)

    mono = monochrome_foreground(cutout, 1024)
    mono.save(ASSETS / "android-icon-monochrome.png", optimize=True)

    favicon = on_solid_bg(cutout, 48, SPLASH_BG)
    favicon.save(ASSETS / "favicon.png", optimize=True)

    print("Wrote logo assets to", ASSETS)
    print("logo.webp size:", cutout.size)


if __name__ == "__main__":
    main()
